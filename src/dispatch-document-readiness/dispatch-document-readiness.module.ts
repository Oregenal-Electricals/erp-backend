import { Module } from '@nestjs/common';
import { DispatchDocumentReadinessController } from './dispatch-document-readiness.controller';
import { DispatchDocumentReadinessService } from './dispatch-document-readiness.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [DispatchDocumentReadinessController],
  providers: [DispatchDocumentReadinessService],
  exports: [DispatchDocumentReadinessService],
})
export class DispatchDocumentReadinessModule {}
