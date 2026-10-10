import { Module } from '@nestjs/common';
import { CustomerPoController } from './customer-po.controller';
import { CustomerPoService } from './customer-po.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { SalesOrdersModule } from '../sales-orders/sales-orders.module';
import { MrpModule } from '../mrp/mrp.module';
import { CreditControlModule } from '../credit-control/credit-control.module';
import { CustomerItemMappingModule } from '../customer-item-mapping/customer-item-mapping.module';

@Module({
  imports: [PrismaModule, CommonModule, SalesOrdersModule, MrpModule, CreditControlModule, CustomerItemMappingModule],
  controllers: [CustomerPoController],
  providers: [CustomerPoService],
  exports: [CustomerPoService],
})
export class CustomerPoModule {}
