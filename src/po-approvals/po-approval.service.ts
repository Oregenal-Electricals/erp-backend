import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { ApprovePoDto, RejectPoDto, CreateApprovalSettingDto, UpdateApprovalSettingDto } from './dto/po-approval.dto';

@Injectable()
export class PoApprovalService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  // ── SETTINGS ─────────────────────────────────────────────────
  async getSettings(user: any) {
    return this.prisma.poApprovalSetting.findMany({
      where: { companyId: user.companyId },
      orderBy: { level: 'asc' },
    });
  }

  async createSetting(dto: CreateApprovalSettingDto, user: any) {
    const existing = await this.prisma.poApprovalSetting.findUnique({
      where: { companyId_level: { companyId: user.companyId, level: dto.level } },
    });
    if (existing) throw new BadRequestException(`Level ${dto.level} already exists`);
    return this.prisma.poApprovalSetting.create({
      data: { ...dto, companyId: user.companyId, createdBy: user.id, updatedBy: user.id },
    });
  }

  async updateSetting(id: string, dto: UpdateApprovalSettingDto, user: any) {
    const setting = await this.prisma.poApprovalSetting.findFirst({ where: { id, companyId: user.companyId } });
    if (!setting) throw new NotFoundException('Approval setting not found');
    return this.prisma.poApprovalSetting.update({ where: { id }, data: { ...dto, updatedBy: user.id } });
  }

  // ── DETERMINE REQUIRED LEVELS ─────────────────────────────────
  private async getRequiredLevels(companyId: string, amount: number): Promise<number[]> {
    const settings = await this.prisma.poApprovalSetting.findMany({
      where: { companyId, isActive: true },
      orderBy: { level: 'asc' },
    });
    if (settings.length === 0) return [1]; // Default: single level approval
    const required = settings.filter(s =>
      amount >= s.minAmount && (s.maxAmount === null || amount <= s.maxAmount)
    );
    if (required.length === 0) return settings.map(s => s.level); // All levels if no match
    return required.map(s => s.level);
  }

  // ── PENDING APPROVALS ─────────────────────────────────────────
  async getPending(user: any) {
    const pos = await this.prisma.purchaseOrder.findMany({
      where: { companyId: user.companyId, status: 'DRAFT', isActive: true },
      include: {
        vendor: { select: { code: true, name: true } },
        approvals: { orderBy: { createdAt: 'desc' } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return pos.map(po => {
      const lastAction = po.approvals[0];
      return {
        ...po,
        lastApprovalAction: lastAction?.action || null,
        lastApprovalBy: lastAction?.approvedBy || null,
        lastRemarks: lastAction?.remarks || null,
      };
    });
  }

  // ── APPROVAL HISTORY ─────────────────────────────────────────
  async getHistory(poId: string, user: any) {
    const po = await this.prisma.purchaseOrder.findFirst({ where: { id: poId, companyId: user.companyId } });
    if (!po) throw new NotFoundException('Purchase Order not found');
    return this.prisma.poApproval.findMany({
      where: { poId, companyId: user.companyId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ── APPROVE ──────────────────────────────────────────────────
  async approve(poId: string, dto: ApprovePoDto, user: any) {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id: poId, companyId: user.companyId },
      include: { approvals: true },
    });
    if (!po) throw new NotFoundException('Purchase Order not found');
    if (!['DRAFT'].includes(po.status)) throw new BadRequestException('Only DRAFT POs can be approved');
    const itemCount = await this.prisma.purchaseOrderItem.count({ where: { poId, isActive: true } });
    if (itemCount === 0) throw new BadRequestException('Cannot approve PO with no items');

    const requiredLevels = await this.getRequiredLevels(user.companyId, po.totalAmount);
    const approvedLevels = po.approvals.filter(a => a.action === 'APPROVED').map(a => a.approvalLevel);
    const nextLevel = requiredLevels.find(l => !approvedLevels.includes(l)) || 1;

    // Record approval
    const approval = await this.prisma.poApproval.create({
      data: {
        companyId: user.companyId, poId,
        approvalLevel: nextLevel,
        approvedBy: user.id,
        action: 'APPROVED',
        remarks: dto.remarks,
        createdBy: user.id, updatedBy: user.id,
      },
    });

    // Check if all levels approved
    const newApprovedLevels = [...approvedLevels, nextLevel];
    const allApproved = requiredLevels.every(l => newApprovedLevels.includes(l));

    if (allApproved) {
      await this.prisma.purchaseOrder.update({
        where: { id: poId },
        data: { status: 'APPROVED', approvedBy: user.id, approvedAt: new Date(), updatedBy: user.id },
      });
    }

    await this.audit.log({ tableName: 'po_approvals', recordId: approval.id, action: 'CREATE', newValues: approval, changedBy: user.id });

    return {
      approval,
      allApproved,
      levelsApproved: newApprovedLevels,
      levelsRequired: requiredLevels,
      poStatus: allApproved ? 'APPROVED' : 'DRAFT',
      message: allApproved ? 'PO fully approved' : `Level ${nextLevel} approved. ${requiredLevels.length - newApprovedLevels.length} level(s) remaining.`,
    };
  }

  // ── REJECT ───────────────────────────────────────────────────
  async reject(poId: string, dto: RejectPoDto, user: any) {
    const po = await this.prisma.purchaseOrder.findFirst({ where: { id: poId, companyId: user.companyId } });
    if (!po) throw new NotFoundException('Purchase Order not found');
    if (po.status !== 'DRAFT') throw new BadRequestException('Only DRAFT POs can be rejected');

    const approval = await this.prisma.poApproval.create({
      data: {
        companyId: user.companyId, poId,
        approvalLevel: 1,
        approvedBy: user.id,
        action: 'REJECTED',
        remarks: dto.remarks,
        createdBy: user.id, updatedBy: user.id,
      },
    });

    await this.audit.log({ tableName: 'po_approvals', recordId: approval.id, action: 'CREATE', newValues: approval, changedBy: user.id });
    return { approval, message: 'PO rejected', poStatus: 'DRAFT' };
  }

  async getStats(user: any) {
    const where: any = { companyId: user.companyId };
    const [total, approved, rejected, pending] = await Promise.all([
      this.prisma.poApproval.count({ where }),
      this.prisma.poApproval.count({ where: { ...where, action: 'APPROVED' } }),
      this.prisma.poApproval.count({ where: { ...where, action: 'REJECTED' } }),
      this.prisma.purchaseOrder.count({ where: { companyId: user.companyId, status: 'DRAFT', isActive: true } }),
    ]);
    return { total, approved, rejected, pendingPos: pending };
  }
}
