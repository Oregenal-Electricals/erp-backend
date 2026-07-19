import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { StockLedgerService } from '../stock-ledger/stock-ledger.service';
import { WorkOrderService } from '../work-orders/work-order.service';
import { CreateFgReceiptDto } from './dto/fg-receipt.dto';

@Injectable()
export class FgReceiptService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private stockLedger: StockLedgerService,
    private workOrderService: WorkOrderService,
  ) {}

  private async generateNumber(companyId: string): Promise<string> {
    const count = await this.prisma.fgReceipt.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `FGR-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private includes() {
    return {
      workOrder: { select: { woNumber: true, productCode: true, productName: true, plannedQty: true, completedQty: true } },
      warehouse: { select: { name: true, code: true } },
    };
  }

  async createFromWo(workOrderId: string, user: any) {
    const wo = await this.prisma.workOrder.findFirst({
      where: { id: workOrderId, companyId: user.companyId },
    });
    if (!wo) throw new NotFoundException('Work order not found');
    if (wo.status !== 'COMPLETED') throw new BadRequestException('Work order must be COMPLETED');

    const existing = await this.prisma.fgReceipt.findFirst({
      where: { workOrderId, companyId: user.companyId, status: 'RECEIVED' },
    });
    if (existing) throw new BadRequestException(`FG Receipt ${existing.receiptNumber} already exists for this WO`);

    return this.create({
      workOrderId, warehouseId: wo.warehouseId,
      receivedQty: wo.completedQty, rejectedQty: wo.rejectedQty || 0,
      batchNumber: `FG-${wo.woNumber}-${new Date().getFullYear()}`,
      unitCost: 0, remarks: `Auto-created from WO ${wo.woNumber}`,
    }, user);
  }

  async create(dto: CreateFgReceiptDto, user: any) {
    const wo = await this.prisma.workOrder.findFirst({
      where: { id: dto.workOrderId, companyId: user.companyId },
    });
    if (!wo) throw new NotFoundException('Work order not found');
    if (!['COMPLETED','IN_PROGRESS'].includes(wo.status)) {
      throw new BadRequestException('Work order must be COMPLETED or IN_PROGRESS');
    }
    if (dto.receivedQty > wo.completedQty) {
      throw new BadRequestException(`Cannot receive more than completed qty (${wo.completedQty})`);
    }

    const receiptNumber = await this.generateNumber(user.companyId);
    const totalCost = dto.receivedQty * (dto.unitCost || 0);

    const receipt = await this.prisma.fgReceipt.create({
      data: {
        receiptNumber, workOrderId: dto.workOrderId,
        warehouseId: dto.warehouseId,
        itemCode: wo.productCode, itemName: wo.productName, uom: wo.uom,
        plannedQty: wo.plannedQty, receivedQty: dto.receivedQty,
        rejectedQty: dto.rejectedQty || 0,
        batchNumber: dto.batchNumber, unitCost: dto.unitCost || 0, totalCost,
        remarks: dto.remarks, status: 'DRAFT',
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
      },
      include: this.includes(),
    });

    await this.audit.log({ tableName: 'fg_receipts', recordId: receipt.id, action: 'CREATE', newValues: receipt, changedBy: user.id });
    return receipt;
  }

  async confirm(id: string, user: any) {
    const receipt = await this.prisma.fgReceipt.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!receipt) throw new NotFoundException('FG Receipt not found');
    if (receipt.status !== 'DRAFT') throw new BadRequestException('Only DRAFT receipts can be confirmed');

    await this.stockLedger.postTransaction({
      companyId: user.companyId,
      itemCode: receipt.itemCode, itemName: receipt.itemName,
      warehouseId: receipt.warehouseId,
      transactionType: 'RECEIPT',
      referenceType: 'FG_RECEIPT',
      referenceId: receipt.id, referenceNumber: receipt.receiptNumber,
      inQty: receipt.receivedQty, unitCost: receipt.unitCost,
      remarks: `FG Receipt from WO`,
      userId: user.id,
    });

    if (receipt.batchNumber) {
      await this.prisma.stockBatch.create({
        data: {
          batchNumber: receipt.batchNumber, itemCode: receipt.itemCode,
          itemName: receipt.itemName, warehouseId: receipt.warehouseId,
          originalQty: receipt.receivedQty, availableQty: receipt.receivedQty,
          unitCost: receipt.unitCost, status: 'ACTIVE',
          companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
        },
      }).catch(() => {});
    }

    const updated = await this.prisma.fgReceipt.update({
      where: { id }, data: { status: 'RECEIVED', updatedBy: user.id }, include: this.includes(),
    });
    await this.audit.log({ tableName: 'fg_receipts', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });

    const childWo = await this.prisma.workOrder.findFirst({
      where: { parentWorkOrderId: receipt.workOrderId, companyId: user.companyId, status: 'DRAFT' },
    });
    if (childWo) {
      try {
        await this.workOrderService.release(childWo.id, user);
      } catch (e) {
        // don't fail the receipt confirmation if the next stage can't release
      }
    }

    return updated;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, status } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (search) where.OR = [
      { receiptNumber: { contains: search, mode: 'insensitive' } },
      { itemCode: { contains: search, mode: 'insensitive' } },
    ];
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.fgReceipt.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: this.includes(),
      }),
      this.prisma.fgReceipt.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const receipt = await this.prisma.fgReceipt.findFirst({
      where: { id, companyId: user.companyId }, include: this.includes(),
    });
    if (!receipt) throw new NotFoundException('FG Receipt not found');
    return receipt;
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const [total, draft, received] = await Promise.all([
      this.prisma.fgReceipt.count({ where }),
      this.prisma.fgReceipt.count({ where: { ...where, status: 'DRAFT' } }),
      this.prisma.fgReceipt.count({ where: { ...where, status: 'RECEIVED' } }),
    ]);
    const totals = await this.prisma.fgReceipt.aggregate({
      where: { ...where, status: 'RECEIVED' },
      _sum: { receivedQty: true, totalCost: true },
    });
    return {
      total, draft, received,
      totalReceivedQty: totals._sum.receivedQty || 0,
      totalValue: totals._sum.totalCost || 0,
    };
  }

  async getCompletedWosWithoutFgr(user: any) {
    const companyId = user.companyId;
    const completedWos = await this.prisma.workOrder.findMany({
      where: { companyId, status: 'COMPLETED' },
      select: { id: true, woNumber: true, productCode: true, productName: true, completedQty: true, uom: true },
    });
    const result = [];
    for (const wo of completedWos) {
      const fgr = await this.prisma.fgReceipt.findFirst({
        where: { workOrderId: wo.id, companyId, status: 'RECEIVED' },
      });
      if (!fgr) result.push(wo);
    }
    return { data: result, total: result.length };
  }
}
