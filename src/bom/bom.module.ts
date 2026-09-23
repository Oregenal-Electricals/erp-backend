import { Module, forwardRef } from '@nestjs/common';
import { BomController } from './bom.controller';
import { BomService } from './bom.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WorkflowsModule } from '../workflows/workflows.module';

@Module({
  imports: [PrismaModule, CommonModule, NotificationsModule, forwardRef(() => WorkflowsModule)],
  controllers: [BomController],
  providers: [BomService],
  exports: [BomService],
})
export class BomModule {}
