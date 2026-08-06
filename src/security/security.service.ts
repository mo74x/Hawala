import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { randomUUID } from 'crypto';

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);

  constructor(private readonly redisService: RedisService) {}

  /**
   * Ensures an account cannot execute more than 5 transfers per minute.
   */
  async enforceTransferVelocity(senderId: string): Promise<void> {
    const redis = this.redisService.getClient();

    const now = Date.now();
    const windowInMs = 60 * 1000; // 1-minute rolling window
    const windowStart = now - windowInMs;
    const maxTransfers = 5;

    const key = `security:velocity:transfers:${senderId}`;

    // Batch commands in a single network trip for high performance
    const pipeline = redis.pipeline();

    // Drop old transfer events that fall outside our 1-minute window
    pipeline.zremrangebyscore(key, 0, windowStart);
    // Count the remaining events in the current window
    pipeline.zcard(key);
    // Log the current attempt
    pipeline.zadd(key, now, `${now}-${randomUUID()}`);
    // Set a 60-second TTL on the entire key to prevent memory leaks from inactive accounts
    pipeline.expire(key, 60);

    const results = await pipeline.exec();

    if (!results) {
      throw new Error('Redis pipeline execution failed');
    }

    // results[1][1] holds the return value of the second command in the pipeline (zcard)
    const currentCount = results[1][1] as number;

    if (currentCount >= maxTransfers) {
      this.logger.warn(
        `Velocity trigger tripped for Account: ${senderId}. Count: ${currentCount}`,
      );
      throw new HttpException(
        'Fraud Prevention: Too many transfers initiated recently. Please wait a minute.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}
