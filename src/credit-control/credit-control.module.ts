import { Module } from '@nestjs/common';
import { CreditControlController } from './credit-control.controller';
import { CreditControlService } from './credit-control.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [CreditControlController],
  providers: [CreditControlService],
  exports: [CreditControlService],
})
export class CreditControlModule {}
