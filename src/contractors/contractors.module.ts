import { Module } from '@nestjs/common';
import { ContractorsController } from './contractors.controller';
import { ContractorsService } from './contractors.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [ContractorsController],
  providers: [ContractorsService],
  exports: [ContractorsService],
})
export class ContractorsModule {}
