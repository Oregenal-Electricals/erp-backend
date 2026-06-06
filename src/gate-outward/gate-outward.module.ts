import { Module } from '@nestjs/common';
import { GateOutwardController } from './gate-outward.controller';
import { GateOutwardService } from './gate-outward.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [SettingsModule],
  controllers: [GateOutwardController],
  providers: [GateOutwardService],
  exports: [GateOutwardService],
})
export class GateOutwardModule {}
