import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

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
      { code: `${company.code}-PLT-T2`, name: `${company.name} - Assembly Plant`, plantType: 'ASSEMBLY'      },
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
      { code: `${company.code}-BR-T2`, name: `${company.name} - Sales Branch`, branchType: 'SALES'       },
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

    // Step 1: Get all test users for this company
    const testUsers = await this.prisma.user.findMany({
      where: { companyId, isTestData: true }, select: { id: true },
    });
    const testUserIds = testUsers.map(u => u.id);

    // Step 2: Delete all CRs by test users (even non-test ones to avoid FK violation)
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

    // Step 3: Delete test CRs for this company (those not by test users)
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

    // Step 4: Delete test users
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

    // Delete all CR comments first
    const allCRs = await this.prisma.changeRequest.findMany({ select: { id: true } });
    if (allCRs.length > 0) {
      await this.prisma.changeRequestComment.deleteMany({
        where: { changeRequestId: { in: allCRs.map(c => c.id) } },
      });
    }

    // Delete all CRs by test users
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
}
