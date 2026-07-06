import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HrReportsService {
  constructor(private prisma: PrismaService) {}

  async getHeadcountReport(companyId: string) {
    const [total, active, byDept, byType, byGender, joinedThisMonth, resignedThisMonth] = await Promise.all([
      this.prisma.employee.count({ where: { companyId, isActive: true } }),
      this.prisma.employee.count({ where: { companyId, isActive: true, status: 'ACTIVE' } }),
      this.prisma.employee.groupBy({
        by: ['departmentId'], where: { companyId, isActive: true, status: 'ACTIVE' },
        _count: { id: true },
      }),
      this.prisma.employee.groupBy({
        by: ['employmentType'], where: { companyId, isActive: true, status: 'ACTIVE' },
        _count: { id: true },
      }),
      this.prisma.employee.groupBy({
        by: ['gender'], where: { companyId, isActive: true, status: 'ACTIVE' },
        _count: { id: true },
      }),
      this.prisma.employee.count({
        where: { companyId, isActive: true, dateOfJoining: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
      }),
      this.prisma.employee.count({
        where: { companyId, isActive: true, status: 'RESIGNED', dateOfLeaving: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
      }),
    ]);

    const deptIds = byDept.map(d => d.departmentId);
    const depts = await this.prisma.hrDepartment.findMany({ where: { id: { in: deptIds } }, select: { id: true, name: true, code: true } });
    const deptMap = Object.fromEntries(depts.map(d => [d.id, d]));

    return {
      reportType: 'HEADCOUNT',
      summary: { total, active, inactive: total - active, joinedThisMonth, resignedThisMonth },
      byDepartment: byDept.map(d => ({ department: deptMap[d.departmentId]?.name || '—', code: deptMap[d.departmentId]?.code || '—', count: d._count.id })).sort((a, b) => b.count - a.count),
      byEmploymentType: byType.map(t => ({ type: t.employmentType, count: t._count.id })),
      byGender: byGender.map(g => ({ gender: g.gender, count: g._count.id })),
    };
  }

  async getAttendanceSummaryReport(companyId: string, month: number, year: number) {
    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 0, 23, 59, 59);

    const employees = await this.prisma.employee.findMany({
      where: { companyId, isActive: true, status: 'ACTIVE' },
      include: { department: { select: { name: true } } },
      orderBy: { employeeNumber: 'asc' },
    });

    const attendance = await this.prisma.attendance.findMany({
      where: { companyId, attendanceDate: { gte: from, lte: to } },
    });

    const attMap: Record<string, any[]> = {};
    attendance.forEach(a => {
      if (!attMap[a.employeeId]) attMap[a.employeeId] = [];
      attMap[a.employeeId].push(a);
    });

    const rows = employees.map(emp => {
      const records = attMap[emp.id] || [];
      return {
        employeeNumber: emp.employeeNumber,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        department: emp.department?.name || '—',
        present: records.filter(r => r.status === 'PRESENT').length,
        absent: records.filter(r => r.status === 'ABSENT').length,
        halfDay: records.filter(r => r.status === 'HALF_DAY').length,
        leave: records.filter(r => r.status === 'LEAVE').length,
        holiday: records.filter(r => r.status === 'HOLIDAY').length,
        weekOff: records.filter(r => r.status === 'WEEK_OFF').length,
        totalOtHours: records.reduce((s, r) => s + (r.otHours || 0), 0),
        totalOtAmount: records.reduce((s, r) => s + (r.otAmount || 0), 0),
        workedHours: records.reduce((s, r) => s + (r.workedHours || 0), 0),
      };
    });

    return {
      reportType: 'ATTENDANCE_SUMMARY',
      month, year,
      summary: {
        totalEmployees: rows.length,
        avgPresent: rows.length ? Math.round(rows.reduce((s, r) => s + r.present, 0) / rows.length * 10) / 10 : 0,
        totalOtHours: rows.reduce((s, r) => s + r.totalOtHours, 0),
        totalOtAmount: rows.reduce((s, r) => s + r.totalOtAmount, 0),
      },
      rows,
    };
  }

  async getLeaveUtilizationReport(companyId: string, year: number) {
    const leaveTypes = await this.prisma.leaveType.findMany({ where: { companyId, isActive: true } });
    const balances = await this.prisma.leaveBalance.findMany({
      where: { companyId, year },
      include: { employee: { select: { firstName: true, lastName: true, employeeNumber: true, department: { select: { name: true } } } }, leaveType: { select: { name: true, code: true } } },
    });

    const byType = leaveTypes.map(lt => {
      const typeBals = balances.filter(b => b.leaveTypeId === lt.id);
      return {
        leaveType: lt.name, code: lt.code, isPaid: lt.isPaid,
        totalAllocated: typeBals.reduce((s, b) => s + b.allocated, 0),
        totalUsed: typeBals.reduce((s, b) => s + b.used, 0),
        totalPending: typeBals.reduce((s, b) => s + b.pending, 0),
        totalAvailable: typeBals.reduce((s, b) => s + b.available, 0),
        utilizationRate: typeBals.reduce((s, b) => s + b.allocated, 0) > 0
          ? Math.round(typeBals.reduce((s, b) => s + b.used, 0) / typeBals.reduce((s, b) => s + b.allocated, 0) * 100)
          : 0,
        employeeCount: typeBals.length,
      };
    });

    const byEmployee = balances.reduce((acc: any[], b) => {
      const existing = acc.find(e => e.employeeId === b.employeeId);
      if (existing) {
        existing.leaves.push({ type: b.leaveType?.code, allocated: b.allocated, used: b.used, available: b.available });
      } else {
        acc.push({
          employeeId: b.employeeId,
          employeeNumber: b.employee?.employeeNumber,
          employeeName: `${b.employee?.firstName} ${b.employee?.lastName}`,
          department: b.employee?.department?.name,
          leaves: [{ type: b.leaveType?.code, allocated: b.allocated, used: b.used, available: b.available }],
        });
      }
      return acc;
    }, []);

    return { reportType: 'LEAVE_UTILIZATION', year, byType, byEmployee };
  }

  async getPayrollCostReport(companyId: string, month: number, year: number) {
    const entries = await this.prisma.payrollEntry.findMany({
      where: { companyId, month, year, status: { not: 'DRAFT' } },
      include: {
        employee: {
          include: { department: { select: { name: true } }, designation: { select: { name: true, grade: true } } },
        },
      },
    });

    const byDept: Record<string, any> = {};
    entries.forEach(e => {
      const dept = e.employee?.department?.name || 'Unknown';
      if (!byDept[dept]) byDept[dept] = { department: dept, headcount: 0, totalGross: 0, totalPf: 0, totalEsi: 0, totalTds: 0, totalNetPay: 0, totalOt: 0 };
      byDept[dept].headcount++;
      byDept[dept].totalGross += e.grossEarnings;
      byDept[dept].totalPf += e.pfEmployee + e.pfEmployer;
      byDept[dept].totalEsi += e.esiEmployee + e.esiEmployer;
      byDept[dept].totalTds += e.tdsAmount;
      byDept[dept].totalNetPay += e.netPay;
      byDept[dept].totalOt += e.otAmount;
    });

    return {
      reportType: 'PAYROLL_COST',
      month, year,
      summary: {
        totalEmployees: entries.length,
        totalGross: entries.reduce((s, e) => s + e.grossEarnings, 0),
        totalPf: entries.reduce((s, e) => s + e.pfEmployee + e.pfEmployer, 0),
        totalEsi: entries.reduce((s, e) => s + e.esiEmployee + e.esiEmployer, 0),
        totalTds: entries.reduce((s, e) => s + e.tdsAmount, 0),
        totalNetPay: entries.reduce((s, e) => s + e.netPay, 0),
        totalOt: entries.reduce((s, e) => s + e.otAmount, 0),
      },
      byDepartment: Object.values(byDept).sort((a: any, b: any) => b.totalGross - a.totalGross),
      entries: entries.map(e => ({
        employeeNumber: e.employee?.employeeNumber,
        employeeName: `${e.employee?.firstName} ${e.employee?.lastName}`,
        department: e.employee?.department?.name,
        designation: e.employee?.designation?.name,
        gross: e.grossEarnings, pf: e.pfEmployee + e.pfEmployer,
        esi: e.esiEmployee + e.esiEmployer, tds: e.tdsAmount,
        ot: e.otAmount, netPay: e.netPay,
      })),
    };
  }

  async getAttritionReport(companyId: string, year: number) {
    const from = new Date(year, 0, 1);
    const to = new Date(year, 11, 31, 23, 59, 59);

    const [joined, resigned, terminated, total] = await Promise.all([
      this.prisma.employee.findMany({ where: { companyId, dateOfJoining: { gte: from, lte: to } }, select: { employeeNumber: true, firstName: true, lastName: true, dateOfJoining: true, department: { select: { name: true } }, designation: { select: { name: true } }, employmentType: true } }),
      this.prisma.employee.findMany({ where: { companyId, status: 'RESIGNED', dateOfLeaving: { gte: from, lte: to } }, select: { employeeNumber: true, firstName: true, lastName: true, dateOfLeaving: true, department: { select: { name: true } }, designation: { select: { name: true } } } }),
      this.prisma.employee.findMany({ where: { companyId, status: 'TERMINATED', dateOfLeaving: { gte: from, lte: to } }, select: { employeeNumber: true, firstName: true, lastName: true, dateOfLeaving: true, department: { select: { name: true } } } }),
      this.prisma.employee.count({ where: { companyId, isActive: true } }),
    ]);

    const attritionRate = total > 0 ? Math.round((resigned.length + terminated.length) / total * 100 * 100) / 100 : 0;

    return {
      reportType: 'ATTRITION',
      year,
      summary: { totalEmployees: total, joined: joined.length, resigned: resigned.length, terminated: terminated.length, attritionRate },
      joinedEmployees: joined.map(e => ({ employeeNumber: e.employeeNumber, name: `${e.firstName} ${e.lastName}`, department: e.department?.name, designation: e.designation?.name, dateOfJoining: e.dateOfJoining, type: e.employmentType })),
      resignedEmployees: resigned.map(e => ({ employeeNumber: e.employeeNumber, name: `${e.firstName} ${e.lastName}`, department: e.department?.name, designation: e.designation?.name, dateOfLeaving: e.dateOfLeaving })),
      terminatedEmployees: terminated.map(e => ({ employeeNumber: e.employeeNumber, name: `${e.firstName} ${e.lastName}`, department: e.department?.name, dateOfLeaving: e.dateOfLeaving })),
    };
  }

  async getOtReport(companyId: string, month: number, year: number) {
    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 0, 23, 59, 59);

    const records = await this.prisma.attendance.findMany({
      where: { companyId, attendanceDate: { gte: from, lte: to }, otHours: { gt: 0 } },
      include: { employee: { select: { firstName: true, lastName: true, employeeNumber: true, department: { select: { name: true } }, designation: { select: { name: true } } } } },
      orderBy: { otAmount: 'desc' },
    });

    const byEmployee: Record<string, any> = {};
    records.forEach(r => {
      if (!byEmployee[r.employeeId]) {
        byEmployee[r.employeeId] = {
          employeeNumber: r.employee?.employeeNumber,
          employeeName: `${r.employee?.firstName} ${r.employee?.lastName}`,
          department: r.employee?.department?.name,
          designation: r.employee?.designation?.name,
          totalOtHours: 0, totalOtAmount: 0, otDays: 0,
        };
      }
      byEmployee[r.employeeId].totalOtHours += r.otHours;
      byEmployee[r.employeeId].totalOtAmount += r.otAmount;
      byEmployee[r.employeeId].otDays++;
    });

    return {
      reportType: 'OT_REPORT',
      month, year,
      summary: {
        totalOtHours: records.reduce((s, r) => s + r.otHours, 0),
        totalOtAmount: records.reduce((s, r) => s + r.otAmount, 0),
        employeesWithOt: Object.keys(byEmployee).length,
      },
      byEmployee: Object.values(byEmployee).sort((a: any, b: any) => b.totalOtAmount - a.totalOtAmount),
    };
  }
}
