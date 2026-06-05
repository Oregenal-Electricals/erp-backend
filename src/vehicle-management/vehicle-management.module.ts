import { Module } from '@nestjs/common';
import { VehicleManagementController } from './vehicle-management.controller';
import { VehicleLogController } from './vehicle-log.controller';
import { VehicleManagementService } from './vehicle-management.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [SettingsModule],
  controllers: [VehicleManagementController, VehicleLogController],
  providers: [VehicleManagementService],
  exports: [VehicleManagementService],
})
export class VehicleManagementModule {}
