import { Module } from '@nestjs/common';
import { ProductTargetController } from './product-target.controller';
import { ProductTargetService } from './product-target.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [ProductTargetController],
  providers: [ProductTargetService],
  exports: [ProductTargetService],
})
export class ProductTargetModule {}
