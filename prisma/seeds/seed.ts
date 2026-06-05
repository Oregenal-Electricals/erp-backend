import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Module 1 — Master Setup...\n');

  // ── Company ──────────────────────────────────
  const company = await prisma.company.upsert({
    where: { code: 'ACME001' },
    update: {},
    create: {
      code: 'ACME001',
      name: 'Acme Electronics Pvt Ltd',
      legalName: 'Acme Electronics Private Limited',
      pan: 'AABCA1234Z',
      gstin: '27AABCA1234Z1ZX',
      address: '123 Industrial Area, Andheri East',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      pincode: '400069',
      phone: '+91-22-12345678',
      email: 'info@acmeelectronics.com',
      website: 'https://www.acmeelectronics.com',
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
    where: { code: 'PLT-MUM-01' },
    update: {},
    create: {
      code: 'PLT-MUM-01',
      name: 'Mumbai Manufacturing Plant',
      gstin: '27AABCA1234Z1ZX',
      address: '456 MIDC, Andheri East',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      pincode: '400093',
      phone: '+91-22-87654321',
      email: 'plant1@acmeelectronics.com',
      plantType: 'MANUFACTURING',
      companyId: company.id,
      createdBy: 'system',
      updatedBy: 'system',
      isTestData: false,
    },
  });
  console.log(`✅ Plant    : ${plant.name} (${plant.code})`);

  // ── Units ─────────────────────────────────────
  const units = [
    { code: 'UNIT-SMT-01', name: 'SMT Line 1',     unitType: 'PRODUCTION' },
    { code: 'UNIT-ASM-01', name: 'Assembly Unit 1', unitType: 'PRODUCTION' },
    { code: 'UNIT-WH-01',  name: 'Main Warehouse',  unitType: 'WAREHOUSE'  },
  ];
  for (const u of units) {
    await prisma.unit.upsert({
      where: { code: u.code },
      update: {},
      create: { ...u, plantId: plant.id, createdBy: 'system', updatedBy: 'system', isTestData: false },
    });
    console.log(`✅ Unit     : ${u.name}`);
  }

  // ── Departments ───────────────────────────────
  const departments = [
    { code: 'DEPT-PROD',  name: 'Production',      description: 'Manufacturing & Production' },
    { code: 'DEPT-QC',    name: 'Quality Control',  description: 'IQC, PQC, OQC'             },
    { code: 'DEPT-PURCH', name: 'Purchase',         description: 'Procurement & Vendors'      },
    { code: 'DEPT-STORE', name: 'Store',            description: 'Inventory & Warehouse'      },
    { code: 'DEPT-FIN',   name: 'Finance',          description: 'Accounts & GST'             },
    { code: 'DEPT-HR',    name: 'HR',               description: 'Human Resources'            },
    { code: 'DEPT-IT',    name: 'IT',               description: 'Technology & Systems'       },
  ];
  for (const d of departments) {
    await prisma.department.upsert({
      where: { code: d.code },
      update: {},
      create: { ...d, companyId: company.id, createdBy: 'system', updatedBy: 'system', isTestData: false },
    });
    console.log(`✅ Dept     : ${d.name}`);
  }

  // ── Branch ────────────────────────────────────
  const branch = await prisma.branch.upsert({
    where: { code: 'BRN-MUM-HO' },
    update: {},
    create: {
      code: 'BRN-MUM-HO',
      name: 'Mumbai Head Office',
      gstin: '27AABCA1234Z1ZX',
      address: '123 Business Park, BKC',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      pincode: '400051',
      phone: '+91-22-99887766',
      email: 'ho@acmeelectronics.com',
      branchType: 'OFFICE',
      companyId: company.id,
      createdBy: 'system',
      updatedBy: 'system',
      isTestData: false,
    },
  });
  console.log(`✅ Branch   : ${branch.name}`);

  // ── Financial Year ────────────────────────────
  const fy = await prisma.financialYear.upsert({
    where: { code: 'FY2024-25' },
    update: {},
    create: {
      code: 'FY2024-25',
      label: '2024-2025',
      startDate: new Date('2024-04-01'),
      endDate: new Date('2025-03-31'),
      status: 'CURRENT',
      companyId: company.id,
      createdBy: 'system',
      updatedBy: 'system',
      isTestData: false,
    },
  });
  console.log(`✅ Fin Year : ${fy.label} — ${fy.status}`);

  // ── Super Admin User ──────────────────────────
  const passwordHash = await bcrypt.hash('Admin@1234', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@acmeelectronics.com' },
    update: {},
    create: {
      email: 'admin@acmeelectronics.com',
      firstName: 'Super',
      lastName: 'Admin',
      employeeCode: 'EMP0001',
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      mustChangePwd: false,
      companyId: company.id,
      createdBy: 'system',
      updatedBy: 'system',
      isTestData: false,
    },
  });
  console.log(`✅ Admin    : ${admin.email}`);

  // ── Viewer Test User ──────────────────────────
  const viewerHash = await bcrypt.hash('Viewer@1234', 12);
  const viewer = await prisma.user.upsert({
    where: { email: 'john.doe@acmeelectronics.com' },
    update: {},
    create: {
      email: 'john.doe@acmeelectronics.com',
      firstName: 'John',
      lastName: 'Doe',
      employeeCode: 'EMP0002',
      passwordHash: viewerHash,
      role: UserRole.VIEWER,
      mustChangePwd: false,
      companyId: company.id,
      createdBy: 'system',
      updatedBy: 'system',
      isTestData: false,
    },
  });
  console.log(`✅ Viewer   : ${viewer.email}`);

  // ── Numbering Series ──────────────────────────
  const seriesTypes = [
    { documentType: 'PO',  prefix: 'PO'  },
    { documentType: 'GRN', prefix: 'GRN' },
    { documentType: 'INV', prefix: 'INV' },
    { documentType: 'WO',  prefix: 'WO'  },
    { documentType: 'DC',  prefix: 'DC'  },
    { documentType: 'QC',  prefix: 'QC'  },
    { documentType: 'MR',  prefix: 'MR'  },
    { documentType: 'SR',  prefix: 'SR'  },
    { documentType: 'CR',  prefix: 'CR'  },
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
  console.log(`✅ Numbering: 9 series created`);

  // ── System Settings ───────────────────────────
  const settings = [
    { key: 'app_name',           value: 'Smart Manufacturing ERP', category: 'GENERAL',  description: 'Application name'              },
    { key: 'app_version',        value: '1.0.0',                   category: 'GENERAL',  description: 'Application version'           },
    { key: 'timezone',           value: 'Asia/Kolkata',            category: 'GENERAL',  description: 'Default timezone'              },
    { key: 'date_format',        value: 'DD/MM/YYYY',             category: 'GENERAL',  description: 'Date display format'           },
    { key: 'currency_code',      value: 'INR',                     category: 'FINANCE',  description: 'Default currency'             },
    { key: 'currency_symbol',    value: '₹',                       category: 'FINANCE',  description: 'Currency symbol'              },
    { key: 'gst_enabled',        value: 'true',                    category: 'FINANCE',  description: 'GST enabled'                  },
    { key: 'decimal_places',     value: '2',                       category: 'FINANCE',  description: 'Decimal places'               },
    { key: 'approval_po',        value: 'true',                    category: 'APPROVAL', description: 'PO requires approval'         },
    { key: 'approval_grn',       value: 'false',                   category: 'APPROVAL', description: 'GRN requires approval'        },
    { key: 'approval_inv',       value: 'true',                    category: 'APPROVAL', description: 'Invoice requires approval'    },
    { key: 'max_login_attempts', value: '5',                       category: 'SECURITY', description: 'Max failed login attempts'    },
    { key: 'session_timeout',    value: '24',                      category: 'SECURITY', description: 'Session timeout hours'        },
    { key: 'password_expiry',    value: '90',                      category: 'SECURITY', description: 'Password expiry days'         },
  ];
  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: {},
      create: { ...s, createdBy: 'system', updatedBy: 'system', isTestData: false },
    });
  }
  console.log(`✅ Settings : 14 system settings created`);

  console.log('\n────────────────────────────────────────');
  console.log('🎉 Seed complete!');
  console.log('────────────────────────────────────────');
  console.log(`Company ID  : ${company.id}`);
  console.log(`Plant ID    : ${plant.id}`);
  console.log(`Login Email : admin@acmeelectronics.com`);
  console.log(`Password    : Admin@1234`);
  console.log(`Viewer      : john.doe@acmeelectronics.com / Viewer@1234`);
  console.log('────────────────────────────────────────');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
