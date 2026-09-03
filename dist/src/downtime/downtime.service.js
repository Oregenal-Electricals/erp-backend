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
exports.DowntimeService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let DowntimeService = class DowntimeService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    includes() {
        return {
            workOrder: { select: { id: true, woNumber: true, stageName: true, status: true } },
            startedBy: { select: { firstName: true, lastName: true } },
            resumedBy: { select: { firstName: true, lastName: true } },
        };
    }
    async pause(dto, user) {
        const wo = await this.prisma.workOrder.findFirst({ where: { id: dto.workOrderId, companyId: user.companyId } });
        if (!wo)
            throw new common_1.NotFoundException('Work order not found');
        if (wo.status !== 'IN_PROGRESS')
            throw new common_1.BadRequestException('Only an IN_PROGRESS Work Order can be paused');
        const existing = await this.prisma.downtime.findFirst({
            where: { workOrderId: dto.workOrderId, companyId: user.companyId, status: 'OPEN', isActive: true },
        });
        if (existing) {
            throw new common_1.BadRequestException(`Production is already paused since ${existing.startTime.toISOString()}`);
        }
        const startTime = dto.startTime ? new Date(dto.startTime) : new Date();
        const downtime = await this.prisma.downtime.create({
            data: {
                companyId: user.companyId, workOrderId: dto.workOrderId,
                reason: dto.reason, category: dto.category || 'OTHER',
                startTime, status: 'OPEN', startedByUserId: user.id, remarks: dto.remarks,
                createdBy: user.id, updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.prisma.workOrder.update({ where: { id: dto.workOrderId }, data: { stageStatus: 'PAUSED', updatedBy: user.id } });
        await this.audit.log({ tableName: 'downtimes', recordId: downtime.id, action: 'CREATE', newValues: downtime, changedBy: user.id });
        return downtime;
    }
    async resume(id, dto, user) {
        const downtime = await this.prisma.downtime.findFirst({ where: { id, companyId: user.companyId } });
        if (!downtime)
            throw new common_1.NotFoundException('Downtime record not found');
        if (downtime.status !== 'OPEN')
            throw new common_1.BadRequestException('This downtime has already been resumed');
        const endTime = dto.endTime ? new Date(dto.endTime) : new Date();
        if (endTime <= downtime.startTime)
            throw new common_1.BadRequestException('Resume time must be after pause time');
        const activeManpower = await this.prisma.manpowerAllocation.aggregate({
            where: { companyId: user.companyId, workOrderId: downtime.workOrderId, level: 'STAGE_TO_LINE', isActive: true, status: { not: 'REJECTED' } },
            _sum: { count: true },
        });
        if ((activeManpower._sum.count || 0) <= 0) {
            throw new common_1.BadRequestException('No active manpower available for this Work Order - restore manpower before resuming production');
        }
        const updated = await this.prisma.downtime.update({
            where: { id },
            data: { endTime, status: 'CLOSED', resumedByUserId: user.id, remarks: dto.remarks || downtime.remarks, updatedBy: user.id },
            include: this.includes(),
        });
        await this.prisma.workOrder.update({ where: { id: downtime.workOrderId }, data: { stageStatus: 'IN_PRODUCTION', updatedBy: user.id } });
        await this.audit.log({
            tableName: 'downtimes', recordId: id, action: 'UPDATE',
            oldValues: { status: 'OPEN' }, newValues: { status: 'CLOSED', endTime, durationMinutes: Math.round((endTime.getTime() - downtime.startTime.getTime()) / 60000) },
            changedBy: user.id,
        });
        return updated;
    }
    async findAll(user, query) {
        const { workOrderId, status } = query;
        const where = { companyId: user.companyId, isActive: true };
        if (workOrderId)
            where.workOrderId = workOrderId;
        if (status)
            where.status = status;
        return this.prisma.downtime.findMany({ where, include: this.includes(), orderBy: { startTime: 'desc' } });
    }
    async getCumulativeDowntime(workOrderId, user) {
        const records = await this.prisma.downtime.findMany({
            where: { companyId: user.companyId, workOrderId, status: 'CLOSED', isActive: true },
        });
        const totalMinutes = records.reduce((sum, d) => sum + (d.endTime ? Math.round((d.endTime.getTime() - d.startTime.getTime()) / 60000) : 0), 0);
        return { workOrderId, downtimeCount: records.length, totalMinutes };
    }
};
exports.DowntimeService = DowntimeService;
exports.DowntimeService = DowntimeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], DowntimeService);
//# sourceMappingURL=downtime.service.js.map