import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateShippingDocumentDto, UpdateShippingDocumentDto } from './dto/shipping-document.dto';

@Injectable()
export class ShippingDocumentService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private includes() {
    return {
      shipment: { select: { shipmentNumber: true, shipmentMode: true, status: true, vesselName: true, carrierName: true } },
      ipo: { select: { ipoNumber: true, currency: true, vendor: { select: { code: true, name: true } } } },
    };
  }

  async create(dto: CreateShippingDocumentDto, user: any) {
    const shipment = await this.prisma.shipment.findFirst({ where: { id: dto.shipmentId, companyId: user.companyId } });
    if (!shipment) throw new NotFoundException('Shipment not found');

    const doc = await this.prisma.shippingDocument.create({
      data: {
        ...dto,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
        companyId: user.companyId,
        createdBy: user.id, updatedBy: user.id,
      },
      include: this.includes(),
    });

    await this.audit.log({ tableName: 'shipping_documents', recordId: doc.id, action: 'CREATE', newValues: doc, changedBy: user.id });
    return doc;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, status, documentType } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (search) where.OR = [
      { documentNumber: { contains: search, mode: 'insensitive' } },
      { shipperName: { contains: search, mode: 'insensitive' } },
    ];
    if (status) where.status = status;
    if (documentType) where.documentType = documentType;

    const [data, total] = await Promise.all([
      this.prisma.shippingDocument.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: this.includes(),
      }),
      this.prisma.shippingDocument.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const where: any = { id };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const doc = await this.prisma.shippingDocument.findFirst({ where, include: this.includes() });
    if (!doc) throw new NotFoundException('Shipping document not found');
    return doc;
  }

  async findByShipment(shipmentId: string, user: any) {
    const where: any = { shipmentId };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    return this.prisma.shippingDocument.findMany({ where, orderBy: { createdAt: 'desc' }, include: this.includes() });
  }

  async update(id: string, dto: UpdateShippingDocumentDto, user: any) {
    const doc = await this.findOne(id, user);
    if (doc.status === 'SURRENDERED') throw new BadRequestException('Cannot edit surrendered document');
    const updated = await this.prisma.shippingDocument.update({
      where: { id }, data: { ...dto, updatedBy: user.id }, include: this.includes(),
    });
    await this.audit.log({ tableName: 'shipping_documents', recordId: id, action: 'UPDATE', oldValues: doc, newValues: updated, changedBy: user.id });
    return updated;
  }

  async verify(id: string, user: any) {
    const doc = await this.findOne(id, user);
    if (doc.status !== 'RECEIVED') throw new BadRequestException('Only RECEIVED documents can be verified');
    const updated = await this.prisma.shippingDocument.update({
      where: { id }, data: { status: 'VERIFIED', updatedBy: user.id }, include: this.includes(),
    });
    await this.audit.log({ tableName: 'shipping_documents', recordId: id, action: 'UPDATE', oldValues: doc, newValues: updated, changedBy: user.id });
    return updated;
  }

  async surrender(id: string, user: any) {
    const doc = await this.findOne(id, user);
    if (doc.status !== 'VERIFIED') throw new BadRequestException('Only VERIFIED documents can be surrendered');
    const updated = await this.prisma.shippingDocument.update({
      where: { id }, data: { status: 'SURRENDERED', updatedBy: user.id }, include: this.includes(),
    });
    await this.audit.log({ tableName: 'shipping_documents', recordId: id, action: 'UPDATE', oldValues: doc, newValues: updated, changedBy: user.id });
    return updated;
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const [total, received, verified, surrendered] = await Promise.all([
      this.prisma.shippingDocument.count({ where }),
      this.prisma.shippingDocument.count({ where: { ...where, status: 'RECEIVED' } }),
      this.prisma.shippingDocument.count({ where: { ...where, status: 'VERIFIED' } }),
      this.prisma.shippingDocument.count({ where: { ...where, status: 'SURRENDERED' } }),
    ]);
    const byType = await this.prisma.shippingDocument.groupBy({ by: ['documentType'], where, _count: true });
    return { total, received, verified, surrendered, byType };
  }
}
