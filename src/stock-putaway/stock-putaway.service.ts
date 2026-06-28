import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { StockLedgerService } from '../stock-ledger/stock-ledger.service';
import { CreatePutawayDto, UpdatePutawayItemsDto } from './dto/stock-putaway.dto';

@Injectable()
export class StockPutawayService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private stockLedger: StockLedgerService,
  ) {}

  private async generateNumber(companyId: string): Promise<string> {
    const count = await this.prisma.stockPutaway.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `PUT-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private includes() {
    return {
      grn: { select: { grnNumber: true, grnType: true } },
      iqc: { select: { iqcNumber: true } },
      warehouse: { select: { name: true, code: true } },
      items: { where: { isActive: true }, include: { bin: { select: { code: true, status: true } } } },
    };
  }

  async create(dto: CreatePutawayDto, user: any) {
    const grn = await this.prisma.grnHeader.findFirst({ where: { id: dto.grnId, companyId: user.companyId } });
    if (!grn) throw new NotFoundException('GRN not found');

    const putawayNumber = await this.generateNumber(user.companyId);
    const putaway = await this.prisma.stockPutaway.create({
      data: {
        putawayNumber, grnId: dto.grnId, iqcId: dto.iqcId,
        warehouseId: dto.warehouseId, remarks: dto.remarks,
        status: 'IN_PROGRESS',
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
        items: dto.items ? {
          create: dto.items.map(item => ({ ...item, companyId: user.companyId, createdBy: user.id, updatedBy: user.id }))
        } : undefined,
      },
      include: this.includes(),
    });

    await this.audit.log({ tableName: 'stock_putaway', recordId: putaway.id, action: 'CREATE', newValues: putaway, changedBy: user.id });
    return putaway;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, status } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (search) where.OR = [{ putawayNumber: { contains: search, mode: 'insensitive' } }];
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.stockPutaway.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: {
          grn: { select: { grnNumber: true } },
          warehouse: { select: { name: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.stockPutaway.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const where: any = { id };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const putaway = await this.prisma.stockPutaway.findFirst({ where, include: this.includes() });
    if (!putaway) throw new NotFoundException('Putaway not found');
    return putaway;
  }

  async updateItems(id: string, dto: UpdatePutawayItemsDto, user: any) {
    const putaway = await this.findOne(id, user);
    if (putaway.status === 'COMPLETED') throw new BadRequestException('Cannot edit completed putaway');

    // Delete existing items and recreate
    await this.prisma.stockPutawayItem.deleteMany({ where: { putawayId: id } });
    await this.prisma.stockPutaway.update({
      where: { id },
      data: {
        items: { create: dto.items.map(item => ({ ...item, companyId: user.companyId, createdBy: user.id, updatedBy: user.id })) },
        updatedBy: user.id,
      },
    });
    return this.findOne(id, user);
  }

  async complete(id: string, user: any) {
    const putaway = await this.findOne(id, user);
    if (putaway.status === 'COMPLETED') throw new BadRequestException('Already completed');
    if (!putaway.items || putaway.items.length === 0) throw new BadRequestException('No items to putaway');

    // Update each bin status
    for (const item of putaway.items as any[]) {
      const bin = await this.prisma.warehouseBin.findUnique({ where: { id: item.binId } });
      if (!bin) continue;
      const newQty = bin.currentQty + item.qty;
      let newStatus = 'PARTIAL';
      if (bin.maxQty && newQty >= bin.maxQty) newStatus = 'FULL';
      await this.prisma.warehouseBin.update({
        where: { id: item.binId },
        data: { currentQty: newQty, itemCode: item.itemCode, status: newStatus, updatedBy: user.id },
      });
    }

    const updated = await this.prisma.stockPutaway.update({
      where: { id }, data: { status: 'COMPLETED', updatedBy: user.id }, include: this.includes(),
    });
    await this.audit.log({ tableName: 'stock_putaway', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const [total, inProgress, completed] = await Promise.all([
      this.prisma.stockPutaway.count({ where }),
      this.prisma.stockPutaway.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      this.prisma.stockPutaway.count({ where: { ...where, status: 'COMPLETED' } }),
    ]);
    const totalQty = await this.prisma.stockPutawayItem.aggregate({
      where: { companyId: where.companyId }, _sum: { qty: true },
    });
    return { total, inProgress, completed, totalQtyPutaway: totalQty._sum.qty || 0 };
  }
}
