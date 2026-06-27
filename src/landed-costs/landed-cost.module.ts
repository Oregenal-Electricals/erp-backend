import { Module } from '@nestjs/common';
import { LandedCostController } from './landed-cost.controller';
import { LandedCostService } from './landed-cost.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [LandedCostController],
  providers: [LandedCostService],
  exports: [LandedCostService],
})
export class LandedCostModule {}
