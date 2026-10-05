import { Injectable, NotFoundException, BadRequestException, forwardRef, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { WorkflowsService } from '../workflows/workflows.service';
import { ResolveOrCreateMappingDto, RequestMappingChangeDto } from './dto/customer-item-mapping.dto';

/**
 * Maps a customer's own item code/name (as written on their Customer PO)
 * to our internal Product. A first-time mapping is created directly -
 * nothing existed to override. CHANGING an existing mapping goes through
 * the generic WorkflowsService approval chain instead of applying
 * immediately, since a wrong correction here would silently misroute
 * the Sales Order (and therefore Production/Dispatch) onto the wrong
 * product.
 */
@Injectable()
export class CustomerItemMappingService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    @Inject(forwardRef(() => WorkflowsService)) private workflows: WorkflowsService,
  ) {}

  private includes() {
    return {
      customer: { select: { id: true, code: true, name: true } },
      product: { select: { id: true, code: true, name: true } },
    };
  }

  async resolve(customerId: string, customerItemCode: string, user: any) {
    return this.prisma.customerItemMapping.findFirst({
      where: { companyId: user.companyId, customerId, customerItemCode, isActive: true },
      include: this.includes(),
    });
  }

  async createIfMissing(dto: ResolveOrCreateMappingDto, user: any) {
    const existing = await this.prisma.customerItemMapping.findFirst({
      where: { companyId: user.companyId, customerId: dto.customerId, customerItemCode: dto.customerItemCode },
    });
    if (existing) {
      return this.prisma.customerItemMapping.findFirst({ where: { id: existing.id }, include: this.includes() });
    }

    if (!dto.productId) throw new BadRequestException('productId is required to create a new mapping');

    const customer = await this.prisma.customer.findFirst({ where: { id: dto.customerId, companyId: user.companyId } });
    if (!customer) throw new NotFoundException('Customer not found');
    const product = await this.prisma.product.findFirst({ where: { id: dto.productId, companyId: user.companyId } });
    if (!product) throw new NotFoundException('Product not found');

    const mapping = await this.prisma.customerItemMapping.create({
      data: {
        companyId: user.companyId, customerId: dto.customerId,
        customerItemCode: dto.customerItemCode, customerItemName: dto.customerItemName,
        productId: dto.productId, status: 'ACTIVE',
        createdBy: user.id, updatedBy: user.id,
      },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'customer_item_mappings', recordId: mapping.id, action: 'CREATE', newValues: mapping, changedBy: user.id });
    return mapping;
  }

  async requestChange(id: string, dto: RequestMappingChangeDto, user: any) {
    const mapping = await this.prisma.customerItemMapping.findFirst({ where: { id, companyId: user.companyId } });
    if (!mapping) throw new NotFoundException('Mapping not found');
    if (mapping.status === 'PENDING_CHANGE') throw new BadRequestException('A change is already pending approval for this mapping');

    const product = await this.prisma.product.findFirst({ where: { id: dto.productId, companyId: user.companyId } });
    if (!product) throw new NotFoundException('Product not found');

    const updated = await this.prisma.customerItemMapping.update({
      where: { id },
      data: { status: 'PENDING_CHANGE', pendingProductId: dto.productId, updatedBy: user.id },
      include: this.includes(),
    });

    await this.workflows.submit({
      documentType: 'CUSTOMER_ITEM_MAPPING',
      documentId: id,
      documentNumber: `${mapping.customerItemCode} -> ${product.code}`,
      remarks: dto.remarks,
    } as any, user);

    await this.audit.log({ tableName: 'customer_item_mappings', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async onWorkflowApproved(id: string, user: any) {
    const mapping = await this.prisma.customerItemMapping.findFirst({ where: { id } });
    if (!mapping) return;
    const updated = await this.prisma.customerItemMapping.update({
      where: { id },
      data: { productId: mapping.pendingProductId as string, pendingProductId: null, status: 'ACTIVE', updatedBy: user.id },
    });
    await this.audit.log({ tableName: 'customer_item_mappings', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async onWorkflowRejected(id: string, user: any) {
    const mapping = await this.prisma.customerItemMapping.findFirst({ where: { id } });
    if (!mapping) return;
    const updated = await this.prisma.customerItemMapping.update({
      where: { id },
      data: { pendingProductId: null, status: 'ACTIVE', updatedBy: user.id },
    });
    await this.audit.log({ tableName: 'customer_item_mappings', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async findAll(user: any, query: any) {
    const { customerId } = query;
    const where: any = { companyId: user.companyId, isActive: true };
    if (customerId) where.customerId = customerId;
    return this.prisma.customerItemMapping.findMany({ where, include: this.includes(), orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string, user: any) {
    const mapping = await this.prisma.customerItemMapping.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
    if (!mapping) throw new NotFoundException('Mapping not found');
    return mapping;
  }
}
