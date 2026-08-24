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
exports.GateEventsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let GateEventsService = class GateEventsService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    includes() {
        return {
            gate: { select: { id: true, code: true, name: true } },
            vehicle: { select: { id: true, vehicleNumber: true, vehicleType: true } },
            securityUser: { select: { id: true, firstName: true, lastName: true } },
            correctionOfEvent: { select: { id: true, eventType: true, eventTime: true } },
        };
    }
    async create(dto, user) {
        const plant = await this.prisma.plant.findFirst({ where: { id: dto.plantId, companyId: user.companyId } });
        if (!plant)
            throw new common_1.NotFoundException('Plant not found');
        const event = await this.prisma.gateEvent.create({
            data: {
                companyId: user.companyId,
                plantId: dto.plantId,
                gateId: dto.gateId,
                eventType: dto.eventType,
                referenceType: dto.referenceType,
                referenceId: dto.referenceId,
                personId: dto.personId,
                personName: dto.personName,
                vehicleId: dto.vehicleId,
                vehicleNumber: dto.vehicleNumber,
                eventTime: dto.eventTime ? new Date(dto.eventTime) : new Date(),
                securityUserId: user.id,
                source: dto.source || 'MANUAL',
                remarks: dto.remarks,
                createdBy: user.id, updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'gate_events', recordId: event.id, action: 'CREATE', newValues: event, changedBy: user.id });
        return event;
    }
    async findAll(user, query) {
        const { plantId, gateId, eventType, personId, vehicleId, dateFrom, dateTo, limit } = query;
        const where = { companyId: user.companyId, isActive: true };
        if (plantId)
            where.plantId = plantId;
        if (gateId)
            where.gateId = gateId;
        if (eventType)
            where.eventType = eventType;
        if (personId)
            where.personId = personId;
        if (vehicleId)
            where.vehicleId = vehicleId;
        if (dateFrom || dateTo) {
            where.eventTime = {};
            if (dateFrom)
                where.eventTime.gte = new Date(dateFrom);
            if (dateTo)
                where.eventTime.lte = new Date(dateTo);
        }
        return this.prisma.gateEvent.findMany({
            where, include: this.includes(), orderBy: { eventTime: 'desc' },
            take: limit ? parseInt(limit, 10) : 100,
        });
    }
    async findOne(id, user) {
        const event = await this.prisma.gateEvent.findFirst({
            where: { id, companyId: user.companyId },
            include: Object.assign(Object.assign({}, this.includes()), { corrections: { include: this.includes() } }),
        });
        if (!event)
            throw new common_1.NotFoundException('Gate event not found');
        return event;
    }
    async correct(id, dto, user) {
        var _a, _b, _c, _d, _e, _f;
        const original = await this.prisma.gateEvent.findFirst({ where: { id, companyId: user.companyId } });
        if (!original)
            throw new common_1.NotFoundException('Gate event not found');
        const correction = await this.prisma.gateEvent.create({
            data: {
                companyId: user.companyId,
                plantId: original.plantId,
                gateId: original.gateId,
                eventType: dto.eventType,
                referenceType: (_a = dto.referenceType) !== null && _a !== void 0 ? _a : original.referenceType,
                referenceId: (_b = dto.referenceId) !== null && _b !== void 0 ? _b : original.referenceId,
                personId: (_c = dto.personId) !== null && _c !== void 0 ? _c : original.personId,
                personName: (_d = dto.personName) !== null && _d !== void 0 ? _d : original.personName,
                vehicleId: (_e = dto.vehicleId) !== null && _e !== void 0 ? _e : original.vehicleId,
                vehicleNumber: (_f = dto.vehicleNumber) !== null && _f !== void 0 ? _f : original.vehicleNumber,
                eventTime: new Date(),
                securityUserId: user.id,
                source: 'MANUAL',
                remarks: dto.remarks,
                correctionOfEventId: original.id,
                createdBy: user.id, updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'gate_events', recordId: correction.id, action: 'CREATE', newValues: Object.assign({ correctionOf: original.id }, correction), changedBy: user.id });
        return correction;
    }
};
exports.GateEventsService = GateEventsService;
exports.GateEventsService = GateEventsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], GateEventsService);
//# sourceMappingURL=gate-events.service.js.map