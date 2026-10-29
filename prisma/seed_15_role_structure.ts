// prisma/seed_15_role_structure.ts
//
// Seeds the new 15-role business structure (Super Admin, Admin, R&D, Purchase,
// Sales, Store, Plant Manager, Stage Supervisor, Quality Manager, IQC, IPQC,
// OQC, HR, Accounts, Gate Incharge) into the EXISTING flexible Role /
// RolePermission system (src/roles/roles.service.ts), NOT into the hardcoded
// UserRole enum in schema.prisma. That enum and everything that still reads
// it (src/common/permissions/role-permissions.ts, the old 14-role static
// map) is left completely untouched - this script only ever INSERTs new
// `roles` / `role_permissions` / `ui_control_overrides` rows, keyed by role
// name, exactly the way src/common/guards/permissions.guard.ts already
// resolves permissions at runtime (DB-driven lookup by role name + the
// user's companyId, independent of the TS enum).
//
// Idempotent: for every company, each role is looked up by (companyId, name)
// first. If it already exists, that role is left completely alone (no
// permission diffing, no overwrite) and the script just logs a skip - this
// guarantees running it twice, or running it against a company where these
// roles were already created some other way (e.g. a hand-run SQL patch),
// never fails and never duplicates rows. Sidebar visibility is applied the
// same way, keyed on (elementId, scopeType='ROLE', roleName) - the same
// composite the UI already treats as unique (see
// ui_control_overrides' partial unique index `uq_ui_override_role` and
// UiControlService.upsertOverride).
//
// Run with: npx ts-node prisma/seed_15_role_structure.ts
// (not wired into package.json's "seed" script, same as the sibling
// one-off files prisma/seed_roles_from_static_file.ts and
// prisma/seed_granular_permissions.ts - those are run directly too.)
//
// NOTE: this script assigns role PERMISSIONS and SIDEBAR VISIBILITY only.
// It deliberately does NOT touch any `users.role` value - migrating real
// users onto these new roles is a separate, explicit decision for whoever
// runs this against a given company's data, not something a generic
// idempotent seed should do silently.

import { PrismaClient } from '@prisma/client';
import { Permission } from '../src/common/permissions/permissions.enum';

const prisma = new PrismaClient();

const P = Permission; // shorthand below

interface SidebarEntry {
  key: string;
  customPage?: string;
}

interface RoleDef {
  name: string;
  label: string;
  description: string;
  isProtected: boolean;
  permissions: Permission[];
  sidebar: SidebarEntry[];
}

// ─────────────────────────────────────────────────────────────────────────
// The 15-role structure. Permission lists are deliberately explicit (no
// spreading of the old UserRole-based ROLE_PERMISSIONS map) so every string
// here is checked against the real Permission enum at compile time - if a
// permission doesn't exist, `pnpm run build` fails on this file, which is
// exactly the safety net we want instead of silently seeding a permission
// nothing enforces.
//
// Sidebar keys are restricted to keys already referenced elsewhere in this
// codebase's UI-control migrations (see e.g. 144_role_sidebar_matrix.sql,
// 145_quality_item_filtering.sql, 143_dispatch_sidebar.sql) - no new sidebar
// item is invented here, per the task's instruction.
// ─────────────────────────────────────────────────────────────────────────
const ROLE_DEFS: RoleDef[] = [
  {
    name: 'SUPER_ADMIN',
    label: 'Super Admin',
    description:
      'Full unrestricted access. Protected - cannot be edited or deleted.',
    isProtected: true,
    permissions: Object.values(Permission),
    sidebar: [], // SUPER_ADMIN bypasses sidebar visibility entirely (see ui-control.service.ts / PermissionsGuard)
  },
  {
    name: 'ADMIN',
    label: 'Admin',
    description:
      'Company-wide administrator - masters, users, settings, and broad cross-module oversight.',
    isProtected: false,
    permissions: [
      P.COMPANY_VIEW,
      P.COMPANY_CREATE,
      P.COMPANY_EDIT,
      P.PLANT_VIEW,
      P.PLANT_CREATE,
      P.PLANT_EDIT,
      P.UNIT_VIEW,
      P.UNIT_CREATE,
      P.UNIT_EDIT,
      P.DEPARTMENT_VIEW,
      P.DEPARTMENT_CREATE,
      P.DEPARTMENT_EDIT,
      P.BRANCH_VIEW,
      P.BRANCH_CREATE,
      P.BRANCH_EDIT,
      P.FINANCIAL_YEAR_VIEW,
      P.FINANCIAL_YEAR_CREATE,
      P.FINANCIAL_YEAR_MANAGE,
      P.USER_VIEW,
      P.USER_CREATE,
      P.USER_EDIT,
      P.USER_TOGGLE_STATUS,
      P.USER_RESET_PASSWORD,
      P.USER_UNLOCK,
      P.PURCHASE_VIEW,
      P.PURCHASE_CREATE,
      P.PURCHASE_EDIT,
      P.PURCHASE_APPROVE,
      P.INVENTORY_VIEW,
      P.INVENTORY_CREATE,
      P.INVENTORY_EDIT,
      P.INVENTORY_DASHBOARD_VIEW,
      P.PRODUCTION_VIEW,
      P.PRODUCTION_CREATE,
      P.PRODUCTION_EDIT,
      P.PRODUCTION_DASHBOARD_VIEW,
      P.QUALITY_VIEW,
      P.QUALITY_CREATE,
      P.QUALITY_EDIT,
      P.QUALITY_DASHBOARD_VIEW,
      P.FINANCE_VIEW,
      P.FINANCE_CREATE,
      P.FINANCE_EDIT,
      P.FINANCE_APPROVE,
      P.VENDORS_VIEW,
      P.VENDORS_CREATE,
      P.VENDORS_EDIT,
      P.VENDORS_DELETE,
      P.REPORTS_VIEW,
      P.REPORTS_EXPORT,
      P.SETTINGS_VIEW,
      P.SETTINGS_MANAGE,
      P.HR_VIEW,
      P.HR_CREATE,
      P.HR_EDIT,
      P.HR_APPROVE,
      P.SALES_VIEW,
      P.SALES_CREATE,
      P.SALES_EDIT,
      P.SALES_APPROVE,
      P.SYSTEM_VIEW,
      P.SYSTEM_CREATE,
      P.SYSTEM_EDIT,
      P.SYSTEM_MANAGE_ROLES,
      P.AUDIT_VIEW,
      P.UI_CONTROL_MANAGE,
      P.CHANGE_REQUEST_VIEW,
      P.DELETE_APPROVE,
      P.GATE_DASHBOARD_VIEW,
      P.GATE_INWARD_VIEW,
      P.GATE_OUTWARD_VIEW,
      P.GATE_PASS_VIEW,
      P.VISITOR_VIEW,
      P.VEHICLE_LOG_VIEW,
      P.GATE_MASTER_MANAGE,
      P.GATE_EVENT_VIEW,
      P.WORKFLOW_VIEW,
      P.WORKFLOW_MANAGE,
      P.WORKFLOW_ACT,
      P.WORKFLOW_SUBMIT,
      P.PRODUCTION_TARGET_VIEW,
      P.PRODUCTION_TARGET_MANAGE,
      P.PRODUCT_SELLING_PRICE_VIEW,
      P.PRODUCT_SELLING_PRICE_MANAGE,
      P.BOM_VIEW,
      P.BOM_REVISION_VIEW,
      P.BOM_VERIFY,
      P.BOM_APPROVE,
      P.GRN_VIEW,
      P.IQC_VIEW,
      P.GRN_DISCREPANCY_VIEW,
      P.DISPATCH_DASHBOARD_VIEW,
      P.DISPATCH_VIEW,
      P.DISPATCH_PLAN_VIEW,
      P.DISPATCH_TRACE_VIEW,
      P.DISPATCH_RECONCILIATION_VIEW,
      P.DISPATCH_RECONCILIATION_RUN,
      P.MIS_REPORT_VIEW,
      P.ANALYTICS_TAB_VIEW,
      P.IOT_VIEW,
      P.TASK_VIEW,
      P.NOTIFICATION_VIEW,
      P.DOCUMENT_VIEW,
      P.ALERT_VIEW,
      P.VENDOR_PORTAL_VIEW,
      P.STORE_RECEIVING_VIEW,
      P.STORE_PHYSICAL_VERIFY_VIEW,
      P.STORE_DISCREPANCY_VIEW,
      P.STORE_SHORTAGE_VIEW,
      P.PURCHASE_SHORTAGE_VIEW,
      P.WORK_ORDER_VIEW,
      P.WORK_ORDER_APPROVE,
      P.WORK_ORDER_RELEASE,
      P.MANPOWER_VIEW,
    ],
    sidebar: [
      { key: 'sidebar.purchase' },
      { key: 'sidebar.sales' },
      { key: 'sidebar.inventory' },
      { key: 'sidebar.production' },
      { key: 'sidebar.quality' },
      { key: 'sidebar.quality.dashboard' },
      { key: 'sidebar.quality.iqc' },
      { key: 'sidebar.quality.iqcTemplates' },
      { key: 'sidebar.quality.ipqc' },
      { key: 'sidebar.quality.oqc' },
      { key: 'sidebar.quality.ncr' },
      { key: 'sidebar.quality.capa' },
      { key: 'sidebar.quality.rca' },
      { key: 'sidebar.quality.supplier' },
      { key: 'sidebar.quality.reports' },
      { key: 'sidebar.hr' },
      { key: 'sidebar.finance' },
      { key: 'sidebar.gate' },
      { key: 'sidebar.gate.vehicles' },
      { key: 'sidebar.gate.visitors' },
      { key: 'sidebar.import' },
      { key: 'sidebar.industry4' },
      { key: 'sidebar.analytics' },
      { key: 'sidebar.changeRequests' },
      { key: 'sidebar.settings' },
      { key: 'dispatch.dashboard' },
      { key: 'dispatch.orders' },
      { key: 'dispatch.pickingLoading' },
      { key: 'dispatch.gateOutStatus' },
      { key: 'dispatch.section' },
      { key: 'dispatch.trace' },
    ],
  },
  {
    name: 'RND',
    label: 'R&D',
    description:
      'Product and BOM development - drafts and revises BOMs, submits them into the approval workflow.',
    isProtected: false,
    permissions: [
      P.COMPANY_VIEW,
      P.PLANT_VIEW,
      P.UNIT_VIEW,
      P.DEPARTMENT_VIEW,
      P.INVENTORY_VIEW,
      P.INVENTORY_DASHBOARD_VIEW,
      P.WAREHOUSE_VIEW,
      P.BOM_VIEW,
      P.BOM_REVISION_VIEW,
      P.WORKFLOW_VIEW,
      P.WORKFLOW_SUBMIT,
      P.PRODUCTION_VIEW,
      P.PURCHASE_VIEW,
      P.REPORTS_VIEW,
      P.CHANGE_REQUEST_VIEW,
    ],
    sidebar: [{ key: 'sidebar.inventory' }, { key: 'sidebar.production' }],
  },
  {
    name: 'PURCHASE',
    label: 'Purchase',
    description:
      'Procurement - requisitions, RFQs, purchase orders, vendor quotations, imports, GRN discrepancy review.',
    isProtected: false,
    permissions: [
      P.PURCHASE_VIEW,
      P.PURCHASE_CREATE,
      P.PURCHASE_EDIT,
      P.PURCHASE_APPROVE,
      P.PURCHASE_REQUISITION_VIEW,
      P.PURCHASE_ORDER_VIEW,
      P.RFQ_VIEW,
      P.VENDOR_QUOTATION_VIEW,
      P.QUOTATION_COMPARISON_VIEW,
      P.PO_AMENDMENT_VIEW,
      P.PO_APPROVAL_VIEW,
      P.PURCHASE_ANALYTICS_VIEW,
      P.PRICE_LIST_VIEW,
      P.PRICE_HISTORY_VIEW,
      P.IMPORT_ORDER_VIEW,
      P.CUSTOMS_ENTRY_VIEW,
      P.LANDED_COST_VIEW,
      P.SHIPMENT_VIEW,
      P.SHIPPING_DOCUMENT_VIEW,
      P.VENDORS_VIEW,
      P.VENDORS_CREATE,
      P.VENDORS_EDIT,
      P.INVENTORY_VIEW,
      P.GRN_VIEW,
      P.PURCHASE_SHORTAGE_VIEW,
      P.PURCHASE_SHORTAGE_REVIEW,
      P.PURCHASE_SHORTAGE_RESOLVE,
      P.PURCHASE_SHORT_CLOSE_APPROVE,
      P.GRN_DISCREPANCY_VIEW,
      P.GRN_DISCREPANCY_PURCHASE_REVIEW,
      P.GRN_DISCREPANCY_RESOLVE_REQUEST,
      P.PURCHASE_RTV_AUTHORIZE,
      P.REPORTS_VIEW,
      P.REPORTS_EXPORT,
      P.PLANT_VIEW,
      P.UNIT_VIEW,
      P.DEPARTMENT_VIEW,
      P.COMPANY_VIEW,
      P.CHANGE_REQUEST_VIEW,
    ],
    sidebar: [
      { key: 'sidebar.purchase' },
      { key: 'sidebar.import' },
      { key: 'sidebar.inventory' },
    ],
  },
  {
    name: 'SALES',
    label: 'Sales',
    description:
      'Leads, quotations, customer POs, sales orders, dispatch visibility, credit control, customer complaints.',
    isProtected: false,
    permissions: [
      P.SALES_VIEW,
      P.SALES_CREATE,
      P.SALES_EDIT,
      P.SALES_APPROVE,
      P.LEAD_VIEW,
      P.QUOTATION_VIEW,
      P.CUSTOMER_PO_VIEW,
      P.SALES_ORDER_VIEW,
      P.SALES_ORDER_RELEASE_DISPATCH,
      P.DISPATCH_PLAN_VIEW,
      P.DISPATCH_VIEW,
      P.DISPATCH_SOURCE_VIEW,
      P.DISPATCH_AVAILABILITY_VIEW,
      P.DISPATCH_DASHBOARD_VIEW,
      P.DISPATCH_TRACE_VIEW,
      P.DISPATCH_RECONCILIATION_VIEW,
      P.DELIVERY_CONFIRMATION_VIEW,
      P.PROFORMA_INVOICE_VIEW,
      P.CREDIT_CONTROL_VIEW,
      P.CUSTOMER_COMPLAINT_VIEW,
      P.CUSTOMER_PORTAL_VIEW,
      P.PRODUCT_SELLING_PRICE_VIEW,
      P.INVENTORY_VIEW,
      P.REPORTS_VIEW,
      P.REPORTS_EXPORT,
      P.ANALYTICS_TAB_VIEW,
      P.COMPANY_VIEW,
      P.PLANT_VIEW,
      P.UNIT_VIEW,
      P.CHANGE_REQUEST_VIEW,
    ],
    sidebar: [
      { key: 'sidebar.sales' },
      { key: 'sidebar.analytics' },
      { key: 'dispatch.dashboard' },
      { key: 'dispatch.orders' },
      { key: 'dispatch.trace' },
    ],
  },
  {
    name: 'STORE',
    label: 'Store',
    description:
      'Warehouse / stores - GRN, stock ledger, putaway, issue, transfer, adjustment, dispatch pick/pack/load.',
    isProtected: false,
    permissions: [
      P.INVENTORY_VIEW,
      P.INVENTORY_CREATE,
      P.INVENTORY_EDIT,
      P.INVENTORY_DASHBOARD_VIEW,
      P.WAREHOUSE_VIEW,
      P.GRN_VIEW,
      P.STOCK_LEDGER_VIEW,
      P.REJECTED_STOCK_VIEW,
      P.RACK_BIN_VIEW,
      P.STOCK_PUTAWAY_VIEW,
      P.STOCK_BATCH_VIEW,
      P.STOCK_ISSUE_VIEW,
      P.STOCK_TRANSFER_VIEW,
      P.STOCK_ADJUSTMENT_VIEW,
      P.STOCK_REPORT_VIEW,
      P.INVENTORY_VALUATION_VIEW,
      P.INVENTORY_REPORT_VIEW,
      P.STORE_RECEIVING_VIEW,
      P.STORE_RECEIVING_CREATE,
      P.STORE_RECEIVING_DETAIL_VIEW,
      P.STORE_PHYSICAL_VERIFY_VIEW,
      P.STORE_PHYSICAL_VERIFY,
      P.STORE_PHYSICAL_VERIFY_CORRECT,
      P.STORE_DISCREPANCY_VIEW,
      P.STORE_SHORTAGE_VIEW,
      P.STORE_SHORTAGE_CREATE,
      P.STORE_SHORTAGE_CORRECT,
      P.STORE_LOCATION_TRANSFER_VIEW,
      P.STORE_LOCATION_TRANSFER_EXECUTE,
      P.STORE_STOCK_ADJUST_REVERSE,
      P.STORE_RTV_PREPARE,
      P.STORE_RTV_CANCEL,
      P.GRN_DISCREPANCY_VIEW,
      P.GRN_DISCREPANCY_CREATE,
      P.GRN_DISCREPANCY_CORRECT,
      P.GRN_DISCREPANCY_SEGREGATE,
      P.GRN_REVERSE,
      P.STORE_IQC_HANDOVER,
      P.STORE_IQC_CANCEL,
      P.ADDITIONAL_MATERIAL_REQUEST,
      P.DISPATCH_RESERVATION_VIEW,
      P.DISPATCH_RESERVATION_CREATE,
      P.DISPATCH_RESERVATION_RELEASE,
      P.DISPATCH_PICK_VIEW,
      P.DISPATCH_PICK_CREATE,
      P.DISPATCH_PICK_CONFIRM,
      P.DISPATCH_PICK_REVERSE,
      P.DISPATCH_VERIFY_VIEW,
      P.DISPATCH_VERIFY_CONFIRM,
      P.DISPATCH_VERIFY_REVERSE,
      P.DISPATCH_PACK_VIEW,
      P.DISPATCH_PACK_CREATE,
      P.DISPATCH_PACK_CONFIRM,
      P.DISPATCH_PACK_REVERSE,
      P.DISPATCH_DOCUMENT_VIEW,
      P.DISPATCH_DOCUMENT_REFRESH,
      P.DISPATCH_TRANSPORT_VIEW,
      P.DISPATCH_TRANSPORT_ASSIGN,
      P.DISPATCH_TRANSPORT_REASSIGN,
      P.DISPATCH_TRANSPORT_CANCEL,
      P.DISPATCH_LOADING_VIEW,
      P.DISPATCH_LOADING_START,
      P.DISPATCH_LOADING_CONFIRM,
      P.DISPATCH_LOADING_UNLOAD,
      P.DISPATCH_LOADING_COMPLETE,
      P.DISPATCH_CONFIRM_VIEW,
      P.DISPATCH_CONFIRM_CREATE,
      P.DISPATCH_CONFIRM_REVERSE,
      P.DISPATCH_DASHBOARD_VIEW,
      P.DISPATCH_TRACE_VIEW,
      P.DISPATCH_RECONCILIATION_VIEW,
      P.PURCHASE_VIEW,
      P.REPORTS_VIEW,
      P.PLANT_VIEW,
      P.UNIT_VIEW,
      P.CHANGE_REQUEST_VIEW,
    ],
    sidebar: [
      { key: 'sidebar.inventory' },
      { key: 'sidebar.gate' },
      { key: 'sidebar.gate.vehicles' },
      { key: 'sidebar.gate.visitors' },
      { key: 'dispatch.dashboard' },
      { key: 'dispatch.orders' },
      { key: 'dispatch.pickingLoading' },
      { key: 'dispatch.gateOutStatus' },
      { key: 'dispatch.section' },
      { key: 'dispatch.trace' },
    ],
  },
  {
    name: 'PLANT_MANAGER',
    label: 'Plant Manager',
    description:
      'Plant-wide oversight across production, quality, store, purchase and sales approvals, and manpower.',
    isProtected: false,
    permissions: [
      P.COMPANY_VIEW,
      P.PLANT_VIEW,
      P.PLANT_EDIT,
      P.UNIT_VIEW,
      P.UNIT_CREATE,
      P.UNIT_EDIT,
      P.DEPARTMENT_VIEW,
      P.BRANCH_VIEW,
      P.USER_VIEW,
      P.PURCHASE_VIEW,
      P.PURCHASE_CREATE,
      P.PURCHASE_EDIT,
      P.PURCHASE_APPROVE,
      P.PURCHASE_ORDER_VIEW,
      P.PO_APPROVAL_VIEW,
      P.INVENTORY_VIEW,
      P.INVENTORY_CREATE,
      P.INVENTORY_EDIT,
      P.INVENTORY_DASHBOARD_VIEW,
      P.PRODUCTION_VIEW,
      P.PRODUCTION_CREATE,
      P.PRODUCTION_EDIT,
      P.PRODUCTION_DASHBOARD_VIEW,
      P.WORK_ORDER_VIEW,
      P.WORK_ORDER_APPROVE,
      P.WORK_ORDER_RELEASE,
      P.MRP_VIEW,
      P.PRODUCTION_ENTRY_VIEW,
      P.FG_RECEIPT_VIEW,
      P.PRODUCTION_ISSUE_VIEW,
      // PRODUCTION_COST_SHEET_VIEW deliberately NOT granted here (task #78):
      // it exposes per-work-order material/labour/rework cost and P&L data,
      // which stays Super Admin/Admin/Accounts only, same restriction as
      // ProductionEntry.profitLossAmount (see production-entry.service.ts).
      P.PRODUCTION_REPORT_VIEW,
      P.QUALITY_VIEW,
      P.QUALITY_CREATE,
      P.QUALITY_EDIT,
      P.QUALITY_DASHBOARD_VIEW,
      P.PRODUCTION_QC_VIEW,
      P.OQC_VIEW,
      P.NCR_VIEW,
      P.CAPA_VIEW,
      P.RCA_VIEW,
      P.SUPPLIER_QUALITY_VIEW,
      P.QUALITY_REPORT_VIEW,
      P.IQC_VIEW,
      P.SALES_VIEW,
      P.SALES_APPROVE,
      P.CUSTOMER_PO_VIEW,
      P.SALES_ORDER_VIEW,
      P.HR_VIEW,
      P.SYSTEM_VIEW,
      P.SYSTEM_CREATE,
      P.REPORTS_VIEW,
      P.REPORTS_EXPORT,
      P.MIS_REPORT_VIEW,
      P.ANALYTICS_TAB_VIEW,
      P.AUDIT_VIEW,
      P.GATE_DASHBOARD_VIEW,
      P.GATE_INWARD_VIEW,
      P.GATE_OUTWARD_VIEW,
      P.MANPOWER_VIEW,
      P.MANPOWER_ALLOCATE,
      P.MANPOWER_ACCEPT,
      P.MANPOWER_DISTRIBUTE,
      P.MANPOWER_QUERY,
      P.MANPOWER_ADJUST,
      P.STAGE_TRANSFER_VIEW,
      P.MATERIAL_ISSUE_OVERRIDE_APPROVE,
      P.ADDITIONAL_MATERIAL_APPROVE,
      P.DELETE_APPROVE,
      P.CHANGE_REQUEST_VIEW,
      P.PRODUCTION_TARGET_VIEW,
      P.PRODUCTION_TARGET_MANAGE,
      P.BOM_VIEW,
      P.BOM_VERIFY,
      P.BOM_APPROVE,
      P.WORKFLOW_VIEW,
      P.WORKFLOW_ACT,
      P.DISPATCH_DASHBOARD_VIEW,
      P.DISPATCH_VIEW,
      P.DISPATCH_PLAN_VIEW,
      P.DISPATCH_TRACE_VIEW,
      P.DISPATCH_RECONCILIATION_VIEW,
      P.GATE_DISPATCH_OUT_VIEW,
    ],
    sidebar: [
      { key: 'sidebar.inventory' },
      { key: 'sidebar.production' },
      { key: 'sidebar.sales' },
      { key: 'sidebar.purchase' },
      { key: 'sidebar.quality' },
      { key: 'sidebar.quality.dashboard' },
      { key: 'sidebar.quality.iqc' },
      { key: 'sidebar.quality.iqcTemplates' },
      { key: 'sidebar.quality.ipqc' },
      { key: 'sidebar.quality.oqc' },
      { key: 'sidebar.quality.ncr' },
      { key: 'sidebar.quality.capa' },
      { key: 'sidebar.quality.rca' },
      { key: 'sidebar.quality.supplier' },
      { key: 'sidebar.quality.reports' },
      { key: 'sidebar.gate' },
      { key: 'sidebar.changeRequests' },
      { key: 'sidebar.industry4' },
      { key: 'sidebar.analytics' },
    ],
  },
  {
    name: 'STAGE_SUPERVISOR',
    label: 'Stage Supervisor',
    description:
      'Shop-floor supervisor for one production stage - entries, FG handoff, manpower assignment on the line.',
    isProtected: false,
    permissions: [
      P.PRODUCTION_VIEW,
      P.PRODUCTION_CREATE,
      P.PRODUCTION_EDIT,
      P.PRODUCTION_DASHBOARD_VIEW,
      P.WORK_ORDER_VIEW,
      P.PRODUCTION_ENTRY_VIEW,
      P.FG_RECEIPT_VIEW,
      P.PRODUCTION_ISSUE_VIEW,
      P.INVENTORY_VIEW,
      P.STOCK_ISSUE_VIEW,
      P.QUALITY_VIEW,
      P.PRODUCTION_QC_VIEW,
      P.MANPOWER_VIEW,
      P.MANPOWER_ASSIGN,
      P.MANPOWER_QUERY,
      P.STAGE_TRANSFER_VIEW,
      P.STAGE_TRANSFER_GIVE,
      P.STAGE_TRANSFER_RECEIVE,
      P.CHANGE_REQUEST_VIEW,
      P.REPORTS_VIEW,
      P.PLANT_VIEW,
      P.UNIT_VIEW,
    ],
    sidebar: [{ key: 'sidebar.production' }],
  },
  {
    name: 'QUALITY_MANAGER',
    label: 'Quality Manager',
    description:
      'Head of Quality - oversees IQC/IPQC/OQC, NCR, CAPA, RCA, supplier quality, and QC-side GRN discrepancy review.',
    isProtected: false,
    permissions: [
      P.QUALITY_VIEW,
      P.QUALITY_CREATE,
      P.QUALITY_EDIT,
      P.QUALITY_DASHBOARD_VIEW,
      P.IQC_VIEW,
      P.PRODUCTION_QC_VIEW,
      P.OQC_VIEW,
      P.NCR_VIEW,
      P.CAPA_VIEW,
      P.RCA_VIEW,
      P.SUPPLIER_QUALITY_VIEW,
      P.QUALITY_REPORT_VIEW,
      P.GRN_VIEW,
      P.GRN_DISCREPANCY_VIEW,
      P.GRN_DISCREPANCY_QC_REVIEW,
      P.GRN_DISCREPANCY_RESOLVE_APPROVE,
      P.QC_IQC_RECEIVE,
      P.PRODUCTION_VIEW,
      P.INVENTORY_VIEW,
      P.WORKFLOW_VIEW,
      P.WORKFLOW_ACT,
      P.REPORTS_VIEW,
      P.REPORTS_EXPORT,
      P.PLANT_VIEW,
      P.UNIT_VIEW,
      P.DEPARTMENT_VIEW,
      P.COMPANY_VIEW,
      P.CHANGE_REQUEST_VIEW,
      P.DISPATCH_TRACE_VIEW,
      P.DISPATCH_RECONCILIATION_VIEW,
    ],
    sidebar: [
      { key: 'sidebar.quality' },
      { key: 'sidebar.quality.dashboard' },
      { key: 'sidebar.quality.iqc' },
      { key: 'sidebar.quality.iqcTemplates' },
      { key: 'sidebar.quality.ipqc' },
      { key: 'sidebar.quality.oqc' },
      { key: 'sidebar.quality.ncr' },
      { key: 'sidebar.quality.capa' },
      { key: 'sidebar.quality.rca' },
      { key: 'sidebar.quality.supplier' },
      { key: 'sidebar.quality.reports' },
      { key: 'sidebar.analytics' },
    ],
  },
  {
    name: 'IQC',
    label: 'IQC',
    description:
      'Incoming Quality Control - inspects incoming material against GRN/gate-inward before it reaches store.',
    isProtected: false,
    permissions: [
      P.IQC_VIEW,
      P.QC_IQC_RECEIVE,
      P.GRN_VIEW,
      P.GATE_INWARD_VIEW,
      P.GRN_DISCREPANCY_VIEW,
      P.GRN_DISCREPANCY_QC_REVIEW,
      P.QUALITY_VIEW,
      P.QUALITY_CREATE,
      P.NCR_VIEW,
      P.INVENTORY_VIEW,
      P.REPORTS_VIEW,
      P.CHANGE_REQUEST_VIEW,
      P.DISPATCH_TRACE_VIEW,
      P.DISPATCH_RECONCILIATION_VIEW,
    ],
    sidebar: [
      { key: 'sidebar.quality' },
      { key: 'sidebar.quality.iqc' },
      { key: 'sidebar.quality.iqcTemplates' },
      { key: 'sidebar.dashboard', customPage: '/quality/iqc-dashboard' },
    ],
  },
  {
    name: 'IPQC',
    label: 'IPQC',
    description:
      'In-Process Quality Control - inspects work-in-progress on the production floor.',
    isProtected: false,
    permissions: [
      P.PRODUCTION_QC_VIEW,
      P.QUALITY_VIEW,
      P.QUALITY_CREATE,
      P.PRODUCTION_VIEW,
      P.WORK_ORDER_VIEW,
      P.PRODUCTION_ENTRY_VIEW,
      P.NCR_VIEW,
      P.REPORTS_VIEW,
      P.CHANGE_REQUEST_VIEW,
      P.DISPATCH_TRACE_VIEW,
      P.DISPATCH_RECONCILIATION_VIEW,
    ],
    sidebar: [{ key: 'sidebar.quality' }, { key: 'sidebar.quality.ipqc' }],
  },
  {
    name: 'OQC',
    label: 'OQC',
    description:
      'Outgoing Quality Control - final FG inspection, tied into the dispatch pick/pack/load/verify chain.',
    isProtected: false,
    permissions: [
      P.OQC_VIEW,
      P.QUALITY_VIEW,
      P.QUALITY_CREATE,
      P.FG_RECEIPT_VIEW,
      P.PRODUCTION_VIEW,
      P.NCR_VIEW,
      P.REPORTS_VIEW,
      P.CHANGE_REQUEST_VIEW,
      P.DISPATCH_RESERVATION_VIEW,
      P.DISPATCH_RESERVATION_CREATE,
      P.DISPATCH_RESERVATION_RELEASE,
      P.DISPATCH_PICK_VIEW,
      P.DISPATCH_PICK_CREATE,
      P.DISPATCH_PICK_CONFIRM,
      P.DISPATCH_PICK_REVERSE,
      P.DISPATCH_VERIFY_VIEW,
      P.DISPATCH_VERIFY_CONFIRM,
      P.DISPATCH_VERIFY_REVERSE,
      P.DISPATCH_PACK_VIEW,
      P.DISPATCH_PACK_CREATE,
      P.DISPATCH_PACK_CONFIRM,
      P.DISPATCH_PACK_REVERSE,
      P.DISPATCH_DOCUMENT_VIEW,
      P.DISPATCH_DOCUMENT_REFRESH,
      P.DISPATCH_TRANSPORT_VIEW,
      P.DISPATCH_TRANSPORT_ASSIGN,
      P.DISPATCH_TRANSPORT_REASSIGN,
      P.DISPATCH_TRANSPORT_CANCEL,
      P.DISPATCH_LOADING_VIEW,
      P.DISPATCH_LOADING_START,
      P.DISPATCH_LOADING_CONFIRM,
      P.DISPATCH_LOADING_UNLOAD,
      P.DISPATCH_LOADING_COMPLETE,
      P.DISPATCH_CONFIRM_VIEW,
      P.DISPATCH_CONFIRM_CREATE,
      P.DISPATCH_CONFIRM_REVERSE,
      P.GATE_DISPATCH_OUT_VIEW,
      P.GATE_DISPATCH_OUT_CONFIRM,
      P.DISPATCH_TRACE_VIEW,
      P.DISPATCH_RECONCILIATION_VIEW,
    ],
    sidebar: [
      { key: 'sidebar.quality' },
      { key: 'sidebar.quality.oqc' },
      { key: 'dispatch.dashboard' },
      { key: 'dispatch.orders' },
      { key: 'dispatch.pickingLoading' },
      { key: 'dispatch.gateOutStatus' },
      { key: 'dispatch.section' },
      { key: 'dispatch.trace' },
    ],
  },
  {
    name: 'HR',
    label: 'HR',
    description:
      'Human Resources - employees, attendance, leave, payroll, training, and user account administration.',
    isProtected: false,
    permissions: [
      P.HR_VIEW,
      P.HR_CREATE,
      P.HR_EDIT,
      P.HR_APPROVE,
      P.EMPLOYEE_VIEW,
      P.ATTENDANCE_VIEW,
      P.LEAVE_VIEW,
      P.PAYROLL_VIEW,
      P.SALARY_SLIP_VIEW,
      P.PF_ESI_VIEW,
      P.TRAINING_VIEW,
      P.HR_REPORT_VIEW,
      P.USER_VIEW,
      P.USER_CREATE,
      P.USER_EDIT,
      P.USER_TOGGLE_STATUS,
      P.USER_RESET_PASSWORD,
      P.DEPARTMENT_VIEW,
      P.DEPARTMENT_CREATE,
      P.DEPARTMENT_EDIT,
      P.PLANT_VIEW,
      P.UNIT_VIEW,
      P.COMPANY_VIEW,
      P.BRANCH_VIEW,
      P.MANPOWER_VIEW,
      P.MANPOWER_ALLOCATE,
      P.MANPOWER_DISTRIBUTE,
      P.REPORTS_VIEW,
      P.REPORTS_EXPORT,
      P.AUDIT_VIEW,
      P.CHANGE_REQUEST_VIEW,
    ],
    sidebar: [{ key: 'sidebar.hr' }],
  },
  {
    name: 'ACCOUNTS',
    label: 'Accounts',
    description:
      'Finance / accounts - ledgers, vouchers, AR/AP, GST, bank reconciliation, credit control, financial reporting.',
    isProtected: false,
    permissions: [
      P.FINANCE_VIEW,
      P.FINANCE_CREATE,
      P.FINANCE_EDIT,
      P.FINANCE_APPROVE,
      P.ACCOUNTING_VIEW,
      P.CHART_OF_ACCOUNTS_VIEW,
      P.VOUCHER_VIEW,
      P.AR_VIEW,
      P.AP_VIEW,
      P.GST_VIEW,
      P.BANK_RECONCILIATION_VIEW,
      P.PAYMENT_INSTRUMENT_VIEW,
      P.TDS_VIEW,
      P.FINANCIAL_REPORT_VIEW,
      P.PURCHASE_VIEW,
      P.PURCHASE_CREATE,
      P.SALES_VIEW,
      P.CREDIT_CONTROL_VIEW,
      P.CREDIT_CONTROL_OVERRIDE,
      P.PROFORMA_INVOICE_VIEW,
      P.INVENTORY_VIEW,
      P.INVENTORY_VALUATION_VIEW,
      P.PRODUCT_SELLING_PRICE_VIEW,
      P.REPORTS_VIEW,
      P.REPORTS_EXPORT,
      P.AUDIT_VIEW,
      P.COMPANY_VIEW,
      P.BRANCH_VIEW,
      P.FINANCIAL_YEAR_VIEW,
      P.PLANT_VIEW,
      P.UNIT_VIEW,
      P.DEPARTMENT_VIEW,
      P.CHANGE_REQUEST_VIEW,
      P.DISPATCH_DASHBOARD_VIEW,
      P.SALES_ORDER_VIEW,
      P.CUSTOMER_PO_VIEW,
      P.DISPATCH_PLAN_VIEW,
      P.DISPATCH_VIEW,
      P.DISPATCH_SOURCE_VIEW,
      P.DISPATCH_AVAILABILITY_VIEW,
      P.DISPATCH_TRACE_VIEW,
      P.DISPATCH_RECONCILIATION_VIEW,
    ],
    sidebar: [
      { key: 'sidebar.finance' },
      { key: 'dispatch.dashboard' },
      { key: 'dispatch.orders' },
      { key: 'dispatch.trace' },
    ],
  },
  {
    name: 'GATE_INCHARGE',
    label: 'Gate Incharge',
    description:
      'Factory gate / security - inward & outward entries, gate passes, visitors, vehicles, parking, dispatch gate-out.',
    isProtected: false,
    permissions: [
      P.GATE_DASHBOARD_VIEW,
      P.GATE_INWARD_VIEW,
      P.GATE_INWARD_CREATE,
      P.GATE_INWARD_VERIFY,
      P.GATE_INWARD_RESOLVE_HOLD,
      P.GATE_OUTWARD_VIEW,
      P.GATE_OUTWARD_CREATE,
      P.GATE_OUTWARD_AUTHORIZE,
      P.GATE_PASS_VIEW,
      P.GATE_PASS_CREATE,
      P.GATE_PASS_APPROVE,
      P.GATE_PASS_VERIFY,
      P.VISITOR_VIEW,
      P.VISITOR_CREATE,
      P.VISITOR_CHECKIN,
      P.VEHICLE_LOG_VIEW,
      P.VEHICLE_LOG_CREATE,
      P.PARKING_MANAGE,
      P.GATE_EVENT_VIEW,
      P.GATE_EVENT_CREATE,
      P.GATE_EVENT_CORRECT,
      P.GATE_RTV_OUT_CONFIRM,
      P.GATE_DISPATCH_OUT_VIEW,
      P.GATE_DISPATCH_OUT_CONFIRM,
      P.DISPATCH_CONFIRM_VIEW,
      P.DISPATCH_TRACE_VIEW,
      P.DISPATCH_RECONCILIATION_VIEW,
      P.CHANGE_REQUEST_VIEW,
    ],
    sidebar: [
      { key: 'sidebar.gate' },
      { key: 'sidebar.gate.vehicles' },
      { key: 'sidebar.gate.visitors' },
      { key: 'dispatch.gateOutStatus' },
      { key: 'dispatch.trace' },
    ],
  },
];

const SEED_ACTOR = 'system-seed-15-roles';

async function seedRoleForCompany(companyId: string, def: RoleDef) {
  const existing = await prisma.role.findFirst({
    where: { companyId, name: def.name },
  });
  if (existing) {
    console.log(
      `    ${def.name}: already exists, skipping (no permission/sidebar changes made).`,
    );
    return;
  }

  const role = await prisma.role.create({
    data: {
      companyId,
      name: def.name,
      label: def.label,
      description: def.description,
      isSystemRole: true,
      isProtected: def.isProtected,
      createdBy: SEED_ACTOR,
      updatedBy: SEED_ACTOR,
    },
  });

  if (def.permissions.length > 0) {
    await prisma.rolePermission.createMany({
      data: def.permissions.map((p) => ({
        companyId,
        roleId: role.id,
        permission: p,
        createdBy: SEED_ACTOR,
        updatedBy: SEED_ACTOR,
      })),
    });
  }

  let sidebarApplied = 0;
  let sidebarSkippedMissing = 0;
  for (const entry of def.sidebar) {
    const element = await prisma.uiControlElement.findUnique({
      where: { companyId_key: { companyId, key: entry.key } },
    });
    if (!element) {
      // Sidebar element hasn't been synced for this company yet (e.g. the
      // frontend hasn't pushed its sidebar structure via /ui-control/sync
      // for this company). Never invent the element - just skip it; it's
      // safe to re-run this script later once it exists.
      sidebarSkippedMissing++;
      continue;
    }
    // Composite (elementId, scopeType='ROLE', roleName) is unique per the
    // partial index `uq_ui_override_role` - mirror that uniqueness check
    // manually since Prisma can't target a partial unique index directly.
    const existingOverride = await prisma.uiControlOverride.findFirst({
      where: { elementId: element.id, scopeType: 'ROLE', roleName: def.name },
    });
    if (existingOverride) continue;

    await prisma.uiControlOverride.create({
      data: {
        companyId,
        elementId: element.id,
        scopeType: 'ROLE',
        roleName: def.name,
        isVisible: true,
        customPage: entry.customPage ?? null,
        createdBy: SEED_ACTOR,
        updatedBy: SEED_ACTOR,
      },
    });
    sidebarApplied++;
  }

  console.log(
    `    ${def.name}: created with ${def.permissions.length} permission(s), ` +
      `${sidebarApplied} sidebar override(s) applied` +
      (sidebarSkippedMissing > 0
        ? ` (${sidebarSkippedMissing} sidebar key(s) not found for this company, skipped)`
        : '') +
      (def.isProtected ? ' [PROTECTED]' : '') +
      '.',
  );
}

async function main() {
  const companies = await prisma.company.findMany({
    select: { id: true, name: true },
  });
  console.log(
    `Seeding the 15-role structure for ${companies.length} company(ies)...`,
  );

  for (const company of companies) {
    console.log(`\n--- ${company.name} (${company.id}) ---`);
    for (const def of ROLE_DEFS) {
      await seedRoleForCompany(company.id, def);
    }
  }

  console.log('\nDone.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
