import { Module } from '@nestjs/common';
import { CapaController } from './capa.controller';
import { CapaService } from './capa.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [CapaController],
  providers: [CapaService],
  exports: [CapaService],
})
export class CapaModule {}
