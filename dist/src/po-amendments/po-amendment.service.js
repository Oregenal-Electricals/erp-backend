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
exports.PoAmendmentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let PoAmendmentService = class PoAmendmentService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async generateAmendmentNumber(poId, companyId) {
        const po = await this.prisma.purchaseOrder.findUnique({ where: { id: poId } });
        const count = await this.prisma.poAmendment.count({ where: { poId, companyId } });
        return `${po === null || po === void 0 ? void 0 : po.poNumber}/AMD-${String(count + 1).padStart(3, '0')}`;
    }
    async create(dto, user) {
        const po = await this.prisma.purchaseOrder.findFirst({
            where: { id: dto.poId, companyId: user.companyId },
            include: { items: { where: { isActive: true } } },
        });
        if (!po)
            throw new common_1.NotFoundException('Purchase Order not found');
        if (!['APPROVED', 'SENT', 'PARTIALLY_RECEIVED'].includes(po.status)) {
            throw new common_1.BadRequestException('Only APPROVED, SENT or PARTIALLY_RECEIVED POs can be amended');
        }
        const amendmentNumber = await this.generateAmendmentNumber(dto.poId, user.companyId);
        const currentSnapshot = {
            poNumber: po.poNumber,
            status: po.status,
            totalAmount: po.totalAmount,
            deliveryDate: po.deliveryDate,
            items: po.items.map(i => ({
                id: i.id, itemCode: i.itemCode, itemName: i.itemName,
                orderedQty: i.orderedQty, unitPrice: i.unitPrice, totalPrice: i.totalPrice,
            })),
        };
        const amendment = await this.prisma.poAmendment.create({
            data: {
                poId: dto.poId,
                amendmentNumber,
                amendmentType: dto.amendmentType || 'GENERAL',
                reason: dto.reason,
                requestedBy: user.id,
                changes: dto.changes || currentSnapshot,
                companyId: user.companyId,
                createdBy: user.id,
                updatedBy: user.id,
            },
            include: {
                po: { select: { poNumber: true, status: true, totalAmount: true, vendor: { select: { code: true, name: true } } } },
            },
        });
        await this.audit.log({ tableName: 'po_amendments', recordId: amendment.id, action: 'CREATE', newValues: amendment, changedBy: user.id });
        return amendment;
    }
    async findAll(user, query) {
        const { page = 1, limit = 20, search, status } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (search)
            where.OR = [
                { amendmentNumber: { contains: search, mode: 'insensitive' } },
                { reason: { contains: search, mode: 'insensitive' } },
            ];
        if (status)
            where.status = status;
        const [data, total] = await Promise.all([
            this.prisma.poAmendment.findMany({
                where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
                include: { po: { select: { poNumber: true, vendor: { select: { code: true, name: true } } } } },
            }),
            this.prisma.poAmendment.count({ where }),
        ]);
        return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
    }
    async findOne(id, user) {
        const where = { id };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const amd = await this.prisma.poAmendment.findFirst({
            where,
            include: { po: { select: { poNumber: true, status: true, totalAmount: true, vendor: { select: { code: true, name: true } } } } },
        });
        if (!amd)
            throw new common_1.NotFoundException('PO Amendment not found');
        return amd;
    }
    async findByPo(poId, user) {
        const where = { poId };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        return this.prisma.poAmendment.findMany({
            where, orderBy: { createdAt: 'desc' },
            include: { po: { select: { poNumber: true } } },
        });
    }
    async submit(id, user) {
        const amd = await this.findOne(id, user);
        if (amd.status !== 'DRAFT')
            throw new common_1.BadRequestException('Only DRAFT amendments can be submitted');
        const updated = await this.prisma.poAmendment.update({
            where: { id }, data: { status: 'SUBMITTED', updatedBy: user.id },
            include: { po: { select: { poNumber: true, vendor: { select: { name: true } } } } },
        });
        await this.audit.log({ tableName: 'po_amendments', recordId: id, action: 'UPDATE', oldValues: amd, newValues: updated, changedBy: user.id });
        return updated;
    }
    async approve(id, user) {
        const amd = await this.findOne(id, user);
        if (amd.status !== 'SUBMITTED')
            throw new common_1.BadRequestException('Only SUBMITTED amendments can be approved');
        const updated = await this.prisma.poAmendment.update({
            where: { id },
            data: { status: 'APPROVED', approvedBy: user.id, approvedAt: new Date(), updatedBy: user.id },
            include: { po: { select: { poNumber: true, vendor: { select: { name: true } } } } },
        });
        await this.audit.log({ tableName: 'po_amendments', recordId: id, action: 'UPDATE', oldValues: amd, newValues: updated, changedBy: user.id });
        return updated;
    }
    async reject(id, dto, user) {
        const amd = await this.findOne(id, user);
        if (amd.status !== 'SUBMITTED')
            throw new common_1.BadRequestException('Only SUBMITTED amendments can be rejected');
        const updated = await this.prisma.poAmendment.update({
            where: { id },
            data: { status: 'REJECTED', rejectedBy: user.id, rejectionReason: dto.rejectionReason, updatedBy: user.id },
            include: { po: { select: { poNumber: true } } },
        });
        await this.audit.log({ tableName: 'po_amendments', recordId: id, action: 'UPDATE', oldValues: amd, newValues: updated, changedBy: user.id });
        return updated;
    }
    async getStats(user) {
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const [total, draft, submitted, approved, rejected] = await Promise.all([
            this.prisma.poAmendment.count({ where }),
            this.prisma.poAmendment.count({ where: Object.assign(Object.assign({}, where), { status: 'DRAFT' }) }),
            this.prisma.poAmendment.count({ where: Object.assign(Object.assign({}, where), { status: 'SUBMITTED' }) }),
            this.prisma.poAmendment.count({ where: Object.assign(Object.assign({}, where), { status: 'APPROVED' }) }),
            this.prisma.poAmendment.count({ where: Object.assign(Object.assign({}, where), { status: 'REJECTED' }) }),
        ]);
        const byType = await this.prisma.poAmendment.groupBy({ by: ['amendmentType'], where, _count: true });
        return { total, draft, submitted, approved, rejected, byType };
    }
};
exports.PoAmendmentService = PoAmendmentService;
exports.PoAmendmentService = PoAmendmentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], PoAmendmentService);
//# sourceMappingURL=po-amendment.service.js.map