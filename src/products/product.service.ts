import { Injectable, NotFoundException, ConflictException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { WorkflowsService } from '../workflows/workflows.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    @Inject(forwardRef(() => WorkflowsService)) private workflows: WorkflowsService,
  ) {}

  private includes() {
    return { category: true, uom: true, family: true };
  }

  /**
   * Checks whether the current user holds PRODUCTION_TARGET_MANAGE, the
   * same lookup PermissionsGuard performs - needed here because setting
   * hourlyTarget/dailyTarget is gated separately from the rest of the
   * Product record, which only requires INVENTORY_CREATE/INVENTORY_EDIT
   * at the controller level.
   */
  private async userHasProductionTargetManage(user: any): Promise<boolean> {
    const allRoles: string[] = user.allRoles || [user.role, ...(user.additionalRoles || [])].filter((v: string, i: number, a: string[]) => a.indexOf(v) === i);
    if (allRoles.includes('SUPER_ADMIN')) return true;
    const roles = await this.prisma.role.findMany({
      where: { name: { in: allRoles }, companyId: user.companyId, isActive: true },
      include: { permissions: { where: { isActive: true, permission: 'PRODUCTION_TARGET_MANAGE' } } },
    });
    return roles.some((r) => r.permissions.length > 0);
  }

  // Both hourlyTarget and dailyTarget are management-only - a caller
  // without PRODUCTION_TARGET_MANAGE can still create/update every other
  // Product field via INVENTORY_CREATE/INVENTORY_EDIT, but is blocked the
  // moment either target field is actually present in the payload (not
  // just falsy - 0 is a value someone could legitimately set).
  private async assertCanSetTargets(dto: CreateProductDto | UpdateProductDto, user: any) {
    if (dto.hourlyTarget === undefined && dto.dailyTarget === undefined) return;
    const allowed = await this.userHasProductionTargetManage(user);
    if (!allowed) {
      throw new ForbiddenException('Only users with PRODUCTION_TARGET_MANAGE can set hourly/daily production targets on a product');
    }
  }

  async create(dto: CreateProductDto, user: any) {
    await this.assertCanSetTargets(dto, user);
    const exists = await this.prisma.product.findUnique({
      where: { companyId_code: { companyId: user.companyId, code: dto.code.toUpperCase() } },
    });
    if (exists) throw new ConflictException(`Product code ${dto.code} already exists`);

    const product = await this.prisma.product.create({
      data: { ...dto, code: dto.code.toUpperCase(), status: 'DRAFT', companyId: user.companyId, createdBy: user.id, updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'products', recordId: product.id, action: 'CREATE', newValues: product, changedBy: user.id });

    await this.workflows.submit({ documentType: 'PRODUCT', documentId: product.id, documentNumber: product.code }, user);
    const submitted = await this.prisma.product.update({
      where: { id: product.id }, data: { status: 'PENDING_APPROVAL', updatedBy: user.id }, include: this.includes(),
    });
    return submitted;
  }

  async onWorkflowApproved(id: string, user: any) {
    const product = await this.prisma.product.findFirst({ where: { id } });
    if (!product) return;
    const updated = await this.prisma.product.update({
      where: { id },
      data: { status: 'APPROVED', approvedBy: user.id, approvedAt: new Date(), updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'products', recordId: id, action: 'UPDATE', oldValues: product, newValues: updated, changedBy: user.id });
    return updated;
  }

  async onWorkflowRejected(id: string, user: any) {
    const product = await this.prisma.product.findFirst({ where: { id } });
    if (!product) return;
    const updated = await this.prisma.product.update({ where: { id }, data: { status: 'REJECTED', updatedBy: user.id }, include: this.includes() });
    await this.audit.log({ tableName: 'products', recordId: id, action: 'UPDATE', oldValues: product, newValues: updated, changedBy: user.id });
    return updated;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, productType, isActive } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (search) where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
      { hsnCode: { contains: search, mode: 'insensitive' } },
      { brand: { contains: search, mode: 'insensitive' } },
    ];
    if (productType) where.productType = productType;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' }, include: this.includes() }),
      this.prisma.product.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const where: any = { id };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const product = await this.prisma.product.findFirst({ where, include: this.includes() });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(id: string, dto: UpdateProductDto, user: any) {
    await this.assertCanSetTargets(dto, user);
    const product = await this.findOne(id, user);
    const updated = await this.prisma.product.update({
      where: { id },
      data: { ...dto, updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'products', recordId: id, action: 'UPDATE', oldValues: product, newValues: updated, changedBy: user.id });
    return updated;
  }

  async remove(id: string, user: any) {
    const product = await this.findOne(id, user);
    const updated = await this.prisma.product.update({
      where: { id },
      data: { isActive: false, updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'products', recordId: id, action: 'DELETE', oldValues: product, newValues: updated, changedBy: user.id });
    return { message: 'Product deactivated successfully' };
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const [total, active, finished, semiFin, byProduct] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.count({ where: { ...where, isActive: true } }),
      this.prisma.product.count({ where: { ...where, productType: 'FINISHED_GOOD', isActive: true } }),
      this.prisma.product.count({ where: { ...where, productType: 'SEMI_FINISHED', isActive: true } }),
      this.prisma.product.count({ where: { ...where, productType: 'BY_PRODUCT', isActive: true } }),
    ]);
    return { total, active, inactive: total - active, finished, semiFin, byProduct };
  }
}
