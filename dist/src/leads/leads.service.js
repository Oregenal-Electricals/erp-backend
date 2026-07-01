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
exports.LeadsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let LeadsService = class LeadsService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async generateNumber(companyId) {
        const count = await this.prisma.lead.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `LEAD-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    async create(dto, user) {
        const leadNumber = await this.generateNumber(user.companyId);
        const lead = await this.prisma.lead.create({
            data: {
                leadNumber, companyName: dto.companyName, contactPerson: dto.contactPerson,
                phone: dto.phone, email: dto.email, source: dto.source,
                productInterest: dto.productInterest, estimatedValue: dto.estimatedValue,
                currency: dto.currency || 'INR',
                followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : null,
                followUpNotes: dto.followUpNotes, assignedTo: dto.assignedTo, remarks: dto.remarks,
                companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
            },
        });
        await this.audit.log({ tableName: 'leads', recordId: lead.id, action: 'CREATE', newValues: lead, changedBy: user.id });
        return lead;
    }
    async update(id, dto, user) {
        const lead = await this.prisma.lead.findFirst({ where: { id, companyId: user.companyId } });
        if (!lead)
            throw new common_1.NotFoundException('Lead not found');
        if (lead.status === 'CONVERTED')
            throw new common_1.BadRequestException('Cannot edit converted lead');
        const updateData = Object.assign(Object.assign({}, dto), { updatedBy: user.id });
        if (dto.followUpDate)
            updateData.followUpDate = new Date(dto.followUpDate);
        if (dto.status === 'LOST' && !dto.lostReason)
            throw new common_1.BadRequestException('Lost reason required when marking as lost');
        const updated = await this.prisma.lead.update({ where: { id }, data: updateData });
        await this.audit.log({ tableName: 'leads', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async convert(id, user) {
        const lead = await this.prisma.lead.findFirst({ where: { id, companyId: user.companyId } });
        if (!lead)
            throw new common_1.NotFoundException('Lead not found');
        if (lead.status === 'CONVERTED')
            throw new common_1.BadRequestException('Already converted');
        if (lead.status === 'LOST')
            throw new common_1.BadRequestException('Cannot convert lost lead');
        const updated = await this.prisma.lead.update({
            where: { id },
            data: { status: 'CONVERTED', updatedBy: user.id },
        });
        await this.audit.log({ tableName: 'leads', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async findAll(user, query) {
        const { page = 1, limit = 20, search, status, source, assignedTo } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = { companyId: user.companyId };
        if (search)
            where.OR = [
                { leadNumber: { contains: search, mode: 'insensitive' } },
                { companyName: { contains: search, mode: 'insensitive' } },
                { contactPerson: { contains: search, mode: 'insensitive' } },
                { productInterest: { contains: search, mode: 'insensitive' } },
            ];
        if (status)
            where.status = status;
        if (source)
            where.source = source;
        if (assignedTo)
            where.assignedTo = { contains: assignedTo, mode: 'insensitive' };
        const [data, total] = await Promise.all([
            this.prisma.lead.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' } }),
            this.prisma.lead.count({ where }),
        ]);
        return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
    }
    async findOne(id, user) {
        const lead = await this.prisma.lead.findFirst({ where: { id, companyId: user.companyId } });
        if (!lead)
            throw new common_1.NotFoundException('Lead not found');
        return lead;
    }
    async getStats(user) {
        const where = { companyId: user.companyId };
        const [total, newL, contacted, qualified, converted, lost, overdueFollowup] = await Promise.all([
            this.prisma.lead.count({ where }),
            this.prisma.lead.count({ where: Object.assign(Object.assign({}, where), { status: 'NEW' }) }),
            this.prisma.lead.count({ where: Object.assign(Object.assign({}, where), { status: 'CONTACTED' }) }),
            this.prisma.lead.count({ where: Object.assign(Object.assign({}, where), { status: 'QUALIFIED' }) }),
            this.prisma.lead.count({ where: Object.assign(Object.assign({}, where), { status: 'CONVERTED' }) }),
            this.prisma.lead.count({ where: Object.assign(Object.assign({}, where), { status: 'LOST' }) }),
            this.prisma.lead.count({ where: Object.assign(Object.assign({}, where), { status: { notIn: ['CONVERTED', 'LOST'] }, followUpDate: { lt: new Date() } }) }),
        ]);
        const valueAgg = await this.prisma.lead.aggregate({ where: Object.assign(Object.assign({}, where), { status: 'QUALIFIED' }), _sum: { estimatedValue: true } });
        return { total, new: newL, contacted, qualified, converted, lost, overdueFollowup, qualifiedPipelineValue: valueAgg._sum.estimatedValue || 0 };
    }
};
exports.LeadsService = LeadsService;
exports.LeadsService = LeadsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], LeadsService);
//# sourceMappingURL=leads.service.js.map