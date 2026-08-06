import { Module } from '@nestjs/common';
import { TransferService } from './transfer.service';
import { TransferController } from './transfer.controller';

@Module({
  providers: [TransferService],
  controllers: [TransferController]
})
export class TransferModule {}
