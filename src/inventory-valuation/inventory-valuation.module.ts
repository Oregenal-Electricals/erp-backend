import { Module } from '@nestjs/common';
import { InventoryValuationController } from './inventory-valuation.controller';
import { InventoryValuationService } from './inventory-valuation.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [InventoryValuationController],
  providers: [InventoryValuationService],
  exports: [InventoryValuationService],
})
export class InventoryValuationModule {}
