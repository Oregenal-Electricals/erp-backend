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
const shipping_document_module_1 = require("./shipping-documents/shipping-document.module");
const customs_entry_module_1 = require("./customs-entries/customs-entry.module");
const landed_cost_module_1 = require("./landed-costs/landed-cost.module");
const grn_module_1 = require("./grn/grn.module");
const iqc_module_1 = require("./iqc/iqc.module");
const stock_ledger_module_1 = require("./stock-ledger/stock-ledger.module");
const rejected_stock_module_1 = require("./rejected-stock/rejected-stock.module");
const rack_bin_module_1 = require("./rack-bin/rack-bin.module");
const stock_putaway_module_1 = require("./stock-putaway/stock-putaway.module");
const stock_batch_module_1 = require("./stock-batches/stock-batch.module");
const stock_issue_module_1 = require("./stock-issues/stock-issue.module");
const stock_transfer_module_1 = require("./stock-transfers/stock-transfer.module");
const stock_adjustment_module_1 = require("./stock-adjustments/stock-adjustment.module");
const stock_reports_module_1 = require("./stock-reports/stock-reports.module");
const inventory_valuation_module_1 = require("./inventory-valuation/inventory-valuation.module");
const inventory_dashboard_module_1 = require("./inventory-dashboard/inventory-dashboard.module");
const inventory_reports_module_1 = require("./inventory-reports/inventory-reports.module");
const work_order_module_1 = require("./work-orders/work-order.module");
const mrp_module_1 = require("./mrp/mrp.module");
const production_issue_module_1 = require("./production-issues/production-issue.module");
const production_entry_module_1 = require("./production-entries/production-entry.module");
const production_qc_module_1 = require("./production-qc/production-qc.module");
const fg_receipt_module_1 = require("./fg-receipts/fg-receipt.module");
const cost_sheet_module_1 = require("./production-cost-sheets/cost-sheet.module");
const production_dashboard_module_1 = require("./production-dashboard/production-dashboard.module");
const production_reports_module_1 = require("./production-reports/production-reports.module");
const ncr_module_1 = require("./ncr/ncr.module");
const capa_module_1 = require("./capa/capa.module");
const rca_module_1 = require("./rca/rca.module");
const oqc_module_1 = require("./oqc/oqc.module");
const supplier_quality_module_1 = require("./supplier-quality/supplier-quality.module");
const complaint_module_1 = require("./customer-complaints/complaint.module");
const quality_dashboard_module_1 = require("./quality-dashboard/quality-dashboard.module");
const quality_reports_module_1 = require("./quality-reports/quality-reports.module");
const leads_module_1 = require("./leads/leads.module");
const quotations_module_1 = require("./quotations/quotations.module");
const customer_po_module_1 = require("./customer-po/customer-po.module");
const sales_orders_module_1 = require("./sales-orders/sales-orders.module");
const dispatch_planning_module_1 = require("./dispatch-planning/dispatch-planning.module");
const dispatch_module_1 = require("./dispatch/dispatch.module");
const delivery_confirmation_module_1 = require("./delivery-confirmation/delivery-confirmation.module");
const accounts_module_1 = require("./accounts/accounts.module");
const vouchers_module_1 = require("./vouchers/vouchers.module");
const ar_module_1 = require("./accounts-receivable/ar.module");
const ap_module_1 = require("./accounts-payable/ap.module");
const gst_module_1 = require("./gst/gst.module");
const bank_recon_module_1 = require("./bank-reconciliation/bank-recon.module");
const financial_reports_module_1 = require("./financial-reports/financial-reports.module");
const credit_control_module_1 = require("./credit-control/credit-control.module");
const notifications_module_1 = require("./notifications/notifications.module");
const alerts_module_1 = require("./alerts/alerts.module");
const workflows_module_1 = require("./workflows/workflows.module");
const tasks_module_1 = require("./tasks/tasks.module");
const documents_module_1 = require("./documents/documents.module");
const pdf_engine_module_1 = require("./pdf-engine/pdf-engine.module");
const excel_export_module_1 = require("./excel-export/excel-export.module");
const analytics_module_1 = require("./analytics/analytics.module");
const mis_reports_module_1 = require("./mis-reports/mis-reports.module");
const employees_module_1 = require("./employees/employees.module");
const attendance_module_1 = require("./attendance/attendance.module");
const leave_management_module_1 = require("./leave-management/leave-management.module");
const payroll_module_1 = require("./payroll/payroll.module");
const pf_esi_module_1 = require("./pf-esi/pf-esi.module");
const tds_module_1 = require("./tds/tds.module");
const salary_slip_module_1 = require("./salary-slip/salary-slip.module");
const hr_reports_module_1 = require("./hr-reports/hr-reports.module");
const training_module_1 = require("./training/training.module");
const accounting_module_1 = require("./accounting/accounting.module");
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
            mis_reports_module_1.MisReportsModule,
            employees_module_1.EmployeesModule,
            attendance_module_1.AttendanceModule,
            leave_management_module_1.LeaveManagementModule,
            payroll_module_1.PayrollModule,
            pf_esi_module_1.PfEsiModule,
            tds_module_1.TdsModule,
            salary_slip_module_1.SalarySlipModule,
            hr_reports_module_1.HrReportsModule,
            training_module_1.TrainingModule,
            accounting_module_1.AccountingModule,
            import_order_module_1.ImportOrderModule,
            proforma_invoice_module_1.ProformaInvoiceModule,
            payment_instrument_module_1.PaymentInstrumentModule,
            shipment_module_1.ShipmentModule,
            shipping_document_module_1.ShippingDocumentModule,
            customs_entry_module_1.CustomsEntryModule,
            landed_cost_module_1.LandedCostModule,
            grn_module_1.GrnModule,
            iqc_module_1.IqcModule,
            stock_ledger_module_1.StockLedgerModule,
            rejected_stock_module_1.RejectedStockModule,
            rack_bin_module_1.RackBinModule,
            stock_putaway_module_1.StockPutawayModule,
            stock_batch_module_1.StockBatchModule,
            stock_issue_module_1.StockIssueModule,
            stock_transfer_module_1.StockTransferModule,
            stock_adjustment_module_1.StockAdjustmentModule,
            stock_reports_module_1.StockReportsModule,
            inventory_valuation_module_1.InventoryValuationModule,
            inventory_dashboard_module_1.InventoryDashboardModule,
            inventory_reports_module_1.InventoryReportsModule,
            work_order_module_1.WorkOrderModule,
            mrp_module_1.MrpModule,
            production_issue_module_1.ProductionIssueModule,
            production_entry_module_1.ProductionEntryModule,
            production_qc_module_1.ProductionQcModule,
            fg_receipt_module_1.FgReceiptModule,
            cost_sheet_module_1.CostSheetModule,
            production_dashboard_module_1.ProductionDashboardModule,
            production_reports_module_1.ProductionReportsModule,
            ncr_module_1.NcrModule,
            capa_module_1.CapaModule,
            rca_module_1.RcaModule,
            oqc_module_1.OqcModule,
            supplier_quality_module_1.SupplierQualityModule,
            complaint_module_1.ComplaintModule,
            quality_dashboard_module_1.QualityDashboardModule,
            quality_reports_module_1.QualityReportsModule,
            leads_module_1.LeadsModule,
            quotations_module_1.QuotationsModule,
            customer_po_module_1.CustomerPoModule,
            sales_orders_module_1.SalesOrdersModule,
            dispatch_planning_module_1.DispatchPlanningModule,
            dispatch_module_1.DispatchModule,
            delivery_confirmation_module_1.DeliveryConfirmationModule,
            accounts_module_1.AccountsModule,
            vouchers_module_1.VouchersModule,
            ar_module_1.ArModule,
            ap_module_1.ApModule,
            gst_module_1.GstModule,
            bank_recon_module_1.BankReconModule,
            financial_reports_module_1.FinancialReportsModule,
            credit_control_module_1.CreditControlModule,
            notifications_module_1.NotificationsModule,
            alerts_module_1.AlertsModule,
            workflows_module_1.WorkflowsModule,
            tasks_module_1.TasksModule,
            documents_module_1.DocumentsModule,
            pdf_engine_module_1.PdfEngineModule,
            excel_export_module_1.ExcelExportModule,
            analytics_module_1.AnalyticsModule,
            mis_reports_module_1.MisReportsModule,
            employees_module_1.EmployeesModule,
            attendance_module_1.AttendanceModule,
            leave_management_module_1.LeaveManagementModule,
            payroll_module_1.PayrollModule,
            pf_esi_module_1.PfEsiModule,
            tds_module_1.TdsModule,
            salary_slip_module_1.SalarySlipModule,
            hr_reports_module_1.HrReportsModule,
            training_module_1.TrainingModule,
            accounting_module_1.AccountingModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map