import { Module } from '@nestjs/common';
import { GrnDiscrepancyController } from './grn-discrepancy.controller';
import { GrnDiscrepancyService } from './grn-discrepancy.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, CommonModule, NotificationsModule],
  controllers: [GrnDiscrepancyController],
  providers: [GrnDiscrepancyService],
  exports: [GrnDiscrepancyService],
})
export class GrnDiscrepancyModule {}
