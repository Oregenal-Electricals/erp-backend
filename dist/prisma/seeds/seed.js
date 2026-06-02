"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding Module 1 — Master Setup...\n');
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
            isTestData: true,
        },
    });
    console.log(`✅ Company  : ${company.name} (${company.code})`);
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
            isTestData: true,
        },
    });
    console.log(`✅ Plant    : ${plant.name} (${plant.code})`);
    const units = [
        { code: 'UNIT-SMT-01', name: 'SMT Line 1', unitType: 'PRODUCTION' },
        { code: 'UNIT-ASM-01', name: 'Assembly Unit 1', unitType: 'PRODUCTION' },
        { code: 'UNIT-WH-01', name: 'Main Warehouse', unitType: 'WAREHOUSE' },
    ];
    for (const u of units) {
        await prisma.unit.upsert({
            where: { code: u.code },
            update: {},
            create: Object.assign(Object.assign({}, u), { plantId: plant.id, createdBy: 'system', updatedBy: 'system', isTestData: true }),
        });
        console.log(`✅ Unit     : ${u.name}`);
    }
    const departments = [
        {
            code: 'DEPT-PROD',
            name: 'Production',
            description: 'Manufacturing & Production',
        },
        { code: 'DEPT-QC', name: 'Quality Control', description: 'IQC, PQC, OQC' },
        {
            code: 'DEPT-PURCH',
            name: 'Purchase',
            description: 'Procurement & Vendors',
        },
        { code: 'DEPT-STORE', name: 'Store', description: 'Inventory & Warehouse' },
        { code: 'DEPT-FIN', name: 'Finance', description: 'Accounts & GST' },
        { code: 'DEPT-HR', name: 'HR', description: 'Human Resources' },
        { code: 'DEPT-IT', name: 'IT', description: 'Technology & Systems' },
    ];
    for (const d of departments) {
        await prisma.department.upsert({
            where: { code: d.code },
            update: {},
            create: Object.assign(Object.assign({}, d), { companyId: company.id, createdBy: 'system', updatedBy: 'system', isTestData: true }),
        });
        console.log(`✅ Dept     : ${d.name}`);
    }
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
            isTestData: true,
        },
    });
    console.log(`✅ Branch   : ${branch.name}`);
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
            isTestData: true,
        },
    });
    console.log(`✅ Fin Year : ${fy.label} — ${fy.status}`);
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
            role: client_1.UserRole.SUPER_ADMIN,
            mustChangePwd: false,
            companyId: company.id,
            createdBy: 'system',
            updatedBy: 'system',
            isTestData: true,
        },
    });
    console.log(`✅ Admin    : ${admin.email}`);
    console.log('\n────────────────────────────────────────');
    console.log('🎉 Seed complete!');
    console.log('────────────────────────────────────────');
    console.log(`Company ID  : ${company.id}`);
    console.log(`Plant ID    : ${plant.id}`);
    console.log(`Login Email : admin@acmeelectronics.com`);
    console.log(`Password    : Admin@1234`);
    console.log('────────────────────────────────────────');
}
main()
    .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed.js.map