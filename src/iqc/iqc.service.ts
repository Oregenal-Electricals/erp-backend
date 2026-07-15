import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateIqcDto, UpdateIqcItemsDto } from './dto/iqc.dto';
import { StockLedgerService } from '../stock-ledger/stock-ledger.service';

@Injectable()
export class IqcService {
  constructor(private prisma: PrismaService, private audit: AuditService, private stockLedger: StockLedgerService) {}

  private async generateIqcNumber(companyId: string): Promise<string> {
    const count = await this.prisma.iqcInspection.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `IQC-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private includes() {
    return {
      grn: { select: { grnNumber: true, grnType: true, warehouseId: true, warehouse: { select: { name: true } } } },
      items: { where: { isActive: true } },
    };
  }

  async create(dto: CreateIqcDto, user: any) {
    const grn = await this.prisma.grnHeader.findFirst({
      where: { id: dto.grnId, companyId: user.companyId },
      include: { items: { where: { isActive: true } } },
    });
    if (!grn) throw new NotFoundException('GRN not found');
    if (grn.status !== 'IQC_PENDING') throw new BadRequestException('GRN must be in IQC_PENDING status');

    // Check if IQC already exists for this GRN
    const existing = await this.prisma.iqcInspection.findFirst({ where: { grnId: dto.grnId, companyId: user.companyId } });
    if (existing) throw new BadRequestException('IQC inspection already exists for this GRN');

    const iqcNumber = await this.generateIqcNumber(user.companyId);

    const iqc = await this.prisma.iqcInspection.create({
      data: {
        iqcNumber,
        grnId: dto.grnId,
        inspectedBy: dto.inspectedBy,
        remarks: dto.remarks,
        status: 'IN_PROGRESS',
        companyId: user.companyId,
        createdBy: user.id, updatedBy: user.id,
        items: {
          create: grn.items.map(item => ({
            grnItemId: item.id,
            itemCode: item.itemCode,
            itemName: item.itemName,
            uom: item.uom,
            receivedQty: item.receivedQty,
            acceptedQty: item.receivedQty, // default all accepted
            rejectedQty: 0,
            companyId: user.companyId,
            createdBy: user.id, updatedBy: user.id,
          })),
        },
      },
      include: this.includes(),
    });

    await this.audit.log({ tableName: 'iqc_inspections', recordId: iqc.id, action: 'CREATE', newValues: iqc, changedBy: user.id });
    return iqc;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, status } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (search) where.OR = [{ iqcNumber: { contains: search, mode: 'insensitive' } }];
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.iqcInspection.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: {
          grn: { select: { grnNumber: true, grnType: true, warehouse: { select: { name: true } } } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.iqcInspection.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const where: any = { id };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const iqc = await this.prisma.iqcInspection.findFirst({ where, include: this.includes() });
    if (!iqc) throw new NotFoundException('IQC inspection not found');
    return iqc;
  }

  async findByGrn(grnId: string, user: any) {
    const where: any = { grnId };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    return this.prisma.iqcInspection.findMany({ where, include: this.includes() });
  }

  async updateItems(id: string, dto: UpdateIqcItemsDto, user: any) {
    const iqc = await this.findOne(id, user);
    if (iqc.status === 'APPROVED') throw new BadRequestException('Cannot edit approved IQC');

    for (const itemUpdate of dto.items) {
      const iqcItem = iqc.items.find((i: any) => i.id === itemUpdate.id);
      if (!iqcItem) throw new BadRequestException(`IQC item ${itemUpdate.id} not found`);
      if (itemUpdate.acceptedQty + itemUpdate.rejectedQty > (iqcItem as any).receivedQty) {
        throw new BadRequestException(`Item ${(iqcItem as any).itemCode}: accepted + rejected cannot exceed received qty`);
      }
      await this.prisma.iqcItem.update({
        where: { id: itemUpdate.id },
        data: {
          acceptedQty: itemUpdate.acceptedQty,
          rejectedQty: itemUpdate.rejectedQty,
          rejectionReason: itemUpdate.rejectionReason,
          updatedBy: user.id,
        },
      });
    }

    const updated = await this.findOne(id, user);
    await this.audit.log({ tableName: 'iqc_inspections', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async approve(id: string, user: any) {
    const iqc = await this.findOne(id, user);
    if (iqc.status === 'APPROVED') throw new BadRequestException('Already approved');
    if (iqc.status === 'PENDING') throw new BadRequestException('IQC must be IN_PROGRESS before approval');

    // Validate: accepted + rejected = received for all items
    for (const item of iqc.items as any[]) {
      if (item.acceptedQty + item.rejectedQty > item.receivedQty) {
        throw new BadRequestException(`Item ${item.itemCode}: quantities don't balance`);
      }
    }

    // Update IQC status
    await this.prisma.iqcInspection.update({
      where: { id }, data: { status: 'APPROVED', updatedBy: user.id },
    });

    // Credit accepted stock into the real StockBalance/StockLedger -
    // without this, materials could pass IQC and still be invisible to
    // the rest of the system (shortage checks, dashboards, production).
    await this.stockLedger.receiveFromIqc(id, user);

    // Update GRN items with accepted/rejected quantities
    for (const item of iqc.items as any[]) {
      await this.prisma.grnItem.update({
        where: { id: item.grnItemId },
        data: { acceptedQty: item.acceptedQty, rejectedQty: item.rejectedQty, updatedBy: user.id },
      });
    }

    // Update GRN status
    const totalAccepted = (iqc.items as any[]).reduce((s, i) => s + i.acceptedQty, 0);
    const totalReceived = (iqc.items as any[]).reduce((s, i) => s + i.receivedQty, 0);
    const totalRejected = (iqc.items as any[]).reduce((s, i) => s + i.rejectedQty, 0);
    let grnStatus = 'ACCEPTED';
    if (totalRejected > 0 && totalAccepted > 0) grnStatus = 'PARTIALLY_ACCEPTED';
    else if (totalRejected === totalReceived) grnStatus = 'ACCEPTED'; // all rejected still closes

    await this.prisma.grnHeader.update({
      where: { id: iqc.grnId }, data: { status: grnStatus, updatedBy: user.id },
    });

    const result = await this.findOne(id, user);
    await this.audit.log({ tableName: 'iqc_inspections', recordId: id, action: 'UPDATE', newValues: result, changedBy: user.id });
    return result;
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const [total, pending, inProgress, approved] = await Promise.all([
      this.prisma.iqcInspection.count({ where }),
      this.prisma.iqcInspection.count({ where: { ...where, status: 'PENDING' } }),
      this.prisma.iqcInspection.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      this.prisma.iqcInspection.count({ where: { ...where, status: 'APPROVED' } }),
    ]);
    return { total, pending, inProgress, approved };
  }
}
