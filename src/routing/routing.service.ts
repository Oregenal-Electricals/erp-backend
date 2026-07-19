import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { WorkOrderService } from '../work-orders/work-order.service';
import { CreateRoutingDto, StartProductionDto } from './dto/routing.dto';

@Injectable()
export class RoutingService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private workOrderService: WorkOrderService,
  ) {}

  async createRouting(dto: CreateRoutingDto, user: any) {
    if (!dto.stages || dto.stages.length === 0) {
      throw new BadRequestException('A routing needs at least one stage');
    }
    const product = await this.prisma.product.findFirst({
      where: { id: dto.finalProductId, companyId: user.companyId },
    });
    if (!product) throw new NotFoundException('Final product not found');

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

  async findAll(user: any) {
    return this.prisma.productRouting.findMany({
      where: { companyId: user.companyId, isActive: true },
      include: {
        stages: { orderBy: { sequence: 'asc' }, include: { bom: { select: { bomNumber: true } } } },
        finalProduct: { select: { code: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: any) {
    const routing = await this.prisma.productRouting.findFirst({
      where: { id, companyId: user.companyId },
      include: {
        stages: { orderBy: { sequence: 'asc' }, include: { bom: { select: { bomNumber: true } } } },
        finalProduct: { select: { code: true, name: true } },
      },
    });
    if (!routing) throw new NotFoundException('Routing not found');
    return routing;
  }

  async startProduction(dto: StartProductionDto, user: any) {
    const routing = await this.findOne(dto.routingId, user);
    if (routing.stages.length === 0) throw new BadRequestException('This routing has no stages');

    const routingGroupId = `RTG-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const startDate = new Date();
    const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const createdStageWos: any[] = [];
    let previousWoId: string | null = null;

    for (const stage of routing.stages) {
      const bom = await this.prisma.bom.findFirst({ where: { id: stage.bomId, companyId: user.companyId } });
      if (!bom) throw new NotFoundException(`BOM not found for stage ${stage.stageName}`);
      const stageProduct = await this.prisma.product.findFirst({ where: { id: bom.productId, companyId: user.companyId } });
      if (!stageProduct) throw new NotFoundException(`Product not found for stage ${stage.stageName}`);

      const warehouseId = stage.warehouseId || dto.warehouseId;
      const wo = await this.workOrderService.create({
        productCode: stageProduct.code, productName: stageProduct.name,
        uom: 'PCS', bomId: bom.id, warehouseId,
        plannedQty: dto.plannedQty,
        plannedStartDate: startDate.toISOString(), plannedEndDate: endDate.toISOString(),
        priority: 'MEDIUM',
        remarks: `Stage ${stage.sequence} (${stage.stageName}) of routing ${routing.routingName}`,
      } as any, user);

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

  async getChain(routingGroupId: string, user: any) {
    const wos = await this.prisma.workOrder.findMany({
      where: { routingGroupId, companyId: user.companyId },
      orderBy: { stageSequence: 'asc' },
      include: { warehouse: { select: { name: true } }, bom: { select: { bomNumber: true } } },
    });
    if (wos.length === 0) throw new NotFoundException('No production chain found for this group');
    return wos;
  }
}
