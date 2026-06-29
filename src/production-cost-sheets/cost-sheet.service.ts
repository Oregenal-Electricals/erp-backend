import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { UpdateCostSheetDto } from './dto/cost-sheet.dto';

@Injectable()
export class CostSheetService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private async generateNumber(companyId: string): Promise<string> {
    const count = await this.prisma.productionCostSheet.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `PCS-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  async generateFromWo(workOrderId: string, user: any) {
    const companyId = user.companyId;

    const wo = await this.prisma.workOrder.findFirst({
      where: { id: workOrderId, companyId },
    });
    if (!wo) throw new NotFoundException('Work order not found');
    if (!['IN_PROGRESS','COMPLETED'].includes(wo.status)) {
      throw new BadRequestException('Work order must be IN_PROGRESS or COMPLETED');
    }

    // Check if cost sheet already exists
    const existing = await this.prisma.productionCostSheet.findUnique({
      where: { workOrderId },
    });
    if (existing) return existing;

    // Calculate material cost from confirmed production issues
    const issueItems = await this.prisma.productionIssueItem.findMany({
      where: { companyId, productionIssue: { workOrderId, status: 'ISSUED' } },
    });
    const materialCost = issueItems.reduce((s, i) => s + (i.issuedQty * i.unitCost), 0);

    // Calculate planned material cost from BOM
    let plannedMaterialCost = 0;
    if (wo.bomId) {
      const bom = await this.prisma.bom.findFirst({
        where: { id: wo.bomId }, include: { items: { where: { isActive: true } } },
      });
      if (bom) {
        plannedMaterialCost = bom.items.reduce((s, i) => s + (i.effectiveQty * wo.plannedQty * (i.unitCost || 0)), 0);
      }
    }

    // Get production entries for labor calculation
    const entries = await this.prisma.productionEntry.findMany({
      where: { workOrderId, companyId, status: 'CONFIRMED' },
    });
    const totalShifts = entries.length;
    const laborHours = totalShifts * 8; // 8 hours per shift default
    const laborRatePerHour = 50; // default ₹50/hour, editable later
    const laborCost = laborHours * laborRatePerHour;

    const totalCost = materialCost + laborCost;
    const completedQty = wo.completedQty || 0;
    const unitCost = completedQty > 0 ? totalCost / completedQty : 0;
    const varianceCost = totalCost - plannedMaterialCost;

    const costSheetNumber = await this.generateNumber(companyId);
    const sheet = await this.prisma.productionCostSheet.create({
      data: {
        costSheetNumber, workOrderId, companyId,
        materialCost, plannedMaterialCost,
        totalShifts, laborHours, laborRatePerHour, laborCost,
        overheadCost: 0, otherCost: 0,
        totalCost, completedQty, unitCost, varianceCost,
        createdBy: user.id, updatedBy: user.id,
      },
      include: { workOrder: { select: { woNumber: true, productCode: true, productName: true, plannedQty: true, completedQty: true } } },
    });

    // Update FG Receipt unit cost if exists
    await this.prisma.fgReceipt.updateMany({
      where: { workOrderId, companyId },
      data: { unitCost, totalCost: unitCost * (wo.completedQty || 0), updatedBy: user.id },
    });

    await this.audit.log({ tableName: 'production_cost_sheets', recordId: sheet.id, action: 'CREATE', newValues: sheet, changedBy: user.id });
    return sheet;
  }

  async update(id: string, dto: UpdateCostSheetDto, user: any) {
    const sheet = await this.prisma.productionCostSheet.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!sheet) throw new NotFoundException('Cost sheet not found');
    if (sheet.status === 'FINALIZED') throw new BadRequestException('Cannot edit finalized cost sheet');

    const laborCost = dto.laborCost !== undefined ? dto.laborCost :
      (dto.laborHours || sheet.laborHours) * (dto.laborRatePerHour || sheet.laborRatePerHour);

    const totalCost = sheet.materialCost + laborCost +
      (dto.overheadCost ?? sheet.overheadCost) + (dto.otherCost ?? sheet.otherCost);
    const unitCost = sheet.completedQty > 0 ? totalCost / sheet.completedQty : 0;
    const varianceCost = totalCost - sheet.plannedMaterialCost;

    const updated = await this.prisma.productionCostSheet.update({
      where: { id },
      data: {
        ...dto, laborCost, totalCost, unitCost, varianceCost, updatedBy: user.id,
      },
      include: { workOrder: { select: { woNumber: true, productCode: true, productName: true } } },
    });

    // Update FG Receipt unit cost
    await this.prisma.fgReceipt.updateMany({
      where: { workOrderId: sheet.workOrderId, companyId: user.companyId },
      data: { unitCost, totalCost: unitCost * sheet.completedQty, updatedBy: user.id },
    });

    await this.audit.log({ tableName: 'production_cost_sheets', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async finalize(id: string, user: any) {
    const sheet = await this.prisma.productionCostSheet.findFirst({ where: { id, companyId: user.companyId } });
    if (!sheet) throw new NotFoundException('Cost sheet not found');
    if (sheet.status === 'FINALIZED') throw new BadRequestException('Already finalized');
    return this.prisma.productionCostSheet.update({
      where: { id }, data: { status: 'FINALIZED', updatedBy: user.id },
      include: { workOrder: { select: { woNumber: true, productName: true } } },
    });
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, status } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.productionCostSheet.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: { workOrder: { select: { woNumber: true, productCode: true, productName: true, completedQty: true } } },
      }),
      this.prisma.productionCostSheet.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const sheet = await this.prisma.productionCostSheet.findFirst({
      where: { id, companyId: user.companyId },
      include: { workOrder: { select: { woNumber: true, productCode: true, productName: true, plannedQty: true, completedQty: true, bomId: true } } },
    });
    if (!sheet) throw new NotFoundException('Cost sheet not found');

    // Get material breakdown
    const issueItems = await this.prisma.productionIssueItem.findMany({
      where: { companyId: user.companyId, productionIssue: { workOrderId: sheet.workOrderId, status: 'ISSUED' } },
    });

    return { ...sheet, materialBreakdown: issueItems };
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const [total, draft, finalized] = await Promise.all([
      this.prisma.productionCostSheet.count({ where }),
      this.prisma.productionCostSheet.count({ where: { ...where, status: 'DRAFT' } }),
      this.prisma.productionCostSheet.count({ where: { ...where, status: 'FINALIZED' } }),
    ]);
    const totals = await this.prisma.productionCostSheet.aggregate({
      where, _sum: { totalCost: true, materialCost: true, laborCost: true, overheadCost: true },
      _avg: { unitCost: true },
    });
    return {
      total, draft, finalized,
      totalCost: totals._sum.totalCost || 0,
      totalMaterialCost: totals._sum.materialCost || 0,
      totalLaborCost: totals._sum.laborCost || 0,
      totalOverheadCost: totals._sum.overheadCost || 0,
      avgUnitCost: totals._avg.unitCost || 0,
    };
  }
}
