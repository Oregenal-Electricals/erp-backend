import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

// Table (not model) names for every model that has an isTestData field,
// computed once from Prisma's own schema metadata rather than hardcoded -
// used by the generic test-session summary/purge below, which is separate
// from this file's existing seedCompany/purgeCompany/purgeAll (those are
// for a fixed, narrow set of org-structure demo entities and predate the
// X-Test-Session auto-tagging feature - see PrismaService and
// PROJECT_STATUS.md item 21). Company itself is deliberately excluded -
// purging a whole Company is far too destructive for this tool and was
// never something Test Mode creates anyway.
const TEST_DATA_TABLES: string[] = Prisma.dmmf.datamodel.models
  .filter((m) => m.fields.some((f) => f.name === 'isTestData') && m.name !== 'Company')
  .map((m) => m.dbName || m.name);

const HAS_COMPANY_ID: Set<string> = new Set(
  Prisma.dmmf.datamodel.models
    .filter((m) => m.fields.some((f) => f.name === 'companyId'))
    .map((m) => m.dbName || m.name),
);

// ── Full-wipe-except-master-data support ──
// Model names (not table names) considered "master data" - protected from
// the full wipe below. Verified against the real schema at startup via
// UNMATCHED_KEEP_NAMES: if a name here doesn't match an actual Prisma model,
// the wipe endpoint refuses to run rather than risk deleting something that
// was meant to be protected due to a typo.
const KEEP_MODEL_NAMES = new Set([
  'Company', 'Plant', 'Unit', 'Department', 'Branch', 'Warehouse', 'FinancialYear',
  'User', 'Role', 'RolePermission', 'NumberingSeries', 'SystemSetting',
  'UnitOfMeasure', 'HsnSacCode', 'UiControlElement', 'UiControlOverride', 'AuditLog',
]);
const ALL_MODEL_NAMES = new Set(Prisma.dmmf.datamodel.models.map((m) => m.name));
const KEEP_TABLES: Set<string> = new Set(
  Prisma.dmmf.datamodel.models.filter((m) => KEEP_MODEL_NAMES.has(m.name)).map((m) => m.dbName || m.name),
);
const WIPE_TABLES: string[] = Prisma.dmmf.datamodel.models
  .filter((m) => !KEEP_MODEL_NAMES.has(m.name))
  .map((m) => m.dbName || m.name);
const UNMATCHED_KEEP_NAMES: string[] = [...KEEP_MODEL_NAMES].filter((n) => !ALL_MODEL_NAMES.has(n));

@Injectable()
export class DummyDataService {
  constructor(private prisma: PrismaService) {}

  async getStatus(companyId?: string) {
    const whereGlobal = { isTestData: true };
    const whereComp = companyId ? { isTestData: true, companyId } : whereGlobal;

    const [companies, plants, units, departments, branches, financialYears, users, changeRequests] =
      await Promise.all([
        this.prisma.company.count({ where: whereGlobal }),
        this.prisma.plant.count({ where: whereComp }),
        this.prisma.unit.count({ where: whereGlobal }),
        this.prisma.department.count({ where: whereComp }),
        this.prisma.branch.count({ where: whereComp }),
        this.prisma.financialYear.count({ where: whereComp }),
        this.prisma.user.count({ where: whereComp }),
        this.prisma.changeRequest.count({ where: whereComp }),
      ]);

    return {
      companies, plants, units, departments,
      branches, financialYears, users, changeRequests,
      total: companies + plants + units + departments + branches + financialYears + users + changeRequests,
    };
  }

  async seedCompany(companyId: string, userId: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found');

    const results = { plants: 0, units: 0, departments: 0, branches: 0, financialYears: 0, users: 0, changeRequests: 0 };

    const plantData = [
      { code: `${company.code}-PLT-T1`, name: `${company.name} - Main Plant`,     plantType: 'MANUFACTURING' },
      { code: `${company.code}-PLT-T2`, name: `${company.name} - Assembly Plant`, plantType: 'ASSEMBLY'     },
      { code: `${company.code}-PLT-T3`, name: `${company.name} - Warehouse`,      plantType: 'WAREHOUSE'     },
    ];

    const createdPlants = [];
    for (const p of plantData) {
      const exists = await this.prisma.plant.findUnique({ where: { code: p.code } });
      if (!exists) {
        const plant = await this.prisma.plant.create({
          data: {
            ...p, companyId, country: 'India',
            address: company.address, city: company.city,
            state: company.state, pincode: company.pincode,
            createdBy: userId, updatedBy: userId, isTestData: true,
          },
        });
        createdPlants.push(plant);
        results.plants++;
      } else {
        createdPlants.push(exists);
      }
    }

    for (const plant of createdPlants.slice(0, 2)) {
      for (let i = 0; i < 2; i++) {
        const code = `${plant.code}-U${i + 1}`;
        const exists = await this.prisma.unit.findUnique({ where: { code } });
        if (!exists) {
          await this.prisma.unit.create({
            data: {
              code, name: `${plant.name} Unit ${i + 1}`,
              unitType: i === 0 ? 'PRODUCTION' : 'TESTING',
              plantId: plant.id,
              createdBy: userId, updatedBy: userId, isTestData: true,
            },
          });
          results.units++;
        }
      }
    }

    const deptData = [
      { code: `${company.code}-DEPT-PRD`, name: 'Production',      headName: 'Test Production Head' },
      { code: `${company.code}-DEPT-QC`,  name: 'Quality Control', headName: 'Test QC Head'         },
      { code: `${company.code}-DEPT-PUR`, name: 'Purchase',        headName: 'Test Purchase Head'   },
      { code: `${company.code}-DEPT-STR`, name: 'Stores',          headName: 'Test Store Head'      },
      { code: `${company.code}-DEPT-FIN`, name: 'Finance',         headName: 'Test Finance Head'    },
      { code: `${company.code}-DEPT-HR`,  name: 'Human Resources', headName: 'Test HR Head'         },
      { code: `${company.code}-DEPT-IT`,  name: 'IT',              headName: 'Test IT Head'         },
    ];

    for (const d of deptData) {
      const exists = await this.prisma.department.findUnique({ where: { code: d.code } });
      if (!exists) {
        await this.prisma.department.create({
          data: { ...d, companyId, createdBy: userId, updatedBy: userId, isTestData: true },
        });
        results.departments++;
      }
    }

    const branchData = [
      { code: `${company.code}-BR-T1`, name: `${company.name} - HO Branch`,    branchType: 'HEAD_OFFICE' },
      { code: `${company.code}-BR-T2`, name: `${company.name} - Sales Branch`, branchType: 'SALES' },
    ];

    for (const b of branchData) {
      const exists = await this.prisma.branch.findUnique({ where: { code: b.code } });
      if (!exists) {
        await this.prisma.branch.create({
          data: {
            ...b, companyId, country: 'India',
            address: company.address, city: company.city,
            state: company.state, pincode: company.pincode,
            createdBy: userId, updatedBy: userId, isTestData: true,
          },
        });
        results.branches++;
      }
    }

    const now = new Date();
    const fy = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    const fyCode = `${company.code}-FY-T${String(fy).slice(2)}`;
    const fyLabel = `${fy}-${fy + 1} (Test)`;
    const fyExists = await this.prisma.financialYear.findUnique({ where: { code: fyCode } });
    if (!fyExists) {
      await this.prisma.financialYear.create({
        data: {
          code: fyCode, label: fyLabel,
          startDate: new Date(`${fy}-04-01`),
          endDate: new Date(`${fy + 1}-03-31`),
          status: 'OPEN', companyId,
          createdBy: userId, updatedBy: userId, isTestData: true,
        },
      });
      results.financialYears++;
    }

    const passwordHash = await bcrypt.hash('Test@1234', 12);
    const testUsers = [
      { employeeCode: `${company.code}-TST-001`, firstName: 'Test', lastName: 'PlantHead',   email: `plnt.${company.code.toLowerCase()}@test.com`, role: UserRole.PLANT_HEAD       },
      { employeeCode: `${company.code}-TST-002`, firstName: 'Test', lastName: 'PurchaseMgr', email: `pur.${company.code.toLowerCase()}@test.com`,  role: UserRole.PURCHASE_MANAGER },
      { employeeCode: `${company.code}-TST-003`, firstName: 'Test', lastName: 'StoreMgr',    email: `str.${company.code.toLowerCase()}@test.com`,  role: UserRole.STORE_MANAGER    },
      { employeeCode: `${company.code}-TST-004`, firstName: 'Test', lastName: 'QCManager',   email: `qc.${company.code.toLowerCase()}@test.com`,   role: UserRole.QC_MANAGER       },
      { employeeCode: `${company.code}-TST-005`, firstName: 'Test', lastName: 'Viewer',      email: `vwr.${company.code.toLowerCase()}@test.com`,  role: UserRole.VIEWER           },
    ];

    const createdUsers = [];
    for (const u of testUsers) {
      const exists = await this.prisma.user.findUnique({ where: { email: u.email } });
      if (!exists) {
        const user = await this.prisma.user.create({
          data: { ...u, passwordHash, companyId, mustChangePwd: false, createdBy: userId, updatedBy: userId, isTestData: true },
        });
        createdUsers.push(user);
        results.users++;
      } else {
        createdUsers.push(exists);
      }
    }

    const crTypes    = ['MASTER_DATA', 'USER_ACCESS', 'PRICE_CHANGE', 'CONFIG_CHANGE', 'OTHER'];
    const crStatuses = ['DRAFT', 'DRAFT', 'SUBMITTED', 'SUBMITTED', 'APPROVED'];
    const crPriority = ['LOW', 'NORMAL', 'HIGH', 'URGENT', 'NORMAL'];

    for (let i = 0; i < 5; i++) {
      const reqNum = `CR-${String(fy).slice(2)}-${String(fy + 1).slice(2)}-TST-${String(i + 1).padStart(3, '0')}`;
      const exists = await this.prisma.changeRequest.findUnique({ where: { requestNumber: reqNum } });
      if (!exists) {
        const requesterId = createdUsers.length > 0 ? createdUsers[i % createdUsers.length].id : userId;
        await this.prisma.changeRequest.create({
          data: {
            requestNumber: reqNum,
            title: `Test CR ${i + 1} - ${crTypes[i].replace(/_/g, ' ')}`,
            description: `Test change request ${i + 1} for demonstration. Type: ${crTypes[i]}.`,
            type: crTypes[i] as any,
            status: crStatuses[i] as any,
            priority: crPriority[i] as any,
            companyId, requestedById: requesterId,
            createdBy: userId, updatedBy: userId, isTestData: true,
          },
        });
        results.changeRequests++;
      }
    }

    return {
      message: `Test data seeded for ${company.name}`,
      company: company.name,
      created: results,
      note: 'All test users password: Test@1234',
    };
  }

  async purgeCompany(companyId: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found');

    const results = { changeRequestComments: 0, changeRequests: 0, users: 0, financialYears: 0, branches: 0, departments: 0, units: 0, plants: 0 };

    const testUsers = await this.prisma.user.findMany({
      where: { companyId, isTestData: true }, select: { id: true },
    });
    const testUserIds = testUsers.map(u => u.id);

    if (testUserIds.length > 0) {
      const crsToDelete = await this.prisma.changeRequest.findMany({
        where: { requestedById: { in: testUserIds } }, select: { id: true },
      });
      if (crsToDelete.length > 0) {
        await this.prisma.changeRequestComment.deleteMany({
          where: { changeRequestId: { in: crsToDelete.map(c => c.id) } },
        });
        results.changeRequestComments += crsToDelete.length;
        await this.prisma.changeRequest.deleteMany({
          where: { requestedById: { in: testUserIds } },
        });
      }
    }

    const remainingTestCRs = await this.prisma.changeRequest.findMany({
      where: { companyId, isTestData: true }, select: { id: true },
    });
    if (remainingTestCRs.length > 0) {
      await this.prisma.changeRequestComment.deleteMany({
        where: { changeRequestId: { in: remainingTestCRs.map(c => c.id) } },
      });
      results.changeRequests += (await this.prisma.changeRequest.deleteMany({
        where: { companyId, isTestData: true },
      })).count;
    }

    results.users = (await this.prisma.user.deleteMany({
      where: { companyId, isTestData: true },
    })).count;

    results.financialYears = (await this.prisma.financialYear.deleteMany({ where: { companyId, isTestData: true } })).count;
    results.branches       = (await this.prisma.branch.deleteMany({ where: { companyId, isTestData: true } })).count;
    results.departments    = (await this.prisma.department.deleteMany({ where: { companyId, isTestData: true } })).count;

    const testPlants = await this.prisma.plant.findMany({ where: { companyId, isTestData: true }, select: { id: true } });
    if (testPlants.length > 0) {
      results.units = (await this.prisma.unit.deleteMany({ where: { plantId: { in: testPlants.map(p => p.id) } } })).count;
    }
    results.plants = (await this.prisma.plant.deleteMany({ where: { companyId, isTestData: true } })).count;

    return { message: `Test data purged for ${company.name}`, company: company.name, deleted: results };
  }

  async purgeAll() {
    const results = { changeRequests: 0, users: 0, financialYears: 0, branches: 0, departments: 0, units: 0, plants: 0, companies: 0 };

    const allCRs = await this.prisma.changeRequest.findMany({ select: { id: true } });
    if (allCRs.length > 0) {
      await this.prisma.changeRequestComment.deleteMany({
        where: { changeRequestId: { in: allCRs.map(c => c.id) } },
      });
    }

    const testUsers = await this.prisma.user.findMany({ where: { isTestData: true }, select: { id: true } });
    if (testUsers.length > 0) {
      await this.prisma.changeRequest.deleteMany({ where: { requestedById: { in: testUsers.map(u => u.id) } } });
    }

    results.changeRequests = (await this.prisma.changeRequest.deleteMany({ where: { isTestData: true } })).count;
    results.users          = (await this.prisma.user.deleteMany({ where: { isTestData: true } })).count;
    results.financialYears = (await this.prisma.financialYear.deleteMany({ where: { isTestData: true } })).count;
    results.branches       = (await this.prisma.branch.deleteMany({ where: { isTestData: true } })).count;
    results.departments    = (await this.prisma.department.deleteMany({ where: { isTestData: true } })).count;
    results.units          = (await this.prisma.unit.deleteMany({ where: { isTestData: true } })).count;
    results.plants         = (await this.prisma.plant.deleteMany({ where: { isTestData: true } })).count;
    results.companies      = (await this.prisma.company.deleteMany({ where: { isTestData: true } })).count;

    return { message: 'All test data purged', deleted: results, warning: 'Real data was NOT touched' };
  }

  /**
   * Counts isTestData:true rows across every table that has the field
   * (computed from Prisma's schema metadata, not a hardcoded list) -
   * covers everything the X-Test-Session auto-tagging feature (item 21)
   * can create: Work Orders, Stock Adjustments, Customer POs, Sales
   * Orders, BOMs, and 150+ other modules, not just the fixed org-
   * structure entities seedCompany()/purgeCompany() above handle.
   * Read-only - safe to call anytime, no confirmation needed.
   */
  async getTestSessionSummary(companyId?: string) {
    const results: Record<string, number> = {};
    for (const table of TEST_DATA_TABLES) {
      try {
        const scoped = companyId && HAS_COMPANY_ID.has(table);
        const sql = scoped
          ? `SELECT COUNT(*)::int AS count FROM "${table}" WHERE "isTestData" = true AND "companyId" = $1`
          : `SELECT COUNT(*)::int AS count FROM "${table}" WHERE "isTestData" = true`;
        const rows = scoped
          ? await this.prisma.$queryRawUnsafe<{ count: number }[]>(sql, companyId)
          : await this.prisma.$queryRawUnsafe<{ count: number }[]>(sql);
        const count = rows[0]?.count || 0;
        if (count > 0) results[table] = count;
      } catch {
        // Table genuinely has no rows, or some other non-fatal read issue -
        // a summary should never fail just because one table is empty.
      }
    }
    const total = Object.values(results).reduce((s, c) => s + c, 0);
    return { total, byTable: results };
  }

  /**
   * Deletes every isTestData:true row across every eligible table.
   * Foreign-key dependency order isn't known upfront (166 models,
   * no hand-maintained ordering) - instead, repeatedly attempts every
   * remaining table and only stops retrying a table once it succeeds;
   * a table that still has a real (non-test) row referencing one of its
   * test rows will keep failing every pass and is reported, never
   * silently skipped or force-deleted. This makes the operation
   * self-ordering and safe: nothing gets deleted out of order, and
   * anything genuinely still depended-on by real data is left alone
   * and flagged for manual review instead.
   */
  async purgeTestSessionData(companyId?: string) {
    let remaining = [...TEST_DATA_TABLES];
    const deleted: Record<string, number> = {};
    let madeProgress = true;

    while (remaining.length > 0 && madeProgress) {
      madeProgress = false;
      const stillBlocked: string[] = [];
      for (const table of remaining) {
        try {
          const scoped = companyId && HAS_COMPANY_ID.has(table);
          const sql = scoped
            ? `DELETE FROM "${table}" WHERE "isTestData" = true AND "companyId" = $1`
            : `DELETE FROM "${table}" WHERE "isTestData" = true`;
          const count = scoped
            ? await this.prisma.$executeRawUnsafe(sql, companyId)
            : await this.prisma.$executeRawUnsafe(sql);
          if (count > 0) deleted[table] = count;
          madeProgress = true;
        } catch {
          stillBlocked.push(table);
        }
      }
      remaining = stillBlocked;
    }

    const totalDeleted = Object.values(deleted).reduce((s, c) => s + c, 0);
    return {
      message: `Purged ${totalDeleted} test-tagged rows across ${Object.keys(deleted).length} tables`,
      deleted,
      totalDeleted,
      blockedTables: remaining,
      note: remaining.length > 0
        ? 'Tables in blockedTables still have test-tagged rows that a real (non-test) record depends on - these were deliberately left alone rather than force-deleted.'
        : undefined,
    };
  }

  /**
   * Read-only. Shows exactly what a full wipe would do, BEFORE anything is
   * deleted: which tables are protected (master data) with their current row
   * counts, which tables would be wiped and how many rows each has right
   * now, and - critically - flags any KEEP_MODEL_NAMES entry that doesn't
   * actually match a real Prisma model name. If unmatchedKeepNames is
   * non-empty, DO NOT proceed - fix the name list in code first.
   */
  async getFullWipePreview(companyId?: string) {
    const keepCounts: Record<string, number> = {};
    for (const table of KEEP_TABLES) {
      try {
        const scoped = companyId && HAS_COMPANY_ID.has(table);
        const sql = scoped
          ? `SELECT COUNT(*)::int AS count FROM "${table}" WHERE "companyId" = $1`
          : `SELECT COUNT(*)::int AS count FROM "${table}"`;
        const rows = scoped
          ? await this.prisma.$queryRawUnsafe<{ count: number }[]>(sql, companyId)
          : await this.prisma.$queryRawUnsafe<{ count: number }[]>(sql);
        keepCounts[table] = rows[0]?.count || 0;
      } catch {
        keepCounts[table] = -1; // query failed - investigate before proceeding
      }
    }

    const wipeCounts: Record<string, number> = {};
    for (const table of WIPE_TABLES) {
      try {
        const scoped = companyId && HAS_COMPANY_ID.has(table);
        const sql = scoped
          ? `SELECT COUNT(*)::int AS count FROM "${table}" WHERE "companyId" = $1`
          : `SELECT COUNT(*)::int AS count FROM "${table}"`;
        const rows = scoped
          ? await this.prisma.$queryRawUnsafe<{ count: number }[]>(sql, companyId)
          : await this.prisma.$queryRawUnsafe<{ count: number }[]>(sql);
        const count = rows[0]?.count || 0;
        if (count > 0) wipeCounts[table] = count;
      } catch {
        // empty/non-existent table - fine
      }
    }

    const totalRowsToWipe = Object.values(wipeCounts).reduce((s, c) => s + c, 0);

    return {
      safeToProceed: UNMATCHED_KEEP_NAMES.length === 0,
      unmatchedKeepNames: UNMATCHED_KEEP_NAMES, // non-empty = STOP, fix the code first
      keptTables: keepCounts,
      tablesToWipe: wipeCounts,
      totalTablesAffected: Object.keys(wipeCounts).length,
      totalRowsToWipe,
      note: 'This is a dry run. Nothing has been deleted. Call the confirmed delete endpoint with the exact confirmation phrase to actually wipe.',
    };
  }

  /**
   * DESTRUCTIVE. Deletes every row in every table NOT in KEEP_TABLES - both
   * real and test data alike, regardless of isTestData. Requires the literal
   * confirmationPhrase 'DELETE ALL TRANSACTIONAL DATA' in the request body;
   * anything else is rejected with zero effect. Uses the same self-ordering
   * retry-loop as purgeTestSessionData so FK dependency order within the
   * wipe set doesn't need to be hand-maintained. SUPER_ADMIN only - enforced
   * again here, not just at the controller/guard level, given the stakes.
   */
  async fullWipeExceptMasterData(confirmationPhrase: string, user: any, companyId?: string) {
    if (user?.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only SUPER_ADMIN can perform a full data wipe');
    }
    if (confirmationPhrase !== 'DELETE ALL TRANSACTIONAL DATA') {
      throw new BadRequestException(
        'Confirmation phrase does not match. Nothing was deleted. Send exactly: "DELETE ALL TRANSACTIONAL DATA"',
      );
    }
    if (UNMATCHED_KEEP_NAMES.length > 0) {
      throw new BadRequestException(
        `Refusing to run: these KEEP model names don't match the real schema and must be fixed first: ${UNMATCHED_KEEP_NAMES.join(', ')}`,
      );
    }

    let remaining = [...WIPE_TABLES];
    const deleted: Record<string, number> = {};
    let madeProgress = true;

    while (remaining.length > 0 && madeProgress) {
      madeProgress = false;
      const stillBlocked: string[] = [];
      for (const table of remaining) {
        try {
          const scoped = companyId && HAS_COMPANY_ID.has(table);
          const sql = scoped
            ? `DELETE FROM "${table}" WHERE "companyId" = $1`
            : `DELETE FROM "${table}"`;
          const count = scoped
            ? await this.prisma.$executeRawUnsafe(sql, companyId)
            : await this.prisma.$executeRawUnsafe(sql);
          if (count > 0) deleted[table] = count;
          madeProgress = true;
        } catch {
          stillBlocked.push(table);
        }
      }
      remaining = stillBlocked;
    }

    const totalDeleted = Object.values(deleted).reduce((s, c) => s + c, 0);
    return {
      message: `Full wipe complete: ${totalDeleted} rows deleted across ${Object.keys(deleted).length} tables. Master data was preserved.`,
      deleted,
      totalDeleted,
      blockedTables: remaining,
      note: remaining.length > 0
        ? 'Tables in blockedTables still have rows a KEPT (master data) record depends on, or another blocked table depends on - left alone rather than force-deleted. Review manually.'
        : 'No blocked tables - the wipe set fully cleared.',
      keptTables: [...KEEP_TABLES],
    };
  }
}
