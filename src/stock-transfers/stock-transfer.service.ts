import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { StockLedgerService } from '../stock-ledger/stock-ledger.service';
import { CreateTransferDto } from './dto/stock-transfer.dto';

@Injectable()
export class StockTransferService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private stockLedger: StockLedgerService,
  ) {}

  private async generateNumber(companyId: string): Promise<string> {
    const count = await this.prisma.stockTransfer.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `TRF-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private includes() {
    return {
      fromWarehouse: { select: { name: true, code: true } },
      toWarehouse: { select: { name: true, code: true } },
      items: { where: { isActive: true }, include: { batch: { select: { batchNumber: true, lotNumber: true } } } },
    };
  }

  async create(dto: CreateTransferDto, user: any) {
    if (!dto.items || dto.items.length === 0) throw new BadRequestException('Transfer must have at least one item');
    if (dto.fromWarehouseId === dto.toWarehouseId && dto.transferType === 'INTER_WAREHOUSE') {
      throw new BadRequestException('Source and destination warehouses must be different for inter-warehouse transfer');
    }

    // Validate stock availability for each item
    for (const item of dto.items) {
      const balance = await this.prisma.stockBalance.findFirst({
        where: { companyId: user.companyId, warehouseId: dto.fromWarehouseId, itemCode: item.itemCode },
      });
      if (!balance || balance.availableQty < item.qty) {
        throw new BadRequestException(`Insufficient stock for ${item.itemCode}. Available: ${balance?.availableQty || 0}, Required: ${item.qty}`);
      }
    }

    const transferNumber = await this.generateNumber(user.companyId);
    const transfer = await this.prisma.stockTransfer.create({
      data: {
        transferNumber, transferType: dto.transferType,
        fromWarehouseId: dto.fromWarehouseId, toWarehouseId: dto.toWarehouseId,
        fromBinId: dto.fromBinId, toBinId: dto.toBinId,
        remarks: dto.remarks, status: 'DRAFT',
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
        items: {
          create: dto.items.map(item => ({ ...item, companyId: user.companyId, createdBy: user.id, updatedBy: user.id })),
        },
      },
      include: this.includes(),
    });

    await this.audit.log({ tableName: 'stock_transfers', recordId: transfer.id, action: 'CREATE', newValues: transfer, changedBy: user.id });
    return transfer;
  }

  async confirm(id: string, user: any) {
    const transfer = await this.prisma.stockTransfer.findFirst({
      where: { id, companyId: user.companyId },
      include: { items: { include: { batch: true } } },
    });
    if (!transfer) throw new NotFoundException('Transfer not found');
    if (transfer.status !== 'DRAFT') throw new BadRequestException('Only DRAFT transfers can be confirmed');

    for (const item of transfer.items) {
      // Post OUT from source warehouse
      await this.stockLedger.postTransaction({
        companyId: user.companyId,
        itemCode: item.itemCode, itemName: item.itemName,
        warehouseId: transfer.fromWarehouseId,
        transactionType: 'TRANSFER_OUT',
        referenceType: 'STOCK_TRANSFER',
        referenceId: transfer.id,
        referenceNumber: transfer.transferNumber,
        outQty: item.qty, unitCost: item.unitCost,
        remarks: `Transfer to ${transfer.toWarehouseId}`,
        userId: user.id,
      });

      // Post IN to destination warehouse
      await this.stockLedger.postTransaction({
        companyId: user.companyId,
        itemCode: item.itemCode, itemName: item.itemName,
        warehouseId: transfer.toWarehouseId,
        transactionType: 'TRANSFER_IN',
        referenceType: 'STOCK_TRANSFER',
        referenceId: transfer.id,
        referenceNumber: transfer.transferNumber,
        inQty: item.qty, unitCost: item.unitCost,
        remarks: `Transfer from ${transfer.fromWarehouseId}`,
        userId: user.id,
      });

      // Update batch warehouse if batch-tracked
      if (item.batchId) {
        await this.prisma.stockBatch.update({
          where: { id: item.batchId },
          data: { warehouseId: transfer.toWarehouseId, updatedBy: user.id },
        });
      }

      // Update bin status if bin-level transfer
      if (transfer.fromBinId) {
        const fromBin = await this.prisma.warehouseBin.findUnique({ where: { id: transfer.fromBinId } });
        if (fromBin) {
          const newQty = Math.max(0, fromBin.currentQty - item.qty);
          await this.prisma.warehouseBin.update({
            where: { id: transfer.fromBinId },
            data: { currentQty: newQty, status: newQty === 0 ? 'EMPTY' : 'PARTIAL', updatedBy: user.id },
          });
        }
      }
      if (transfer.toBinId) {
        const toBin = await this.prisma.warehouseBin.findUnique({ where: { id: transfer.toBinId } });
        if (toBin) {
          const newQty = toBin.currentQty + item.qty;
          const newStatus = toBin.maxQty && newQty >= toBin.maxQty ? 'FULL' : 'PARTIAL';
          await this.prisma.warehouseBin.update({
            where: { id: transfer.toBinId },
            data: { currentQty: newQty, itemCode: item.itemCode, status: newStatus, updatedBy: user.id },
          });
        }
      }
    }

    const updated = await this.prisma.stockTransfer.update({
      where: { id }, data: { status: 'CONFIRMED', updatedBy: user.id }, include: this.includes(),
    });
    await this.audit.log({ tableName: 'stock_transfers', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async cancel(id: string, user: any) {
    const transfer = await this.prisma.stockTransfer.findFirst({ where: { id, companyId: user.companyId } });
    if (!transfer) throw new NotFoundException('Transfer not found');
    if (transfer.status !== 'DRAFT') throw new BadRequestException('Only DRAFT transfers can be cancelled');
    return this.prisma.stockTransfer.update({ where: { id }, data: { status: 'CANCELLED', updatedBy: user.id }, include: this.includes() });
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, status, transferType } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (search) where.OR = [{ transferNumber: { contains: search, mode: 'insensitive' } }];
    if (status) where.status = status;
    if (transferType) where.transferType = transferType;

    const [data, total] = await Promise.all([
      this.prisma.stockTransfer.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: {
          fromWarehouse: { select: { name: true } },
          toWarehouse: { select: { name: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.stockTransfer.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const where: any = { id };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const transfer = await this.prisma.stockTransfer.findFirst({ where, include: this.includes() });
    if (!transfer) throw new NotFoundException('Transfer not found');
    return transfer;
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const [total, draft, confirmed, cancelled] = await Promise.all([
      this.prisma.stockTransfer.count({ where }),
      this.prisma.stockTransfer.count({ where: { ...where, status: 'DRAFT' } }),
      this.prisma.stockTransfer.count({ where: { ...where, status: 'CONFIRMED' } }),
      this.prisma.stockTransfer.count({ where: { ...where, status: 'CANCELLED' } }),
    ]);
    const byType = await this.prisma.stockTransfer.groupBy({ by: ['transferType'], where, _count: true });
    return { total, draft, confirmed, cancelled, byType };
  }
}
