import { Module } from '@nestjs/common';
import { ImportOrderController } from './import-order.controller';
import { ImportOrderService } from './import-order.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [ImportOrderController],
  providers: [ImportOrderService],
  exports: [ImportOrderService],
})
export class ImportOrderModule {}
