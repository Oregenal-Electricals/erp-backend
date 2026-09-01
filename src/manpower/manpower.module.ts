import { Module } from '@nestjs/common';
import { ManpowerController } from './manpower.controller';
import { ManpowerService } from './manpower.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { WorkflowsModule } from '../workflows/workflows.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SettingsModule } from '../settings/settings.module';
@Module({
  imports: [PrismaModule, CommonModule, WorkflowsModule, NotificationsModule, SettingsModule],
  controllers: [ManpowerController],
  providers: [ManpowerService],
  exports: [ManpowerService],
})
export class ManpowerModule {}
