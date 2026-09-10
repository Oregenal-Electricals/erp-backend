import { Module } from '@nestjs/common';
import { GrnController } from './grn.controller';
import { GrnService } from './grn.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { StoreReceivingModule } from '../store-receiving/store-receiving.module';

@Module({
  imports: [PrismaModule, CommonModule, StoreReceivingModule],
  controllers: [GrnController],
  providers: [GrnService],
  exports: [GrnService],
})
export class GrnModule {}
