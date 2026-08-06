/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Module } from '@nestjs/common';
import { TransferService } from './transfer.service';
import { TransferController } from './transfer.controller';
import { BullModule } from '@nestjs/bullmq';
import { WebhookProcessor } from './webhook.processor';

@Module({
  providers: [TransferService, WebhookProcessor],
  controllers: [TransferController],
  imports: [
    BullModule.registerQueue({
      name: 'webhook_queue',
    }),
  ],
})
export class TransferModule {}
