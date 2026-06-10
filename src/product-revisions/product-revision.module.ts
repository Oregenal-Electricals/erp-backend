import { Module } from '@nestjs/common';
import { ProductRevisionController } from './product-revision.controller';
import { ProductRevisionService } from './product-revision.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [ProductRevisionController],
  providers: [ProductRevisionService],
  exports: [ProductRevisionService],
})
export class ProductRevisionModule {}
