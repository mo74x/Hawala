import { Module } from '@nestjs/common';
import { TransferService } from './transfer.service';

@Module({
  providers: [TransferService]
})
export class TransferModule {}
