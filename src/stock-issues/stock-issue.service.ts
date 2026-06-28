import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { StockLedgerService } from '../stock-ledger/stock-ledger.service';
import { CreateStockIssueDto } from './dto/stock-issue.dto';

@Injectable()
export class StockIssueService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private stockLedger: StockLedgerService,
  ) {}

  private async generateIssueNumber(companyId: string): Promise<string> {
    const count = await this.prisma.stockIssue.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `ISS-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  // FIFO/FEFO Engine: allocate batches for an item
  async allocateBatches(companyId: string, warehouseId: string, itemCode: string, requiredQty: number, method: string = 'FIFO') {
    const orderBy: any = method === 'FEFO'
      ? [{ expiryDate: 'asc' }, { receivedDate: 'asc' }]
      : [{ receivedDate: 'asc' }, { createdAt: 'asc' }];

    const batches = await this.prisma.stockBatch.findMany({
      where: { companyId, warehouseId, itemCode, status: 'ACTIVE', availableQty: { gt: 0 } },
      orderBy,
    });

    const allocation = [];
    let remaining = requiredQty;

    for (const batch of batches) {
      if (remaining <= 0) break;
      const toTake = Math.min(remaining, batch.availableQty);
      allocation.push({ batch, qty: toTake });
      remaining -= toTake;
    }

    if (remaining > 0) {
      throw new BadRequestException(`Insufficient stock for ${itemCode}. Available: ${requiredQty - remaining}, Required: ${requiredQty}`);
    }

    return allocation;
  }

  // Preview FIFO plan without issuing
  async getFifoPlan(warehouseId: string, itemCode: string, qty: number, method: string = 'FIFO', user: any) {
    const allocation = await this.allocateBatches(user.companyId, warehouseId, itemCode, qty, method);
    return {
      itemCode, warehouseId, requestedQty: qty, method,
      allocation: allocation.map(a => ({
        batchNumber: a.batch.batchNumber,
        lotNumber: a.batch.lotNumber,
        receivedDate: a.batch.receivedDate,
        expiryDate: a.batch.expiryDate,
        availableQty: a.batch.availableQty,
        toIssueQty: a.qty,
        unitCost: a.batch.unitCost,
      })),
    };
  }

  async create(dto: CreateStockIssueDto, user: any) {
    if (!dto.items || dto.items.length === 0) throw new BadRequestException('Issue must have at least one item');
    const method = dto.issueMethod || 'FIFO';
    const issueNumber = await this.generateIssueNumber(user.companyId);

    // Pre-validate all items have sufficient stock
    const allocations = [];
    for (const item of dto.items) {
      const alloc = await this.allocateBatches(user.companyId, dto.warehouseId, item.itemCode, item.requestedQty, method);
      allocations.push({ item, alloc });
    }

    // Create issue with items
    const issueItems = allocations.flatMap(({ item, alloc }) =>
      alloc.map(a => ({
        itemCode: item.itemCode, itemName: item.itemName, uom: item.uom,
        requestedQty: item.requestedQty, issuedQty: a.qty,
        batchId: a.batch.id, unitCost: a.batch.unitCost,
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
      }))
    );

    const issue = await this.prisma.stockIssue.create({
      data: {
        issueNumber, warehouseId: dto.warehouseId, issuedTo: dto.issuedTo,
        referenceType: dto.referenceType || 'INTERNAL',
        referenceId: dto.referenceId, issueMethod: method,
        remarks: dto.remarks, status: 'DRAFT',
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
        items: { create: issueItems },
      },
      include: {
        warehouse: { select: { name: true } },
        items: { include: { batch: { select: { batchNumber: true, lotNumber: true } } } },
      },
    });

    await this.audit.log({ tableName: 'stock_issues', recordId: issue.id, action: 'CREATE', newValues: issue, changedBy: user.id });
    return issue;
  }

  async confirm(id: string, user: any) {
    const issue = await this.prisma.stockIssue.findFirst({
      where: { id, companyId: user.companyId },
      include: { items: { include: { batch: true } } },
    });
    if (!issue) throw new NotFoundException('Stock issue not found');
    if (issue.status !== 'DRAFT') throw new BadRequestException('Only DRAFT issues can be confirmed');

    // Deduct from batches and post ledger entries
    for (const item of issue.items) {
      if (!item.batchId || !item.batch) continue;
      const newQty = item.batch.availableQty - item.issuedQty;
      const newStatus = newQty <= 0 ? 'EXHAUSTED' : 'ACTIVE';
      await this.prisma.stockBatch.update({
        where: { id: item.batchId },
        data: { availableQty: Math.max(0, newQty), status: newStatus, updatedBy: user.id },
      });

      // Post stock ledger OUT entry
      await this.stockLedger.postTransaction({
        companyId: user.companyId,
        itemCode: item.itemCode, itemName: item.itemName,
        warehouseId: issue.warehouseId,
        transactionType: 'ISSUE',
        referenceType: 'STOCK_ISSUE',
        referenceId: issue.id,
        referenceNumber: issue.issueNumber,
        outQty: item.issuedQty,
        unitCost: item.unitCost,
        remarks: `Issued to ${issue.issuedTo}`,
        userId: user.id,
      });
    }

    const updated = await this.prisma.stockIssue.update({
      where: { id }, data: { status: 'ISSUED', updatedBy: user.id },
      include: { warehouse: { select: { name: true } }, items: { include: { batch: { select: { batchNumber: true, lotNumber: true } } } } },
    });
    await this.audit.log({ tableName: 'stock_issues', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, status } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (search) where.OR = [{ issueNumber: { contains: search, mode: 'insensitive' } }, { issuedTo: { contains: search, mode: 'insensitive' } }];
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.stockIssue.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: { warehouse: { select: { name: true } }, _count: { select: { items: true } } },
      }),
      this.prisma.stockIssue.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const where: any = { id };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const issue = await this.prisma.stockIssue.findFirst({
      where,
      include: { warehouse: { select: { name: true } }, items: { include: { batch: { select: { batchNumber: true, lotNumber: true, receivedDate: true } } } } },
    });
    if (!issue) throw new NotFoundException('Stock issue not found');
    return issue;
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const [total, draft, issued] = await Promise.all([
      this.prisma.stockIssue.count({ where }),
      this.prisma.stockIssue.count({ where: { ...where, status: 'DRAFT' } }),
      this.prisma.stockIssue.count({ where: { ...where, status: 'ISSUED' } }),
    ]);
    const totalIssued = await this.prisma.stockIssueItem.aggregate({
      where: { companyId: where.companyId }, _sum: { issuedQty: true },
    });
    return { total, draft, issued, totalQtyIssued: totalIssued._sum.issuedQty || 0 };
  }
}
