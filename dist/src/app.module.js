"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const prisma_module_1 = require("./prisma/prisma.module");
const common_module_1 = require("./common/common.module");
const health_module_1 = require("./health/health.module");
const auth_module_1 = require("./auth/auth.module");
const masters_module_1 = require("./masters/masters.module");
const users_module_1 = require("./users/users.module");
const permissions_module_1 = require("./permissions/permissions.module");
const settings_module_1 = require("./settings/settings.module");
const change_requests_module_1 = require("./change-requests/change-requests.module");
const dummy_data_module_1 = require("./dummy-data/dummy-data.module");
const visitor_management_module_1 = require("./visitor-management/visitor-management.module");
const vehicle_management_module_1 = require("./vehicle-management/vehicle-management.module");
const gate_inward_module_1 = require("./gate-inward/gate-inward.module");
const gate_outward_module_1 = require("./gate-outward/gate-outward.module");
const gate_pass_module_1 = require("./gate-pass/gate-pass.module");
const gate_dashboard_module_1 = require("./gate-dashboard/gate-dashboard.module");
const item_master_module_1 = require("./item-master/item-master.module");
const warehouse_module_1 = require("./warehouse/warehouse.module");
const vendor_module_1 = require("./vendors/vendor.module");
const product_module_1 = require("./products/product.module");
const raw_material_module_1 = require("./raw-materials/raw-material.module");
const hsn_sac_module_1 = require("./hsn-sac/hsn-sac.module");
const price_list_module_1 = require("./price-lists/price-list.module");
const price_history_module_1 = require("./price-history/price-history.module");
const product_revision_module_1 = require("./product-revisions/product-revision.module");
const bom_module_1 = require("./bom/bom.module");
const bom_revision_module_1 = require("./bom-revisions/bom-revision.module");
const custom_field_module_1 = require("./custom-fields/custom-field.module");
const purchase_requisition_module_1 = require("./purchase-requisitions/purchase-requisition.module");
const rfq_module_1 = require("./rfq/rfq.module");
const vendor_quotation_module_1 = require("./vendor-quotations/vendor-quotation.module");
const quotation_comparison_module_1 = require("./quotation-comparison/quotation-comparison.module");
const purchase_order_module_1 = require("./purchase-orders/purchase-order.module");
const po_approval_module_1 = require("./po-approvals/po-approval.module");
const po_amendment_module_1 = require("./po-amendments/po-amendment.module");
const purchase_analytics_module_1 = require("./purchase-analytics/purchase-analytics.module");
const import_order_module_1 = require("./import-orders/import-order.module");
const proforma_invoice_module_1 = require("./proforma-invoices/proforma-invoice.module");
const payment_instrument_module_1 = require("./payment-instruments/payment-instrument.module");
const shipment_module_1 = require("./shipments/shipment.module");
const logger_middleware_1 = require("./common/middleware/logger.middleware");
const configuration_1 = __importDefault(require("./config/configuration"));
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(logger_middleware_1.LoggerMiddleware).forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true, load: [configuration_1.default], envFilePath: ['.env'] }),
            throttler_1.ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
            prisma_module_1.PrismaModule, common_module_1.CommonModule, health_module_1.HealthModule, auth_module_1.AuthModule,
            masters_module_1.MastersModule, users_module_1.UsersModule, permissions_module_1.PermissionsModule, settings_module_1.SettingsModule,
            change_requests_module_1.ChangeRequestsModule, dummy_data_module_1.DummyDataModule,
            visitor_management_module_1.VisitorManagementModule, vehicle_management_module_1.VehicleManagementModule,
            gate_inward_module_1.GateInwardModule, gate_outward_module_1.GateOutwardModule, gate_pass_module_1.GatePassModule,
            gate_dashboard_module_1.GateDashboardModule, item_master_module_1.ItemMasterModule, warehouse_module_1.WarehouseModule,
            vendor_module_1.VendorModule,
            product_module_1.ProductModule,
            raw_material_module_1.RawMaterialModule,
            hsn_sac_module_1.HsnSacModule,
            price_list_module_1.PriceListModule,
            price_history_module_1.PriceHistoryModule,
            product_revision_module_1.ProductRevisionModule,
            bom_module_1.BomModule,
            bom_revision_module_1.BomRevisionModule,
            custom_field_module_1.CustomFieldModule,
            purchase_requisition_module_1.PurchaseRequisitionModule,
            rfq_module_1.RfqModule,
            vendor_quotation_module_1.VendorQuotationModule,
            quotation_comparison_module_1.QuotationComparisonModule,
            purchase_order_module_1.PurchaseOrderModule,
            po_approval_module_1.PoApprovalModule,
            po_amendment_module_1.PoAmendmentModule,
            purchase_analytics_module_1.PurchaseAnalyticsModule,
            import_order_module_1.ImportOrderModule,
            proforma_invoice_module_1.ProformaInvoiceModule,
            payment_instrument_module_1.PaymentInstrumentModule,
            shipment_module_1.ShipmentModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map