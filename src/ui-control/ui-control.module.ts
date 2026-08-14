// erp-backend/src/ui-control/ui-control.module.ts
import { Module } from '@nestjs/common';
import { UiControlController } from './ui-control.controller';
import { UiControlService } from './ui-control.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UiControlController],
  providers: [UiControlService],
  exports: [UiControlService],
})
export class UiControlModule {}
