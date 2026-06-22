import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateRfqDto, UpdateRfqDto, AddRfqVendorDto, AddRfqItemDto } from './dto/rfq.dto';

@Injectable()
export class RfqService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private async generateRfqNumber(companyId: string): Promise<string> {
    const count = await this.prisma.rfq.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `RFQ-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private includes() {
    return {
      pr: { select: { prNumber: true, title: true, status: true } },
      vendors: { where: { isActive: true }, include: { vendor: { select: { code: true, name: true, email: true, phone: true } } } },
      items: { where: { isActive: true }, orderBy: { createdAt: 'asc' as const } },
    };
  }

  async create(dto: CreateRfqDto, user: any) {
    // Validate PR exists and is approved
    const pr = await this.prisma.purchaseRequisition.findFirst({
      where: { id: dto.prId, companyId: user.companyId },
      include: { items: { where: { isActive: true } } },
    });
    if (!pr) throw new NotFoundException('Purchase Requisition not found');
    if (pr.status !== 'APPROVED') throw new BadRequestException('Only approved PRs can have RFQs');

    const rfqNumber = await this.generateRfqNumber(user.companyId);
    const { vendorIds, prItemIds, ...rfqData } = dto;

    // Use PR items if prItemIds provided, otherwise use all PR items
    const itemsToAdd = prItemIds?.length
      ? pr.items.filter(i => prItemIds.includes(i.id))
      : pr.items;

    const rfq = await this.prisma.rfq.create({
      data: {
        ...rfqData,
        rfqNumber,
        responseDeadline: new Date(dto.responseDeadline),
        companyId: user.companyId,
        createdBy: user.id,
        updatedBy: user.id,
        items: {
          create: itemsToAdd.map(item => ({
            prItemId: item.id,
            itemCode: item.itemCode,
            itemName: item.itemName,
            uom: item.uom,
            requiredQty: item.requiredQty,
            companyId: user.companyId,
            createdBy: user.id,
            updatedBy: user.id,
          })),
        },
        vendors: vendorIds?.length ? {
          create: vendorIds.map(vendorId => ({
            vendorId,
            companyId: user.companyId,
            createdBy: user.id,
            updatedBy: user.id,
          })),
        } : undefined,
      },
      include: this.includes(),
    });

    await this.audit.log({ tableName: 'rfqs', recordId: rfq.id, action: 'CREATE', newValues: rfq, changedBy: user.id });
    return rfq;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, status } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (search) where.OR = [
      { rfqNumber: { contains: search, mode: 'insensitive' } },
      { title: { contains: search, mode: 'insensitive' } },
    ];
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.rfq.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: {
          pr: { select: { prNumber: true, title: true } },
          _count: { select: { vendors: true, items: true } },
        },
      }),
      this.prisma.rfq.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const where: any = { id };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const rfq = await this.prisma.rfq.findFirst({ where, include: this.includes() });
    if (!rfq) throw new NotFoundException('RFQ not found');
    return rfq;
  }

  async update(id: string, dto: UpdateRfqDto, user: any) {
    const rfq = await this.findOne(id, user);
    if (!['DRAFT'].includes(rfq.status)) throw new BadRequestException('Only DRAFT RFQs can be edited');
    const updated = await this.prisma.rfq.update({
      where: { id },
      data: {
        ...dto,
        responseDeadline: dto.responseDeadline ? new Date(dto.responseDeadline) : undefined,
        updatedBy: user.id,
      },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'rfqs', recordId: id, action: 'UPDATE', oldValues: rfq, newValues: updated, changedBy: user.id });
    return updated;
  }

  async send(id: string, user: any) {
    const rfq = await this.findOne(id, user);
    if (rfq.status !== 'DRAFT') throw new BadRequestException('Only DRAFT RFQs can be sent');
    if (!rfq.vendors || rfq.vendors.length === 0) throw new BadRequestException('Add at least one vendor before sending');
    if (!rfq.items || rfq.items.length === 0) throw new BadRequestException('Add at least one item before sending');
    const updated = await this.prisma.rfq.update({ where: { id }, data: { status: 'SENT', updatedBy: user.id }, include: this.includes() });
    await this.audit.log({ tableName: 'rfqs', recordId: id, action: 'UPDATE', oldValues: rfq, newValues: updated, changedBy: user.id });
    return updated;
  }

  async close(id: string, user: any) {
    const rfq = await this.findOne(id, user);
    if (rfq.status !== 'SENT') throw new BadRequestException('Only SENT RFQs can be closed');
    const updated = await this.prisma.rfq.update({ where: { id }, data: { status: 'CLOSED', closedAt: new Date(), updatedBy: user.id }, include: this.includes() });
    await this.audit.log({ tableName: 'rfqs', recordId: id, action: 'UPDATE', oldValues: rfq, newValues: updated, changedBy: user.id });
    return updated;
  }

  async cancel(id: string, user: any) {
    const rfq = await this.findOne(id, user);
    if (rfq.status === 'CANCELLED') throw new BadRequestException('Already cancelled');
    const updated = await this.prisma.rfq.update({ where: { id }, data: { status: 'CANCELLED', updatedBy: user.id }, include: this.includes() });
    await this.audit.log({ tableName: 'rfqs', recordId: id, action: 'UPDATE', oldValues: rfq, newValues: updated, changedBy: user.id });
    return updated;
  }

  async addVendor(id: string, dto: AddRfqVendorDto, user: any) {
    const rfq = await this.findOne(id, user);
    if (rfq.status === 'CANCELLED') throw new BadRequestException('Cannot add vendors to cancelled RFQ');
    const vendor = await this.prisma.vendor.findFirst({ where: { id: dto.vendorId, companyId: user.companyId } });
    if (!vendor) throw new NotFoundException('Vendor not found');
    const rv = await this.prisma.rfqVendor.upsert({
      where: { rfqId_vendorId: { rfqId: id, vendorId: dto.vendorId } },
      create: { rfqId: id, vendorId: dto.vendorId, companyId: user.companyId, createdBy: user.id, updatedBy: user.id },
      update: { isActive: true, status: 'INVITED', updatedBy: user.id },
      include: { vendor: { select: { code: true, name: true } } },
    });
    return rv;
  }

  async removeVendor(id: string, vendorId: string, user: any) {
    await this.findOne(id, user);
    await this.prisma.rfqVendor.updateMany({ where: { rfqId: id, vendorId }, data: { isActive: false, updatedBy: user.id } });
    return { message: 'Vendor removed from RFQ' };
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const [total, draft, sent, closed, cancelled] = await Promise.all([
      this.prisma.rfq.count({ where }),
      this.prisma.rfq.count({ where: { ...where, status: 'DRAFT' } }),
      this.prisma.rfq.count({ where: { ...where, status: 'SENT' } }),
      this.prisma.rfq.count({ where: { ...where, status: 'CLOSED' } }),
      this.prisma.rfq.count({ where: { ...where, status: 'CANCELLED' } }),
    ]);
    return { total, draft, sent, closed, cancelled };
  }
}
