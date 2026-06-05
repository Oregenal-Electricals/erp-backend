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
exports.VisitorManagementService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const settings_service_1 = require("../settings/settings.service");
const client_1 = require("@prisma/client");
let VisitorManagementService = class VisitorManagementService {
    constructor(prisma, audit, settings) {
        this.prisma = prisma;
        this.audit = audit;
        this.settings = settings;
    }
    async createVisitor(dto, user) {
        const visitor = await this.prisma.visitor.create({
            data: Object.assign(Object.assign({}, dto), { companyId: user.companyId, createdBy: user.id, updatedBy: user.id }),
        });
        await this.audit.log({
            tableName: 'visitors', recordId: visitor.id,
            action: 'CREATE', newValues: visitor, changedBy: user.id,
        });
        return visitor;
    }
    async findAllVisitors(user, search) {
        const where = { companyId: user.companyId };
        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { mobile: { contains: search, mode: 'insensitive' } },
                { idProofNumber: { contains: search, mode: 'insensitive' } },
                { visitorCompany: { contains: search, mode: 'insensitive' } },
            ];
        }
        return this.prisma.visitor.findMany({
            where,
            include: {
                _count: { select: { logs: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOneVisitor(id) {
        const visitor = await this.prisma.visitor.findUnique({
            where: { id },
            include: {
                logs: {
                    include: {
                        plant: { select: { id: true, name: true, code: true } },
                        hostEmployee: { select: { id: true, firstName: true, lastName: true } },
                        checkedInBy: { select: { id: true, firstName: true, lastName: true } },
                    },
                    orderBy: { checkInTime: 'desc' },
                    take: 10,
                },
            },
        });
        if (!visitor)
            throw new common_1.NotFoundException('Visitor not found');
        return visitor;
    }
    async updateVisitor(id, dto, user) {
        const visitor = await this.prisma.visitor.findUnique({ where: { id } });
        if (!visitor)
            throw new common_1.NotFoundException('Visitor not found');
        const updated = await this.prisma.visitor.update({
            where: { id },
            data: Object.assign(Object.assign({}, dto), { updatedBy: user.id }),
        });
        await this.audit.log({
            tableName: 'visitors', recordId: id,
            action: 'UPDATE', oldValues: visitor, newValues: dto, changedBy: user.id,
        });
        return updated;
    }
    async blacklistVisitor(id, reason, user) {
        const visitor = await this.prisma.visitor.findUnique({ where: { id } });
        if (!visitor)
            throw new common_1.NotFoundException('Visitor not found');
        const updated = await this.prisma.visitor.update({
            where: { id },
            data: { isBlacklisted: !visitor.isBlacklisted, blacklistReason: reason, updatedBy: user.id },
        });
        await this.audit.log({
            tableName: 'visitors', recordId: id,
            action: 'UPDATE',
            newValues: { isBlacklisted: updated.isBlacklisted, reason },
            changedBy: user.id,
            reason: updated.isBlacklisted ? `Blacklisted: ${reason}` : 'Removed from blacklist',
        });
        return updated;
    }
    async checkIn(dto, user) {
        const visitor = await this.prisma.visitor.findUnique({ where: { id: dto.visitorId } });
        if (!visitor)
            throw new common_1.NotFoundException('Visitor not found');
        if (visitor.isBlacklisted)
            throw new common_1.BadRequestException(`Visitor is blacklisted: ${visitor.blacklistReason}`);
        const plant = await this.prisma.plant.findUnique({ where: { id: dto.plantId } });
        if (!plant)
            throw new common_1.NotFoundException('Plant not found');
        const alreadyIn = await this.prisma.visitorLog.findFirst({
            where: { visitorId: dto.visitorId, status: client_1.VisitorStatus.CHECKED_IN },
        });
        if (alreadyIn)
            throw new common_1.ConflictException('Visitor is already checked in');
        let logNumber;
        try {
            logNumber = await this.settings.getNextNumber(user.companyId, 'VIS');
        }
        catch (_a) {
            const count = await this.prisma.visitorLog.count({ where: { companyId: user.companyId } });
            const now = new Date();
            const fy = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
            logNumber = `VIS-${String(fy).slice(2)}-${String(fy + 1).slice(2)}-${String(count + 1).padStart(4, '0')}`;
        }
        const log = await this.prisma.visitorLog.create({
            data: {
                logNumber,
                companyId: user.companyId,
                visitorId: dto.visitorId,
                plantId: dto.plantId,
                hostEmployeeId: dto.hostEmployeeId,
                checkedInById: user.id,
                purpose: dto.purpose,
                vehicleNumber: dto.vehicleNumber,
                itemsCarried: dto.itemsCarried,
                areasToVisit: dto.areasToVisit,
                remarks: dto.remarks,
                expectedOutTime: dto.expectedOutTime ? new Date(dto.expectedOutTime) : undefined,
                status: client_1.VisitorStatus.CHECKED_IN,
                createdBy: user.id,
                updatedBy: user.id,
            },
            include: this.logIncludes(),
        });
        await this.audit.log({
            tableName: 'visitor_logs', recordId: log.id,
            action: 'CREATE',
            newValues: { logNumber, visitorId: dto.visitorId, plantId: dto.plantId },
            changedBy: user.id,
        });
        return log;
    }
    async checkOut(id, dto, user) {
        const log = await this.prisma.visitorLog.findUnique({ where: { id } });
        if (!log)
            throw new common_1.NotFoundException('Visitor log not found');
        if (log.status !== client_1.VisitorStatus.CHECKED_IN) {
            throw new common_1.BadRequestException('Visitor is not currently checked in');
        }
        const updated = await this.prisma.visitorLog.update({
            where: { id },
            data: {
                status: client_1.VisitorStatus.CHECKED_OUT,
                checkOutTime: new Date(),
                checkedOutById: user.id,
                remarks: dto.remarks || log.remarks,
                updatedBy: user.id,
            },
            include: this.logIncludes(),
        });
        await this.audit.log({
            tableName: 'visitor_logs', recordId: id,
            action: 'UPDATE',
            oldValues: { status: 'CHECKED_IN' },
            newValues: { status: 'CHECKED_OUT', checkOutTime: new Date() },
            changedBy: user.id,
        });
        return updated;
    }
    async findAllLogs(user, filters) {
        const where = { companyId: user.companyId };
        if (filters.plantId)
            where.plantId = filters.plantId;
        if (filters.status)
            where.status = filters.status;
        if (filters.date) {
            const d = new Date(filters.date);
            const next = new Date(d);
            next.setDate(next.getDate() + 1);
            where.checkInTime = { gte: d, lt: next };
        }
        return this.prisma.visitorLog.findMany({
            where,
            include: this.logIncludes(),
            orderBy: { checkInTime: 'desc' },
        });
    }
    async getActiveVisitors(user) {
        return this.prisma.visitorLog.findMany({
            where: { companyId: user.companyId, status: client_1.VisitorStatus.CHECKED_IN },
            include: this.logIncludes(),
            orderBy: { checkInTime: 'asc' },
        });
    }
    async getStats(user) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const base = { companyId: user.companyId };
        const [totalVisitors, activeNow, todayIn, todayOut, totalLogs, blacklisted,] = await Promise.all([
            this.prisma.visitor.count({ where: base }),
            this.prisma.visitorLog.count({ where: Object.assign(Object.assign({}, base), { status: 'CHECKED_IN' }) }),
            this.prisma.visitorLog.count({ where: Object.assign(Object.assign({}, base), { checkInTime: { gte: today, lt: tomorrow } }) }),
            this.prisma.visitorLog.count({ where: Object.assign(Object.assign({}, base), { status: 'CHECKED_OUT', checkOutTime: { gte: today, lt: tomorrow } }) }),
            this.prisma.visitorLog.count({ where: base }),
            this.prisma.visitor.count({ where: Object.assign(Object.assign({}, base), { isBlacklisted: true }) }),
        ]);
        return { totalVisitors, activeNow, todayIn, todayOut, totalLogs, blacklisted };
    }
    logIncludes() {
        return {
            visitor: { select: { id: true, firstName: true, lastName: true, mobile: true, visitorCompany: true, idProofType: true } },
            plant: { select: { id: true, name: true, code: true } },
            hostEmployee: { select: { id: true, firstName: true, lastName: true } },
            checkedInBy: { select: { id: true, firstName: true, lastName: true } },
            checkedOutBy: { select: { id: true, firstName: true, lastName: true } },
        };
    }
};
exports.VisitorManagementService = VisitorManagementService;
exports.VisitorManagementService = VisitorManagementService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        settings_service_1.SettingsService])
], VisitorManagementService);
//# sourceMappingURL=visitor-management.service.js.map