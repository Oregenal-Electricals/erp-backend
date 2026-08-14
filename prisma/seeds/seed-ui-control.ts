// erp-backend/prisma/seeds/seed-ui-control.ts
//
// Run once: npx ts-node prisma/seeds/seed-ui-control.ts
// Idempotent — safe to re-run. Built from your REAL current Sidebar.jsx NAV
// array (not guessed routes), so what you see in the UI Control Center
// matches what's actually live today, and reordering/hiding here reorders
// the real sidebar.

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const COMPANY_ID = '83eda866-ba63-472c-902f-561f05b6b1c1'; // confirm matches your current company id

type Item = { key: string; label: string; page: string; icon?: string };
type Section = { key: string; label: string; icon?: string; standalone?: boolean; page?: string; items?: Item[] };

const STRUCTURE: Section[] = [
  { key: 'sidebar.dashboard', label: 'Dashboard', icon: 'layout-dashboard', standalone: true, page: '/dashboard' },
  {
    key: 'sidebar.changeRequests', label: 'Change Requests', icon: 'clipboard-list',
    items: [
      { key: 'sidebar.changeRequests.all', label: 'All Requests', page: '/change-requests' },
      { key: 'sidebar.changeRequests.new', label: 'New Request', page: '/change-requests/create' },
    ],
  },
  {
    key: 'sidebar.gate', label: 'Gate Management', icon: 'shield',
    items: [
      { key: 'sidebar.gate.dashboard', label: 'Gate Dashboard', page: '/gate-dashboard' },
      { key: 'sidebar.gate.inward', label: 'Gate Inward', page: '/gate/inward' },
      { key: 'sidebar.gate.outward', label: 'Gate Outward', page: '/gate/outward' },
      { key: 'sidebar.gate.passes', label: 'Gate Passes', page: '/gate/passes' },
      { key: 'sidebar.gate.vehicles', label: 'Vehicle Log', page: '/gate/vehicles' },
      { key: 'sidebar.gate.visitors', label: 'Visitors', page: '/gate/visitors' },
      { key: 'sidebar.gate.checkin', label: 'Check-In', page: '/gate/check-in' },
    ],
  },
  {
    key: 'sidebar.purchase', label: 'Purchase', icon: 'shopping-cart',
    items: [
      { key: 'sidebar.purchase.requisitions', label: 'Purchase Requisitions', page: '/purchase-requisitions' },
      { key: 'sidebar.purchase.orders', label: 'Purchase Orders', page: '/purchase-orders' },
      { key: 'sidebar.purchase.shortages', label: 'Material Shortages', page: '/purchase/shortages' },
      { key: 'sidebar.purchase.rfqs', label: 'RFQs', page: '/purchase/rfqs' },
      { key: 'sidebar.purchase.quotations', label: 'Vendor Quotations', page: '/purchase/quotations' },
      { key: 'sidebar.purchase.comparison', label: 'Quotation Comparison', page: '/purchase/comparison' },
      { key: 'sidebar.purchase.amendments', label: 'PO Amendments', page: '/purchase/amendments' },
      { key: 'sidebar.purchase.approvals', label: 'PO Approvals', page: '/purchase/approvals' },
      { key: 'sidebar.purchase.analytics', label: 'Purchase Analytics', page: '/purchase/analytics' },
      { key: 'sidebar.purchase.priceLists', label: 'Price Lists', page: '/masters/price-lists' },
      { key: 'sidebar.purchase.priceHistory', label: 'Price History', page: '/masters/price-history' },
      { key: 'sidebar.purchase.vendors', label: 'Vendors', page: '/masters/vendors' },
    ],
  },
  {
    key: 'sidebar.import', label: 'Import', icon: 'globe',
    items: [
      { key: 'sidebar.import.orders', label: 'Import Orders', page: '/import/orders' },
      { key: 'sidebar.import.customs', label: 'Customs Entries', page: '/import/customs' },
      { key: 'sidebar.import.landedCost', label: 'Landed Costs', page: '/import/landed-cost' },
      { key: 'sidebar.import.shipments', label: 'Shipments', page: '/import/shipments' },
    ],
  },
  {
    key: 'sidebar.sales', label: 'Sales', icon: 'tag',
    items: [
      { key: 'sidebar.sales.leads', label: 'Leads', page: '/sales/leads' },
      { key: 'sidebar.sales.quotations', label: 'Quotations', page: '/sales/quotations' },
      { key: 'sidebar.sales.customers', label: 'Customers', page: '/sales/customers' },
      { key: 'sidebar.sales.customerPo', label: 'Customer PO', page: '/customer-po' },
      { key: 'sidebar.sales.salesOrders', label: 'Sales Orders', page: '/sales/sales-orders' },
      { key: 'sidebar.sales.dispatchPlanning', label: 'Dispatch Plans', page: '/sales/dispatch-planning' },
      { key: 'sidebar.sales.dispatch', label: 'Dispatch', page: '/sales/dispatch' },
      { key: 'sidebar.sales.delivery', label: 'Delivery Confirmations', page: '/sales/delivery' },
      { key: 'sidebar.sales.proforma', label: 'Proforma Invoices', page: '/import/proforma' },
      { key: 'sidebar.sales.creditControl', label: 'Credit Control', page: '/sales/credit-control' },
      { key: 'sidebar.sales.complaints', label: 'Customer Complaints', page: '/quality/complaints' },
      { key: 'sidebar.sales.customerPortal', label: 'Customer Portal', page: '/customer-portal' },
    ],
  },
  {
    key: 'sidebar.inventory', label: 'Inventory', icon: 'database',
    items: [
      { key: 'sidebar.inventory.dashboard', label: 'Inv. Dashboard', page: '/inventory-dashboard' },
      { key: 'sidebar.inventory.uom', label: 'UOM', page: '/inventory/uom' },
      { key: 'sidebar.inventory.products', label: 'Products', page: '/masters/products' },
      { key: 'sidebar.inventory.rawMaterials', label: 'Raw Materials', page: '/masters/raw-materials' },
      { key: 'sidebar.inventory.bom', label: 'BOM', page: '/inventory/bom' },
      { key: 'sidebar.inventory.bomRevisions', label: 'BOM Revisions', page: '/inventory/bom-revisions' },
      { key: 'sidebar.inventory.grn', label: 'GRN', page: '/inventory/grn' },
      { key: 'sidebar.inventory.stock', label: 'Stock Ledger', page: '/inventory/stock' },
      { key: 'sidebar.inventory.rejected', label: 'Rejected Stock', page: '/inventory/rejected' },
      { key: 'sidebar.inventory.rackBin', label: 'Rack & Bin', page: '/inventory/rack-bin' },
      { key: 'sidebar.inventory.putaway', label: 'Stock Putaway', page: '/inventory/putaway' },
      { key: 'sidebar.inventory.batches', label: 'Batches & Lots', page: '/inventory/batches' },
      { key: 'sidebar.inventory.issues', label: 'Stock Issues', page: '/inventory/issues' },
      { key: 'sidebar.inventory.transfers', label: 'Stock Transfer', page: '/inventory/transfers' },
      { key: 'sidebar.inventory.adjustments', label: 'Stock Adjustment', page: '/inventory/adjustments' },
      { key: 'sidebar.inventory.reports', label: 'Stock Reports', page: '/inventory/reports' },
      { key: 'sidebar.inventory.valuation', label: 'Inv. Valuation', page: '/inventory/valuation' },
      { key: 'sidebar.inventory.invReports', label: 'Inv. Reports', page: '/inventory/inv-reports' },
    ],
  },
  {
    key: 'sidebar.production', label: 'Production', icon: 'factory',
    items: [
      { key: 'sidebar.production.floor', label: 'Production Floor', page: '/production/floor' },
      { key: 'sidebar.production.manpower', label: 'Manpower', page: '/production/manpower' },
      { key: 'sidebar.production.stageTransfers', label: 'Stage Transfers', page: '/production/stage-transfers' },
      { key: 'sidebar.production.dashboard', label: 'Production Dashboard', page: '/production/dashboard' },
      { key: 'sidebar.production.workOrders', label: 'Work Orders', page: '/production/work-orders' },
      { key: 'sidebar.production.mrp', label: 'MRP', page: '/production/mrp' },
      { key: 'sidebar.production.entries', label: 'Production Entries', page: '/production/recording' },
      { key: 'sidebar.production.fgReceipts', label: 'FG Receipts', page: '/production/fg-receipt' },
      { key: 'sidebar.production.issues', label: 'Production Issues', page: '/production/material-issue' },
      { key: 'sidebar.production.costSheets', label: 'Cost Sheets', page: '/production/cost-sheet' },
      { key: 'sidebar.production.reports', label: 'Production Reports', page: '/production/reports' },
    ],
  },
  {
    key: 'sidebar.quality', label: 'Quality', icon: 'badge-check',
    items: [
      { key: 'sidebar.quality.dashboard', label: 'Quality Dashboard', page: '/quality-dashboard' },
      { key: 'sidebar.quality.iqc', label: 'IQC', page: '/inventory/iqc' },
      { key: 'sidebar.quality.ipqc', label: 'Production QC', page: '/production/ipqc' },
      { key: 'sidebar.quality.oqc', label: 'OQC', page: '/quality/oqc' },
      { key: 'sidebar.quality.ncr', label: 'NCR', page: '/quality/ncr' },
      { key: 'sidebar.quality.capa', label: 'CAPA', page: '/quality/capa' },
      { key: 'sidebar.quality.rca', label: 'RCA', page: '/quality/rca' },
      { key: 'sidebar.quality.supplier', label: 'Supplier Quality', page: '/quality/supplier' },
      { key: 'sidebar.quality.reports', label: 'Quality Reports', page: '/quality/reports' },
    ],
  },
  {
    key: 'sidebar.hr', label: 'HR', icon: 'users-2',
    items: [
      { key: 'sidebar.hr.employees', label: 'Employees', page: '/hr/employees' },
      { key: 'sidebar.hr.attendance', label: 'Attendance', page: '/hr/attendance' },
      { key: 'sidebar.hr.leave', label: 'Leave', page: '/hr/leave' },
      { key: 'sidebar.hr.payroll', label: 'Payroll', page: '/hr/payroll' },
      { key: 'sidebar.hr.pfEsi', label: 'PF/ESI', page: '/hr/pf-esi' },
      { key: 'sidebar.hr.training', label: 'Training', page: '/hr/training' },
    ],
  },
  {
    key: 'sidebar.finance', label: 'Finance', icon: 'credit-card',
    items: [
      { key: 'sidebar.finance.accounts', label: 'Chart of Accounts', page: '/finance/accounts' },
      { key: 'sidebar.finance.vouchers', label: 'Vouchers', page: '/finance/vouchers' },
      { key: 'sidebar.finance.ar', label: 'Accounts Receivable', page: '/finance/ar' },
      { key: 'sidebar.finance.ap', label: 'Accounts Payable', page: '/finance/ap' },
      { key: 'sidebar.finance.gst', label: 'GST', page: '/finance/gst' },
      { key: 'sidebar.finance.tds', label: 'TDS', page: '/hr/tds' },
    ],
  },
  {
    key: 'sidebar.industry4', label: 'Industry 4.0', icon: 'activity',
    items: [
      { key: 'sidebar.industry4.iot', label: 'IoT Dashboard', page: '/iot' },
      { key: 'sidebar.industry4.tasks', label: 'Tasks', page: '/tasks' },
      { key: 'sidebar.industry4.notifications', label: 'Notifications', page: '/notifications' },
      { key: 'sidebar.industry4.documents', label: 'Documents', page: '/documents' },
      { key: 'sidebar.industry4.workflows', label: 'Workflows', page: '/workflows' },
      { key: 'sidebar.industry4.alerts', label: 'Alerts', page: '/alerts' },
      { key: 'sidebar.industry4.vendorPortal', label: 'Vendor Portal', page: '/vendor-portal' },
    ],
  },
  {
    key: 'sidebar.analytics', label: 'Analytics', icon: 'bar-chart-3',
    items: [
      { key: 'sidebar.analytics.mis', label: 'MIS Reports', page: '/mis-reports' },
      { key: 'sidebar.analytics.analytics', label: 'Analytics', page: '/analytics' },
    ],
  },
  {
    key: 'sidebar.settings', label: 'Settings', icon: 'settings',
    items: [
      { key: 'sidebar.settings.companies', label: 'Companies', page: '/masters/company' },
      { key: 'sidebar.settings.plants', label: 'Plants', page: '/masters/plant' },
      { key: 'sidebar.settings.warehouses', label: 'Warehouses', page: '/warehouse' },
      { key: 'sidebar.settings.units', label: 'Units', page: '/masters/unit' },
      { key: 'sidebar.settings.departments', label: 'Departments', page: '/masters/department' },
      { key: 'sidebar.settings.branches', label: 'Branches', page: '/masters/branch' },
      { key: 'sidebar.settings.financialYear', label: 'Financial Year', page: '/masters/financial-year' },
      { key: 'sidebar.settings.users', label: 'Users', page: '/users' },
      { key: 'sidebar.settings.system', label: 'System Settings', page: '/settings/system' },
      { key: 'sidebar.settings.rolesPermissions', label: 'Roles & Permissions', page: '/settings/roles-permissions' },
      { key: 'sidebar.settings.numbering', label: 'Numbering Series', page: '/settings/numbering' },
      { key: 'sidebar.settings.customFields', label: 'Custom Fields', page: '/settings/custom-fields' },
      { key: 'sidebar.settings.dummyData', label: 'Dummy Data', page: '/settings/dummy-data' },
      { key: 'sidebar.settings.uiControl', label: 'UI Control Center', page: '/settings/ui-control' },
    ],
  },
];

async function main() {
  let sectionCount = 0, itemCount = 0;
  for (let sIdx = 0; sIdx < STRUCTURE.length; sIdx++) {
    const section = STRUCTURE[sIdx];
    await prisma.uiControlElement.upsert({
      where: { companyId_key: { companyId: COMPANY_ID, key: section.key } },
      update: {},
      create: {
        companyId: COMPANY_ID, key: section.key,
        elementType: section.standalone ? 'SIDEBAR_ITEM' : 'SIDEBAR_SECTION',
        module: section.label, page: section.page, label: section.label, icon: section.icon,
        sortOrder: sIdx, defaultVisible: true,
      },
    });
    sectionCount++;

    if (section.items) {
      for (let iIdx = 0; iIdx < section.items.length; iIdx++) {
        const item = section.items[iIdx];
        await prisma.uiControlElement.upsert({
          where: { companyId_key: { companyId: COMPANY_ID, key: item.key } },
          update: {},
          create: {
            companyId: COMPANY_ID, key: item.key, elementType: 'SIDEBAR_ITEM',
            module: section.label, page: item.page, label: item.label, icon: item.icon,
            parentKey: section.key, sortOrder: iIdx, defaultVisible: true,
          },
        });
        itemCount++;
      }
    }
  }
  console.log(`Seeded ${sectionCount} sections/standalone items and ${itemCount} nested items.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
