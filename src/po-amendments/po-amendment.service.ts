import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreatePoAmendmentDto, RejectAmendmentDto } from './dto/po-amendment.dto';

@Injectable()
export class PoAmendmentService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private async generateAmendmentNumber(poId: string, companyId: string): Promise<string> {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id: poId } });
    const count = await this.prisma.poAmendment.count({ where: { poId, companyId } });
    return `${po?.poNumber}/AMD-${String(count + 1).padStart(3, '0')}`;
  }

  async create(dto: CreatePoAmendmentDto, user: any) {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id: dto.poId, companyId: user.companyId },
      include: { items: { where: { isActive: true } } },
    });
    if (!po) throw new NotFoundException('Purchase Order not found');
    if (!['APPROVED', 'SENT', 'PARTIALLY_RECEIVED'].includes(po.status)) {
      throw new BadRequestException('Only APPROVED, SENT or PARTIALLY_RECEIVED POs can be amended');
    }

    const amendmentNumber = await this.generateAmendmentNumber(dto.poId, user.companyId);

    // Snapshot current PO state as changes reference
    const currentSnapshot = {
      poNumber: po.poNumber,
      status: po.status,
      totalAmount: po.totalAmount,
      deliveryDate: po.deliveryDate,
      items: po.items.map(i => ({
        id: i.id, itemCode: i.itemCode, itemName: i.itemName,
        orderedQty: i.orderedQty, unitPrice: i.unitPrice, totalPrice: i.totalPrice,
      })),
    };

    const amendment = await this.prisma.poAmendment.create({
      data: {
        poId: dto.poId,
        amendmentNumber,
        amendmentType: dto.amendmentType || 'GENERAL',
        reason: dto.reason,
        requestedBy: user.id,
        changes: dto.changes || currentSnapshot,
        companyId: user.companyId,
        createdBy: user.id,
        updatedBy: user.id,
      },
      include: {
        po: { select: { poNumber: true, status: true, totalAmount: true, vendor: { select: { code: true, name: true } } } },
      },
    });

    await this.audit.log({ tableName: 'po_amendments', recordId: amendment.id, action: 'CREATE', newValues: amendment, changedBy: user.id });
    return amendment;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, status } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (search) where.OR = [
      { amendmentNumber: { contains: search, mode: 'insensitive' } },
      { reason: { contains: search, mode: 'insensitive' } },
    ];
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.poAmendment.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: { po: { select: { poNumber: true, vendor: { select: { code: true, name: true } } } } },
      }),
      this.prisma.poAmendment.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const where: any = { id };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const amd = await this.prisma.poAmendment.findFirst({
      where,
      include: { po: { select: { poNumber: true, status: true, totalAmount: true, vendor: { select: { code: true, name: true } } } } },
    });
    if (!amd) throw new NotFoundException('PO Amendment not found');
    return amd;
  }

  async findByPo(poId: string, user: any) {
    const where: any = { poId };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    return this.prisma.poAmendment.findMany({
      where, orderBy: { createdAt: 'desc' },
      include: { po: { select: { poNumber: true } } },
    });
  }

  async submit(id: string, user: any) {
    const amd = await this.findOne(id, user);
    if (amd.status !== 'DRAFT') throw new BadRequestException('Only DRAFT amendments can be submitted');
    const updated = await this.prisma.poAmendment.update({
      where: { id }, data: { status: 'SUBMITTED', updatedBy: user.id },
      include: { po: { select: { poNumber: true, vendor: { select: { name: true } } } } },
    });
    await this.audit.log({ tableName: 'po_amendments', recordId: id, action: 'UPDATE', oldValues: amd, newValues: updated, changedBy: user.id });
    return updated;
  }

  async approve(id: string, user: any) {
    const amd = await this.findOne(id, user);
    if (amd.status !== 'SUBMITTED') throw new BadRequestException('Only SUBMITTED amendments can be approved');
    const updated = await this.prisma.poAmendment.update({
      where: { id },
      data: { status: 'APPROVED', approvedBy: user.id, approvedAt: new Date(), updatedBy: user.id },
      include: { po: { select: { poNumber: true, vendor: { select: { name: true } } } } },
    });
    await this.audit.log({ tableName: 'po_amendments', recordId: id, action: 'UPDATE', oldValues: amd, newValues: updated, changedBy: user.id });
    return updated;
  }

  async reject(id: string, dto: RejectAmendmentDto, user: any) {
    const amd = await this.findOne(id, user);
    if (amd.status !== 'SUBMITTED') throw new BadRequestException('Only SUBMITTED amendments can be rejected');
    const updated = await this.prisma.poAmendment.update({
      where: { id },
      data: { status: 'REJECTED', rejectedBy: user.id, rejectionReason: dto.rejectionReason, updatedBy: user.id },
      include: { po: { select: { poNumber: true } } },
    });
    await this.audit.log({ tableName: 'po_amendments', recordId: id, action: 'UPDATE', oldValues: amd, newValues: updated, changedBy: user.id });
    return updated;
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const [total, draft, submitted, approved, rejected] = await Promise.all([
      this.prisma.poAmendment.count({ where }),
      this.prisma.poAmendment.count({ where: { ...where, status: 'DRAFT' } }),
      this.prisma.poAmendment.count({ where: { ...where, status: 'SUBMITTED' } }),
      this.prisma.poAmendment.count({ where: { ...where, status: 'APPROVED' } }),
      this.prisma.poAmendment.count({ where: { ...where, status: 'REJECTED' } }),
    ]);
    const byType = await this.prisma.poAmendment.groupBy({ by: ['amendmentType'], where, _count: true });
    return { total, draft, submitted, approved, rejected, byType };
  }
}
