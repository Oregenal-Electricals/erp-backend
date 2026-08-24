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
exports.GateMastersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let GateMastersService = class GateMastersService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
        this.VALID_MAPS_TO = ['RETURNABLE', 'NON_RETURNABLE', 'STAFF_EXIT'];
    }
    async createGateType(dto, user) {
        const gt = await this.prisma.gateType.create({ data: Object.assign(Object.assign({}, dto), { companyId: user.companyId, createdBy: user.id, updatedBy: user.id }) });
        await this.audit.log({ tableName: 'gate_types', recordId: gt.id, action: 'CREATE', newValues: gt, changedBy: user.id });
        return gt;
    }
    findAllGateTypes(user) {
        return this.prisma.gateType.findMany({ where: { companyId: user.companyId, isActive: true }, orderBy: { name: 'asc' } });
    }
    async updateGateType(id, dto, user) {
        const gt = await this.prisma.gateType.findFirst({ where: { id, companyId: user.companyId } });
        if (!gt)
            throw new common_1.NotFoundException('Gate type not found');
        const updated = await this.prisma.gateType.update({ where: { id }, data: Object.assign(Object.assign({}, dto), { updatedBy: user.id }) });
        await this.audit.log({ tableName: 'gate_types', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async createGate(dto, user) {
        const plant = await this.prisma.plant.findFirst({ where: { id: dto.plantId, companyId: user.companyId } });
        if (!plant)
            throw new common_1.NotFoundException('Plant not found');
        const gate = await this.prisma.gate.create({ data: Object.assign(Object.assign({}, dto), { companyId: user.companyId, createdBy: user.id, updatedBy: user.id }) });
        await this.audit.log({ tableName: 'gates', recordId: gate.id, action: 'CREATE', newValues: gate, changedBy: user.id });
        return gate;
    }
    findAllGates(user, plantId) {
        const where = { companyId: user.companyId, isActive: true };
        if (plantId)
            where.plantId = plantId;
        return this.prisma.gate.findMany({ where, include: { gateType: true, plant: { select: { id: true, name: true, code: true } } }, orderBy: { name: 'asc' } });
    }
    async updateGate(id, dto, user) {
        const gate = await this.prisma.gate.findFirst({ where: { id, companyId: user.companyId } });
        if (!gate)
            throw new common_1.NotFoundException('Gate not found');
        const updated = await this.prisma.gate.update({ where: { id }, data: Object.assign(Object.assign({}, dto), { updatedBy: user.id }) });
        await this.audit.log({ tableName: 'gates', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async createParkingArea(dto, user) {
        const plant = await this.prisma.plant.findFirst({ where: { id: dto.plantId, companyId: user.companyId } });
        if (!plant)
            throw new common_1.NotFoundException('Plant not found');
        const area = await this.prisma.parkingArea.create({ data: Object.assign(Object.assign({}, dto), { companyId: user.companyId, createdBy: user.id, updatedBy: user.id }) });
        await this.audit.log({ tableName: 'parking_areas', recordId: area.id, action: 'CREATE', newValues: area, changedBy: user.id });
        return area;
    }
    async findAllParkingAreas(user, plantId) {
        const where = { companyId: user.companyId, isActive: true };
        if (plantId)
            where.plantId = plantId;
        const areas = await this.prisma.parkingArea.findMany({
            where, orderBy: { name: 'asc' },
            include: { _count: { select: { slots: { where: { isActive: true } } } }, slots: { where: { isActive: true }, select: { isOccupied: true } } },
        });
        return areas.map(a => (Object.assign(Object.assign({}, a), { occupiedSlots: a.slots.filter(s => s.isOccupied).length, totalActiveSlots: a.slots.length, slots: undefined })));
    }
    async updateParkingArea(id, dto, user) {
        const area = await this.prisma.parkingArea.findFirst({ where: { id, companyId: user.companyId } });
        if (!area)
            throw new common_1.NotFoundException('Parking area not found');
        const updated = await this.prisma.parkingArea.update({ where: { id }, data: Object.assign(Object.assign({}, dto), { updatedBy: user.id }) });
        await this.audit.log({ tableName: 'parking_areas', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async createParkingSlot(dto, user) {
        const area = await this.prisma.parkingArea.findFirst({ where: { id: dto.parkingAreaId, companyId: user.companyId } });
        if (!area)
            throw new common_1.NotFoundException('Parking area not found');
        const slot = await this.prisma.parkingSlot.create({ data: Object.assign(Object.assign({}, dto), { companyId: user.companyId, createdBy: user.id, updatedBy: user.id }) });
        await this.audit.log({ tableName: 'parking_slots', recordId: slot.id, action: 'CREATE', newValues: slot, changedBy: user.id });
        return slot;
    }
    findAllParkingSlots(user, parkingAreaId) {
        const where = { companyId: user.companyId, isActive: true };
        if (parkingAreaId)
            where.parkingAreaId = parkingAreaId;
        return this.prisma.parkingSlot.findMany({
            where, orderBy: { slotCode: 'asc' },
            include: { currentVehicleLog: { select: { id: true, vehicle: { select: { vehicleNumber: true } }, driverName: true, entryTime: true } } },
        });
    }
    async updateParkingSlot(id, dto, user) {
        const slot = await this.prisma.parkingSlot.findFirst({ where: { id, companyId: user.companyId } });
        if (!slot)
            throw new common_1.NotFoundException('Parking slot not found');
        const updated = await this.prisma.parkingSlot.update({ where: { id }, data: Object.assign(Object.assign({}, dto), { updatedBy: user.id }) });
        await this.audit.log({ tableName: 'parking_slots', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async createVisitPurpose(dto, user) {
        const vp = await this.prisma.visitPurpose.create({ data: Object.assign(Object.assign({}, dto), { companyId: user.companyId, createdBy: user.id, updatedBy: user.id }) });
        await this.audit.log({ tableName: 'visit_purposes', recordId: vp.id, action: 'CREATE', newValues: vp, changedBy: user.id });
        return vp;
    }
    findAllVisitPurposes(user) {
        return this.prisma.visitPurpose.findMany({ where: { companyId: user.companyId, isActive: true }, orderBy: { name: 'asc' } });
    }
    async updateVisitPurpose(id, dto, user) {
        const vp = await this.prisma.visitPurpose.findFirst({ where: { id, companyId: user.companyId } });
        if (!vp)
            throw new common_1.NotFoundException('Visit purpose not found');
        const updated = await this.prisma.visitPurpose.update({ where: { id }, data: Object.assign(Object.assign({}, dto), { updatedBy: user.id }) });
        await this.audit.log({ tableName: 'visit_purposes', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async createGatePassTypeMaster(dto, user) {
        if (!this.VALID_MAPS_TO.includes(dto.mapsToType)) {
            throw new common_1.BadRequestException(`mapsToType must be one of ${this.VALID_MAPS_TO.join(', ')}`);
        }
        const t = await this.prisma.gatePassTypeMaster.create({ data: Object.assign(Object.assign({}, dto), { companyId: user.companyId, createdBy: user.id, updatedBy: user.id }) });
        await this.audit.log({ tableName: 'gate_pass_type_masters', recordId: t.id, action: 'CREATE', newValues: t, changedBy: user.id });
        return t;
    }
    findAllGatePassTypeMasters(user) {
        return this.prisma.gatePassTypeMaster.findMany({ where: { companyId: user.companyId, isActive: true }, orderBy: { name: 'asc' } });
    }
    async updateGatePassTypeMaster(id, dto, user) {
        if (dto.mapsToType && !this.VALID_MAPS_TO.includes(dto.mapsToType)) {
            throw new common_1.BadRequestException(`mapsToType must be one of ${this.VALID_MAPS_TO.join(', ')}`);
        }
        const t = await this.prisma.gatePassTypeMaster.findFirst({ where: { id, companyId: user.companyId } });
        if (!t)
            throw new common_1.NotFoundException('Gate pass type not found');
        const updated = await this.prisma.gatePassTypeMaster.update({ where: { id }, data: Object.assign(Object.assign({}, dto), { updatedBy: user.id }) });
        await this.audit.log({ tableName: 'gate_pass_type_masters', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async createSecurityReason(dto, user) {
        const sr = await this.prisma.securityReason.create({ data: Object.assign(Object.assign({}, dto), { companyId: user.companyId, createdBy: user.id, updatedBy: user.id }) });
        await this.audit.log({ tableName: 'security_reasons', recordId: sr.id, action: 'CREATE', newValues: sr, changedBy: user.id });
        return sr;
    }
    findAllSecurityReasons(user) {
        return this.prisma.securityReason.findMany({ where: { companyId: user.companyId, isActive: true }, orderBy: { name: 'asc' } });
    }
    async updateSecurityReason(id, dto, user) {
        const sr = await this.prisma.securityReason.findFirst({ where: { id, companyId: user.companyId } });
        if (!sr)
            throw new common_1.NotFoundException('Security reason not found');
        const updated = await this.prisma.securityReason.update({ where: { id }, data: Object.assign(Object.assign({}, dto), { updatedBy: user.id }) });
        await this.audit.log({ tableName: 'security_reasons', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
};
exports.GateMastersService = GateMastersService;
exports.GateMastersService = GateMastersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], GateMastersService);
//# sourceMappingURL=gate-masters.service.js.map