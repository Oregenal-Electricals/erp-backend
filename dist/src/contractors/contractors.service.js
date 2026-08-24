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
exports.ContractorsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let ContractorsService = class ContractorsService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async create(dto, user) {
        const contractor = await this.prisma.contractor.create({
            data: Object.assign(Object.assign({}, dto), { companyId: user.companyId, createdBy: user.id, updatedBy: user.id }),
        });
        await this.audit.log({ tableName: 'contractors', recordId: contractor.id, action: 'CREATE', newValues: contractor, changedBy: user.id });
        return contractor;
    }
    async findAll(user, query) {
        const { search } = query;
        const where = { companyId: user.companyId, isActive: true };
        if (search)
            where.name = { contains: search, mode: 'insensitive' };
        return this.prisma.contractor.findMany({
            where, orderBy: { name: 'asc' },
            include: { _count: { select: { employees: true } } },
        });
    }
    async findOne(id, user) {
        const contractor = await this.prisma.contractor.findFirst({
            where: { id, companyId: user.companyId },
            include: { employees: { where: { isActive: true }, select: { id: true, employeeNumber: true, firstName: true, lastName: true, hourlyRate: true } } },
        });
        if (!contractor)
            throw new common_1.NotFoundException('Contractor not found');
        return contractor;
    }
    async update(id, dto, user) {
        const contractor = await this.prisma.contractor.findFirst({ where: { id, companyId: user.companyId } });
        if (!contractor)
            throw new common_1.NotFoundException('Contractor not found');
        const updated = await this.prisma.contractor.update({ where: { id }, data: Object.assign(Object.assign({}, dto), { updatedBy: user.id }) });
        await this.audit.log({ tableName: 'contractors', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async remove(id, user) {
        const contractor = await this.prisma.contractor.findFirst({ where: { id, companyId: user.companyId }, include: { _count: { select: { employees: true } } } });
        if (!contractor)
            throw new common_1.NotFoundException('Contractor not found');
        if (contractor._count.employees > 0) {
            throw new common_1.BadRequestException(`Cannot remove ${contractor.name} - ${contractor._count.employees} employee(s) are still linked to this contractor`);
        }
        await this.prisma.contractor.update({ where: { id }, data: { isActive: false, updatedBy: user.id } });
        await this.audit.log({ tableName: 'contractors', recordId: id, action: 'DELETE', newValues: {}, changedBy: user.id });
        return { success: true };
    }
};
exports.ContractorsService = ContractorsService;
exports.ContractorsService = ContractorsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], ContractorsService);
//# sourceMappingURL=contractors.service.js.map