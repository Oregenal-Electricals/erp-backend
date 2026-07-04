import { Module } from '@nestjs/common';
import { CapaController } from './capa.controller';
import { CapaAutomationController } from './capa-automation.controller';
import { CapaAutomationService } from './capa-automation.service';
import { CapaService } from './capa.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [CapaController, CapaAutomationController],
  providers: [CapaService, CapaAutomationService],
  exports: [CapaService, CapaAutomationService],
})
export class CapaModule {}
