import { Module } from '@nestjs/common';
import { CustomerPoController } from './customer-po.controller';
import { CustomerPoService } from './customer-po.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { SalesOrdersModule } from '../sales-orders/sales-orders.module';

@Module({
  imports: [PrismaModule, CommonModule, SalesOrdersModule],
  controllers: [CustomerPoController],
  providers: [CustomerPoService],
  exports: [CustomerPoService],
})
export class CustomerPoModule {}
