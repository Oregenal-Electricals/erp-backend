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
exports.GatePassService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const settings_service_1 = require("../settings/settings.service");
const client_1 = require("@prisma/client");
let GatePassService = class GatePassService {
    constructor(prisma, audit, settings) {
        this.prisma = prisma;
        this.audit = audit;
        this.settings = settings;
    }
    async create(dto, user) {
        var _a;
        const plant = await this.prisma.plant.findUnique({ where: { id: dto.plantId } });
        if (!plant)
            throw new common_1.NotFoundException('Plant not found');
        if (dto.type === 'STAFF_EXIT' && !dto.employeeId) {
            throw new common_1.BadRequestException('Employee ID is required for staff exit pass');
        }
        let passNumber;
        try {
            passNumber = await this.settings.getNextNumber(user.companyId, 'GP');
        }
        catch (_b) {
            const count = await this.prisma.gatePass.count({ where: { companyId: user.companyId } });
            const now = new Date();
            const fy = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
            passNumber = `GP-${String(fy).slice(2)}-${String(fy + 1).slice(2)}-${String(count + 1).padStart(4, '0')}`;
        }
        const pass = await this.prisma.gatePass.create({
            data: {
                passNumber,
                companyId: user.companyId,
                plantId: dto.plantId,
                type: dto.type,
                purpose: dto.purpose,
                carrierName: dto.carrierName,
                carrierMobile: dto.carrierMobile,
                carrierIdProof: dto.carrierIdProof,
                vehicleNumber: dto.vehicleNumber,
                itemDescription: dto.itemDescription,
                quantity: dto.quantity,
                unit: (_a = dto.unit) !== null && _a !== void 0 ? _a : 'NOS',
                estimatedValue: dto.estimatedValue,
                validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
                validTo: dto.validTo ? new Date(dto.validTo) : undefined,
                remarks: dto.remarks,
                employeeId: dto.employeeId,
                exitType: dto.exitType,
                expectedReturnTime: dto.expectedReturnTime ? new Date(dto.expectedReturnTime) : undefined,
                departmentName: dto.departmentName,
                requestedById: user.id,
                createdBy: user.id,
                updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'gate_passes', recordId: pass.id, action: 'CREATE', newValues: { passNumber, type: dto.type }, changedBy: user.id });
        return pass;
    }
    async findAll(user, filters) {
        const where = { companyId: user.companyId };
        if (filters.status)
            where.status = filters.status;
        if (filters.type)
            where.type = filters.type;
        if (filters.plantId)
            where.plantId = filters.plantId;
        if (filters.search) {
            where.OR = [
                { passNumber: { contains: filters.search, mode: 'insensitive' } },
                { carrierName: { contains: filters.search, mode: 'insensitive' } },
                { itemDescription: { contains: filters.search, mode: 'insensitive' } },
                { purpose: { contains: filters.search, mode: 'insensitive' } },
            ];
        }
        return this.prisma.gatePass.findMany({ where, include: this.includes(), orderBy: { createdAt: 'desc' } });
    }
    async findOne(id) {
        const pass = await this.prisma.gatePass.findUnique({ where: { id }, include: this.includes() });
        if (!pass)
            throw new common_1.NotFoundException('Gate pass not found');
        return pass;
    }
    async approve(id, dto, user) {
        const pass = await this.prisma.gatePass.findUnique({ where: { id } });
        if (!pass)
            throw new common_1.NotFoundException('Gate pass not found');
        if (pass.status !== client_1.GatePassStatus.PENDING)
            throw new common_1.BadRequestException('Only PENDING passes can be approved');
        const updated = await this.prisma.gatePass.update({
            where: { id },
            data: { status: client_1.GatePassStatus.APPROVED, authorizedById: user.id, authorizedAt: new Date(), remarks: dto.remarks || pass.remarks, updatedBy: user.id },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'gate_passes', recordId: id, action: 'UPDATE', oldValues: { status: 'PENDING' }, newValues: { status: 'APPROVED' }, changedBy: user.id });
        return updated;
    }
    async issue(id, user) {
        const pass = await this.prisma.gatePass.findUnique({ where: { id } });
        if (!pass)
            throw new common_1.NotFoundException('Gate pass not found');
        if (pass.status !== client_1.GatePassStatus.APPROVED)
            throw new common_1.BadRequestException('Only APPROVED passes can be issued');
        const updated = await this.prisma.gatePass.update({
            where: { id },
            data: { status: client_1.GatePassStatus.ISSUED, issuedById: user.id, issuedAt: new Date(), updatedBy: user.id },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'gate_passes', recordId: id, action: 'UPDATE', oldValues: { status: 'APPROVED' }, newValues: { status: 'ISSUED' }, changedBy: user.id });
        return updated;
    }
    async markReturned(id, dto, user) {
        const pass = await this.prisma.gatePass.findUnique({ where: { id } });
        if (!pass)
            throw new common_1.NotFoundException('Gate pass not found');
        if (pass.status !== client_1.GatePassStatus.ISSUED)
            throw new common_1.BadRequestException('Only ISSUED passes can be marked returned');
        if (!['RETURNABLE', 'STAFF_EXIT'].includes(pass.type))
            throw new common_1.BadRequestException('Only RETURNABLE or STAFF_EXIT passes can be marked returned');
        const updated = await this.prisma.gatePass.update({
            where: { id },
            data: {
                status: client_1.GatePassStatus.RETURNED,
                returnedAt: new Date(),
                actualReturnTime: new Date(),
                remarks: dto.remarks || pass.remarks,
                updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'gate_passes', recordId: id, action: 'UPDATE', oldValues: { status: 'ISSUED' }, newValues: { status: 'RETURNED' }, changedBy: user.id });
        return updated;
    }
    async close(id, user) {
        const pass = await this.prisma.gatePass.findUnique({ where: { id } });
        if (!pass)
            throw new common_1.NotFoundException('Gate pass not found');
        if (!['ISSUED', 'RETURNED'].includes(pass.status))
            throw new common_1.BadRequestException('Only ISSUED or RETURNED passes can be closed');
        const updated = await this.prisma.gatePass.update({
            where: { id },
            data: { status: client_1.GatePassStatus.CLOSED, closedById: user.id, closedAt: new Date(), updatedBy: user.id },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'gate_passes', recordId: id, action: 'UPDATE', oldValues: { status: pass.status }, newValues: { status: 'CLOSED' }, changedBy: user.id });
        return updated;
    }
    async cancel(id, dto, user) {
        const pass = await this.prisma.gatePass.findUnique({ where: { id } });
        if (!pass)
            throw new common_1.NotFoundException('Gate pass not found');
        if (['ISSUED', 'CLOSED', 'CANCELLED'].includes(pass.status))
            throw new common_1.BadRequestException(`Cannot cancel a ${pass.status} pass`);
        const updated = await this.prisma.gatePass.update({
            where: { id },
            data: { status: client_1.GatePassStatus.CANCELLED, cancelReason: dto.cancelReason, updatedBy: user.id },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'gate_passes', recordId: id, action: 'UPDATE', oldValues: { status: pass.status }, newValues: { status: 'CANCELLED' }, changedBy: user.id });
        return updated;
    }
    async getStats(user) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const base = { companyId: user.companyId };
        const [total, pending, approved, issued, returned, closed, cancelled, returnable, nonReturnable, staffExit] = await Promise.all([
            this.prisma.gatePass.count({ where: base }),
            this.prisma.gatePass.count({ where: Object.assign(Object.assign({}, base), { status: 'PENDING' }) }),
            this.prisma.gatePass.count({ where: Object.assign(Object.assign({}, base), { status: 'APPROVED' }) }),
            this.prisma.gatePass.count({ where: Object.assign(Object.assign({}, base), { status: 'ISSUED' }) }),
            this.prisma.gatePass.count({ where: Object.assign(Object.assign({}, base), { status: 'RETURNED' }) }),
            this.prisma.gatePass.count({ where: Object.assign(Object.assign({}, base), { status: 'CLOSED' }) }),
            this.prisma.gatePass.count({ where: Object.assign(Object.assign({}, base), { status: 'CANCELLED' }) }),
            this.prisma.gatePass.count({ where: Object.assign(Object.assign({}, base), { type: 'RETURNABLE' }) }),
            this.prisma.gatePass.count({ where: Object.assign(Object.assign({}, base), { type: 'NON_RETURNABLE' }) }),
            this.prisma.gatePass.count({ where: Object.assign(Object.assign({}, base), { type: 'STAFF_EXIT' }) }),
        ]);
        return { total, pending, approved, issued, returned, closed, cancelled, returnable, nonReturnable, staffExit };
    }
    includes() {
        return {
            plant: { select: { id: true, name: true, code: true } },
            requestedBy: { select: { id: true, firstName: true, lastName: true } },
            authorizedBy: { select: { id: true, firstName: true, lastName: true } },
            issuedBy: { select: { id: true, firstName: true, lastName: true } },
            closedBy: { select: { id: true, firstName: true, lastName: true } },
            employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true, role: true } },
        };
    }
};
exports.GatePassService = GatePassService;
exports.GatePassService = GatePassService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        settings_service_1.SettingsService])
], GatePassService);
//# sourceMappingURL=gate-pass.service.js.map