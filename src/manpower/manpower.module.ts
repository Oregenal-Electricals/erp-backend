import { Module } from '@nestjs/common';
import { ManpowerController } from './manpower.controller';
import { ManpowerService } from './manpower.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [ManpowerController],
  providers: [ManpowerService],
  exports: [ManpowerService],
})
export class ManpowerModule {}
