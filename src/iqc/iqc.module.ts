import { Module } from '@nestjs/common';
import { IqcController } from './iqc.controller';
import { IqcService } from './iqc.service';
import { IqcEscalationService } from './iqc-escalation.service';
import { IqcTemplateImportService } from './iqc-template-import.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { StockLedgerModule } from '../stock-ledger/stock-ledger.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RejectedStockModule } from '../rejected-stock/rejected-stock.module';

@Module({
  imports: [PrismaModule, CommonModule, StockLedgerModule, NotificationsModule, RejectedStockModule],
  controllers: [IqcController],
  providers: [IqcService, IqcEscalationService, IqcTemplateImportService],
  exports: [IqcService, IqcEscalationService, IqcTemplateImportService],
})
export class IqcModule {}
