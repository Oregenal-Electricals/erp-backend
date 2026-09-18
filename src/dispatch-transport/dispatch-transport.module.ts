import { Module } from '@nestjs/common';
import { DispatchTransportController } from './dispatch-transport.controller';
import { DispatchTransportService } from './dispatch-transport.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { DispatchDocumentReadinessModule } from '../dispatch-document-readiness/dispatch-document-readiness.module';

@Module({
  imports: [PrismaModule, CommonModule, DispatchDocumentReadinessModule],
  controllers: [DispatchTransportController],
  providers: [DispatchTransportService],
  exports: [DispatchTransportService],
})
export class DispatchTransportModule {}
