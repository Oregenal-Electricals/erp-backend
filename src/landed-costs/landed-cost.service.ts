import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateLandedCostDto, UpdateLandedCostDto } from './dto/landed-cost.dto';

@Injectable()
export class LandedCostService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private async generateLcNumber(companyId: string): Promise<string> {
    const count = await this.prisma.landedCost.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `LC-COST-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private includes() {
    return {
      ipo: { select: { ipoNumber: true, currency: true, exchangeRate: true, status: true, vendor: { select: { code: true, name: true } } } },
      items: { where: { isActive: true }, orderBy: { itemCode: 'asc' as const } },
    };
  }

  private calcTotal(dto: any) {
    return (dto.invoiceValue || 0) + (dto.customsDuty || 0) + (dto.freightCharges || 0) +
      (dto.chaCharges || 0) + (dto.portCharges || 0) + (dto.bankCharges || 0) +
      (dto.insuranceCharges || 0) + (dto.otherCharges || 0);
  }

  private allocateCosts(items: any[], totalLandedCost: number, method: string) {
    if (items.length === 0) return items;
    let totalBase = 0;
    if (method === 'BY_VALUE') totalBase = items.reduce((s, i) => s + i.valueInr, 0);
    else if (method === 'BY_QTY') totalBase = items.reduce((s, i) => s + i.qty, 0);
    else totalBase = items.length; // BY_QTY equal split

    return items.map(item => {
      const base = method === 'BY_VALUE' ? item.valueInr : method === 'BY_QTY' ? item.qty : 1;
      const allocationRatio = totalBase > 0 ? base / totalBase : 1 / items.length;
      const allocatedCost = totalLandedCost * allocationRatio;
      const landedCostPerUnit = item.qty > 0 ? (item.valueInr + allocatedCost) / item.qty : 0;
      return { ...item, allocationRatio, allocatedCost, landedCostPerUnit };
    });
  }

  async create(dto: CreateLandedCostDto, user: any) {
    const ipo = await this.prisma.importPurchaseOrder.findFirst({
      where: { id: dto.ipoId, companyId: user.companyId },
      include: { items: { where: { isActive: true } } },
    });
    if (!ipo) throw new NotFoundException('Import PO not found');

    const lcNumber = await this.generateLcNumber(user.companyId);
    const totalLandedCost = this.calcTotal(dto);

    // Auto-populate from IPO items
    const rawItems = ipo.items.map(item => ({
      ipoItemId: item.id,
      itemCode: item.itemCode,
      itemName: item.itemName,
      uom: item.uom,
      qty: item.orderedQty,
      unitPriceForeign: item.unitPriceForeign,
      valueForeign: item.totalForeign,
      valueInr: item.totalInr,
    }));

    const allocatedItems = this.allocateCosts(rawItems, totalLandedCost, dto.allocationMethod || 'BY_VALUE');

    const lc = await this.prisma.landedCost.create({
      data: {
        ...dto,
        lcNumber,
        totalLandedCost,
        companyId: user.companyId,
        createdBy: user.id, updatedBy: user.id,
        items: { create: allocatedItems.map(i => ({ ...i, companyId: user.companyId, createdBy: user.id, updatedBy: user.id })) },
      },
      include: this.includes(),
    });

    await this.audit.log({ tableName: 'landed_costs', recordId: lc.id, action: 'CREATE', newValues: lc, changedBy: user.id });
    return lc;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, status } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (search) where.OR = [{ lcNumber: { contains: search, mode: 'insensitive' } }];
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.landedCost.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: {
          ipo: { select: { ipoNumber: true, currency: true, vendor: { select: { code: true, name: true } } } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.landedCost.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const where: any = { id };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const lc = await this.prisma.landedCost.findFirst({ where, include: this.includes() });
    if (!lc) throw new NotFoundException('Landed cost not found');
    return lc;
  }

  async findByIpo(ipoId: string, user: any) {
    const where: any = { ipoId };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    return this.prisma.landedCost.findMany({ where, orderBy: { createdAt: 'desc' }, include: this.includes() });
  }

  async update(id: string, dto: UpdateLandedCostDto, user: any) {
    const lc = await this.findOne(id, user);
    if (lc.status === 'FINALIZED') throw new BadRequestException('Cannot edit finalized landed cost');
    const totalLandedCost = this.calcTotal({ ...lc, ...dto });
    const updated = await this.prisma.landedCost.update({
      where: { id }, data: { ...dto, totalLandedCost, updatedBy: user.id }, include: this.includes(),
    });
    await this.audit.log({ tableName: 'landed_costs', recordId: id, action: 'UPDATE', oldValues: lc, newValues: updated, changedBy: user.id });
    return updated;
  }

  async calculate(id: string, user: any) {
    const lc = await this.findOne(id, user);
    if (lc.status === 'FINALIZED') throw new BadRequestException('Cannot recalculate finalized landed cost');
    const allocatedItems = this.allocateCosts(lc.items as any[], lc.totalLandedCost, lc.allocationMethod);
    for (const item of allocatedItems) {
      await this.prisma.landedCostItem.update({
        where: { id: item.id },
        data: { allocationRatio: item.allocationRatio, allocatedCost: item.allocatedCost, landedCostPerUnit: item.landedCostPerUnit, updatedBy: user.id },
      });
    }
    return this.findOne(id, user);
  }

  async finalize(id: string, user: any) {
    const lc = await this.findOne(id, user);
    if (lc.status !== 'DRAFT') throw new BadRequestException('Only DRAFT landed costs can be finalized');
    if (!lc.items || lc.items.length === 0) throw new BadRequestException('Cannot finalize without items');
    const updated = await this.prisma.landedCost.update({
      where: { id }, data: { status: 'FINALIZED', updatedBy: user.id }, include: this.includes(),
    });
    await this.audit.log({ tableName: 'landed_costs', recordId: id, action: 'UPDATE', oldValues: lc, newValues: updated, changedBy: user.id });
    return updated;
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const [total, draft, finalized] = await Promise.all([
      this.prisma.landedCost.count({ where }),
      this.prisma.landedCost.count({ where: { ...where, status: 'DRAFT' } }),
      this.prisma.landedCost.count({ where: { ...where, status: 'FINALIZED' } }),
    ]);
    const totals = await this.prisma.landedCost.aggregate({ where, _sum: { totalLandedCost: true, customsDuty: true, freightCharges: true } });
    return { total, draft, finalized, totalLandedCost: totals._sum.totalLandedCost || 0, totalCustomsDuty: totals._sum.customsDuty || 0, totalFreight: totals._sum.freightCharges || 0 };
  }
}
