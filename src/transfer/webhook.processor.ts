/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import * as crypto from 'crypto';

@Processor('webhook_queue')
export class WebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessor.name);
  private readonly WEBHOOK_SECRET = 'super-secret-merchant-key'; // Normally from .env

  async process(job: Job): Promise<any> {
    this.logger.log(
      `Attempt ${job.attemptsMade + 1}: Dispatching webhook for Tx ${job.data.transactionId}`,
    );

    const payloadString = JSON.stringify(job.data);

    // Cryptographic Signature (HMAC-SHA256)
    // This proves to the receiver that the payload wasn't tampered with in transit
    const signature = crypto
      .createHmac('sha256', this.WEBHOOK_SECRET)
      .update(payloadString)
      .digest('hex');

    try {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const isFlakyNetwork = Math.random() < 0.3;
      if (isFlakyNetwork) {
        throw new Error('Merchant API responded with 503 Service Unavailable');
      }

      this.logger.log(
        `✅ Webhook delivered successfully for Tx ${job.data.transactionId}`,
      );
      return { delivered: true };
    } catch (error) {
      this.logger.error(`❌ Webhook delivery failed: ${error.message}`);
      throw error;
    }
  }
}
