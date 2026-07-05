import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { SaveDeclarationDto } from './dto/tds.dto';

// Tax Slabs OLD REGIME FY2025-26
const OLD_SLABS = [
  { from: 0, to: 250000, rate: 0 },
  { from: 250000, to: 500000, rate: 0.05 },
  { from: 500000, to: 1000000, rate: 0.20 },
  { from: 1000000, to: Infinity, rate: 0.30 },
];

// Tax Slabs NEW REGIME FY2025-26
const NEW_SLABS = [
  { from: 0, to: 300000, rate: 0 },
  { from: 300000, to: 600000, rate: 0.05 },
  { from: 600000, to: 900000, rate: 0.10 },
  { from: 900000, to: 1200000, rate: 0.15 },
  { from: 1200000, to: 1500000, rate: 0.20 },
  { from: 1500000, to: Infinity, rate: 0.30 },
];

const STANDARD_DEDUCTION = 50000;
const SECTION_80C_LIMIT = 150000;
const SECTION_80D_LIMIT = 25000;
const REBATE_87A_LIMIT = 700000; // New regime rebate limit
const REBATE_87A_AMOUNT = 25000;

@Injectable()
export class TdsService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private calculateTax(taxableIncome: number, regime: string): number {
    if (taxableIncome <= 0) return 0;
    const slabs = regime === 'NEW' ? NEW_SLABS : OLD_SLABS;
    let tax = 0;
    for (const slab of slabs) {
      if (taxableIncome <= slab.from) break;
      const taxable = Math.min(taxableIncome, slab.to) - slab.from;
      tax += taxable * slab.rate;
    }
    // Section 87A rebate (new regime: income <= 7L → rebate up to 25k)
    if (regime === 'NEW' && taxableIncome <= REBATE_87A_LIMIT) {
      tax = Math.max(0, tax - Math.min(tax, REBATE_87A_AMOUNT));
    }
    // Old regime: income <= 5L → full rebate
    if (regime === 'OLD' && taxableIncome <= 500000) {
      tax = 0;
    }
    // Surcharge + cess (4% health & education cess)
    const cess = tax * 0.04;
    return Math.round((tax + cess) * 100) / 100;
  }

  private calculateHraExemption(annualBasic: number, annualHra: number, annualRentPaid: number, isMetroCity: boolean): number {
    if (annualRentPaid <= 0) return 0;
    const metroRate = isMetroCity ? 0.5 : 0.4;
    const exempt = Math.min(
      annualHra,
      annualBasic * metroRate,
      annualRentPaid - annualBasic * 0.1,
    );
    return Math.max(0, exempt);
  }

  async saveDeclaration(dto: SaveDeclarationDto, user: any) {
    const emp = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, companyId: user.companyId },
    });
    if (!emp) throw new NotFoundException('Employee not found');

    const regime = dto.regime || 'NEW';
    const annualBasic = emp.basicSalary * 12;
    const annualHra = emp.hraAmount * 12;
    const annualGross = (emp.basicSalary + emp.hraAmount + emp.conveyanceAmount + emp.otherAllowances) * 12;
    const annualRentPaid = (dto.rentPaid || 0) * 12;

    // Deductions
    const hraExemption = this.calculateHraExemption(annualBasic, annualHra, annualRentPaid, dto.isMetroCity || false);
    const section80C = Math.min(dto.section80C || 0, SECTION_80C_LIMIT);
    const section80D = Math.min(dto.section80D || 0, SECTION_80D_LIMIT);
    const section80G = dto.section80G || 0;
    const section80E = dto.section80E || 0;
    const otherDed = dto.otherDeductions || 0;

    let taxableIncome: number;
    if (regime === 'NEW') {
      // New regime: only standard deduction
      taxableIncome = Math.max(0, annualGross - STANDARD_DEDUCTION);
    } else {
      // Old regime: all deductions
      taxableIncome = Math.max(0, annualGross - STANDARD_DEDUCTION - hraExemption - section80C - section80D - section80G - section80E - otherDed);
    }

    const annualTax = this.calculateTax(taxableIncome, regime);
    const monthlyTds = Math.round(annualTax / 12 * 100) / 100;

    const existing = await this.prisma.tdsDeclaration.findUnique({
      where: { companyId_employeeId_financialYear: { companyId: user.companyId, employeeId: dto.employeeId, financialYear: dto.financialYear } },
    });

    const data = {
      section80C: section80C, section80D, section80G, section80E,
      otherDeductions: otherDed, rentPaid: dto.rentPaid || 0,
      isMetroCity: dto.isMetroCity || false, hraExemption,
      standardDeduction: STANDARD_DEDUCTION,
      taxableIncome, annualTax, monthlyTds,
      regime, remarks: dto.remarks,
    };

    let decl: any;
    if (existing) {
      decl = await this.prisma.tdsDeclaration.update({
        where: { id: existing.id },
        data: { ...data, updatedBy: user.id },
      });
    } else {
      decl = await this.prisma.tdsDeclaration.create({
        data: { ...data, companyId: user.companyId, employeeId: dto.employeeId, financialYear: dto.financialYear, createdBy: user.id, updatedBy: user.id },
      });
    }

    await this.audit.log({ tableName: 'tds_declarations', recordId: decl.id, action: existing ? 'UPDATE' : 'CREATE', newValues: decl, changedBy: user.id });
    return {
      ...decl, annualGross, annualBasic, annualHra, hraExemption,
      breakdown: {
        annualGross, standardDeduction: STANDARD_DEDUCTION,
        hraExemption: regime === 'OLD' ? hraExemption : 0,
        section80C: regime === 'OLD' ? section80C : 0,
        section80D: regime === 'OLD' ? section80D : 0,
        section80G: regime === 'OLD' ? section80G : 0,
        section80E: regime === 'OLD' ? section80E : 0,
        otherDeductions: regime === 'OLD' ? otherDed : 0,
        taxableIncome, annualTax, monthlyTds, regime,
      },
    };
  }

  async getDeclaration(employeeId: string, financialYear: string, user: any) {
    return this.prisma.tdsDeclaration.findUnique({
      where: { companyId_employeeId_financialYear: { companyId: user.companyId, employeeId, financialYear } },
      include: { employee: { select: { firstName: true, lastName: true, employeeNumber: true, basicSalary: true, hraAmount: true } } },
    });
  }

  async getTdsChallan(month: number, year: number, user: any) {
    const run = await this.prisma.payrollRun.findUnique({
      where: { companyId_month_year: { companyId: user.companyId, month, year } },
      include: {
        entries: {
          include: {
            employee: { select: { firstName: true, lastName: true, employeeNumber: true, panNumber: true } },
          },
          where: { tdsAmount: { gt: 0 } },
        },
      },
    });
    if (!run) throw new NotFoundException(`No payroll run found for ${month}/${year}`);

    const entries = run.entries.map(e => ({
      employeeNumber: e.employee.employeeNumber,
      employeeName: `${e.employee.firstName} ${e.employee.lastName}`,
      panNumber: e.employee.panNumber || '—',
      grossSalary: e.grossEarnings,
      tdsAmount: e.tdsAmount,
    }));
    const totalTds = entries.reduce((s, e) => s + e.tdsAmount, 0);

    return {
      reportType: 'TDS_CHALLAN',
      month, year, runNumber: run.runNumber,
      payrollStatus: run.status,
      dueDate: `7/${month > 12 ? 1 : month + 1}/${month > 11 ? year + 1 : year}`,
      section: '192 - Salary',
      entries, totalTds, employeeCount: entries.length,
    };
  }

  async getTdsRegister(companyId: string, financialYear: string) {
    const [startYear] = financialYear.split('-').map(Number);
    const from = new Date(startYear, 3, 1); // April 1
    const to = new Date(startYear + 1, 2, 31, 23, 59, 59); // March 31

    const declarations = await this.prisma.tdsDeclaration.findMany({
      where: { companyId, financialYear },
      include: { employee: { select: { firstName: true, lastName: true, employeeNumber: true, panNumber: true } } },
    });

    const runs = await this.prisma.payrollRun.findMany({
      where: { companyId, createdAt: { gte: from, lte: to }, status: { not: 'DRAFT' } },
      include: { entries: { select: { employeeId: true, tdsAmount: true, grossEarnings: true, month: true } } },
      orderBy: { month: 'asc' },
    });

    const empMap: Record<string, any> = {};
    declarations.forEach(d => {
      empMap[d.employeeId] = {
        employeeId: d.employeeId,
        employeeNumber: d.employee.employeeNumber,
        employeeName: `${d.employee.firstName} ${d.employee.lastName}`,
        panNumber: d.employee.panNumber || '—',
        taxableIncome: d.taxableIncome,
        annualTax: d.annualTax,
        monthlyTds: d.monthlyTds,
        regime: d.regime,
        months: {},
        totalTdsDeducted: 0,
      };
    });

    runs.forEach(run => {
      run.entries.forEach(e => {
        if (!empMap[e.employeeId]) return;
        empMap[e.employeeId].months[run.month] = { tdsAmount: e.tdsAmount, grossEarnings: e.grossEarnings };
        empMap[e.employeeId].totalTdsDeducted += e.tdsAmount;
      });
    });

    return {
      reportType: 'TDS_REGISTER',
      financialYear, companyId,
      employees: Object.values(empMap),
      totalTdsDeducted: Object.values(empMap).reduce((s: number, e: any) => s + e.totalTdsDeducted, 0),
    };
  }

  async getForm16Summary(employeeId: string, financialYear: string, user: any) {
    const decl = await this.prisma.tdsDeclaration.findUnique({
      where: { companyId_employeeId_financialYear: { companyId: user.companyId, employeeId, financialYear } },
      include: { employee: { select: { firstName: true, lastName: true, employeeNumber: true, panNumber: true, basicSalary: true, hraAmount: true, conveyanceAmount: true, otherAllowances: true } } },
    });
    if (!decl) throw new NotFoundException('TDS declaration not found for this employee and financial year');

    const [startYear] = financialYear.split('-').map(Number);
    const from = new Date(startYear, 3, 1);
    const to = new Date(startYear + 1, 2, 31, 23, 59, 59);

    const entries = await this.prisma.payrollEntry.findMany({
      where: { companyId: user.companyId, employeeId, createdAt: { gte: from, lte: to }, status: { not: 'DRAFT' } },
      orderBy: { month: 'asc' },
    });

    const totalGross = entries.reduce((s, e) => s + e.grossEarnings, 0);
    const totalTds = entries.reduce((s, e) => s + e.tdsAmount, 0);
    const totalPf = entries.reduce((s, e) => s + e.pfEmployee, 0);

    return {
      reportType: 'FORM_16_SUMMARY',
      financialYear, employeeId,
      employee: decl.employee,
      grossSalary: totalGross,
      standardDeduction: STANDARD_DEDUCTION,
      hraExemption: decl.hraExemption,
      section80C: decl.section80C,
      section80D: decl.section80D,
      section80G: decl.section80G,
      section80E: decl.section80E,
      otherDeductions: decl.otherDeductions,
      taxableIncome: decl.taxableIncome,
      annualTax: decl.annualTax,
      totalTdsDeducted: totalTds,
      balanceTax: Math.max(0, decl.annualTax - totalTds),
      regime: decl.regime,
      totalPfContribution: totalPf,
      monthlyDetails: entries.map(e => ({ month: e.month, gross: e.grossEarnings, tds: e.tdsAmount })),
    };
  }

  async getAllDeclarations(user: any, query: any) {
    const { financialYear } = query;
    const where: any = { companyId: user.companyId };
    if (financialYear) where.financialYear = financialYear;
    return this.prisma.tdsDeclaration.findMany({
      where,
      include: { employee: { select: { firstName: true, lastName: true, employeeNumber: true, panNumber: true } } },
      orderBy: { employee: { employeeNumber: 'asc' } },
    });
  }
}
