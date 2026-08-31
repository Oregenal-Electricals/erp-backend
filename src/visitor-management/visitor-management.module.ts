import { Module } from '@nestjs/common';
import { VisitorManagementController } from './visitor-management.controller';
import { VisitorLogController } from './visitor-log.controller';
import { VisitorManagementService } from './visitor-management.service';
import { SettingsModule } from '../settings/settings.module';
import { VehicleManagementModule } from '../vehicle-management/vehicle-management.module';

@Module({
  imports: [SettingsModule, VehicleManagementModule],
  controllers: [VisitorManagementController, VisitorLogController],
  providers: [VisitorManagementService],
  exports: [VisitorManagementService],
})
export class VisitorManagementModule {}
