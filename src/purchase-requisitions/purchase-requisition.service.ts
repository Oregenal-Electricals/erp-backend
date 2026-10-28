import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreatePurchaseRequisitionDto, UpdatePurchaseRequisitionDto, RejectPrDto, CreatePrFromShortageDto } from './dto/purchase-requisition.dto';

@Injectable()
export class PurchaseRequisitionService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private async generatePrNumber(companyId: string): Promise<string> {
    const count = await this.prisma.purchaseRequisition.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `PR-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private includes() {
    return { items: { where: { isActive: true }, orderBy: { sequence: 'asc' as const } } };
  }

  async create(dto: CreatePurchaseRequisitionDto, user: any) {
    const prNumber = await this.generatePrNumber(user.companyId);
    const { items, ...prData } = dto;
    // Ensure requiredDate is a proper DateTime
    if (prData.requiredDate && typeof prData.requiredDate === 'string') {
      (prData as any).requiredDate = new Date(prData.requiredDate);
    }

    const pr = await this.prisma.purchaseRequisition.create({
      data: {
        ...prData,
        prNumber,
        requestedBy: user.id,
        companyId: user.companyId,
        createdBy: user.id,
        updatedBy: user.id,
        items: items && items.length > 0 ? {
          create: items.map((item, idx) => ({
            ...item,
            sequence: item.sequence || idx + 1,
            estimatedTotal: item.estimatedUnitPrice ? item.requiredQty * item.estimatedUnitPrice : null,
            companyId: user.companyId,
            createdBy: user.id,
            updatedBy: user.id,
          })),
        } : undefined,
      },
      include: this.includes(),
    });

    // Calculate total
    if (pr.items.length > 0) {
      const total = pr.items.reduce((s, i) => s + (i.estimatedTotal || 0), 0);
      await this.prisma.purchaseRequisition.update({ where: { id: pr.id }, data: { totalAmount: total } });
    }

    await this.audit.log({ tableName: 'purchase_requisitions', recordId: pr.id, action: 'CREATE', newValues: pr, changedBy: user.id });
    return pr;
  }

  /**
   * Auto-drafts a Purchase Requisition from the Customer PO shortage
   * check's own output (MaterialShortage, status OPEN) instead of the
   * full BOM/demand requirement. For each requested itemCode, every OPEN
   * shortage row across all customer orders is summed into ONE PR line,
   * so Purchase sees "buy X of item Y" exactly matching the aggregated
   * view they already see on the shortages screen (getAllOpenShortages) -
   * never the gross BOM quantity, which ignores stock/incoming already
   * on hand. The PR is created in DRAFT status: nothing is submitted,
   * approved, or sent to a vendor here - Purchase can still edit/add/
   * remove items and adjust quantities via the existing update()/
   * addItem()/removeItem() endpoints before calling submit() themselves.
   * Matched shortage rows are tagged PR_RAISED and linked to the new PR
   * (MaterialShortage.prId) so the shortages screen can trace which PR
   * now covers which gap - mirroring how markShortagesRaised() already
   * closes the loop for the direct-to-PO path, but for the PR path this
   * schema's prId field was actually named for.
   */
  async createFromShortages(dto: CreatePrFromShortageDto, user: any) {
    const itemCodes = Array.from(new Set(dto.itemCodes));
    const openShortages = await this.prisma.materialShortage.findMany({
      where: { companyId: user.companyId, status: 'OPEN', itemCode: { in: itemCodes } },
      orderBy: { createdAt: 'asc' },
    });
    if (openShortages.length === 0) {
      throw new BadRequestException('No OPEN material shortage records found for the given item codes');
    }

    const byItemCode = new Map<string, { itemName: string; uom: string; rawMaterialId: string | null; shortageQty: number; rowIds: string[] }>();
    for (const row of openShortages) {
      const agg = byItemCode.get(row.itemCode);
      if (agg) {
        agg.shortageQty = Math.round((agg.shortageQty + row.shortageQty) * 1000) / 1000;
        agg.rowIds.push(row.id);
      } else {
        byItemCode.set(row.itemCode, {
          itemName: row.itemName, uom: row.uom, rawMaterialId: row.rawMaterialId,
          shortageQty: Math.round(row.shortageQty * 1000) / 1000, rowIds: [row.id],
        });
      }
    }

    const items = Array.from(byItemCode.entries()).map(([itemCode, agg]) => ({
      itemType: 'RAW_MATERIAL',
      rawMaterialId: agg.rawMaterialId,
      itemCode,
      itemName: agg.itemName,
      uom: agg.uom,
      // Strictly the shortfall figure (MaterialShortage.shortageQty =
      // BOM/demand requirement minus stock/incoming already netted off
      // by the shortage check) - never the full BOM requirement.
      requiredQty: agg.shortageQty,
      notes: 'Auto-suggested from Customer PO material shortage check - review/adjust qty before submitting.',
    }));

    const pr = await this.create(
      {
        title: dto.title, description: dto.description, requiredDate: dto.requiredDate,
        department: dto.department, priority: dto.priority, notes: dto.notes, items,
      } as CreatePurchaseRequisitionDto,
      user,
    );

    const allRowIds = Array.from(byItemCode.values()).flatMap(agg => agg.rowIds);
    await this.prisma.materialShortage.updateMany({
      where: { id: { in: allRowIds } },
      data: { status: 'PR_RAISED', prId: pr.id, updatedBy: user.id },
    });

    await this.audit.log({
      tableName: 'purchase_requisitions', recordId: pr.id, action: 'CREATE',
      newValues: { ...pr, sourcedFromShortages: allRowIds }, changedBy: user.id,
    });

    return pr;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, status, priority } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (search) where.OR = [
      { prNumber: { contains: search, mode: 'insensitive' } },
      { title: { contains: search, mode: 'insensitive' } },
      { department: { contains: search, mode: 'insensitive' } },
    ];
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const [data, total] = await Promise.all([
      this.prisma.purchaseRequisition.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: { _count: { select: { items: true } } },
      }),
      this.prisma.purchaseRequisition.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const where: any = { id };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const pr = await this.prisma.purchaseRequisition.findFirst({ where, include: this.includes() });
    if (!pr) throw new NotFoundException('Purchase Requisition not found');
    return pr;
  }

  async update(id: string, dto: UpdatePurchaseRequisitionDto, user: any) {
    const pr = await this.findOne(id, user);
    if (!['DRAFT', 'REJECTED'].includes(pr.status)) throw new BadRequestException('Only DRAFT or REJECTED PRs can be edited');
    const updated = await this.prisma.purchaseRequisition.update({
      where: { id }, data: { ...dto, updatedBy: user.id }, include: this.includes(),
    });
    await this.audit.log({ tableName: 'purchase_requisitions', recordId: id, action: 'UPDATE', oldValues: pr, newValues: updated, changedBy: user.id });
    return updated;
  }

  async submit(id: string, user: any) {
    const pr = await this.findOne(id, user);
    if (pr.status !== 'DRAFT') throw new BadRequestException('Only DRAFT PRs can be submitted');
    if (!pr.items || pr.items.length === 0) throw new BadRequestException('Cannot submit PR with no items');
    const updated = await this.prisma.purchaseRequisition.update({
      where: { id }, data: { status: 'SUBMITTED', updatedBy: user.id }, include: this.includes(),
    });
    await this.audit.log({ tableName: 'purchase_requisitions', recordId: id, action: 'UPDATE', oldValues: pr, newValues: updated, changedBy: user.id });
    return updated;
  }

  async approve(id: string, user: any) {
    const pr = await this.findOne(id, user);
    if (pr.status !== 'SUBMITTED') throw new BadRequestException('Only SUBMITTED PRs can be approved');
    const updated = await this.prisma.purchaseRequisition.update({
      where: { id },
      data: { status: 'APPROVED', approvedBy: user.id, approvedAt: new Date(), updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'purchase_requisitions', recordId: id, action: 'UPDATE', oldValues: pr, newValues: updated, changedBy: user.id });
    return updated;
  }

  async reject(id: string, dto: RejectPrDto, user: any) {
    const pr = await this.findOne(id, user);
    if (pr.status !== 'SUBMITTED') throw new BadRequestException('Only SUBMITTED PRs can be rejected');
    const updated = await this.prisma.purchaseRequisition.update({
      where: { id },
      data: { status: 'REJECTED', rejectedBy: user.id, rejectedAt: new Date(), rejectionReason: dto.rejectionReason, updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'purchase_requisitions', recordId: id, action: 'UPDATE', oldValues: pr, newValues: updated, changedBy: user.id });
    return updated;
  }

  async addItem(id: string, item: any, user: any) {
    const pr = await this.findOne(id, user);
    if (!['DRAFT', 'REJECTED'].includes(pr.status)) throw new BadRequestException('Cannot add items to this PR');
    const seq = (pr.items?.length || 0) + 1;
    const newItem = await this.prisma.purchaseRequisitionItem.create({
      data: {
        ...item, prId: id, sequence: item.sequence || seq,
        estimatedTotal: item.estimatedUnitPrice ? item.requiredQty * item.estimatedUnitPrice : null,
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
      },
    });
    await this.recalculateTotal(id);
    return newItem;
  }

  async removeItem(id: string, itemId: string, user: any) {
    const pr = await this.findOne(id, user);
    if (!['DRAFT', 'REJECTED'].includes(pr.status)) throw new BadRequestException('Cannot remove items from this PR');
    await this.prisma.purchaseRequisitionItem.update({ where: { id: itemId }, data: { isActive: false, updatedBy: user.id } });
    await this.recalculateTotal(id);
    return { message: 'Item removed' };
  }

  private async recalculateTotal(prId: string) {
    const items = await this.prisma.purchaseRequisitionItem.findMany({ where: { prId, isActive: true } });
    const total = items.reduce((s, i) => s + (i.estimatedTotal || 0), 0);
    await this.prisma.purchaseRequisition.update({ where: { id: prId }, data: { totalAmount: total } });
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const [total, draft, submitted, approved, rejected, poRaised] = await Promise.all([
      this.prisma.purchaseRequisition.count({ where }),
      this.prisma.purchaseRequisition.count({ where: { ...where, status: 'DRAFT' } }),
      this.prisma.purchaseRequisition.count({ where: { ...where, status: 'SUBMITTED' } }),
      this.prisma.purchaseRequisition.count({ where: { ...where, status: 'APPROVED' } }),
      this.prisma.purchaseRequisition.count({ where: { ...where, status: 'REJECTED' } }),
      this.prisma.purchaseRequisition.count({ where: { ...where, status: 'PO_RAISED' } }),
    ]);
    return { total, draft, submitted, approved, rejected, poRaised };
  }
}
