import { Module } from '@nestjs/common';
import { GateInwardController } from './gate-inward.controller';
import { GateInwardService } from './gate-inward.service';
import { SettingsModule } from '../settings/settings.module';
import { VehicleManagementModule } from '../vehicle-management/vehicle-management.module';

@Module({
  imports: [SettingsModule, VehicleManagementModule],
  controllers: [GateInwardController],
  providers: [GateInwardService],
  exports: [GateInwardService],
})
export class GateInwardModule {}
