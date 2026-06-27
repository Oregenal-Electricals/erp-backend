import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { DisposeItemDto } from './dto/rejected-stock.dto';

@Injectable()
export class RejectedStockService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private async generateNumber(companyId: string): Promise<string> {
    const count = await this.prisma.rejectedStock.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `REJ-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private includes() {
    return {
      iqc: { select: { iqcNumber: true } },
      grn: { select: { grnNumber: true, grnType: true } },
      warehouse: { select: { name: true, code: true } },
      items: { where: { isActive: true } },
    };
  }

  async createFromIqc(iqcId: string, user: any) {
    const iqc = await this.prisma.iqcInspection.findFirst({
      where: { id: iqcId, companyId: user.companyId },
      include: {
        items: { where: { isActive: true, rejectedQty: { gt: 0 } } },
        grn: true,
      },
    });
    if (!iqc) throw new NotFoundException('IQC not found');
    if (iqc.status !== 'APPROVED') throw new BadRequestException('IQC must be APPROVED');

    const rejectedItems = iqc.items.filter(i => i.rejectedQty > 0);
    if (rejectedItems.length === 0) throw new BadRequestException('No rejected items in this IQC');

    // Check if rejection record already exists
    const existing = await this.prisma.rejectedStock.findFirst({ where: { iqcId, companyId: user.companyId } });
    if (existing) throw new BadRequestException('Rejection record already exists for this IQC');

    const grn = iqc.grn as any;
    const rejectionNumber = await this.generateNumber(user.companyId);
    const totalRejectedQty = rejectedItems.reduce((s, i) => s + i.rejectedQty, 0);

    const rejected = await this.prisma.rejectedStock.create({
      data: {
        rejectionNumber,
        iqcId,
        grnId: grn.id,
        warehouseId: grn.warehouseId,
        totalRejectedQty,
        companyId: user.companyId,
        createdBy: user.id, updatedBy: user.id,
        items: {
          create: rejectedItems.map(item => ({
            iqcItemId: item.id,
            itemCode: item.itemCode,
            itemName: item.itemName,
            uom: item.uom,
            rejectedQty: item.rejectedQty,
            rejectionReason: item.rejectionReason,
            companyId: user.companyId,
            createdBy: user.id, updatedBy: user.id,
          })),
        },
      },
      include: this.includes(),
    });

    await this.audit.log({ tableName: 'rejected_stock', recordId: rejected.id, action: 'CREATE', newValues: rejected, changedBy: user.id });
    return rejected;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, status } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (search) where.OR = [{ rejectionNumber: { contains: search, mode: 'insensitive' } }];
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.rejectedStock.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: {
          iqc: { select: { iqcNumber: true } },
          grn: { select: { grnNumber: true } },
          warehouse: { select: { name: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.rejectedStock.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const where: any = { id };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const rec = await this.prisma.rejectedStock.findFirst({ where, include: this.includes() });
    if (!rec) throw new NotFoundException('Rejected stock record not found');
    return rec;
  }

  async disposeItem(id: string, itemId: string, dto: DisposeItemDto, user: any) {
    const rec = await this.findOne(id, user);
    if (rec.status === 'CLOSED') throw new BadRequestException('Cannot update closed rejection record');

    const item = (rec.items as any[]).find(i => i.id === itemId);
    if (!item) throw new NotFoundException('Item not found');

    await this.prisma.rejectedStockItem.update({
      where: { id: itemId },
      data: {
        disposition: dto.disposition,
        dispositionDate: new Date(),
        dispositionBy: dto.dispositionBy || user.id,
        dispositionNotes: dto.dispositionNotes,
        updatedBy: user.id,
      },
    });

    // Check if all items are dispositioned — update header status
    const updated = await this.findOne(id, user);
    const allDispositioned = (updated.items as any[]).every(i => i.disposition !== 'PENDING');
    const someDispositioned = (updated.items as any[]).some(i => i.disposition !== 'PENDING');

    let newStatus = rec.status;
    if (allDispositioned) newStatus = 'PARTIALLY_DISPOSITIONED';
    else if (someDispositioned) newStatus = 'PARTIALLY_DISPOSITIONED';

    await this.prisma.rejectedStock.update({
      where: { id }, data: { status: newStatus, updatedBy: user.id },
    });

    await this.audit.log({ tableName: 'rejected_stock', recordId: id, action: 'UPDATE', newValues: { itemId, disposition: dto.disposition }, changedBy: user.id });
    return this.findOne(id, user);
  }

  async close(id: string, user: any) {
    const rec = await this.findOne(id, user);
    const pendingItems = (rec.items as any[]).filter(i => i.disposition === 'PENDING');
    if (pendingItems.length > 0) throw new BadRequestException(`${pendingItems.length} item(s) still pending disposition`);
    const updated = await this.prisma.rejectedStock.update({
      where: { id }, data: { status: 'CLOSED', updatedBy: user.id }, include: this.includes(),
    });
    await this.audit.log({ tableName: 'rejected_stock', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const [total, quarantined, closed] = await Promise.all([
      this.prisma.rejectedStock.count({ where }),
      this.prisma.rejectedStock.count({ where: { ...where, status: 'QUARANTINED' } }),
      this.prisma.rejectedStock.count({ where: { ...where, status: 'CLOSED' } }),
    ]);
    const totalQty = await this.prisma.rejectedStock.aggregate({ where, _sum: { totalRejectedQty: true } });
    const byDisposition = await this.prisma.rejectedStockItem.groupBy({
      by: ['disposition'], where: { companyId: where.companyId }, _count: true, _sum: { rejectedQty: true },
    });
    return { total, quarantined, closed, totalRejectedQty: totalQty._sum.totalRejectedQty || 0, byDisposition };
  }
}
