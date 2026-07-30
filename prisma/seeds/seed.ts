import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Fixed IDs, matching what's already referenced throughout PROJECT_STATUS.md
// and ERP_Manual_Testing_Guide.md - preserving these across a DB wipe keeps
// that documentation accurate instead of instantly stale.
const COMPANY_ID = '83eda866-ba63-472c-902f-561f05b6b1c1';
const WAREHOUSE_ID = '8ee69281-5f14-475a-ac66-dabbb037a1a4';
const SUPER_ADMIN_ID = '19b228a1-c479-4b25-bf69-a5d3e091f682';

async function main() {
  console.log('🌱 Seeding Oregenal Electricals master data...\n');

  // ── Company ──────────────────────────────────
  const company = await prisma.company.upsert({
    where: { id: COMPANY_ID },
    update: {},
    create: {
      id: COMPANY_ID,
      code: 'OREGENAL',
      name: 'Oregenal Electricals India Pvt Ltd',
      legalName: 'Oregenal Electricals India Private Limited',
      address: 'Plot 25117, IMT Manesar',
      city: 'Manesar',
      state: 'Haryana',
      pincode: '122051',
      currencyCode: 'INR',
      timezone: 'Asia/Kolkata',
      createdBy: 'system',
      updatedBy: 'system',
      isTestData: false,
    },
  });
  console.log(`✅ Company  : ${company.name} (${company.code})`);

  // ── Plant ─────────────────────────────────────
  const plant = await prisma.plant.upsert({
    where: { code: '25117' },
    update: {},
    create: {
      code: '25117',
      name: 'OREGENAL MANESAR PLANT',
      address: 'Plot 25117, IMT Manesar',
      city: 'Manesar',
      state: 'Haryana',
      pincode: '122051',
      plantType: 'MANUFACTURING',
      companyId: company.id,
      createdBy: 'system',
      updatedBy: 'system',
      isTestData: false,
    },
  });
  console.log(`✅ Plant    : ${plant.name} (${plant.code})`);

  // ── Warehouse ─────────────────────────────────
  const warehouse = await prisma.warehouse.upsert({
    where: { id: WAREHOUSE_ID },
    update: {},
    create: {
      id: WAREHOUSE_ID,
      code: 'WH-MAIN',
      name: 'Main Store - Bangalore',
      type: 'GENERAL',
      description: 'Main Raw Material and Finished Goods Store',
      isDefault: true,
      companyId: company.id,
      plantId: plant.id,
      createdBy: 'system',
      updatedBy: 'system',
      isTestData: false,
    },
  });
  console.log(`✅ Warehouse: ${warehouse.name} (${warehouse.code})`);

  // ── Financial Year ────────────────────────────
  const fy = await prisma.financialYear.upsert({
    where: { code: 'FY2026-27' },
    update: {},
    create: {
      code: 'FY2026-27',
      label: '2026-2027',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2027-03-31'),
      status: 'CURRENT',
      companyId: company.id,
      createdBy: 'system',
      updatedBy: 'system',
      isTestData: false,
    },
  });
  console.log(`✅ Fin Year : ${fy.label} — ${fy.status}`);

  // ── Users - SUPER_ADMIN first (fixed ID), then one seeded account per role ──
  const superAdminHash = await bcrypt.hash('Oregenal@123', 12);
  const superAdmin = await prisma.user.upsert({
    where: { id: SUPER_ADMIN_ID },
    update: {},
    create: {
      id: SUPER_ADMIN_ID,
      email: 'superadmin@oregenalelectrical.com',
      firstName: 'Admin',
      lastName: 'User',
      employeeCode: 'EMP0001',
      passwordHash: superAdminHash,
      role: UserRole.SUPER_ADMIN,
      mustChangePwd: false,
      companyId: company.id,
      createdBy: 'system',
      updatedBy: 'system',
      isTestData: false,
    },
  });
  console.log(`✅ Admin    : ${superAdmin.email} / Oregenal@123`);

  // Every other role gets a seeded account too, matching the documented
  // role@oregenalelectrical.com / Oregenal@123 pattern so all existing
  // testing docs and past session notes keep working after a wipe.
  const otherRoles: { role: UserRole; email: string; empCode: string; first: string; last: string }[] = [
    { role: UserRole.CORPORATE_ADMIN, email: 'corporate.admin@oregenalelectrical.com', empCode: 'EMP0002', first: 'Corporate', last: 'Admin' },
    { role: UserRole.PLANT_HEAD, email: 'plant.head@oregenalelectrical.com', empCode: 'EMP0003', first: 'Plant', last: 'Head' },
    { role: UserRole.UNIT_HEAD, email: 'unit.head@oregenalelectrical.com', empCode: 'EMP0004', first: 'Unit', last: 'Head' },
    { role: UserRole.PRODUCTION_HEAD, email: 'production.head@oregenalelectrical.com', empCode: 'EMP0005', first: 'Production', last: 'Head' },
    { role: UserRole.PLANNING_MANAGER, email: 'planning.manager@oregenalelectrical.com', empCode: 'EMP0006', first: 'Planning', last: 'Manager' },
    { role: UserRole.PURCHASE_MANAGER, email: 'purchase.manager@oregenalelectrical.com', empCode: 'EMP0007', first: 'Purchase', last: 'Manager' },
    { role: UserRole.STORE_MANAGER, email: 'store.manager@oregenalelectrical.com', empCode: 'EMP0008', first: 'Store', last: 'Manager' },
    { role: UserRole.QC_MANAGER, email: 'qc.manager@oregenalelectrical.com', empCode: 'EMP0009', first: 'QC', last: 'Manager' },
    { role: UserRole.FINANCE_MANAGER, email: 'finance.manager@oregenalelectrical.com', empCode: 'EMP0010', first: 'Finance', last: 'Manager' },
    { role: UserRole.HR_MANAGER, email: 'hr.manager@oregenalelectrical.com', empCode: 'EMP0011', first: 'HR', last: 'Manager' },
    { role: UserRole.SUPERVISOR, email: 'supervisor@oregenalelectrical.com', empCode: 'EMP0012', first: 'Line', last: 'Supervisor' },
    { role: UserRole.OPERATOR, email: 'operator@oregenalelectrical.com', empCode: 'EMP0013', first: 'Floor', last: 'Operator' },
    { role: UserRole.VIEWER, email: 'viewer@oregenalelectrical.com', empCode: 'EMP0014', first: 'Read', last: 'Only' },
  ];
  const roleHash = await bcrypt.hash('Oregenal@123', 12);
  for (const u of otherRoles) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email, firstName: u.first, lastName: u.last, employeeCode: u.empCode,
        passwordHash: roleHash, role: u.role, mustChangePwd: false, companyId: company.id,
        createdBy: SUPER_ADMIN_ID, updatedBy: SUPER_ADMIN_ID, isTestData: false,
      },
    });
    console.log(`✅ User     : ${u.email} (${u.role}) / Oregenal@123`);
  }

  // ── Numbering Series ──────────────────────────
  const seriesTypes = [
    { documentType: 'PO', prefix: 'PO' },
    { documentType: 'GRN', prefix: 'GRN' },
    { documentType: 'INV', prefix: 'INV' },
    { documentType: 'WO', prefix: 'WO' },
    { documentType: 'DC', prefix: 'DC' },
    { documentType: 'QC', prefix: 'QC' },
    { documentType: 'MR', prefix: 'MR' },
    { documentType: 'SR', prefix: 'SR' },
    { documentType: 'CR', prefix: 'CR' },
  ];
  for (const s of seriesTypes) {
    await prisma.numberingSeries.upsert({
      where: { companyId_documentType: { companyId: company.id, documentType: s.documentType } },
      update: {},
      create: {
        ...s, companyId: company.id,
        separator: '-', includeYear: true, yearFormat: 'YY-YY', padding: 4,
        createdBy: 'system', updatedBy: 'system', isTestData: false,
      },
    });
  }
  console.log(`✅ Numbering: ${seriesTypes.length} series created`);

  // ── System Settings ───────────────────────────
  const settings = [
    { key: 'app_name', value: 'Oregenal Electricals Smart Manufacturing ERP', category: 'GENERAL', description: 'Application name' },
    { key: 'app_version', value: '1.0.0', category: 'GENERAL', description: 'Application version' },
    { key: 'timezone', value: 'Asia/Kolkata', category: 'GENERAL', description: 'Default timezone' },
    { key: 'date_format', value: 'DD/MM/YYYY', category: 'GENERAL', description: 'Date display format' },
    { key: 'currency_code', value: 'INR', category: 'FINANCE', description: 'Default currency' },
    { key: 'currency_symbol', value: '₹', category: 'FINANCE', description: 'Currency symbol' },
    { key: 'gst_enabled', value: 'true', category: 'FINANCE', description: 'GST enabled' },
    { key: 'decimal_places', value: '2', category: 'FINANCE', description: 'Decimal places' },
    { key: 'approval_po', value: 'true', category: 'APPROVAL', description: 'PO requires approval' },
    { key: 'approval_grn', value: 'false', category: 'APPROVAL', description: 'GRN requires approval' },
    { key: 'approval_inv', value: 'true', category: 'APPROVAL', description: 'Invoice requires approval' },
    { key: 'max_login_attempts', value: '5', category: 'SECURITY', description: 'Max failed login attempts' },
    { key: 'session_timeout', value: '24', category: 'SECURITY', description: 'Session timeout hours' },
    { key: 'password_expiry', value: '90', category: 'SECURITY', description: 'Password expiry days' },
  ];
  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: {},
      create: { ...s, createdBy: 'system', updatedBy: 'system', isTestData: false },
    });
  }
  console.log(`✅ Settings : ${settings.length} system settings created`);

  console.log('\n────────────────────────────────────────');
  console.log('🎉 Seed complete!');
  console.log('────────────────────────────────────────');
  console.log(`Company ID   : ${company.id}`);
  console.log(`Plant ID     : ${plant.id}`);
  console.log(`Warehouse ID : ${warehouse.id}`);
  console.log(`Login Email  : superadmin@oregenalelectrical.com`);
  console.log(`Password     : Oregenal@123`);
  console.log('────────────────────────────────────────');
  console.log('NOTE: products, raw materials, BOMs, routing, customers, and');
  console.log('vendors are NOT seeded here - there is no automated script for');
  console.log('those yet. They need to be re-created via the UI/API after login.');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
