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
exports.CustomsEntryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let CustomsEntryService = class CustomsEntryService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async generateBoeNumber(companyId) {
        const count = await this.prisma.customsEntry.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `BOE-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    calcDuty(cifValue, bcdRate, igstRate, aidcAmount = 0) {
        const bcdAmount = cifValue * bcdRate / 100;
        const swsAmount = bcdAmount * 0.10;
        const igstBase = cifValue + bcdAmount + swsAmount + aidcAmount;
        const igstAmount = igstBase * igstRate / 100;
        const totalDuty = bcdAmount + swsAmount + igstAmount + aidcAmount;
        return { bcdAmount, swsAmount, igstAmount, totalDuty };
    }
    includes() {
        return {
            ipo: { select: { ipoNumber: true, currency: true, status: true, vendor: { select: { code: true, name: true } } } },
            shipment: { select: { shipmentNumber: true, shipmentMode: true, portOfDischarge: true } },
        };
    }
    async create(dto, user) {
        const ipo = await this.prisma.importPurchaseOrder.findFirst({ where: { id: dto.ipoId, companyId: user.companyId } });
        if (!ipo)
            throw new common_1.NotFoundException('Import PO not found');
        const boeNumber = await this.generateBoeNumber(user.companyId);
        const bcdRate = dto.bcdRate || 0;
        const igstRate = dto.igstRate || 0;
        const aidcAmount = dto.aidcAmount || 0;
        const { bcdAmount, swsAmount, igstAmount, totalDuty } = this.calcDuty(dto.cifValue, bcdRate, igstRate, aidcAmount);
        const entry = await this.prisma.customsEntry.create({
            data: Object.assign(Object.assign({}, dto), { boeNumber,
                bcdRate, bcdAmount, swsAmount, igstRate, igstAmount, aidcAmount, totalDuty, companyId: user.companyId, createdBy: user.id, updatedBy: user.id }),
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'customs_entries', recordId: entry.id, action: 'CREATE', newValues: entry, changedBy: user.id });
        return entry;
    }
    async findAll(user, query) {
        const { page = 1, limit = 20, search, status } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (search)
            where.OR = [
                { boeNumber: { contains: search, mode: 'insensitive' } },
                { customsBoeNumber: { contains: search, mode: 'insensitive' } },
                { chaName: { contains: search, mode: 'insensitive' } },
            ];
        if (status)
            where.status = status;
        const [data, total] = await Promise.all([
            this.prisma.customsEntry.findMany({
                where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
                include: this.includes(),
            }),
            this.prisma.customsEntry.count({ where }),
        ]);
        return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
    }
    async findOne(id, user) {
        const where = { id };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const entry = await this.prisma.customsEntry.findFirst({ where, include: this.includes() });
        if (!entry)
            throw new common_1.NotFoundException('Customs entry not found');
        return entry;
    }
    async findByIpo(ipoId, user) {
        const where = { ipoId };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        return this.prisma.customsEntry.findMany({ where, orderBy: { createdAt: 'desc' }, include: this.includes() });
    }
    async update(id, dto, user) {
        var _a, _b, _c, _d, _e;
        const entry = await this.findOne(id, user);
        if (['OUT_OF_CHARGE', 'CANCELLED'].includes(entry.status))
            throw new common_1.BadRequestException('Cannot edit cleared or cancelled entry');
        const cifValue = (_a = dto.cifValue) !== null && _a !== void 0 ? _a : entry.cifValue;
        const bcdRate = (_b = dto.bcdRate) !== null && _b !== void 0 ? _b : entry.bcdRate;
        const igstRate = (_c = dto.igstRate) !== null && _c !== void 0 ? _c : entry.igstRate;
        const aidcAmount = (_e = (_d = dto.aidcAmount) !== null && _d !== void 0 ? _d : entry.aidcAmount) !== null && _e !== void 0 ? _e : 0;
        const { bcdAmount, swsAmount, igstAmount, totalDuty } = this.calcDuty(cifValue, bcdRate, igstRate, aidcAmount);
        const updated = await this.prisma.customsEntry.update({
            where: { id },
            data: Object.assign(Object.assign({}, dto), { bcdAmount, swsAmount, igstAmount, totalDuty, updatedBy: user.id }),
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'customs_entries', recordId: id, action: 'UPDATE', oldValues: entry, newValues: updated, changedBy: user.id });
        return updated;
    }
    async file(id, user) {
        const entry = await this.findOne(id, user);
        if (entry.status !== 'DRAFT')
            throw new common_1.BadRequestException('Only DRAFT entries can be filed');
        const updated = await this.prisma.customsEntry.update({
            where: { id }, data: { status: 'FILED', updatedBy: user.id }, include: this.includes(),
        });
        await this.audit.log({ tableName: 'customs_entries', recordId: id, action: 'UPDATE', oldValues: entry, newValues: updated, changedBy: user.id });
        return updated;
    }
    async assess(id, dto, user) {
        const entry = await this.findOne(id, user);
        if (entry.status !== 'FILED')
            throw new common_1.BadRequestException('Only FILED entries can be assessed');
        const { bcdAmount, swsAmount, igstAmount, totalDuty } = this.calcDuty(dto.cifValue, dto.bcdRate, dto.igstRate, dto.aidcAmount || 0);
        const updated = await this.prisma.customsEntry.update({
            where: { id },
            data: {
                status: 'ASSESSED',
                cifValue: dto.cifValue, bcdRate: dto.bcdRate, igstRate: dto.igstRate,
                bcdAmount, swsAmount, igstAmount, aidcAmount: dto.aidcAmount || 0, totalDuty,
                customsBoeNumber: dto.customsBoeNumber,
                updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'customs_entries', recordId: id, action: 'UPDATE', oldValues: entry, newValues: updated, changedBy: user.id });
        return updated;
    }
    async payDuty(id, user) {
        const entry = await this.findOne(id, user);
        if (entry.status !== 'ASSESSED')
            throw new common_1.BadRequestException('Only ASSESSED entries can have duty paid');
        const updated = await this.prisma.customsEntry.update({
            where: { id }, data: { status: 'DUTY_PAID', dutyPaidDate: new Date(), updatedBy: user.id }, include: this.includes(),
        });
        await this.audit.log({ tableName: 'customs_entries', recordId: id, action: 'UPDATE', oldValues: entry, newValues: updated, changedBy: user.id });
        return updated;
    }
    async outOfCharge(id, user) {
        const entry = await this.findOne(id, user);
        if (entry.status !== 'DUTY_PAID')
            throw new common_1.BadRequestException('Only DUTY_PAID entries can be cleared');
        const updated = await this.prisma.customsEntry.update({
            where: { id }, data: { status: 'OUT_OF_CHARGE', outOfChargeDate: new Date(), updatedBy: user.id }, include: this.includes(),
        });
        await this.prisma.importPurchaseOrder.update({
            where: { id: entry.ipoId }, data: { status: 'CUSTOMS_CLEARED', updatedBy: user.id },
        });
        await this.audit.log({ tableName: 'customs_entries', recordId: id, action: 'UPDATE', oldValues: entry, newValues: updated, changedBy: user.id });
        return updated;
    }
    async getStats(user) {
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const [total, draft, filed, assessed, dutyPaid, cleared] = await Promise.all([
            this.prisma.customsEntry.count({ where }),
            this.prisma.customsEntry.count({ where: Object.assign(Object.assign({}, where), { status: 'DRAFT' }) }),
            this.prisma.customsEntry.count({ where: Object.assign(Object.assign({}, where), { status: 'FILED' }) }),
            this.prisma.customsEntry.count({ where: Object.assign(Object.assign({}, where), { status: 'ASSESSED' }) }),
            this.prisma.customsEntry.count({ where: Object.assign(Object.assign({}, where), { status: 'DUTY_PAID' }) }),
            this.prisma.customsEntry.count({ where: Object.assign(Object.assign({}, where), { status: 'OUT_OF_CHARGE' }) }),
        ]);
        const totalDuty = await this.prisma.customsEntry.aggregate({ where, _sum: { totalDuty: true } });
        return { total, draft, filed, assessed, dutyPaid, cleared, totalDutyPaid: totalDuty._sum.totalDuty || 0 };
    }
};
exports.CustomsEntryService = CustomsEntryService;
exports.CustomsEntryService = CustomsEntryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], CustomsEntryService);
//# sourceMappingURL=customs-entry.service.js.map