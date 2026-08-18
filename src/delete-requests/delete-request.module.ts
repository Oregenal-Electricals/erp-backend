import { Module } from '@nestjs/common';
import { DeleteRequestController } from './delete-request.controller';
import { DeleteRequestService } from './delete-request.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { WorkflowsModule } from '../workflows/workflows.module';

@Module({
  imports: [PrismaModule, CommonModule, WorkflowsModule],
  controllers: [DeleteRequestController],
  providers: [DeleteRequestService],
  exports: [DeleteRequestService],
})
export class DeleteRequestModule {}
