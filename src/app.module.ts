import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { MastersModule } from './masters/masters.module';
import { UsersModule } from './users/users.module';
import { PermissionsModule } from './permissions/permissions.module';
import { SettingsModule } from './settings/settings.module';
import { ChangeRequestsModule } from './change-requests/change-requests.module';
import { DummyDataModule } from './dummy-data/dummy-data.module';
import { VisitorManagementModule } from './visitor-management/visitor-management.module';
import { VehicleManagementModule } from './vehicle-management/vehicle-management.module';
import { GateInwardModule } from './gate-inward/gate-inward.module';
import { GateOutwardModule } from './gate-outward/gate-outward.module';
import { GatePassModule } from './gate-pass/gate-pass.module';
import { GateDashboardModule } from './gate-dashboard/gate-dashboard.module';
import { ItemMasterModule } from './item-master/item-master.module';
import { WarehouseModule } from './warehouse/warehouse.module';
import { VendorModule } from './vendors/vendor.module';
import { ProductModule } from './products/product.module';
import { RawMaterialModule } from './raw-materials/raw-material.module';
import { HsnSacModule } from './hsn-sac/hsn-sac.module';
import { PriceListModule } from './price-lists/price-list.module';
import { PriceHistoryModule } from './price-history/price-history.module';
import { ProductRevisionModule } from './product-revisions/product-revision.module';
import { BomModule } from './bom/bom.module';
import { BomRevisionModule } from './bom-revisions/bom-revision.module';
import { CustomFieldModule } from './custom-fields/custom-field.module';
import { PurchaseRequisitionModule } from './purchase-requisitions/purchase-requisition.module';
import { RfqModule } from './rfq/rfq.module';
import { VendorQuotationModule } from './vendor-quotations/vendor-quotation.module';
import { QuotationComparisonModule } from './quotation-comparison/quotation-comparison.module';
import { PurchaseOrderModule } from './purchase-orders/purchase-order.module';
import { PoApprovalModule } from './po-approvals/po-approval.module';
import { PoAmendmentModule } from './po-amendments/po-amendment.module';
import { PurchaseAnalyticsModule } from './purchase-analytics/purchase-analytics.module';
import { ImportOrderModule } from './import-orders/import-order.module';
import { ProformaInvoiceModule } from './proforma-invoices/proforma-invoice.module';
import { PaymentInstrumentModule } from './payment-instruments/payment-instrument.module';
import { ShipmentModule } from './shipments/shipment.module';
import { ShippingDocumentModule } from './shipping-documents/shipping-document.module';
import { CustomsEntryModule } from './customs-entries/customs-entry.module';
import { LandedCostModule } from './landed-costs/landed-cost.module';
import { GrnModule } from './grn/grn.module';
import { IqcModule } from './iqc/iqc.module';
import { StockLedgerModule } from './stock-ledger/stock-ledger.module';
import { RejectedStockModule } from './rejected-stock/rejected-stock.module';
import { RackBinModule } from './rack-bin/rack-bin.module';
import { StockPutawayModule } from './stock-putaway/stock-putaway.module';
import { StockBatchModule } from './stock-batches/stock-batch.module';
import { StockIssueModule } from './stock-issues/stock-issue.module';
import { StockTransferModule } from './stock-transfers/stock-transfer.module';
import { StockAdjustmentModule } from './stock-adjustments/stock-adjustment.module';
import { StockReportsModule } from './stock-reports/stock-reports.module';
import { InventoryValuationModule } from './inventory-valuation/inventory-valuation.module';
import { InventoryDashboardModule } from './inventory-dashboard/inventory-dashboard.module';
import { InventoryReportsModule } from './inventory-reports/inventory-reports.module';
import { WorkOrderModule } from './work-orders/work-order.module';
import { MrpModule } from './mrp/mrp.module';
import { ProductionIssueModule } from './production-issues/production-issue.module';
import { ProductionEntryModule } from './production-entries/production-entry.module';
import { ProductionQcModule } from './production-qc/production-qc.module';
import { FgReceiptModule } from './fg-receipts/fg-receipt.module';
import { CostSheetModule } from './production-cost-sheets/cost-sheet.module';
import { ProductionDashboardModule } from './production-dashboard/production-dashboard.module';
import { ProductionReportsModule } from './production-reports/production-reports.module';
import { NcrModule } from './ncr/ncr.module';
import { CapaModule } from './capa/capa.module';
import { RcaModule } from './rca/rca.module';
import { OqcModule } from './oqc/oqc.module';
import { SupplierQualityModule } from './supplier-quality/supplier-quality.module';
import { ComplaintModule } from './customer-complaints/complaint.module';
import { QualityDashboardModule } from './quality-dashboard/quality-dashboard.module';
import { QualityReportsModule } from './quality-reports/quality-reports.module';
import { LeadsModule } from './leads/leads.module';
import { QuotationsModule } from './quotations/quotations.module';
import { CustomerPoModule } from './customer-po/customer-po.module';
import { SalesOrdersModule } from './sales-orders/sales-orders.module';
import { DispatchPlanningModule } from './dispatch-planning/dispatch-planning.module';
import { DispatchModule } from './dispatch/dispatch.module';
import { DeliveryConfirmationModule } from './delivery-confirmation/delivery-confirmation.module';
import { AccountsModule } from './accounts/accounts.module';
import { VouchersModule } from './vouchers/vouchers.module';
import { ArModule } from './accounts-receivable/ar.module';
import { ApModule } from './accounts-payable/ap.module';
import { GstModule } from './gst/gst.module';
import { BankReconModule } from './bank-reconciliation/bank-recon.module';
import { FinancialReportsModule } from './financial-reports/financial-reports.module';
import { CreditControlModule } from './credit-control/credit-control.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AlertsModule } from './alerts/alerts.module';
import { WorkflowsModule } from './workflows/workflows.module';
import { TasksModule } from './tasks/tasks.module';
import { DocumentsModule } from './documents/documents.module';
import { PdfEngineModule } from './pdf-engine/pdf-engine.module';
import { ExcelExportModule } from './excel-export/excel-export.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { MisReportsModule } from './mis-reports/mis-reports.module';
import { EmployeesModule } from './employees/employees.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration], envFilePath: ['.env'] }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule, CommonModule, HealthModule, AuthModule,
    MastersModule, UsersModule, PermissionsModule, SettingsModule,
    ChangeRequestsModule, DummyDataModule,
    VisitorManagementModule, VehicleManagementModule,
    GateInwardModule, GateOutwardModule, GatePassModule,
    GateDashboardModule, ItemMasterModule, WarehouseModule,
    VendorModule,
    ProductModule,
    RawMaterialModule,
    HsnSacModule,
    PriceListModule,
    PriceHistoryModule,
    ProductRevisionModule,
    BomModule,
    BomRevisionModule,
    CustomFieldModule,
    PurchaseRequisitionModule,
    RfqModule,
    VendorQuotationModule,
    QuotationComparisonModule,
    PurchaseOrderModule,
    PoApprovalModule,
    PoAmendmentModule,
    PurchaseAnalyticsModule,
    MisReportsModule,
    EmployeesModule,
    ImportOrderModule,
    ProformaInvoiceModule,
    PaymentInstrumentModule,
    ShipmentModule,
    ShippingDocumentModule,
    CustomsEntryModule,
    LandedCostModule,
    GrnModule,
    IqcModule,
    StockLedgerModule,
    RejectedStockModule,
    RackBinModule,
    StockPutawayModule,
    StockBatchModule,
    StockIssueModule,
    StockTransferModule,
    StockAdjustmentModule,
    StockReportsModule,
    InventoryValuationModule,
    InventoryDashboardModule,
    InventoryReportsModule,
    WorkOrderModule,
    MrpModule,
    ProductionIssueModule,
    ProductionEntryModule,
    ProductionQcModule,
    FgReceiptModule,
    CostSheetModule,
    ProductionDashboardModule,
    ProductionReportsModule,
    NcrModule,
    CapaModule,
    RcaModule,
    OqcModule,
    SupplierQualityModule,
    ComplaintModule,
    QualityDashboardModule,
    QualityReportsModule,
    LeadsModule,
    QuotationsModule,
    CustomerPoModule,
    SalesOrdersModule,
    DispatchPlanningModule,
    DispatchModule,
    DeliveryConfirmationModule,
    AccountsModule,
    VouchersModule,
    ArModule,
    ApModule,
    GstModule,
    BankReconModule,
    FinancialReportsModule,
    CreditControlModule,
    NotificationsModule,
    AlertsModule,
    WorkflowsModule,
    TasksModule,
    DocumentsModule,
    PdfEngineModule,
    ExcelExportModule,
    AnalyticsModule,
    MisReportsModule,
    EmployeesModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
