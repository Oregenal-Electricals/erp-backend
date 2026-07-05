import { Module } from '@nestjs/common';
import { PfEsiController } from './pf-esi.controller';
import { PfEsiService } from './pf-esi.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [PfEsiController],
  providers: [PfEsiService],
  exports: [PfEsiService],
})
export class PfEsiModule {}
