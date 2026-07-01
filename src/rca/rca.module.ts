import { Module } from '@nestjs/common';
import { RcaController } from './rca.controller';
import { RcaService } from './rca.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [RcaController],
  providers: [RcaService],
  exports: [RcaService],
})
export class RcaModule {}
