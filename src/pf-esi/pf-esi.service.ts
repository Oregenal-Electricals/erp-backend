import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Indian Statutory Rates
const PF_EMPLOYEE_RATE = 0.12;
const PF_EPS_RATE = 0.0833;      // Employer pension
const PF_EPF_EMPLOYER = 0.0367;  // Employer EPF
const PF_EDLI_RATE = 0.005;      // EDLI admin
const PF_ADMIN_RATE = 0.005;     // Admin charges
const PF_WAGE_CEILING = 15000;   // PF computed on min(basic, 15000)
const ESI_EMPLOYEE_RATE = 0.0075;
const ESI_EMPLOYER_RATE = 0.0325;
const ESI_WAGE_CEILING = 21000;  // ESI applicable if gross <= 21000

@Injectable()
export class PfEsiService {
  constructor(private prisma: PrismaService) {}

  getStatutoryRates() {
    return {
      pf: {
        employeeRate: PF_EMPLOYEE_RATE * 100 + '%',
        employerEpfRate: PF_EPF_EMPLOYER * 100 + '%',
        employerEpsRate: PF_EPS_RATE * 100 + '%',
        edliRate: PF_EDLI_RATE * 100 + '%',
        adminRate: PF_ADMIN_RATE * 100 + '%',
        wageCeiling: PF_WAGE_CEILING,
        note: 'PF computed on min(basicSalary, ₹15,000)',
      },
      esi: {
        employeeRate: ESI_EMPLOYEE_RATE * 100 + '%',
        employerRate: ESI_EMPLOYER_RATE * 100 + '%',
        wageCeiling: ESI_WAGE_CEILING,
        note: 'ESI applicable only if gross wages ≤ ₹21,000/month',
      },
    };
  }

  async getPfChallan(month: number, year: number, companyId: string) {
    const run = await this.prisma.payrollRun.findUnique({
      where: { companyId_month_year: { companyId, month, year } },
      include: {
        entries: {
          include: {
            employee: {
              select: { firstName: true, lastName: true, employeeNumber: true, pfNumber: true, panNumber: true, dateOfJoining: true },
            },
          },
          where: { status: { not: 'DRAFT' } },
        },
      },
    });
    if (!run) throw new NotFoundException(`No payroll run found for ${month}/${year}`);

    const pfEntries = run.entries.map(e => {
      const pfWage = Math.min(e.basicSalary, PF_WAGE_CEILING);
      const epfEmployee = Math.round(pfWage * PF_EMPLOYEE_RATE * 100) / 100;
      const epfEmployer = Math.round(pfWage * PF_EPF_EMPLOYER * 100) / 100;
      const eps = Math.round(pfWage * PF_EPS_RATE * 100) / 100;
      const edli = Math.round(pfWage * PF_EDLI_RATE * 100) / 100;
      const adminCharges = Math.round(pfWage * PF_ADMIN_RATE * 100) / 100;
      const totalEmployerContrib = epfEmployer + eps + edli + adminCharges;

      return {
        employeeNumber: e.employee.employeeNumber,
        employeeName: `${e.employee.firstName} ${e.employee.lastName}`,
        pfNumber: e.employee.pfNumber || '—',
        panNumber: e.employee.panNumber || '—',
        basicWage: e.basicSalary,
        pfWage,
        epfEmployee,
        epfEmployer,
        eps,
        edli,
        adminCharges,
        totalEmployerContrib,
        totalContrib: epfEmployee + totalEmployerContrib,
      };
    });

    const totals = {
      totalBasicWage: pfEntries.reduce((s, e) => s + e.basicWage, 0),
      totalPfWage: pfEntries.reduce((s, e) => s + e.pfWage, 0),
      totalEpfEmployee: pfEntries.reduce((s, e) => s + e.epfEmployee, 0),
      totalEpfEmployer: pfEntries.reduce((s, e) => s + e.epfEmployer, 0),
      totalEps: pfEntries.reduce((s, e) => s + e.eps, 0),
      totalEdli: pfEntries.reduce((s, e) => s + e.edli, 0),
      totalAdminCharges: pfEntries.reduce((s, e) => s + e.adminCharges, 0),
      totalContrib: pfEntries.reduce((s, e) => s + e.totalContrib, 0),
    };

    return {
      reportType: 'PF_CHALLAN',
      month, year, companyId,
      runNumber: run.runNumber,
      payrollStatus: run.status,
      dueDate: `15/${month > 12 ? 1 : month + 1}/${month > 11 ? year + 1 : year}`,
      entries: pfEntries,
      totals,
      employeeCount: pfEntries.length,
    };
  }

  async getEsiChallan(month: number, year: number, companyId: string) {
    const run = await this.prisma.payrollRun.findUnique({
      where: { companyId_month_year: { companyId, month, year } },
      include: {
        entries: {
          include: {
            employee: {
              select: { firstName: true, lastName: true, employeeNumber: true, esiNumber: true, dateOfJoining: true },
            },
          },
          where: { status: { not: 'DRAFT' } },
        },
      },
    });
    if (!run) throw new NotFoundException(`No payroll run found for ${month}/${year}`);

    // Only employees with gross <= ESI ceiling
    const esiEntries = run.entries
      .filter(e => e.grossEarnings <= ESI_WAGE_CEILING)
      .map(e => {
        const esiEmployee = Math.round(e.grossEarnings * ESI_EMPLOYEE_RATE * 100) / 100;
        const esiEmployer = Math.round(e.grossEarnings * ESI_EMPLOYER_RATE * 100) / 100;
        return {
          employeeNumber: e.employee.employeeNumber,
          employeeName: `${e.employee.firstName} ${e.employee.lastName}`,
          esiNumber: e.employee.esiNumber || '—',
          grossWage: e.grossEarnings,
          esiEmployee,
          esiEmployer,
          totalEsi: esiEmployee + esiEmployer,
        };
      });

    const notApplicable = run.entries.filter(e => e.grossEarnings > ESI_WAGE_CEILING).map(e => ({
      employeeNumber: e.employee.employeeNumber,
      employeeName: `${e.employee.firstName} ${e.employee.lastName}`,
      grossWage: e.grossEarnings,
      reason: `Gross > ₹${ESI_WAGE_CEILING.toLocaleString('en-IN')}`,
    }));

    const totals = {
      totalGrossWage: esiEntries.reduce((s, e) => s + e.grossWage, 0),
      totalEsiEmployee: esiEntries.reduce((s, e) => s + e.esiEmployee, 0),
      totalEsiEmployer: esiEntries.reduce((s, e) => s + e.esiEmployer, 0),
      totalEsi: esiEntries.reduce((s, e) => s + e.totalEsi, 0),
    };

    return {
      reportType: 'ESI_CHALLAN',
      month, year, companyId,
      runNumber: run.runNumber,
      payrollStatus: run.status,
      dueDate: `15/${month > 12 ? 1 : month + 1}/${month > 11 ? year + 1 : year}`,
      entries: esiEntries,
      notApplicable,
      totals,
      applicableCount: esiEntries.length,
      notApplicableCount: notApplicable.length,
    };
  }

  async getPfRegister(companyId: string, year: number) {
    const runs = await this.prisma.payrollRun.findMany({
      where: { companyId, year, status: { not: 'DRAFT' } },
      include: {
        entries: {
          include: {
            employee: { select: { firstName: true, lastName: true, employeeNumber: true, pfNumber: true } },
          },
        },
      },
      orderBy: { month: 'asc' },
    });

    // Build employee-wise annual PF register
    const employeeMap: Record<string, any> = {};
    runs.forEach(run => {
      run.entries.forEach(e => {
        if (!employeeMap[e.employeeId]) {
          employeeMap[e.employeeId] = {
            employeeId: e.employeeId,
            employeeNumber: e.employee.employeeNumber,
            employeeName: `${e.employee.firstName} ${e.employee.lastName}`,
            pfNumber: e.employee.pfNumber || '—',
            months: {},
            annualBasic: 0, annualPfEmployee: 0, annualPfEmployer: 0,
          };
        }
        const pfWage = Math.min(e.basicSalary, PF_WAGE_CEILING);
        employeeMap[e.employeeId].months[run.month] = {
          month: run.month, basicWage: e.basicSalary, pfWage,
          pfEmployee: e.pfEmployee, pfEmployer: e.pfEmployer,
        };
        employeeMap[e.employeeId].annualBasic += e.basicSalary;
        employeeMap[e.employeeId].annualPfEmployee += e.pfEmployee;
        employeeMap[e.employeeId].annualPfEmployer += e.pfEmployer;
      });
    });

    return { reportType: 'PF_REGISTER', year, companyId, employees: Object.values(employeeMap), monthsProcessed: runs.map(r => r.month) };
  }

  async getEsiRegister(companyId: string, year: number) {
    const runs = await this.prisma.payrollRun.findMany({
      where: { companyId, year, status: { not: 'DRAFT' } },
      include: {
        entries: {
          include: {
            employee: { select: { firstName: true, lastName: true, employeeNumber: true, esiNumber: true } },
          },
          where: { grossEarnings: { lte: ESI_WAGE_CEILING } },
        },
      },
      orderBy: { month: 'asc' },
    });

    const employeeMap: Record<string, any> = {};
    runs.forEach(run => {
      run.entries.forEach(e => {
        if (!employeeMap[e.employeeId]) {
          employeeMap[e.employeeId] = {
            employeeId: e.employeeId,
            employeeNumber: e.employee.employeeNumber,
            employeeName: `${e.employee.firstName} ${e.employee.lastName}`,
            esiNumber: e.employee.esiNumber || '—',
            months: {},
            annualGross: 0, annualEsiEmployee: 0, annualEsiEmployer: 0,
          };
        }
        employeeMap[e.employeeId].months[run.month] = {
          month: run.month, grossWage: e.grossEarnings,
          esiEmployee: e.esiEmployee, esiEmployer: e.esiEmployer,
        };
        employeeMap[e.employeeId].annualGross += e.grossEarnings;
        employeeMap[e.employeeId].annualEsiEmployee += e.esiEmployee;
        employeeMap[e.employeeId].annualEsiEmployer += e.esiEmployer;
      });
    });

    return { reportType: 'ESI_REGISTER', year, companyId, employees: Object.values(employeeMap), monthsProcessed: runs.map(r => r.month) };
  }
}
