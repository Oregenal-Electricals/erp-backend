"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const INHERITANCE = {
    PURCHASE_VIEW: [
        'PURCHASE_REQUISITION_VIEW', 'PURCHASE_ORDER_VIEW', 'RFQ_VIEW', 'VENDOR_QUOTATION_VIEW',
        'QUOTATION_COMPARISON_VIEW', 'PO_AMENDMENT_VIEW', 'PO_APPROVAL_VIEW', 'PURCHASE_ANALYTICS_VIEW',
        'PRICE_LIST_VIEW', 'PRICE_HISTORY_VIEW', 'IMPORT_ORDER_VIEW', 'CUSTOMS_ENTRY_VIEW', 'LANDED_COST_VIEW',
    ],
    SALES_VIEW: [
        'LEAD_VIEW', 'QUOTATION_VIEW', 'CUSTOMER_PO_VIEW', 'SALES_ORDER_VIEW', 'DISPATCH_PLAN_VIEW',
        'DISPATCH_VIEW', 'DELIVERY_CONFIRMATION_VIEW', 'PROFORMA_INVOICE_VIEW', 'CREDIT_CONTROL_VIEW',
        'CUSTOMER_COMPLAINT_VIEW', 'CUSTOMER_PORTAL_VIEW', 'SHIPMENT_VIEW', 'SHIPPING_DOCUMENT_VIEW',
    ],
    INVENTORY_VIEW: [
        'INVENTORY_DASHBOARD_VIEW', 'WAREHOUSE_VIEW', 'BOM_VIEW', 'BOM_REVISION_VIEW', 'GRN_VIEW',
        'STOCK_LEDGER_VIEW', 'REJECTED_STOCK_VIEW', 'RACK_BIN_VIEW', 'STOCK_PUTAWAY_VIEW', 'STOCK_BATCH_VIEW',
        'STOCK_ISSUE_VIEW', 'STOCK_TRANSFER_VIEW', 'STOCK_ADJUSTMENT_VIEW', 'STOCK_REPORT_VIEW',
        'INVENTORY_VALUATION_VIEW', 'INVENTORY_REPORT_VIEW',
    ],
    QUALITY_VIEW: [
        'QUALITY_DASHBOARD_VIEW', 'IQC_VIEW', 'PRODUCTION_QC_VIEW', 'OQC_VIEW', 'NCR_VIEW', 'CAPA_VIEW',
        'RCA_VIEW', 'SUPPLIER_QUALITY_VIEW', 'QUALITY_REPORT_VIEW',
    ],
    PRODUCTION_VIEW: [
        'PRODUCTION_DASHBOARD_VIEW', 'WORK_ORDER_VIEW', 'MRP_VIEW', 'PRODUCTION_ENTRY_VIEW', 'FG_RECEIPT_VIEW',
        'PRODUCTION_ISSUE_VIEW', 'PRODUCTION_COST_SHEET_VIEW', 'PRODUCTION_REPORT_VIEW',
    ],
    HR_VIEW: [
        'EMPLOYEE_VIEW', 'ATTENDANCE_VIEW', 'LEAVE_VIEW', 'PAYROLL_VIEW', 'SALARY_SLIP_VIEW', 'PF_ESI_VIEW',
        'TRAINING_VIEW', 'HR_REPORT_VIEW',
    ],
    FINANCE_VIEW: [
        'ACCOUNTING_VIEW', 'CHART_OF_ACCOUNTS_VIEW', 'VOUCHER_VIEW', 'AR_VIEW', 'AP_VIEW', 'GST_VIEW',
        'BANK_RECONCILIATION_VIEW', 'PAYMENT_INSTRUMENT_VIEW', 'TDS_VIEW', 'FINANCIAL_REPORT_VIEW',
    ],
    SYSTEM_VIEW: [
        'IOT_VIEW', 'TASK_VIEW', 'NOTIFICATION_VIEW', 'DOCUMENT_VIEW', 'WORKFLOW_VIEW', 'ALERT_VIEW', 'VENDOR_PORTAL_VIEW',
    ],
    REPORTS_VIEW: ['MIS_REPORT_VIEW', 'ANALYTICS_TAB_VIEW'],
    SETTINGS_VIEW: ['CHANGE_REQUEST_VIEW'],
};
const GATE_PERMS = ['GATE_DASHBOARD_VIEW', 'GATE_INWARD_VIEW', 'GATE_OUTWARD_VIEW', 'GATE_PASS_VIEW', 'VISITOR_VIEW', 'VEHICLE_LOG_VIEW'];
const GATE_DEFAULT_ROLES = ['SUPER_ADMIN', 'CORPORATE_ADMIN', 'OPERATOR'];
async function main() {
    const roles = await prisma.role.findMany({ include: { permissions: true } });
    console.log(`Processing ${roles.length} role(s)...`);
    for (const role of roles) {
        const currentPerms = new Set(role.permissions.map(p => p.permission));
        const toAdd = new Set();
        for (const [oldPerm, newPerms] of Object.entries(INHERITANCE)) {
            if (currentPerms.has(oldPerm)) {
                newPerms.forEach(p => { if (!currentPerms.has(p))
                    toAdd.add(p); });
            }
        }
        if (GATE_DEFAULT_ROLES.includes(role.name)) {
            GATE_PERMS.forEach(p => { if (!currentPerms.has(p))
                toAdd.add(p); });
        }
        if (toAdd.size > 0) {
            await prisma.rolePermission.createMany({
                data: Array.from(toAdd).map(p => ({
                    companyId: role.companyId,
                    roleId: role.id,
                    permission: p,
                    createdBy: 'system-migration',
                    updatedBy: 'system-migration',
                })),
            });
            console.log(`  ${role.name}: added ${toAdd.size} new granular permissions.`);
        }
        else {
            console.log(`  ${role.name}: no changes needed.`);
        }
    }
    console.log('Done.');
}
main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
//# sourceMappingURL=seed_granular_permissions.js.map