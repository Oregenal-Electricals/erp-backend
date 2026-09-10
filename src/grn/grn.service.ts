import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { StoreShortageService } from '../store-receiving/store-shortage.service';
import { CreateGrnDto, UpdateGrnDto } from './dto/grn.dto';

@Injectable()
export class GrnService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private shortageService: StoreShortageService,
  ) {}

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

    if (!dto.warehouseId) throw new BadRequestException('Please select a Warehouse');
    const warehouse = await this.prisma.warehouse.findFirst({ where: { id: dto.warehouseId, companyId: user.companyId } });
    if (!warehouse) throw new BadRequestException('Selected Warehouse was not found');

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

    // STORE-003/004: detect short or excess per line against orderedQty
    // and raise/close a discrepancy record as needed. Runs after the GRN
    // itself is committed, one line at a time - a failure here (e.g. a
    // notification hiccup) must never roll back a GRN that was otherwise
    // valid, it's a follow-on side effect, not a precondition.
    for (const item of grn.items as any[]) {
      await this.shortageService.upsertFromGrnLine(item, grn, user);
    }

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

    // Physical Verification: corrects each item's receivedQty to what
    // Store actually counted, separate from the initial Receive step.
    // Still gated to DRAFT only (same guard as the header update above),
    // so a GRN already sent to IQC can never have its quantities quietly
    // rewritten. Same 105%-of-ordered tolerance as create() - verification
    // corrects a miscount, it doesn't relax the ordered-qty ceiling.
    // STORE-004: no more hard 105% ceiling here either - a verified qty
    // above/below ordered is allowed through and tracked as a discrepancy
    // (below), same as create(). Physical verification is exactly the
    // moment Store is most likely to discover a real short or excess, so
    // blocking it here would defeat the point of tracking it at all.
    if (dto.items && dto.items.length > 0) {
      const itemMap = new Map((dto.items || []).map(i => [i.id, i.receivedQty]));
      await this.prisma.$transaction(
        (dto.items || [])
          .filter(i => itemMap.has(i.id))
          .map(i => this.prisma.grnItem.update({ where: { id: i.id }, data: { receivedQty: i.receivedQty, updatedBy: user.id } })),
      );
      const updatedItems = await this.prisma.grnItem.findMany({ where: { id: { in: Array.from(itemMap.keys()) } } });
      for (const item of updatedItems) {
        await this.shortageService.upsertFromGrnLine(item, grn, user);
      }
    }

    const { items: _items, ...headerDto } = dto;
    const updated = await this.prisma.grnHeader.update({
      where: { id },
      data: {
        ...headerDto,
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
