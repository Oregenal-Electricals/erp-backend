import { Module } from '@nestjs/common';
import { PurchaseRequisitionController } from './purchase-requisition.controller';
import { PurchaseRequisitionService } from './purchase-requisition.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [PurchaseRequisitionController],
  providers: [PurchaseRequisitionService],
  exports: [PurchaseRequisitionService],
})
export class PurchaseRequisitionModule {}
