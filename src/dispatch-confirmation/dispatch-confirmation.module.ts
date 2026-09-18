import { Module } from '@nestjs/common';
import { DispatchConfirmationController } from './dispatch-confirmation.controller';
import { DispatchConfirmationService } from './dispatch-confirmation.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { DispatchDocumentReadinessModule } from '../dispatch-document-readiness/dispatch-document-readiness.module';

@Module({
  imports: [PrismaModule, CommonModule, DispatchDocumentReadinessModule],
  controllers: [DispatchConfirmationController],
  providers: [DispatchConfirmationService],
  exports: [DispatchConfirmationService],
})
export class DispatchConfirmationModule {}
