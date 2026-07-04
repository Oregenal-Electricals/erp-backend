import { Module } from '@nestjs/common';
import { MisReportsController } from './mis-reports.controller';
import { MisReportsService } from './mis-reports.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [MisReportsController],
  providers: [MisReportsService],
  exports: [MisReportsService],
})
export class MisReportsModule {}
