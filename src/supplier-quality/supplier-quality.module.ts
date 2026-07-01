import { Module } from '@nestjs/common';
import { SupplierQualityController } from './supplier-quality.controller';
import { SupplierQualityService } from './supplier-quality.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [SupplierQualityController],
  providers: [SupplierQualityService],
  exports: [SupplierQualityService],
})
export class SupplierQualityModule {}
