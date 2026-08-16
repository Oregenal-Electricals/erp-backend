import { Module } from '@nestjs/common';
import { BomController } from './bom.controller';
import { BomService } from './bom.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, CommonModule, NotificationsModule],
  controllers: [BomController],
  providers: [BomService],
  exports: [BomService],
})
export class BomModule {}
