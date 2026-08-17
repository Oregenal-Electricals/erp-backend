import { Module } from '@nestjs/common';
import { ProductFamilyController } from './product-family.controller';
import { ProductFamilyService } from './product-family.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [ProductFamilyController],
  providers: [ProductFamilyService],
  exports: [ProductFamilyService],
})
export class ProductFamilyModule {}
