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
exports.RoutingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const work_order_service_1 = require("../work-orders/work-order.service");
let RoutingService = class RoutingService {
    constructor(prisma, audit, workOrderService) {
        this.prisma = prisma;
        this.audit = audit;
        this.workOrderService = workOrderService;
    }
    async createRouting(dto, user) {
        if (!dto.stages || dto.stages.length === 0) {
            throw new common_1.BadRequestException('A routing needs at least one stage');
        }
        const product = await this.prisma.product.findFirst({
            where: { id: dto.finalProductId, companyId: user.companyId },
        });
        if (!product)
            throw new common_1.NotFoundException('Final product not found');
        const routing = await this.prisma.productRouting.create({
            data: {
                companyId: user.companyId, finalProductId: dto.finalProductId,
                routingName: dto.routingName, createdBy: user.id, updatedBy: user.id,
                stages: {
                    create: dto.stages.map((s, i) => ({
                        companyId: user.companyId, sequence: i + 1,
                        stageName: s.stageName, bomId: s.bomId, warehouseId: s.warehouseId,
                        createdBy: user.id, updatedBy: user.id,
                    })),
                },
            },
            include: { stages: { orderBy: { sequence: 'asc' } }, finalProduct: { select: { code: true, name: true } } },
        });
        await this.audit.log({ tableName: 'product_routings', recordId: routing.id, action: 'CREATE', newValues: routing, changedBy: user.id });
        return routing;
    }
    async findAll(user) {
        return this.prisma.productRouting.findMany({
            where: { companyId: user.companyId, isActive: true },
            include: {
                stages: { orderBy: { sequence: 'asc' }, include: { bom: { select: { bomNumber: true } } } },
                finalProduct: { select: { code: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id, user) {
        const routing = await this.prisma.productRouting.findFirst({
            where: { id, companyId: user.companyId },
            include: {
                stages: { orderBy: { sequence: 'asc' }, include: { bom: { select: { bomNumber: true } } } },
                finalProduct: { select: { code: true, name: true } },
            },
        });
        if (!routing)
            throw new common_1.NotFoundException('Routing not found');
        return routing;
    }
    async startProduction(dto, user) {
        const routing = await this.findOne(dto.routingId, user);
        if (routing.stages.length === 0)
            throw new common_1.BadRequestException('This routing has no stages');
        const routingGroupId = `RTG-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const startDate = new Date();
        const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const createdStageWos = [];
        let previousWoId = null;
        for (const stage of routing.stages) {
            const bom = await this.prisma.bom.findFirst({ where: { id: stage.bomId, companyId: user.companyId } });
            if (!bom)
                throw new common_1.NotFoundException(`BOM not found for stage ${stage.stageName}`);
            const stageProduct = await this.prisma.product.findFirst({ where: { id: bom.productId, companyId: user.companyId } });
            if (!stageProduct)
                throw new common_1.NotFoundException(`Product not found for stage ${stage.stageName}`);
            const warehouseId = stage.warehouseId || dto.warehouseId;
            const wo = await this.workOrderService.create({
                productCode: stageProduct.code, productName: stageProduct.name,
                uom: 'PCS', bomId: bom.id, warehouseId,
                plannedQty: dto.plannedQty,
                plannedStartDate: startDate.toISOString(), plannedEndDate: endDate.toISOString(),
                priority: 'MEDIUM',
                remarks: `Stage ${stage.sequence} (${stage.stageName}) of routing ${routing.routingName}`,
            }, user);
            await this.prisma.workOrder.update({
                where: { id: wo.id },
                data: { routingGroupId, stageSequence: stage.sequence, parentWorkOrderId: previousWoId },
            });
            if (stage.sequence === 1) {
                await this.workOrderService.release(wo.id, user);
            }
            createdStageWos.push({ woId: wo.id, woNumber: wo.woNumber, stageName: stage.stageName, sequence: stage.sequence });
            previousWoId = wo.id;
        }
        await this.audit.log({
            tableName: 'work_orders', recordId: routingGroupId, action: 'CREATE',
            newValues: { routingGroupId, stages: createdStageWos }, changedBy: user.id,
        });
        return { routingGroupId, stages: createdStageWos };
    }
    async getChain(routingGroupId, user) {
        const wos = await this.prisma.workOrder.findMany({
            where: { routingGroupId, companyId: user.companyId },
            orderBy: { stageSequence: 'asc' },
            include: { warehouse: { select: { name: true } }, bom: { select: { bomNumber: true } } },
        });
        if (wos.length === 0)
            throw new common_1.NotFoundException('No production chain found for this group');
        return wos;
    }
};
exports.RoutingService = RoutingService;
exports.RoutingService = RoutingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        work_order_service_1.WorkOrderService])
], RoutingService);
//# sourceMappingURL=routing.service.js.map