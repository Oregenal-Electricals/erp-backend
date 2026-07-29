"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HrReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let HrReportsService = class HrReportsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getHeadcountReport(companyId) {
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
            byDepartment: byDept.map(d => { var _a, _b; return ({ department: ((_a = deptMap[d.departmentId]) === null || _a === void 0 ? void 0 : _a.name) || '—', code: ((_b = deptMap[d.departmentId]) === null || _b === void 0 ? void 0 : _b.code) || '—', count: d._count.id }); }).sort((a, b) => b.count - a.count),
            byEmploymentType: byType.map(t => ({ type: t.employmentType, count: t._count.id })),
            byGender: byGender.map(g => ({ gender: g.gender, count: g._count.id })),
        };
    }
    async getAttendanceSummaryReport(companyId, month, year) {
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
        const attMap = {};
        attendance.forEach(a => {
            if (!attMap[a.employeeId])
                attMap[a.employeeId] = [];
            attMap[a.employeeId].push(a);
        });
        const rows = employees.map(emp => {
            var _a;
            const records = attMap[emp.id] || [];
            return {
                employeeNumber: emp.employeeNumber,
                employeeName: `${emp.firstName} ${emp.lastName}`,
                department: ((_a = emp.department) === null || _a === void 0 ? void 0 : _a.name) || '—',
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
    async getLeaveUtilizationReport(companyId, year) {
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
        const byEmployee = balances.reduce((acc, b) => {
            var _a, _b, _c, _d, _e, _f, _g;
            const existing = acc.find(e => e.employeeId === b.employeeId);
            if (existing) {
                existing.leaves.push({ type: (_a = b.leaveType) === null || _a === void 0 ? void 0 : _a.code, allocated: b.allocated, used: b.used, available: b.available });
            }
            else {
                acc.push({
                    employeeId: b.employeeId,
                    employeeNumber: (_b = b.employee) === null || _b === void 0 ? void 0 : _b.employeeNumber,
                    employeeName: `${(_c = b.employee) === null || _c === void 0 ? void 0 : _c.firstName} ${(_d = b.employee) === null || _d === void 0 ? void 0 : _d.lastName}`,
                    department: (_f = (_e = b.employee) === null || _e === void 0 ? void 0 : _e.department) === null || _f === void 0 ? void 0 : _f.name,
                    leaves: [{ type: (_g = b.leaveType) === null || _g === void 0 ? void 0 : _g.code, allocated: b.allocated, used: b.used, available: b.available }],
                });
            }
            return acc;
        }, []);
        return { reportType: 'LEAVE_UTILIZATION', year, byType, byEmployee };
    }
    async getPayrollCostReport(companyId, month, year) {
        const entries = await this.prisma.payrollEntry.findMany({
            where: { companyId, month, year, status: { not: 'DRAFT' } },
            include: {
                employee: {
                    include: { department: { select: { name: true } }, designation: { select: { name: true, grade: true } } },
                },
            },
        });
        const byDept = {};
        entries.forEach(e => {
            var _a, _b;
            const dept = ((_b = (_a = e.employee) === null || _a === void 0 ? void 0 : _a.department) === null || _b === void 0 ? void 0 : _b.name) || 'Unknown';
            if (!byDept[dept])
                byDept[dept] = { department: dept, headcount: 0, totalGross: 0, totalPf: 0, totalEsi: 0, totalTds: 0, totalNetPay: 0, totalOt: 0 };
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
            byDepartment: Object.values(byDept).sort((a, b) => b.totalGross - a.totalGross),
            entries: entries.map(e => {
                var _a, _b, _c, _d, _e, _f, _g;
                return ({
                    employeeNumber: (_a = e.employee) === null || _a === void 0 ? void 0 : _a.employeeNumber,
                    employeeName: `${(_b = e.employee) === null || _b === void 0 ? void 0 : _b.firstName} ${(_c = e.employee) === null || _c === void 0 ? void 0 : _c.lastName}`,
                    department: (_e = (_d = e.employee) === null || _d === void 0 ? void 0 : _d.department) === null || _e === void 0 ? void 0 : _e.name,
                    designation: (_g = (_f = e.employee) === null || _f === void 0 ? void 0 : _f.designation) === null || _g === void 0 ? void 0 : _g.name,
                    gross: e.grossEarnings, pf: e.pfEmployee + e.pfEmployer,
                    esi: e.esiEmployee + e.esiEmployer, tds: e.tdsAmount,
                    ot: e.otAmount, netPay: e.netPay,
                });
            }),
        };
    }
    async getAttritionReport(companyId, year) {
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
            joinedEmployees: joined.map(e => { var _a, _b; return ({ employeeNumber: e.employeeNumber, name: `${e.firstName} ${e.lastName}`, department: (_a = e.department) === null || _a === void 0 ? void 0 : _a.name, designation: (_b = e.designation) === null || _b === void 0 ? void 0 : _b.name, dateOfJoining: e.dateOfJoining, type: e.employmentType }); }),
            resignedEmployees: resigned.map(e => { var _a, _b; return ({ employeeNumber: e.employeeNumber, name: `${e.firstName} ${e.lastName}`, department: (_a = e.department) === null || _a === void 0 ? void 0 : _a.name, designation: (_b = e.designation) === null || _b === void 0 ? void 0 : _b.name, dateOfLeaving: e.dateOfLeaving }); }),
            terminatedEmployees: terminated.map(e => { var _a; return ({ employeeNumber: e.employeeNumber, name: `${e.firstName} ${e.lastName}`, department: (_a = e.department) === null || _a === void 0 ? void 0 : _a.name, dateOfLeaving: e.dateOfLeaving }); }),
        };
    }
    async getOtReport(companyId, month, year) {
        const from = new Date(year, month - 1, 1);
        const to = new Date(year, month, 0, 23, 59, 59);
        const records = await this.prisma.attendance.findMany({
            where: { companyId, attendanceDate: { gte: from, lte: to }, otHours: { gt: 0 } },
            include: { employee: { select: { firstName: true, lastName: true, employeeNumber: true, department: { select: { name: true } }, designation: { select: { name: true } } } } },
            orderBy: { otAmount: 'desc' },
        });
        const byEmployee = {};
        records.forEach(r => {
            var _a, _b, _c, _d, _e, _f, _g;
            if (!byEmployee[r.employeeId]) {
                byEmployee[r.employeeId] = {
                    employeeNumber: (_a = r.employee) === null || _a === void 0 ? void 0 : _a.employeeNumber,
                    employeeName: `${(_b = r.employee) === null || _b === void 0 ? void 0 : _b.firstName} ${(_c = r.employee) === null || _c === void 0 ? void 0 : _c.lastName}`,
                    department: (_e = (_d = r.employee) === null || _d === void 0 ? void 0 : _d.department) === null || _e === void 0 ? void 0 : _e.name,
                    designation: (_g = (_f = r.employee) === null || _f === void 0 ? void 0 : _f.designation) === null || _g === void 0 ? void 0 : _g.name,
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
            byEmployee: Object.values(byEmployee).sort((a, b) => b.totalOtAmount - a.totalOtAmount),
        };
    }
};
exports.HrReportsService = HrReportsService;
exports.HrReportsService = HrReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], HrReportsService);
//# sourceMappingURL=hr-reports.service.js.map