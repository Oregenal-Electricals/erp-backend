import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateGrnDto, UpdateGrnDto } from './dto/grn.dto';

@Injectable()
export class GrnService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private async generateGrnNumber(companyId: string): Promise<string> {
    const count = await this.prisma.grnHeader.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `GRN-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private includes() {
    return {
      warehouse: { select: { name: true, code: true } },
      po: { select: { poNumber: true, vendor: { select: { name: true, code: true } } } },
      ipo: { select: { ipoNumber: true, vendor: { select: { name: true, code: true } } } },
      items: { where: { isActive: true } },
    };
  }

  async create(dto: CreateGrnDto, user: any) {
    if (!dto.items || dto.items.length === 0) throw new BadRequestException('GRN must have at least one item');

    // Validate received qty vs ordered qty (max 105% tolerance)
    for (const item of dto.items) {
      const maxAllowed = item.orderedQty * 1.05;
      const totalReceived = item.previouslyReceived + item.receivedQty;
      if (totalReceived > maxAllowed) {
        throw new BadRequestException(`Item ${item.itemCode}: received qty (${totalReceived}) exceeds ordered qty (${item.orderedQty}) by more than 5%`);
      }
    }

    let resolvedPoId = dto.poId;
    let resolvedInvoiceNumber = dto.invoiceNumber;
    let resolvedInvoiceDate = dto.invoiceDate;
    if (dto.gateInwardEntryId) {
      const gin = await this.prisma.gateInwardEntry.findFirst({
        where: { id: dto.gateInwardEntryId, companyId: user.companyId },
      });
      if (!gin) throw new NotFoundException('Gate Inward entry not found');
      if (gin.status === 'REJECTED') throw new BadRequestException('Cannot create a GRN from a rejected Gate Inward entry');

      const existingGrn = await this.prisma.grnHeader.findFirst({
        where: { gateInwardEntryId: dto.gateInwardEntryId, isActive: true },
      });
      if (existingGrn) {
        throw new BadRequestException(`This Gate Inward entry already has GRN ${existingGrn.grnNumber} - a gate entry can only be received into one GRN.`);
      }

      if (gin.poId) resolvedPoId = gin.poId;
      if (gin.invoiceNumber) resolvedInvoiceNumber = gin.invoiceNumber;
      if (gin.invoiceDate) resolvedInvoiceDate = gin.invoiceDate.toISOString();
    }

    // Validate source document (now that gate-inward-derived poId, if any, has already been resolved above)
    if (dto.grnType === 'DOMESTIC' && !resolvedPoId) throw new BadRequestException('Domestic GRN requires a Purchase Order');
    if (dto.grnType === 'IMPORT' && !dto.ipoId) throw new BadRequestException('Import GRN requires an Import Purchase Order');

    const grnNumber = await this.generateGrnNumber(user.companyId);

    const grn = await this.prisma.grnHeader.create({
      data: {
        grnNumber,
        grnType: dto.grnType,
        poId: resolvedPoId,
        ipoId: dto.ipoId,
        gateInwardEntryId: dto.gateInwardEntryId,
        landedCostId: dto.landedCostId,
        warehouseId: dto.warehouseId,
        receivedDate: dto.receivedDate ? new Date(dto.receivedDate) : new Date(),
        vehicleNumber: dto.vehicleNumber,
        dcNumber: dto.dcNumber,
        invoiceNumber: resolvedInvoiceNumber,
        invoiceDate: resolvedInvoiceDate ? new Date(resolvedInvoiceDate) : undefined,
        remarks: dto.remarks,
        companyId: user.companyId,
        createdBy: user.id, updatedBy: user.id,
        items: {
          create: dto.items.map(item => ({
            ...item,
            acceptedQty: 0,
            rejectedQty: 0,
            totalValue: item.receivedQty * item.unitPrice,
            companyId: user.companyId,
            createdBy: user.id, updatedBy: user.id,
          })),
        },
      },
      include: this.includes(),
    });

    await this.audit.log({ tableName: 'grn_headers', recordId: grn.id, action: 'CREATE', newValues: grn, changedBy: user.id });
    return grn;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, status, grnType } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (search) where.OR = [
      { grnNumber: { contains: search, mode: 'insensitive' } },
      { invoiceNumber: { contains: search, mode: 'insensitive' } },
      { dcNumber: { contains: search, mode: 'insensitive' } },
    ];
    if (status) where.status = status;
    if (grnType) where.grnType = grnType;

    const [data, total] = await Promise.all([
      this.prisma.grnHeader.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: {
          warehouse: { select: { name: true, code: true } },
          po: { select: { poNumber: true, vendor: { select: { name: true } } } },
          ipo: { select: { ipoNumber: true, vendor: { select: { name: true } } } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.grnHeader.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const where: any = { id };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const grn = await this.prisma.grnHeader.findFirst({ where, include: this.includes() });
    if (!grn) throw new NotFoundException('GRN not found');
    return grn;
  }

  async update(id: string, dto: UpdateGrnDto, user: any) {
    const grn = await this.findOne(id, user);
    if (grn.status !== 'DRAFT') throw new BadRequestException('Only DRAFT GRNs can be edited');
    const updated = await this.prisma.grnHeader.update({
      where: { id },
      data: {
        ...dto,
        invoiceDate: dto.invoiceDate ? new Date(dto.invoiceDate) : undefined,
        updatedBy: user.id,
      },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'grn_headers', recordId: id, action: 'UPDATE', oldValues: grn, newValues: updated, changedBy: user.id });
    return updated;
  }

  async submit(id: string, user: any) {
    const grn = await this.findOne(id, user);
    if (grn.status !== 'DRAFT') throw new BadRequestException('Only DRAFT GRNs can be submitted');
    if (!grn.items || grn.items.length === 0) throw new BadRequestException('GRN must have items');
    const updated = await this.prisma.grnHeader.update({
      where: { id }, data: { status: 'IQC_PENDING', updatedBy: user.id }, include: this.includes(),
    });
    await this.audit.log({ tableName: 'grn_headers', recordId: id, action: 'UPDATE', oldValues: grn, newValues: updated, changedBy: user.id });
    return updated;
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const [total, draft, iqcPending, accepted, closed] = await Promise.all([
      this.prisma.grnHeader.count({ where }),
      this.prisma.grnHeader.count({ where: { ...where, status: 'DRAFT' } }),
      this.prisma.grnHeader.count({ where: { ...where, status: 'IQC_PENDING' } }),
      this.prisma.grnHeader.count({ where: { ...where, status: 'ACCEPTED' } }),
      this.prisma.grnHeader.count({ where: { ...where, status: 'CLOSED' } }),
    ]);
    const byType = await this.prisma.grnHeader.groupBy({ by: ['grnType'], where, _count: true });
    const totalValue = await this.prisma.grnItem.aggregate({
      where: { companyId: where.companyId },
      _sum: { totalValue: true },
    });
    return { total, draft, iqcPending, accepted, closed, byType, totalValue: totalValue._sum.totalValue || 0 };
  }
}
