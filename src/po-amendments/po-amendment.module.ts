import { Module } from '@nestjs/common';
import { PoAmendmentController } from './po-amendment.controller';
import { PoAmendmentService } from './po-amendment.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [PoAmendmentController],
  providers: [PoAmendmentService],
  exports: [PoAmendmentService],
})
export class PoAmendmentModule {}
