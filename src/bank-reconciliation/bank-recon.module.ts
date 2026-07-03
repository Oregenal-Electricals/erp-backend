import { Module } from '@nestjs/common';
import { BankReconController } from './bank-recon.controller';
import { BankReconService } from './bank-recon.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [BankReconController],
  providers: [BankReconService],
  exports: [BankReconService],
})
export class BankReconModule {}
