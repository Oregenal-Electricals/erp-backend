import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateBatchDto, UpdateBatchDto } from './dto/stock-batch.dto';

@Injectable()
export class StockBatchService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private async generateBatchNumber(companyId: string): Promise<string> {
    const count = await this.prisma.stockBatch.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `BAT-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  async create(dto: CreateBatchDto, user: any) {
    const batchNumber = await this.generateBatchNumber(user.companyId);
    const batch = await this.prisma.stockBatch.create({
      data: {
        ...dto,
        batchNumber,
        availableQty: dto.originalQty,
        mfgDate: dto.mfgDate ? new Date(dto.mfgDate) : undefined,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        receivedDate: dto.receivedDate ? new Date(dto.receivedDate) : new Date(),
        companyId: user.companyId,
        createdBy: user.id, updatedBy: user.id,
      },
      include: { warehouse: { select: { name: true, code: true } } },
    });
    await this.audit.log({ tableName: 'stock_batches', recordId: batch.id, action: 'CREATE', newValues: batch, changedBy: user.id });
    return batch;
  }

  async createFromGrn(grnId: string, user: any) {
    const grn = await this.prisma.grnHeader.findFirst({
      where: { id: grnId, companyId: user.companyId },
      include: { items: { where: { isActive: true, acceptedQty: { gt: 0 } } } },
    });
    if (!grn) throw new NotFoundException('GRN not found');
    if (!['ACCEPTED', 'PARTIALLY_ACCEPTED'].includes(grn.status)) {
      throw new BadRequestException('GRN must be accepted before creating batches');
    }

    const batches = [];
    for (const item of grn.items) {
      if (item.acceptedQty <= 0) continue;
      const existing = await this.prisma.stockBatch.findFirst({
        where: { grnItemId: item.id, companyId: user.companyId },
      });
      if (existing) continue; // Skip if batch already exists for this GRN item

      const batchNumber = await this.generateBatchNumber(user.companyId);
      const batch = await this.prisma.stockBatch.create({
        data: {
          batchNumber,
          itemCode: item.itemCode,
          itemName: item.itemName,
          uom: item.uom,
          warehouseId: grn.warehouseId,
          grnId: grn.id,
          grnItemId: item.id,
          originalQty: item.acceptedQty,
          availableQty: item.acceptedQty,
          unitCost: item.landedCostPerUnit || item.unitPrice,
          companyId: user.companyId,
          createdBy: user.id, updatedBy: user.id,
        },
      });
      batches.push(batch);
    }

    await this.audit.log({ tableName: 'stock_batches', recordId: grnId, action: 'CREATE', newValues: { batches: batches.length }, changedBy: user.id });
    return { created: batches.length, batches };
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, status, itemCode } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (search) where.OR = [
      { batchNumber: { contains: search, mode: 'insensitive' } },
      { lotNumber: { contains: search, mode: 'insensitive' } },
      { itemCode: { contains: search, mode: 'insensitive' } },
    ];
    if (status) where.status = status;
    if (itemCode) where.itemCode = { contains: itemCode, mode: 'insensitive' };

    // Auto-expire batches past expiry date
    await this.prisma.stockBatch.updateMany({
      where: { companyId: user.companyId, status: 'ACTIVE', expiryDate: { lt: new Date() } },
      data: { status: 'EXPIRED' },
    });

    const [data, total] = await Promise.all([
      this.prisma.stockBatch.findMany({
        where, skip, take: Number(limit), orderBy: [{ receivedDate: 'asc' }, { createdAt: 'asc' }],
        include: { warehouse: { select: { name: true, code: true } } },
      }),
      this.prisma.stockBatch.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const where: any = { id };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const batch = await this.prisma.stockBatch.findFirst({ where, include: { warehouse: { select: { name: true } } } });
    if (!batch) throw new NotFoundException('Batch not found');
    return batch;
  }

  async findByItem(itemCode: string, user: any) {
    const where: any = { itemCode, status: 'ACTIVE' };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    return this.prisma.stockBatch.findMany({
      where, orderBy: [{ receivedDate: 'asc' }], // FIFO order
      include: { warehouse: { select: { name: true } } },
    });
  }

  async update(id: string, dto: UpdateBatchDto, user: any) {
    const batch = await this.findOne(id, user);
    if (['EXHAUSTED', 'EXPIRED'].includes(batch.status)) throw new BadRequestException('Cannot edit exhausted or expired batch');
    return this.prisma.stockBatch.update({
      where: { id },
      data: {
        ...dto,
        mfgDate: dto.mfgDate ? new Date(dto.mfgDate) : undefined,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        updatedBy: user.id,
      },
      include: { warehouse: { select: { name: true } } },
    });
  }

  async quarantine(id: string, user: any) {
    const batch = await this.findOne(id, user);
    if (batch.status !== 'ACTIVE') throw new BadRequestException('Only ACTIVE batches can be quarantined');
    return this.prisma.stockBatch.update({
      where: { id }, data: { status: 'QUARANTINED', updatedBy: user.id },
    });
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const [total, active, expired, exhausted, quarantined] = await Promise.all([
      this.prisma.stockBatch.count({ where }),
      this.prisma.stockBatch.count({ where: { ...where, status: 'ACTIVE' } }),
      this.prisma.stockBatch.count({ where: { ...where, status: 'EXPIRED' } }),
      this.prisma.stockBatch.count({ where: { ...where, status: 'EXHAUSTED' } }),
      this.prisma.stockBatch.count({ where: { ...where, status: 'QUARANTINED' } }),
    ]);
    const expiringIn30 = await this.prisma.stockBatch.count({
      where: { ...where, status: 'ACTIVE', expiryDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), gte: new Date() } },
    });
    const totalValue = await this.prisma.stockBatch.aggregate({ where: { ...where, status: 'ACTIVE' }, _sum: { availableQty: true } });
    return { total, active, expired, exhausted, quarantined, expiringIn30, totalActiveBatchQty: totalValue._sum.availableQty || 0 };
  }
}
