import { PrismaClient } from '@prisma/client';
import { ROLE_PERMISSIONS } from '../src/common/permissions/role-permissions';

const prisma = new PrismaClient();

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  CORPORATE_ADMIN: 'Corporate Admin',
  PLANT_HEAD: 'Plant Head',
  UNIT_HEAD: 'Unit Head',
  PRODUCTION_HEAD: 'Production Head',
  PLANNING_MANAGER: 'Planning Manager',
  PURCHASE_MANAGER: 'Purchase Manager',
  STORE_MANAGER: 'Store Manager',
  QC_MANAGER: 'QC Manager',
  FINANCE_MANAGER: 'Finance Manager',
  HR_MANAGER: 'HR Manager',
  SUPERVISOR: 'Supervisor',
  OPERATOR: 'Operator',
  VIEWER: 'Viewer',
};

async function main() {
  const companies = await prisma.company.findMany({ select: { id: true, name: true } });
  console.log(`Seeding roles for ${companies.length} company(ies)...`);

  for (const company of companies) {
    console.log(`\n--- ${company.name} (${company.id}) ---`);

    for (const [roleName, permissions] of Object.entries(ROLE_PERMISSIONS)) {
      const existing = await prisma.role.findFirst({
        where: { companyId: company.id, name: roleName },
      });
      if (existing) {
        console.log(`  ${roleName}: already exists, skipping.`);
        continue;
      }

      const isProtected = roleName === 'SUPER_ADMIN';

      const role = await prisma.role.create({
        data: {
          companyId: company.id,
          name: roleName,
          label: ROLE_LABELS[roleName] || roleName,
          isSystemRole: true,
          isProtected,
          createdBy: 'system-migration',
          updatedBy: 'system-migration',
        },
      });

      const permList = permissions as string[];
      if (permList.length > 0) {
        await prisma.rolePermission.createMany({
          data: permList.map((p) => ({
            companyId: company.id,
            roleId: role.id,
            permission: p,
            createdBy: 'system-migration',
            updatedBy: 'system-migration',
          })),
        });
      }

      console.log(`  ${roleName}: created with ${permList.length} permissions${isProtected ? ' (PROTECTED)' : ''}.`);
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
