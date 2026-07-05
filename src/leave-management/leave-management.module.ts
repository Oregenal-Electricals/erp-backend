import { Module } from '@nestjs/common';
import { LeaveManagementController } from './leave-management.controller';
import { LeaveManagementService } from './leave-management.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [LeaveManagementController],
  providers: [LeaveManagementService],
  exports: [LeaveManagementService],
})
export class LeaveManagementModule {}
