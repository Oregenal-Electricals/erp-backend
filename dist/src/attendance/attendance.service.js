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
exports.AttendanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let AttendanceService = class AttendanceService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    parseTime(dateStr, timeStr) {
        if (timeStr.includes('T'))
            return new Date(timeStr);
        const [h, m] = timeStr.split(':').map(Number);
        const d = new Date(dateStr);
        d.setHours(h, m, 0, 0);
        return d;
    }
    roundTo30Min(minutes) {
        return Math.floor(minutes / 30) * 30;
    }
    calculateAttendance(data) {
        if (!data.checkIn || !data.checkOut) {
            return { grossWorkedMinutes: 0, netWorkedMinutes: 0, netWorkedRounded: 0, workedHours: 0, otHours: 0, otRate: data.otRate, otAmount: 0, lunchMinutes: 0 };
        }
        const checkIn = this.parseTime(data.attendanceDate, data.checkIn);
        const checkOut = this.parseTime(data.attendanceDate, data.checkOut);
        if (checkOut <= checkIn)
            throw new common_1.BadRequestException('Check-out must be after check-in');
        const grossWorkedMinutes = (checkOut.getTime() - checkIn.getTime()) / 60000;
        let lunchMinutes = 0;
        if (data.lunchOut && data.lunchIn) {
            const lunchOut = this.parseTime(data.attendanceDate, data.lunchOut);
            const lunchIn = this.parseTime(data.attendanceDate, data.lunchIn);
            lunchMinutes = Math.max(0, (lunchIn.getTime() - lunchOut.getTime()) / 60000);
        }
        else {
            lunchMinutes = data.lunchMinutesConfig;
        }
        const netWorkedMinutes = Math.max(0, grossWorkedMinutes - lunchMinutes);
        const netWorkedRounded = this.roundTo30Min(netWorkedMinutes);
        const workedHours = netWorkedRounded / 60;
        const shiftMinutes = data.shiftHours * 60;
        const otMinutes = Math.max(0, netWorkedRounded - shiftMinutes);
        const otHours = otMinutes / 60;
        const effectiveOtRate = data.isHoliday ? data.holidayMultiplier : data.otRate;
        const hourlyRate = data.basicSalary / 26 / 8;
        const otAmount = otHours * hourlyRate * effectiveOtRate;
        return { grossWorkedMinutes, lunchMinutes, netWorkedMinutes, netWorkedRounded, workedHours, otHours, otRate: effectiveOtRate, otAmount };
    }
    async createShift(dto, user) {
        if (!['SUPER_ADMIN', 'ADMIN'].includes(user.role))
            throw new common_1.ForbiddenException('Only Admin can manage shifts');
        const existing = await this.prisma.shift.findUnique({ where: { companyId_code: { companyId: user.companyId, code: dto.code } } });
        if (existing)
            throw new common_1.BadRequestException(`Shift code ${dto.code} already exists`);
        let lunchMinutes = dto.lunchMinutes || 0;
        if (dto.lunchStartTime && dto.lunchEndTime) {
            const [sh, sm] = dto.lunchStartTime.split(':').map(Number);
            const [eh, em] = dto.lunchEndTime.split(':').map(Number);
            lunchMinutes = (eh * 60 + em) - (sh * 60 + sm);
        }
        const shift = await this.prisma.shift.create({
            data: Object.assign(Object.assign({}, dto), { lunchMinutes, companyId: user.companyId, createdBy: user.id, updatedBy: user.id }),
        });
        await this.audit.log({ tableName: 'shifts', recordId: shift.id, action: 'CREATE', newValues: shift, changedBy: user.id });
        return shift;
    }
    async updateShift(id, dto, user) {
        if (!['SUPER_ADMIN', 'ADMIN'].includes(user.role))
            throw new common_1.ForbiddenException('Only Admin can manage shifts');
        const shift = await this.prisma.shift.findFirst({ where: { id, companyId: user.companyId } });
        if (!shift)
            throw new common_1.NotFoundException('Shift not found');
        let lunchMinutes = dto.lunchMinutes;
        if (dto.lunchStartTime && dto.lunchEndTime) {
            const [sh, sm] = dto.lunchStartTime.split(':').map(Number);
            const [eh, em] = dto.lunchEndTime.split(':').map(Number);
            lunchMinutes = (eh * 60 + em) - (sh * 60 + sm);
        }
        const updated = await this.prisma.shift.update({
            where: { id },
            data: Object.assign(Object.assign(Object.assign({}, dto), (lunchMinutes !== undefined && { lunchMinutes })), { updatedBy: user.id }),
        });
        await this.audit.log({ tableName: 'shifts', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async findAllShifts(user) {
        return this.prisma.shift.findMany({
            where: { companyId: user.companyId, isActive: true },
            orderBy: { name: 'asc' },
        });
    }
    async markAttendance(dto, user) {
        const emp = await this.prisma.employee.findFirst({
            where: { id: dto.employeeId, companyId: user.companyId },
            select: { basicSalary: true },
        });
        if (!emp)
            throw new common_1.NotFoundException('Employee not found');
        const shiftId = dto.shiftId || null;
        let shift = shiftId ? await this.prisma.shift.findFirst({ where: { id: shiftId, companyId: user.companyId } }) : null;
        const existingAtt = await this.prisma.attendance.findUnique({
            where: { companyId_employeeId_attendanceDate: { companyId: user.companyId, employeeId: dto.employeeId, attendanceDate: new Date(dto.attendanceDate) } },
        });
        if (existingAtt)
            throw new common_1.BadRequestException('Attendance already marked for this date. Use update instead.');
        const calc = dto.status === 'PRESENT' || dto.status === 'HALF_DAY' ? this.calculateAttendance({
            attendanceDate: dto.attendanceDate,
            checkIn: dto.checkIn,
            checkOut: dto.checkOut,
            lunchOut: dto.lunchOut,
            lunchIn: dto.lunchIn,
            shiftHours: (shift === null || shift === void 0 ? void 0 : shift.shiftHours) || 8,
            lunchMinutesConfig: (shift === null || shift === void 0 ? void 0 : shift.lunchMinutes) || 0,
            otRate: (shift === null || shift === void 0 ? void 0 : shift.otMultiplier) || 1.5,
            basicSalary: emp.basicSalary,
            isHoliday: dto.isHoliday || false,
            holidayMultiplier: (shift === null || shift === void 0 ? void 0 : shift.holidayMultiplier) || 2.0,
        }) : { grossWorkedMinutes: 0, lunchMinutes: 0, netWorkedMinutes: 0, netWorkedRounded: 0, workedHours: dto.status === 'HALF_DAY' ? 4 : 0, otHours: 0, otRate: 1.5, otAmount: 0 };
        const att = await this.prisma.attendance.create({
            data: Object.assign(Object.assign({ companyId: user.companyId, employeeId: dto.employeeId, attendanceDate: new Date(dto.attendanceDate), shiftId: shiftId || null, checkIn: dto.checkIn ? this.parseTime(dto.attendanceDate, dto.checkIn) : null, checkOut: dto.checkOut ? this.parseTime(dto.attendanceDate, dto.checkOut) : null, lunchOut: dto.lunchOut ? this.parseTime(dto.attendanceDate, dto.lunchOut) : null, lunchIn: dto.lunchIn ? this.parseTime(dto.attendanceDate, dto.lunchIn) : null, status: dto.status || 'PRESENT', isHoliday: dto.isHoliday || false, remarks: dto.remarks, markedBy: user.id }, calc), { createdBy: user.id, updatedBy: user.id }),
            include: { employee: { select: { firstName: true, lastName: true, employeeNumber: true } }, shift: { select: { name: true } } },
        });
        await this.audit.log({ tableName: 'attendance', recordId: att.id, action: 'CREATE', newValues: att, changedBy: user.id });
        return att;
    }
    async updateAttendance(id, dto, user) {
        const att = await this.prisma.attendance.findFirst({
            where: { id, companyId: user.companyId },
            include: { employee: { select: { basicSalary: true } }, shift: true },
        });
        if (!att)
            throw new common_1.NotFoundException('Attendance record not found');
        const shiftId = dto.shiftId || att.shiftId;
        const shift = shiftId ? await this.prisma.shift.findFirst({ where: { id: shiftId, companyId: user.companyId } }) : att.shift;
        const dateStr = att.attendanceDate.toISOString().split('T')[0];
        const checkIn = dto.checkIn || (att.checkIn ? att.checkIn.toISOString() : undefined);
        const checkOut = dto.checkOut || (att.checkOut ? att.checkOut.toISOString() : undefined);
        const lunchOut = dto.lunchOut || (att.lunchOut ? att.lunchOut.toISOString() : undefined);
        const lunchIn = dto.lunchIn || (att.lunchIn ? att.lunchIn.toISOString() : undefined);
        const status = dto.status || att.status;
        const isHoliday = dto.isHoliday !== undefined ? dto.isHoliday : att.isHoliday;
        const calc = status === 'PRESENT' || status === 'HALF_DAY' ? this.calculateAttendance({
            attendanceDate: dateStr,
            checkIn, checkOut, lunchOut, lunchIn,
            shiftHours: (shift === null || shift === void 0 ? void 0 : shift.shiftHours) || 8,
            lunchMinutesConfig: (shift === null || shift === void 0 ? void 0 : shift.lunchMinutes) || 0,
            otRate: (shift === null || shift === void 0 ? void 0 : shift.otMultiplier) || 1.5,
            basicSalary: att.employee.basicSalary,
            isHoliday,
            holidayMultiplier: (shift === null || shift === void 0 ? void 0 : shift.holidayMultiplier) || 2.0,
        }) : { grossWorkedMinutes: 0, lunchMinutes: 0, netWorkedMinutes: 0, netWorkedRounded: 0, workedHours: 0, otHours: 0, otRate: 1.5, otAmount: 0 };
        const updated = await this.prisma.attendance.update({
            where: { id },
            data: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (dto.shiftId && { shiftId: dto.shiftId })), (dto.checkIn && { checkIn: this.parseTime(dateStr, dto.checkIn) })), (dto.checkOut && { checkOut: this.parseTime(dateStr, dto.checkOut) })), (dto.lunchOut && { lunchOut: this.parseTime(dateStr, dto.lunchOut) })), (dto.lunchIn && { lunchIn: this.parseTime(dateStr, dto.lunchIn) })), (dto.status && { status: dto.status })), (dto.isHoliday !== undefined && { isHoliday: dto.isHoliday })), (dto.remarks && { remarks: dto.remarks })), { markedBy: user.id, updatedBy: user.id }), calc),
            include: { employee: { select: { firstName: true, lastName: true, employeeNumber: true } }, shift: { select: { name: true } } },
        });
        await this.audit.log({ tableName: 'attendance', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async bulkMarkAttendance(dto, user) {
        const results = [];
        for (const rec of dto.records) {
            try {
                const result = await this.markAttendance({
                    employeeId: rec.employeeId,
                    attendanceDate: dto.attendanceDate,
                    shiftId: dto.shiftId,
                    checkIn: rec.checkIn,
                    checkOut: rec.checkOut,
                    lunchOut: rec.lunchOut,
                    lunchIn: rec.lunchIn,
                    status: rec.status || 'PRESENT',
                    isHoliday: rec.isHoliday,
                    remarks: rec.remarks,
                }, user);
                results.push({ employeeId: rec.employeeId, success: true, attendanceId: result.id });
            }
            catch (e) {
                results.push({ employeeId: rec.employeeId, success: false, error: e.message });
            }
        }
        return { date: dto.attendanceDate, total: results.length, success: results.filter(r => r.success).length, failed: results.filter(r => !r.success).length, results };
    }
    async findAll(user, query) {
        const { employeeId, departmentId, month, year, status, page = 1, limit = 50 } = query;
        const skip = (Number(page) - 1) * Number(limit);
        let from, to;
        if (month && year) {
            from = new Date(Number(year), Number(month) - 1, 1);
            to = new Date(Number(year), Number(month), 0, 23, 59, 59);
        }
        else {
            const now = new Date();
            from = new Date(now.getFullYear(), now.getMonth(), 1);
            to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        }
        const where = { companyId: user.companyId, attendanceDate: { gte: from, lte: to } };
        if (employeeId)
            where.employeeId = employeeId;
        if (status)
            where.status = status;
        if (departmentId)
            where.employee = { departmentId };
        const [data, total] = await Promise.all([
            this.prisma.attendance.findMany({
                where, skip, take: Number(limit),
                include: {
                    employee: { select: { firstName: true, lastName: true, employeeNumber: true, department: { select: { name: true } } } },
                    shift: { select: { name: true, startTime: true, endTime: true } },
                },
                orderBy: [{ attendanceDate: 'desc' }, { employee: { employeeNumber: 'asc' } }],
            }),
            this.prisma.attendance.count({ where }),
        ]);
        return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
    }
    async getMonthlySummary(employeeId, month, year, user) {
        const emp = await this.prisma.employee.findFirst({ where: { id: employeeId, companyId: user.companyId } });
        if (!emp)
            throw new common_1.NotFoundException('Employee not found');
        const from = new Date(year, month - 1, 1);
        const to = new Date(year, month, 0, 23, 59, 59);
        const records = await this.prisma.attendance.findMany({
            where: { companyId: user.companyId, employeeId, attendanceDate: { gte: from, lte: to } },
            include: { shift: { select: { name: true } } },
            orderBy: { attendanceDate: 'asc' },
        });
        const summary = {
            present: records.filter(r => r.status === 'PRESENT').length,
            absent: records.filter(r => r.status === 'ABSENT').length,
            halfDay: records.filter(r => r.status === 'HALF_DAY').length,
            holiday: records.filter(r => r.status === 'HOLIDAY').length,
            weekOff: records.filter(r => r.status === 'WEEK_OFF').length,
            leave: records.filter(r => r.status === 'LEAVE').length,
            totalWorkedHours: records.reduce((s, r) => s + r.workedHours, 0),
            totalOtHours: records.reduce((s, r) => s + r.otHours, 0),
            totalOtAmount: records.reduce((s, r) => s + r.otAmount, 0),
        };
        return { employeeId, month, year, summary, records };
    }
    async getStats(user, query) {
        const { month, year } = query;
        const now = new Date();
        const m = Number(month) || now.getMonth() + 1;
        const y = Number(year) || now.getFullYear();
        const from = new Date(y, m - 1, 1);
        const to = new Date(y, m, 0, 23, 59, 59);
        const [total, present, absent, onLeave, totalOtHours, totalOtAmount] = await Promise.all([
            this.prisma.attendance.count({ where: { companyId: user.companyId, attendanceDate: { gte: from, lte: to } } }),
            this.prisma.attendance.count({ where: { companyId: user.companyId, attendanceDate: { gte: from, lte: to }, status: 'PRESENT' } }),
            this.prisma.attendance.count({ where: { companyId: user.companyId, attendanceDate: { gte: from, lte: to }, status: 'ABSENT' } }),
            this.prisma.attendance.count({ where: { companyId: user.companyId, attendanceDate: { gte: from, lte: to }, status: 'LEAVE' } }),
            this.prisma.attendance.aggregate({ where: { companyId: user.companyId, attendanceDate: { gte: from, lte: to } }, _sum: { otHours: true } }),
            this.prisma.attendance.aggregate({ where: { companyId: user.companyId, attendanceDate: { gte: from, lte: to } }, _sum: { otAmount: true } }),
        ]);
        return { month: m, year: y, total, present, absent, onLeave, halfDay: total - present - absent - onLeave, totalOtHours: totalOtHours._sum.otHours || 0, totalOtAmount: totalOtAmount._sum.otAmount || 0 };
    }
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], AttendanceService);
//# sourceMappingURL=attendance.service.js.map