import { Module } from '@nestjs/common';
import { SalarySlipController } from './salary-slip.controller';
import { SalarySlipService } from './salary-slip.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [SalarySlipController],
  providers: [SalarySlipService],
  exports: [SalarySlipService],
})
export class SalarySlipModule {}
