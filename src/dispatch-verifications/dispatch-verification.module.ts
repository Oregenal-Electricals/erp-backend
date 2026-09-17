import { Module } from '@nestjs/common';
import { DispatchVerificationController } from './dispatch-verification.controller';
import { DispatchVerificationService } from './dispatch-verification.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [DispatchVerificationController],
  providers: [DispatchVerificationService],
  exports: [DispatchVerificationService],
})
export class DispatchVerificationModule {}
