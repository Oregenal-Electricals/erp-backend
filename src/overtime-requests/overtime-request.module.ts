import { Module, forwardRef } from '@nestjs/common';
import { OvertimeRequestController } from './overtime-request.controller';
import { OvertimeRequestService } from './overtime-request.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { SettingsModule } from '../settings/settings.module';
import { WorkflowsModule } from '../workflows/workflows.module';

@Module({
  imports: [PrismaModule, CommonModule, SettingsModule, forwardRef(() => WorkflowsModule)],
  controllers: [OvertimeRequestController],
  providers: [OvertimeRequestService],
  exports: [OvertimeRequestService],
})
export class OvertimeRequestModule {}
