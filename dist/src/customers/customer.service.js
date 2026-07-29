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
exports.CustomerService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let CustomerService = class CustomerService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    includes() {
        return {
            addresses: { where: { isActive: true } },
            contacts: { where: { isActive: true } },
            gstNumbers: { where: { isActive: true } },
        };
    }
    async create(dto, user) {
        var _a, _b, _c;
        const existing = await this.prisma.customer.findFirst({
            where: { companyId: user.companyId, code: dto.code },
        });
        if (existing)
            throw new common_1.BadRequestException(`Customer code ${dto.code} already exists`);
        const customer = await this.prisma.customer.create({
            data: {
                companyId: user.companyId, code: dto.code, name: dto.name,
                email: dto.email, phone: dto.phone,
                createdBy: user.id, updatedBy: user.id,
                addresses: ((_a = dto.addresses) === null || _a === void 0 ? void 0 : _a.length) ? {
                    create: dto.addresses.map(a => ({
                        companyId: user.companyId, addressType: a.addressType || 'DELIVERY',
                        addressLine: a.addressLine, city: a.city, state: a.state, pincode: a.pincode,
                        isDefault: a.isDefault || false, createdBy: user.id, updatedBy: user.id,
                    })),
                } : undefined,
                contacts: ((_b = dto.contacts) === null || _b === void 0 ? void 0 : _b.length) ? {
                    create: dto.contacts.map(c => ({
                        companyId: user.companyId, name: c.name, designation: c.designation,
                        phone: c.phone, email: c.email, isPrimary: c.isPrimary || false,
                        createdBy: user.id, updatedBy: user.id,
                    })),
                } : undefined,
                gstNumbers: ((_c = dto.gstNumbers) === null || _c === void 0 ? void 0 : _c.length) ? {
                    create: dto.gstNumbers.map(g => ({
                        companyId: user.companyId, gstNumber: g.gstNumber, branchLabel: g.branchLabel,
                        createdBy: user.id, updatedBy: user.id,
                    })),
                } : undefined,
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'customers', recordId: customer.id, action: 'CREATE', newValues: customer, changedBy: user.id });
        return customer;
    }
    async findAll(user, query) {
        const { page = 1, limit = 20, search } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = { isActive: true };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (search)
            where.OR = [
                { code: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
            ];
        const [data, total] = await Promise.all([
            this.prisma.customer.findMany({
                where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
                include: { _count: { select: { addresses: true, contacts: true, gstNumbers: true } } },
            }),
            this.prisma.customer.count({ where }),
        ]);
        return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
    }
    async findOne(id, user) {
        const where = { id };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const customer = await this.prisma.customer.findFirst({ where, include: this.includes() });
        if (!customer)
            throw new common_1.NotFoundException('Customer not found');
        return customer;
    }
    async update(id, dto, user) {
        var _a, _b, _c;
        const customer = await this.findOne(id, user);
        await this.prisma.customerAddress.updateMany({ where: { customerId: id }, data: { isActive: false } });
        await this.prisma.customerContact.updateMany({ where: { customerId: id }, data: { isActive: false } });
        await this.prisma.customerGst.updateMany({ where: { customerId: id }, data: { isActive: false } });
        const updated = await this.prisma.customer.update({
            where: { id },
            data: {
                name: dto.name, email: dto.email, phone: dto.phone, updatedBy: user.id,
                addresses: ((_a = dto.addresses) === null || _a === void 0 ? void 0 : _a.length) ? {
                    create: dto.addresses.map(a => ({
                        companyId: user.companyId, addressType: a.addressType || 'DELIVERY',
                        addressLine: a.addressLine, city: a.city, state: a.state, pincode: a.pincode,
                        isDefault: a.isDefault || false, createdBy: user.id, updatedBy: user.id,
                    })),
                } : undefined,
                contacts: ((_b = dto.contacts) === null || _b === void 0 ? void 0 : _b.length) ? {
                    create: dto.contacts.map(c => ({
                        companyId: user.companyId, name: c.name, designation: c.designation,
                        phone: c.phone, email: c.email, isPrimary: c.isPrimary || false,
                        createdBy: user.id, updatedBy: user.id,
                    })),
                } : undefined,
                gstNumbers: ((_c = dto.gstNumbers) === null || _c === void 0 ? void 0 : _c.length) ? {
                    create: dto.gstNumbers.map(g => ({
                        companyId: user.companyId, gstNumber: g.gstNumber, branchLabel: g.branchLabel,
                        createdBy: user.id, updatedBy: user.id,
                    })),
                } : undefined,
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'customers', recordId: id, action: 'UPDATE', oldValues: customer, newValues: updated, changedBy: user.id });
        return updated;
    }
    async remove(id, user) {
        const customer = await this.findOne(id, user);
        const updated = await this.prisma.customer.update({ where: { id }, data: { isActive: false, updatedBy: user.id } });
        await this.audit.log({ tableName: 'customers', recordId: id, action: 'DELETE', oldValues: customer, newValues: updated, changedBy: user.id });
        return { message: 'Customer deactivated' };
    }
    async getStats(user) {
        const where = { isActive: true };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const total = await this.prisma.customer.count({ where });
        return { total };
    }
};
exports.CustomerService = CustomerService;
exports.CustomerService = CustomerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], CustomerService);
//# sourceMappingURL=customer.service.js.map