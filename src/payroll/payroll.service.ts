import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { RunPayrollDto, UpdatePayrollEntryDto, ApprovePayrollDto } from './dto/payroll.dto';

const PF_RATE = 0.12;        // 12% of basic
const ESI_RATE = 0.0075;     // 0.75% of gross
const ESI_LIMIT = 21000;     // ESI applies if gross <= 21000
const PF_EMPLOYER_RATE = 0.12;
const ESI_EMPLOYER_RATE = 0.0325; // 3.25% employer contribution

@Injectable()
export class PayrollService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async runPayroll(dto: RunPayrollDto, user: any) {
    const { month, year } = dto;

    // Check if payroll already exists
    const existing = await this.prisma.payrollRun.findUnique({
      where: { companyId_month_year: { companyId: user.companyId, month, year } },
    });
    if (existing) throw new BadRequestException(`Payroll for ${month}/${year} already exists (${existing.status}). Use recalculate to update.`);

    // Get all active employees
    const employees = await this.prisma.employee.findMany({
      where: { companyId: user.companyId, isActive: true, status: 'ACTIVE' },
    });
    if (!employees.length) throw new BadRequestException('No active employees found');

    // Get working days for month
    const workingDays = 26; // standard Indian payroll

    // Date range for month
    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 0, 23, 59, 59);

    // Get run number
    const runNumber = `PR-${year}-${String(month).padStart(2, '0')}`;

    // Create payroll run
    const run = await this.prisma.payrollRun.create({
      data: {
        runNumber, month, year, companyId: user.companyId,
        status: 'DRAFT', processedAt: new Date(),
        remarks: dto.remarks, createdBy: user.id, updatedBy: user.id,
      },
    });

    let totalGross = 0, totalDeductions = 0, totalNetPay = 0;
    let totalPf = 0, totalEsi = 0, totalTds = 0, totalOt = 0;

    // Process each employee
    for (const emp of employees) {
      // Get attendance for month
      const attRecords = await this.prisma.attendance.findMany({
        where: { companyId: user.companyId, employeeId: emp.id, attendanceDate: { gte: from, lte: to } },
      });

      const presentDays = attRecords.filter(a => ['PRESENT','HALF_DAY'].includes(a.status)).reduce((s, a) => s + (a.status === 'HALF_DAY' ? 0.5 : 1), 0);
      const absentDays = attRecords.filter(a => a.status === 'ABSENT').length;
      const otHours = attRecords.reduce((s, a) => s + (a.otHours || 0), 0);
      const otAmount = attRecords.reduce((s, a) => s + (a.otAmount || 0), 0);

      // LOP calculation
      const lopDays = absentDays;
      const dailyBasic = emp.basicSalary / workingDays;
      const lopAmount = lopDays * dailyBasic;

      // Earnings
      const basic = emp.basicSalary - lopAmount; // basic after LOP
      const grossEarnings = Math.max(0, basic) + emp.hraAmount + emp.conveyanceAmount + emp.otherAllowances + otAmount;

      // Deductions
      const pfEmployee = Math.round(emp.basicSalary * PF_RATE * 100) / 100;
      const pfEmployer = Math.round(emp.basicSalary * PF_EMPLOYER_RATE * 100) / 100;
      const esiEmployee = grossEarnings <= ESI_LIMIT ? Math.round(grossEarnings * ESI_RATE * 100) / 100 : 0;
      const esiEmployer = grossEarnings <= ESI_LIMIT ? Math.round(grossEarnings * ESI_EMPLOYER_RATE * 100) / 100 : 0;
      const totalDeductionsEmp = pfEmployee + esiEmployee + lopAmount;
      const netPay = Math.max(0, grossEarnings - totalDeductionsEmp);

      // Create entry
      await this.prisma.payrollEntry.create({
        data: {
          companyId: user.companyId, payrollRunId: run.id, employeeId: emp.id,
          month, year, workingDays, presentDays, absentDays, lopDays,
          basicSalary: emp.basicSalary, hraAmount: emp.hraAmount,
          conveyanceAmount: emp.conveyanceAmount, otherAllowances: emp.otherAllowances,
          otHours, otAmount, grossEarnings,
          pfEmployee, pfEmployer, esiEmployee, esiEmployer,
          tdsAmount: 0, lopAmount, otherDeductions: 0,
          totalDeductions: totalDeductionsEmp, netPay,
          createdBy: user.id, updatedBy: user.id,
        },
      });

      totalGross += grossEarnings;
      totalDeductions += totalDeductionsEmp;
      totalNetPay += netPay;
      totalPf += pfEmployee;
      totalEsi += esiEmployee;
      totalOt += otAmount;
    }

    // Update run totals
    const updatedRun = await this.prisma.payrollRun.update({
      where: { id: run.id },
      data: { totalEmployees: employees.length, totalGross, totalDeductions, totalNetPay, totalPf, totalEsi, totalTds, totalOt, updatedBy: user.id },
      include: { entries: { include: { employee: { select: { firstName: true, lastName: true, employeeNumber: true } } } } },
    });

    await this.audit.log({ tableName: 'payroll_runs', recordId: run.id, action: 'CREATE', newValues: { runNumber, month, year, totalEmployees: employees.length }, changedBy: user.id });
    return updatedRun;
  }

  async recalculate(runId: string, user: any) {
    const run = await this.prisma.payrollRun.findFirst({ where: { id: runId, companyId: user.companyId } });
    if (!run) throw new NotFoundException('Payroll run not found');
    if (run.status !== 'DRAFT') throw new BadRequestException('Can only recalculate DRAFT payroll');

    // Delete existing entries and re-run
    await this.prisma.payrollEntry.deleteMany({ where: { payrollRunId: runId } });
    await this.prisma.payrollRun.delete({ where: { id: runId } });

    return this.runPayroll({ month: run.month, year: run.year, remarks: run.remarks || undefined }, user);
  }

  async updateEntry(entryId: string, dto: UpdatePayrollEntryDto, user: any) {
    const entry = await this.prisma.payrollEntry.findFirst({ where: { id: entryId, companyId: user.companyId } });
    if (!entry) throw new NotFoundException('Payroll entry not found');

    const run = await this.prisma.payrollRun.findFirst({ where: { id: entry.payrollRunId } });
    if (run?.status !== 'DRAFT') throw new BadRequestException('Can only edit DRAFT payroll entries');

    const tds = dto.tdsAmount !== undefined ? dto.tdsAmount : entry.tdsAmount;
    const otherDed = dto.otherDeductions !== undefined ? dto.otherDeductions : entry.otherDeductions;
    const otherAll = dto.otherAllowances !== undefined ? dto.otherAllowances : entry.otherAllowances;

    const newGross = entry.grossEarnings - entry.otherAllowances + otherAll;
    const newTotalDed = entry.pfEmployee + entry.esiEmployee + entry.lopAmount + tds + otherDed;
    const newNetPay = Math.max(0, newGross - newTotalDed);

    const updated = await this.prisma.payrollEntry.update({
      where: { id: entryId },
      data: { tdsAmount: tds, otherDeductions: otherDed, otherAllowances: otherAll, grossEarnings: newGross, totalDeductions: newTotalDed, netPay: newNetPay, remarks: dto.remarks, updatedBy: user.id },
    });

    // Recalculate run totals
    const entries = await this.prisma.payrollEntry.findMany({ where: { payrollRunId: entry.payrollRunId } });
    await this.prisma.payrollRun.update({
      where: { id: entry.payrollRunId },
      data: {
        totalGross: entries.reduce((s, e) => s + e.grossEarnings, 0),
        totalDeductions: entries.reduce((s, e) => s + e.totalDeductions, 0),
        totalNetPay: entries.reduce((s, e) => s + e.netPay, 0),
        totalTds: entries.reduce((s, e) => s + e.tdsAmount, 0),
        updatedBy: user.id,
      },
    });

    return updated;
  }

  async approvePayroll(runId: string, dto: ApprovePayrollDto, user: any) {
    const run = await this.prisma.payrollRun.findFirst({ where: { id: runId, companyId: user.companyId } });
    if (!run) throw new NotFoundException('Payroll run not found');

    if (dto.action === 'APPROVED' && run.status !== 'DRAFT') throw new BadRequestException('Only DRAFT payroll can be approved');
    if (dto.action === 'PAID' && run.status !== 'APPROVED') throw new BadRequestException('Only APPROVED payroll can be marked as paid');

    const updated = await this.prisma.payrollRun.update({
      where: { id: runId },
      data: {
        status: dto.action,
        ...(dto.action === 'APPROVED' && { approvedBy: user.id, approvedAt: new Date() }),
        ...(dto.action === 'PAID' && { paidAt: new Date() }),
        remarks: dto.remarks, updatedBy: user.id,
      },
    });

    // Update all entries status
    await this.prisma.payrollEntry.updateMany({ where: { payrollRunId: runId }, data: { status: dto.action, updatedBy: user.id } });

    await this.audit.log({ tableName: 'payroll_runs', recordId: runId, action: 'UPDATE', newValues: { status: dto.action }, changedBy: user.id });
    return updated;
  }

  async findAll(user: any, query: any) {
    const { year, status, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { companyId: user.companyId };
    if (year) where.year = Number(year);
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.payrollRun.findMany({ where, skip, take: Number(limit), orderBy: [{ year: 'desc' }, { month: 'desc' }] }),
      this.prisma.payrollRun.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(runId: string, user: any) {
    const run = await this.prisma.payrollRun.findFirst({
      where: { id: runId, companyId: user.companyId },
      include: {
        entries: {
          include: { employee: { select: { firstName: true, lastName: true, employeeNumber: true, department: { select: { name: true } }, designation: { select: { name: true } } } } },
          orderBy: { employee: { employeeNumber: 'asc' } },
        },
      },
    });
    if (!run) throw new NotFoundException('Payroll run not found');
    return run;
  }

  async getStats(user: any) {
    const now = new Date();
    const [total, draft, approved, paid, currentMonth] = await Promise.all([
      this.prisma.payrollRun.count({ where: { companyId: user.companyId } }),
      this.prisma.payrollRun.count({ where: { companyId: user.companyId, status: 'DRAFT' } }),
      this.prisma.payrollRun.count({ where: { companyId: user.companyId, status: 'APPROVED' } }),
      this.prisma.payrollRun.count({ where: { companyId: user.companyId, status: 'PAID' } }),
      this.prisma.payrollRun.findUnique({ where: { companyId_month_year: { companyId: user.companyId, month: now.getMonth() + 1, year: now.getFullYear() } } }),
    ]);
    return { total, draft, approved, paid, currentMonth };
  }
}
