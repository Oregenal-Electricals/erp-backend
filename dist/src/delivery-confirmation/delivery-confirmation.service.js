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
exports.DeliveryConfirmationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let DeliveryConfirmationService = class DeliveryConfirmationService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async generateNumber(companyId) {
        const count = await this.prisma.deliveryConfirmation.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `DC-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    includes() {
        return {
            dispatch: {
                select: {
                    dispatchNumber: true, vehicleNumber: true, lrNumber: true,
                    salesOrder: { select: { soNumber: true, customerName: true, cpo: { select: { cpoNumber: true, customerPoNumber: true } } } },
                },
            },
        };
    }
    async create(dto, user) {
        const dispatch = await this.prisma.dispatch.findFirst({
            where: { id: dto.dispatchId, companyId: user.companyId },
            include: { salesOrder: { include: { items: true, cpo: true } } },
        });
        if (!dispatch)
            throw new common_1.NotFoundException('Dispatch not found');
        if (dispatch.status !== 'DISPATCHED')
            throw new common_1.BadRequestException('Dispatch must be in DISPATCHED status');
        const existing = await this.prisma.deliveryConfirmation.findUnique({ where: { dispatchId: dto.dispatchId } });
        if (existing)
            throw new common_1.BadRequestException('Delivery confirmation already exists for this dispatch');
        const dcNumber = await this.generateNumber(user.companyId);
        const dc = await this.prisma.deliveryConfirmation.create({
            data: {
                dcNumber, dispatchId: dto.dispatchId,
                deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : new Date(),
                receiverName: dto.receiverName, receiverPhone: dto.receiverPhone,
                podNumber: dto.podNumber, condition: dto.condition || 'GOOD',
                shortageQty: dto.shortageQty || 0, damageNotes: dto.damageNotes,
                remarks: dto.remarks,
                companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.prisma.dispatch.update({
            where: { id: dto.dispatchId },
            data: { status: 'DELIVERED', updatedBy: user.id },
        });
        const so = dispatch.salesOrder;
        if (so) {
            const allItemsDispatched = so.items.every(i => i.pendingQty <= 0);
            if (allItemsDispatched) {
                await this.prisma.salesOrder.update({
                    where: { id: so.id },
                    data: { status: 'COMPLETED', updatedBy: user.id },
                });
                if (so.cpoId) {
                    const cpoSos = await this.prisma.salesOrder.findMany({
                        where: { cpoId: so.cpoId, companyId: user.companyId },
                    });
                    const allCompleted = cpoSos.every(s => s.status === 'COMPLETED' || s.id === so.id);
                    if (allCompleted) {
                        await this.prisma.customerPo.update({
                            where: { id: so.cpoId },
                            data: { status: 'COMPLETED', updatedBy: user.id },
                        });
                    }
                }
            }
        }
        await this.audit.log({ tableName: 'delivery_confirmations', recordId: dc.id, action: 'CREATE', newValues: dc, changedBy: user.id });
        return dc;
    }
    async findAll(user, query) {
        const { page = 1, limit = 20, search, condition } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = { companyId: user.companyId };
        if (search)
            where.OR = [
                { dcNumber: { contains: search, mode: 'insensitive' } },
                { receiverName: { contains: search, mode: 'insensitive' } },
                { podNumber: { contains: search, mode: 'insensitive' } },
            ];
        if (condition)
            where.condition = condition;
        const [data, total] = await Promise.all([
            this.prisma.deliveryConfirmation.findMany({
                where, skip, take: Number(limit), orderBy: { deliveryDate: 'desc' },
                include: { dispatch: { select: { dispatchNumber: true, vehicleNumber: true, salesOrder: { select: { soNumber: true, customerName: true } } } } },
            }),
            this.prisma.deliveryConfirmation.count({ where }),
        ]);
        return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
    }
    async findOne(id, user) {
        const dc = await this.prisma.deliveryConfirmation.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
        if (!dc)
            throw new common_1.NotFoundException('Delivery confirmation not found');
        return dc;
    }
    async getStats(user) {
        const where = { companyId: user.companyId };
        const [total, good, damaged, partial] = await Promise.all([
            this.prisma.deliveryConfirmation.count({ where }),
            this.prisma.deliveryConfirmation.count({ where: Object.assign(Object.assign({}, where), { condition: 'GOOD' }) }),
            this.prisma.deliveryConfirmation.count({ where: Object.assign(Object.assign({}, where), { condition: 'DAMAGED' }) }),
            this.prisma.deliveryConfirmation.count({ where: Object.assign(Object.assign({}, where), { condition: 'PARTIAL' }) }),
        ]);
        return { total, good, damaged, partial };
    }
};
exports.DeliveryConfirmationService = DeliveryConfirmationService;
exports.DeliveryConfirmationService = DeliveryConfirmationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], DeliveryConfirmationService);
//# sourceMappingURL=delivery-confirmation.service.js.map