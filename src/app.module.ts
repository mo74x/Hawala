import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { PrismaService } from './prisma/prisma.service';
import { TransferModule } from './transfer/transfer.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [PrismaModule, TransferModule, RedisModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
