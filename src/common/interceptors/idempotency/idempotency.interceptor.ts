/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';
import { Request, Response } from 'express';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly redisService: RedisService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    //Require the header for POST requests
    if (request.method !== 'POST') return next.handle();

    const idempotencyKey = request.headers['idempotency-key'] as string;
    if (!idempotencyKey) {
      throw new BadRequestException(
        'Idempotency-Key header is required for this operation',
      );
    }

    const redis = this.redisService.getClient();
    const cacheKey = `idempotency:${idempotencyKey}`;

    //Check Redis for an existing key
    const cachedRecord = await redis.get(cacheKey);

    if (cachedRecord) {
      if (cachedRecord === 'IN_PROGRESS') {
        throw new ConflictException(
          'A request with this Idempotency-Key is currently processing.',
        );
      }

      //Return the historical response immediately (Cache Hit)
      const parsedRecord = JSON.parse(cachedRecord);
      response.status(parsedRecord.statusCode);

      //Add a header so the client knows this was a cached replay
      response.setHeader('X-Idempotency-Replayed', 'true');
      return of(parsedRecord.body);
    }

    //Lock the key to prevent rapid-fire identical requests (Cache Miss)
    await redis.set(cacheKey, 'IN_PROGRESS', 'EX', 86400); // 24-hour TTL

    //Execute the actual route handler (the TransferService)
    return next.handle().pipe(
      tap(async (responseBody) => {
        //Cache the final response body and status code (Success)
        const finalRecord = {
          statusCode: response.statusCode,
          body: responseBody,
        };
        await redis.set(cacheKey, JSON.stringify(finalRecord), 'EX', 86400);
      }),
    );
  }
}
