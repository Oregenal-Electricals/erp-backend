import { Injectable, NotFoundException, BadRequestException, forwardRef, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { WorkflowsService } from '../workflows/workflows.service';
import { ResolveOrCreateMappingDto, RequestMappingChangeDto } from './dto/customer-item-mapping.dto';

/**
 * Maps a customer's own item code/name (as written on their Customer PO)
 * to our internal Product or Raw Material - a customer can place a PO
 * directly against a raw material (trading/resale lines), not only a
 * finished/semi-finished Product, so a mapping points at exactly one of
 * the two. A first-time mapping is created directly - nothing existed to
 * override. CHANGING an existing mapping goes through the generic
 * WorkflowsService approval chain instead of applying immediately, since
 * a wrong correction here would silently misroute the Sales Order (and
 * therefore Production/Dispatch) onto the wrong product/material.
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
      rawMaterial: { select: { id: true, code: true, name: true } },
    };
  }

  // A mapping (or a requested change to one) must target exactly one of
  // Product/Raw Material - never both, never neither.
  private validateExactlyOneTarget(productId?: string | null, rawMaterialId?: string | null) {
    const hasProduct = !!productId;
    const hasRawMaterial = !!rawMaterialId;
    if (hasProduct === hasRawMaterial) {
      throw new BadRequestException('Exactly one of productId or rawMaterialId is required');
    }
  }

  async resolve(customerId: string, customerItemCode: string, user: any) {
    return this.prisma.customerItemMapping.findFirst({
      where: { companyId: user.companyId, customerId, customerItemCode, isActive: true },
      include: this.includes(),
    });
  }

  /**
   * The reverse of resolve() - given OUR product/raw material and a
   * customer, find how that customer themselves refers to it (their own
   * code/name from their PO). Used when printing something customer-
   * facing (e.g. the AR Invoice) that must show the customer's original
   * wording for a line we only hold internally as productId/
   * rawMaterialId. Returns null (never throws) when no mapping exists,
   * so callers can fall back to our own item name without this ever
   * blocking document creation.
   */
  async resolveByInternalItem(
    customerId: string | null | undefined,
    target: { productId?: string | null; rawMaterialId?: string | null },
    user: any,
  ) {
    if (!customerId || (!target.productId && !target.rawMaterialId)) return null;
    return this.prisma.customerItemMapping.findFirst({
      where: {
        companyId: user.companyId,
        customerId,
        isActive: true,
        ...(target.productId ? { productId: target.productId } : { rawMaterialId: target.rawMaterialId }),
      },
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

    if (!dto.productId && !dto.rawMaterialId) {
      throw new BadRequestException('productId or rawMaterialId is required to create a new mapping');
    }
    this.validateExactlyOneTarget(dto.productId, dto.rawMaterialId);

    const customer = await this.prisma.customer.findFirst({ where: { id: dto.customerId, companyId: user.companyId } });
    if (!customer) throw new NotFoundException('Customer not found');

    if (dto.productId) {
      const product = await this.prisma.product.findFirst({ where: { id: dto.productId, companyId: user.companyId } });
      if (!product) throw new NotFoundException('Product not found');
    } else {
      const rawMaterial = await this.prisma.rawMaterial.findFirst({ where: { id: dto.rawMaterialId, companyId: user.companyId } });
      if (!rawMaterial) throw new NotFoundException('Raw Material not found');
    }

    const mapping = await this.prisma.customerItemMapping.create({
      data: {
        companyId: user.companyId, customerId: dto.customerId,
        customerItemCode: dto.customerItemCode, customerItemName: dto.customerItemName,
        productId: dto.productId || null, rawMaterialId: dto.rawMaterialId || null, status: 'ACTIVE',
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
    this.validateExactlyOneTarget(dto.productId, dto.rawMaterialId);

    let targetCode: string;
    if (dto.productId) {
      const product = await this.prisma.product.findFirst({ where: { id: dto.productId, companyId: user.companyId } });
      if (!product) throw new NotFoundException('Product not found');
      targetCode = product.code;
    } else {
      const rawMaterial = await this.prisma.rawMaterial.findFirst({ where: { id: dto.rawMaterialId, companyId: user.companyId } });
      if (!rawMaterial) throw new NotFoundException('Raw Material not found');
      targetCode = rawMaterial.code;
    }

    const updated = await this.prisma.customerItemMapping.update({
      where: { id },
      data: {
        status: 'PENDING_CHANGE',
        pendingProductId: dto.productId || null,
        pendingRawMaterialId: dto.rawMaterialId || null,
        updatedBy: user.id,
      },
      include: this.includes(),
    });

    await this.workflows.submit({
      documentType: 'CUSTOMER_ITEM_MAPPING',
      documentId: id,
      documentNumber: `${mapping.customerItemCode} -> ${targetCode}`,
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
      data: {
        productId: mapping.pendingProductId ?? null,
        rawMaterialId: mapping.pendingRawMaterialId ?? null,
        pendingProductId: null,
        pendingRawMaterialId: null,
        status: 'ACTIVE',
        updatedBy: user.id,
      },
    });
    await this.audit.log({ tableName: 'customer_item_mappings', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async onWorkflowRejected(id: string, user: any) {
    const mapping = await this.prisma.customerItemMapping.findFirst({ where: { id } });
    if (!mapping) return;
    const updated = await this.prisma.customerItemMapping.update({
      where: { id },
      data: { pendingProductId: null, pendingRawMaterialId: null, status: 'ACTIVE', updatedBy: user.id },
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
