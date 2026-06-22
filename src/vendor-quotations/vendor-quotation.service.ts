import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateVendorQuotationDto, UpdateVendorQuotationDto, CreateQuotationItemDto, UpdateQuotationItemDto } from './dto/vendor-quotation.dto';

@Injectable()
export class VendorQuotationService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private async generateQuotationNumber(companyId: string): Promise<string> {
    const count = await this.prisma.vendorQuotation.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `VQ-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private includes() {
    return {
      rfq: { select: { rfqNumber: true, title: true, status: true } },
      vendor: { select: { code: true, name: true, email: true, phone: true } },
      items: { where: { isActive: true }, orderBy: { createdAt: 'asc' as const } },
    };
  }

  private calcItemTotal(unitPrice: number, quotedQty: number, discount = 0, taxRate = 0): number {
    const afterDiscount = unitPrice * quotedQty * (1 - discount / 100);
    return afterDiscount * (1 + taxRate / 100);
  }

  async create(dto: CreateVendorQuotationDto, user: any) {
    const rfq = await this.prisma.rfq.findFirst({ where: { id: dto.rfqId, companyId: user.companyId } });
    if (!rfq) throw new NotFoundException('RFQ not found');
    if (!['SENT', 'CLOSED'].includes(rfq.status)) throw new BadRequestException('RFQ must be SENT before recording quotations');

    const vendor = await this.prisma.vendor.findFirst({ where: { id: dto.vendorId, companyId: user.companyId } });
    if (!vendor) throw new NotFoundException('Vendor not found');

    const rfqVendor = await this.prisma.rfqVendor.findFirst({ where: { rfqId: dto.rfqId, vendorId: dto.vendorId, isActive: true } });
    if (!rfqVendor) throw new BadRequestException('Vendor is not invited in this RFQ');

    const existing = await this.prisma.vendorQuotation.findFirst({ where: { rfqId: dto.rfqId, vendorId: dto.vendorId } });
    if (existing) throw new ConflictException('Quotation already exists for this vendor and RFQ');

    const quotationNumber = await this.generateQuotationNumber(user.companyId);
    const rfqItems = await this.prisma.rfqItem.findMany({ where: { rfqId: dto.rfqId, isActive: true } });

    const quotation = await this.prisma.vendorQuotation.create({
      data: {
        ...dto,
        quotationNumber,
        validUntil: new Date(dto.validUntil),
        companyId: user.companyId,
        createdBy: user.id,
        updatedBy: user.id,
        items: {
          create: rfqItems.map(item => ({
            rfqItemId: item.id,
            itemCode: item.itemCode,
            itemName: item.itemName,
            uom: item.uom,
            requiredQty: item.requiredQty,
            quotedQty: item.requiredQty,
            unitPrice: 0,
            totalPrice: 0,
            companyId: user.companyId,
            createdBy: user.id,
            updatedBy: user.id,
          })),
        },
      },
      include: this.includes(),
    });

    await this.audit.log({ tableName: 'vendor_quotations', recordId: quotation.id, action: 'CREATE', newValues: quotation, changedBy: user.id });
    return quotation;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, status, rfqId } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (search) where.OR = [
      { quotationNumber: { contains: search, mode: 'insensitive' } },
      { vendor: { name: { contains: search, mode: 'insensitive' } } },
    ];
    if (status) where.status = status;
    if (rfqId) where.rfqId = rfqId;

    const [data, total] = await Promise.all([
      this.prisma.vendorQuotation.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: {
          rfq: { select: { rfqNumber: true, title: true } },
          vendor: { select: { code: true, name: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.vendorQuotation.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const where: any = { id };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const q = await this.prisma.vendorQuotation.findFirst({ where, include: this.includes() });
    if (!q) throw new NotFoundException('Vendor quotation not found');
    return q;
  }

  async findByRfq(rfqId: string, user: any) {
    const where: any = { rfqId };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    return this.prisma.vendorQuotation.findMany({
      where, orderBy: { totalAmount: 'asc' },
      include: {
        vendor: { select: { code: true, name: true } },
        items: { where: { isActive: true } },
      },
    });
  }

  async update(id: string, dto: UpdateVendorQuotationDto, user: any) {
    const q = await this.findOne(id, user);
    if (q.status !== 'DRAFT') throw new BadRequestException('Only DRAFT quotations can be edited');
    const updated = await this.prisma.vendorQuotation.update({
      where: { id },
      data: { ...dto, validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined, updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'vendor_quotations', recordId: id, action: 'UPDATE', oldValues: q, newValues: updated, changedBy: user.id });
    return updated;
  }

  async submit(id: string, user: any) {
    const q = await this.findOne(id, user);
    if (q.status !== 'DRAFT') throw new BadRequestException('Only DRAFT quotations can be submitted');
    if (!q.items || q.items.length === 0) throw new BadRequestException('Cannot submit quotation with no items');
    const hasZeroPrice = q.items.some(i => i.unitPrice === 0);
    if (hasZeroPrice) throw new BadRequestException('All items must have a unit price before submitting');

    const updated = await this.prisma.vendorQuotation.update({
      where: { id }, data: { status: 'SUBMITTED', updatedBy: user.id }, include: this.includes(),
    });
    await this.prisma.rfqVendor.updateMany({ where: { rfqId: q.rfqId, vendorId: q.vendorId }, data: { status: 'QUOTED', updatedBy: user.id } });
    await this.audit.log({ tableName: 'vendor_quotations', recordId: id, action: 'UPDATE', oldValues: q, newValues: updated, changedBy: user.id });
    return updated;
  }

  async finalize(id: string, user: any) {
    const q = await this.findOne(id, user);
    if (q.status !== 'SUBMITTED') throw new BadRequestException('Only SUBMITTED quotations can be finalized');
    const updated = await this.prisma.vendorQuotation.update({
      where: { id }, data: { status: 'FINALIZED', updatedBy: user.id }, include: this.includes(),
    });
    await this.audit.log({ tableName: 'vendor_quotations', recordId: id, action: 'UPDATE', oldValues: q, newValues: updated, changedBy: user.id });
    return updated;
  }

  async reject(id: string, user: any) {
    const q = await this.findOne(id, user);
    if (!['DRAFT', 'SUBMITTED'].includes(q.status)) throw new BadRequestException('Cannot reject a finalized quotation');
    const updated = await this.prisma.vendorQuotation.update({
      where: { id }, data: { status: 'REJECTED', updatedBy: user.id }, include: this.includes(),
    });
    await this.audit.log({ tableName: 'vendor_quotations', recordId: id, action: 'UPDATE', oldValues: q, newValues: updated, changedBy: user.id });
    return updated;
  }

  async updateItem(id: string, itemId: string, dto: UpdateQuotationItemDto, user: any) {
    const q = await this.findOne(id, user);
    if (q.status !== 'DRAFT') throw new BadRequestException('Can only edit items of DRAFT quotations');
    const item = await this.prisma.vendorQuotationItem.findFirst({ where: { id: itemId, quotationId: id } });
    if (!item) throw new NotFoundException('Item not found');

    const unitPrice = dto.unitPrice ?? item.unitPrice;
    const quotedQty = dto.quotedQty ?? item.quotedQty;
    const discount = dto.discount ?? item.discount ?? 0;
    const taxRate = dto.taxRate ?? item.taxRate ?? 0;
    const totalPrice = this.calcItemTotal(unitPrice, quotedQty, discount, taxRate);

    const updated = await this.prisma.vendorQuotationItem.update({
      where: { id: itemId }, data: { ...dto, totalPrice, updatedBy: user.id },
    });
    await this.recalculateTotal(id);
    return updated;
  }

  private async recalculateTotal(quotationId: string) {
    const items = await this.prisma.vendorQuotationItem.findMany({ where: { quotationId, isActive: true } });
    const total = items.reduce((s, i) => s + (i.totalPrice || 0), 0);
    await this.prisma.vendorQuotation.update({ where: { id: quotationId }, data: { totalAmount: total } });
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const [total, draft, submitted, finalized, rejected] = await Promise.all([
      this.prisma.vendorQuotation.count({ where }),
      this.prisma.vendorQuotation.count({ where: { ...where, status: 'DRAFT' } }),
      this.prisma.vendorQuotation.count({ where: { ...where, status: 'SUBMITTED' } }),
      this.prisma.vendorQuotation.count({ where: { ...where, status: 'FINALIZED' } }),
      this.prisma.vendorQuotation.count({ where: { ...where, status: 'REJECTED' } }),
    ]);
    return { total, draft, submitted, finalized, rejected };
  }
}
