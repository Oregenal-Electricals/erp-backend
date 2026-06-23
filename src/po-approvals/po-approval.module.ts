import { Module } from '@nestjs/common';
import { PoApprovalController } from './po-approval.controller';
import { PoApprovalService } from './po-approval.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [PoApprovalController],
  providers: [PoApprovalService],
  exports: [PoApprovalService],
})
export class PoApprovalModule {}
