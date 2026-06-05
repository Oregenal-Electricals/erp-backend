import { Module } from '@nestjs/common';
import { VisitorManagementController } from './visitor-management.controller';
import { VisitorLogController } from './visitor-log.controller';
import { VisitorManagementService } from './visitor-management.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [SettingsModule],
  controllers: [VisitorManagementController, VisitorLogController],
  providers: [VisitorManagementService],
  exports: [VisitorManagementService],
})
export class VisitorManagementModule {}
