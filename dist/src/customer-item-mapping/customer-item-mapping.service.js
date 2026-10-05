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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerItemMappingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const workflows_service_1 = require("../workflows/workflows.service");
let CustomerItemMappingService = class CustomerItemMappingService {
    constructor(prisma, audit, workflows) {
        this.prisma = prisma;
        this.audit = audit;
        this.workflows = workflows;
    }
    includes() {
        return {
            customer: { select: { id: true, code: true, name: true } },
            product: { select: { id: true, code: true, name: true } },
        };
    }
    async resolve(customerId, customerItemCode, user) {
        return this.prisma.customerItemMapping.findFirst({
            where: { companyId: user.companyId, customerId, customerItemCode, isActive: true },
            include: this.includes(),
        });
    }
    async createIfMissing(dto, user) {
        const existing = await this.prisma.customerItemMapping.findFirst({
            where: { companyId: user.companyId, customerId: dto.customerId, customerItemCode: dto.customerItemCode },
        });
        if (existing) {
            return this.prisma.customerItemMapping.findFirst({ where: { id: existing.id }, include: this.includes() });
        }
        if (!dto.productId)
            throw new common_1.BadRequestException('productId is required to create a new mapping');
        const customer = await this.prisma.customer.findFirst({ where: { id: dto.customerId, companyId: user.companyId } });
        if (!customer)
            throw new common_1.NotFoundException('Customer not found');
        const product = await this.prisma.product.findFirst({ where: { id: dto.productId, companyId: user.companyId } });
        if (!product)
            throw new common_1.NotFoundException('Product not found');
        const mapping = await this.prisma.customerItemMapping.create({
            data: {
                companyId: user.companyId, customerId: dto.customerId,
                customerItemCode: dto.customerItemCode, customerItemName: dto.customerItemName,
                productId: dto.productId, status: 'ACTIVE',
                createdBy: user.id, updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'customer_item_mappings', recordId: mapping.id, action: 'CREATE', newValues: mapping, changedBy: user.id });
        return mapping;
    }
    async requestChange(id, dto, user) {
        const mapping = await this.prisma.customerItemMapping.findFirst({ where: { id, companyId: user.companyId } });
        if (!mapping)
            throw new common_1.NotFoundException('Mapping not found');
        if (mapping.status === 'PENDING_CHANGE')
            throw new common_1.BadRequestException('A change is already pending approval for this mapping');
        const product = await this.prisma.product.findFirst({ where: { id: dto.productId, companyId: user.companyId } });
        if (!product)
            throw new common_1.NotFoundException('Product not found');
        const updated = await this.prisma.customerItemMapping.update({
            where: { id },
            data: { status: 'PENDING_CHANGE', pendingProductId: dto.productId, updatedBy: user.id },
            include: this.includes(),
        });
        await this.workflows.submit({
            documentType: 'CUSTOMER_ITEM_MAPPING',
            documentId: id,
            documentNumber: `${mapping.customerItemCode} -> ${product.code}`,
            remarks: dto.remarks,
        }, user);
        await this.audit.log({ tableName: 'customer_item_mappings', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async onWorkflowApproved(id, user) {
        const mapping = await this.prisma.customerItemMapping.findFirst({ where: { id } });
        if (!mapping)
            return;
        const updated = await this.prisma.customerItemMapping.update({
            where: { id },
            data: { productId: mapping.pendingProductId, pendingProductId: null, status: 'ACTIVE', updatedBy: user.id },
        });
        await this.audit.log({ tableName: 'customer_item_mappings', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async onWorkflowRejected(id, user) {
        const mapping = await this.prisma.customerItemMapping.findFirst({ where: { id } });
        if (!mapping)
            return;
        const updated = await this.prisma.customerItemMapping.update({
            where: { id },
            data: { pendingProductId: null, status: 'ACTIVE', updatedBy: user.id },
        });
        await this.audit.log({ tableName: 'customer_item_mappings', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async findAll(user, query) {
        const { customerId } = query;
        const where = { companyId: user.companyId, isActive: true };
        if (customerId)
            where.customerId = customerId;
        return this.prisma.customerItemMapping.findMany({ where, include: this.includes(), orderBy: { createdAt: 'desc' } });
    }
    async findOne(id, user) {
        const mapping = await this.prisma.customerItemMapping.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
        if (!mapping)
            throw new common_1.NotFoundException('Mapping not found');
        return mapping;
    }
};
exports.CustomerItemMappingService = CustomerItemMappingService;
exports.CustomerItemMappingService = CustomerItemMappingService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => workflows_service_1.WorkflowsService))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        workflows_service_1.WorkflowsService])
], CustomerItemMappingService);
//# sourceMappingURL=customer-item-mapping.service.js.map