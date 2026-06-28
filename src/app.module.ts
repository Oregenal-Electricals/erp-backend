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
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
