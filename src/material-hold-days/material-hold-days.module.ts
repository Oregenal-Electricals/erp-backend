import { Module } from '@nestjs/common';
import { MaterialHoldDaysController } from './material-hold-days.controller';
import { MaterialHoldDaysService } from './material-hold-days.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [MaterialHoldDaysController],
  providers: [MaterialHoldDaysService],
  exports: [MaterialHoldDaysService],
})
export class MaterialHoldDaysModule {}
