import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RejectedStockService } from '../rejected-stock/rejected-stock.service';
import { StockLedgerService } from '../stock-ledger/stock-ledger.service';
import {
  CreateIqcCheckTemplateDto,
  UpdateIqcCheckTemplateDto,
  AttachTemplateDto,
  SubmitIqcStageResultDto,
} from './dto/iqc.dto';

const STAGE_ORDER = ['IQC', 'QUALITY_MANAGER', 'PLANT_HEAD', 'FINAL_AUTHORITY'];

function isAuthorizedForStage(stage: string, user: any): boolean {
  const allRoles: string[] = user.allRoles || [user.role, ...(user.additionalRoles || [])];
  if (allRoles.includes('SUPER_ADMIN')) return true;
  switch (stage) {
    case 'IQC':
      return allRoles.some(r => ['QC_MANAGER', 'CORPORATE_ADMIN'].includes(r));
    case 'QUALITY_MANAGER':
      return allRoles.includes('QC_MANAGER');
    case 'PLANT_HEAD':
      return allRoles.includes('PLANT_HEAD');
    case 'FINAL_AUTHORITY':
      return allRoles.includes('FINAL_AUTHORITY');
    default:
      return false;
  }
}

const VENDOR_PICKUP_DAYS = 21;

@Injectable()
export class IqcEscalationService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private notifications: NotificationsService,
    private rejectedStock: RejectedStockService,
    private stockLedger: StockLedgerService,
  ) {}

  async createTemplate(dto: CreateIqcCheckTemplateDto, user: any) {
    const template = await this.prisma.iqcCheckTemplate.create({
      data: {
        companyId: user.companyId,
        rawMaterialId: dto.rawMaterialId,
        name: dto.name,
        docCode: dto.docCode,
        revision: dto.revision,
        createdBy: user.id, updatedBy: user.id,
        parameters: {
          create: dto.parameters.map((p, idx) => ({
            companyId: user.companyId,
            sNo: p.sNo,
            category: p.category,
            parameterName: p.parameterName,
            specification: p.specification,
            sortOrder: p.sortOrder ?? idx,
            createdBy: user.id, updatedBy: user.id,
          })),
        },
      },
      include: { parameters: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
    });
    await this.audit.log({ tableName: 'iqc_check_templates', recordId: template.id, action: 'CREATE', newValues: template, changedBy: user.id });
    return template;
  }

  async findAllTemplates(user: any, query: any) {
    const { search, rawMaterialId } = query;
    const where: any = { companyId: user.companyId, isActive: true };
    if (rawMaterialId) where.rawMaterialId = rawMaterialId;
    if (search) where.name = { contains: search, mode: 'insensitive' };
    return this.prisma.iqcCheckTemplate.findMany({
      where, orderBy: { name: 'asc' },
      include: { rawMaterial: { select: { code: true, name: true } }, _count: { select: { parameters: true } } },
    });
  }

  async findOneTemplate(id: string, user: any) {
    const template = await this.prisma.iqcCheckTemplate.findFirst({
      where: { id, companyId: user.companyId },
      include: { parameters: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } }, rawMaterial: { select: { code: true, name: true } } },
    });
    if (!template) throw new NotFoundException('Check template not found');
    return template;
  }

  async updateTemplate(id: string, dto: UpdateIqcCheckTemplateDto, user: any) {
    await this.findOneTemplate(id, user);
    await this.prisma.iqcCheckTemplate.update({
      where: { id },
      data: { name: dto.name, docCode: dto.docCode, revision: dto.revision, updatedBy: user.id },
    });
    if (dto.parameters) {
      await this.prisma.iqcCheckParameter.updateMany({ where: { templateId: id }, data: { isActive: false } });
      await this.prisma.iqcCheckParameter.createMany({
        data: dto.parameters.map((p, idx) => ({
          companyId: user.companyId, templateId: id,
          sNo: p.sNo, category: p.category, parameterName: p.parameterName,
          specification: p.specification, sortOrder: p.sortOrder ?? idx,
          createdBy: user.id, updatedBy: user.id,
        })),
      });
    }
    const result = await this.findOneTemplate(id, user);
    await this.audit.log({ tableName: 'iqc_check_templates', recordId: id, action: 'UPDATE', newValues: result, changedBy: user.id });
    return result;
  }

  async cloneTemplate(id: string, newName: string, user: any) {
    const source = await this.findOneTemplate(id, user);
    return this.createTemplate({
      name: newName,
      docCode: source.docCode ?? undefined,
      revision: source.revision ?? undefined,
      rawMaterialId: undefined,
      parameters: (source.parameters as any[]).map(p => ({
        sNo: p.sNo, category: p.category, parameterName: p.parameterName,
        specification: p.specification, sortOrder: p.sortOrder,
      })),
    }, user);
  }

  private itemIncludes() {
    return {
      template: { include: { parameters: { where: { isActive: true }, orderBy: { sortOrder: 'asc' as const } } } },
      stageResults: {
        where: { isActive: true },
        orderBy: { reviewedAt: 'asc' as const },
        include: { parameterResults: { include: { parameter: true } } },
      },
      iqc: {
        select: {
          iqcNumber: true, inspectionDate: true,
          grn: { select: { grnNumber: true, warehouseId: true, po: { select: { vendor: { select: { name: true } } } } } },
        },
      },
    };
  }

  async attachTemplate(itemId: string, dto: AttachTemplateDto, user: any) {
    const item = await this.prisma.iqcItem.findFirst({ where: { id: itemId, companyId: user.companyId } });
    if (!item) throw new NotFoundException('IQC item not found');
    await this.findOneTemplate(dto.templateId, user);

    const updated = await this.prisma.iqcItem.update({
      where: { id: itemId },
      data: { templateId: dto.templateId, sampleSize: dto.sampleSize, updatedBy: user.id },
      include: this.itemIncludes(),
    });
    await this.audit.log({ tableName: 'iqc_items', recordId: itemId, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async getItemEscalationDetail(itemId: string, user: any) {
    const item = await this.prisma.iqcItem.findFirst({
      where: { id: itemId, companyId: user.companyId },
      include: this.itemIncludes(),
    });
    if (!item) throw new NotFoundException('IQC item not found');
    return item;
  }

  async submitStageResult(itemId: string, dto: SubmitIqcStageResultDto, user: any) {
    if (dto.outcome !== 'PASS' && dto.outcome !== 'FAIL') {
      throw new BadRequestException('outcome must be PASS or FAIL');
    }
    if (!dto.remarks || !dto.remarks.trim()) {
      throw new BadRequestException('A remark explaining this decision is required');
    }

    const item = await this.getItemEscalationDetail(itemId, user);
    if (item.currentStage === 'CLOSED') throw new BadRequestException('This item is already closed');
    if (!isAuthorizedForStage(item.currentStage, user)) {
      throw new ForbiddenException(`You are not authorized to record a decision at the ${item.currentStage} stage`);
    }

    const stageResult = await this.prisma.iqcStageResult.create({
      data: {
        companyId: user.companyId,
        iqcItemId: itemId,
        stage: item.currentStage,
        outcome: dto.outcome,
        remarks: dto.remarks,
        reviewedBy: user.id,
        createdBy: user.id, updatedBy: user.id,
        parameterResults: dto.parameterResults ? {
          create: dto.parameterResults.map(pr => ({
            companyId: user.companyId,
            parameterId: pr.parameterId,
            s1: pr.s1, s2: pr.s2, s3: pr.s3, s4: pr.s4, s5: pr.s5,
            remark: pr.remark,
            createdBy: user.id, updatedBy: user.id,
          })),
        } : undefined,
      },
      include: { parameterResults: true },
    });

    if (dto.outcome === 'PASS') {
      await this.closeAsPass(itemId, user);
    } else {
      const currentIdx = STAGE_ORDER.indexOf(item.currentStage);
      const isTerminal = currentIdx === STAGE_ORDER.length - 1;
      if (isTerminal) {
        await this.closeAsFail(itemId, user);
      } else {
        const nextStage = STAGE_ORDER[currentIdx + 1];
        await this.prisma.iqcItem.update({ where: { id: itemId }, data: { currentStage: nextStage, updatedBy: user.id } });
        await this.notifyEscalation(itemId, nextStage, user);
      }
    }

    await this.audit.log({ tableName: 'iqc_stage_results', recordId: stageResult.id, action: 'CREATE', newValues: stageResult, changedBy: user.id });
    return this.getItemEscalationDetail(itemId, user);
  }

  private async closeAsPass(itemId: string, user: any) {
    const item = await this.prisma.iqcItem.findFirst({ where: { id: itemId } });
    if (!item) return;

    await this.prisma.iqcItem.update({
      where: { id: itemId },
      data: {
        currentStage: 'CLOSED', finalOutcome: 'PASS',
        acceptedQty: item.acceptedQty === 0 && item.rejectedQty === 0 ? item.receivedQty : item.acceptedQty,
        updatedBy: user.id,
      },
    });

    await this.maybeCloseInspection(item.iqcId, user);
  }

  private async closeAsFail(itemId: string, user: any) {
    const item = await this.prisma.iqcItem.findFirst({ where: { id: itemId } });
    if (!item) return;

    await this.prisma.iqcItem.update({
      where: { id: itemId },
      data: { currentStage: 'CLOSED', finalOutcome: 'FAIL', acceptedQty: 0, rejectedQty: item.receivedQty, updatedBy: user.id },
    });

    await this.maybeCloseInspection(item.iqcId, user);
  }

  private async maybeCloseInspection(iqcId: string, user: any) {
    const iqc = await this.prisma.iqcInspection.findFirst({ where: { id: iqcId }, include: { items: { where: { isActive: true } } } });
    if (!iqc) return;
    const allClosed = iqc.items.every(i => i.currentStage === 'CLOSED');
    if (!allClosed) return;

    await this.prisma.iqcInspection.update({ where: { id: iqcId }, data: { status: 'APPROVED', updatedBy: user.id } });
    await this.stockLedger.receiveFromIqc(iqcId, user);

    const refreshed = await this.prisma.iqcInspection.findFirst({ where: { id: iqcId }, include: { items: { where: { isActive: true } } } });
    if (!refreshed) return;
    for (const item of refreshed.items) {
      await this.prisma.grnItem.update({
        where: { id: item.grnItemId },
        data: { acceptedQty: item.acceptedQty, rejectedQty: item.rejectedQty, updatedBy: user.id },
      });
    }
    const totalAccepted = refreshed.items.reduce((s, i) => s + i.acceptedQty, 0);
    const totalReceived = refreshed.items.reduce((s, i) => s + i.receivedQty, 0);
    const totalRejected = refreshed.items.reduce((s, i) => s + i.rejectedQty, 0);
    let grnStatus = 'ACCEPTED';
    if (totalRejected > 0 && totalAccepted > 0) grnStatus = 'PARTIALLY_ACCEPTED';
    else if (totalRejected === totalReceived) grnStatus = 'ACCEPTED';
    await this.prisma.grnHeader.update({ where: { id: refreshed.grnId }, data: { status: grnStatus, updatedBy: user.id } });

    if (totalRejected > 0) {
      const existing = await this.prisma.rejectedStock.findFirst({ where: { iqcId, companyId: user.companyId } });
      if (!existing) {
        const rejected = await this.rejectedStock.createFromIqc(iqcId, user);
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + VENDOR_PICKUP_DAYS);
        await this.prisma.rejectedStockItem.updateMany({
          where: { rejectedStockId: rejected.id },
          data: { disposition: 'RTV', vendorPickupDeadline: deadline, vendorNotifiedAt: new Date(), updatedBy: user.id },
        });

        const targets = await this.prisma.user.findMany({
          where: { companyId: user.companyId, isActive: true, role: { in: ['FINANCE_MANAGER', 'PURCHASE_MANAGER'] } },
          select: { id: true },
        });
        if (targets.length > 0) {
          await this.notifications.createBulk(
            targets.map(t => ({
              userId: t.id,
              type: 'QUALITY_ALERT',
              title: `Material rejected — vendor return required`,
              message: `${(rejected as any).rejectionNumber} failed final IQC review and is dead stock pending vendor pickup within ${VENDOR_PICKUP_DAYS} days.`,
              referenceType: 'REJECTED_STOCK', referenceId: rejected.id, referenceNumber: (rejected as any).rejectionNumber,
              priority: 'HIGH',
            })) as any,
            user.companyId, user.id,
          );
        }
      }
    }
  }

  private async notifyEscalation(itemId: string, nextStage: string, user: any) {
    const item = await this.prisma.iqcItem.findFirst({ where: { id: itemId }, include: { iqc: { select: { iqcNumber: true } } } });
    const roleForStage: Record<string, string[]> = {
      QUALITY_MANAGER: ['QC_MANAGER'],
      PLANT_HEAD: ['PLANT_HEAD'],
      FINAL_AUTHORITY: ['FINAL_AUTHORITY'],
    };
    const roles = roleForStage[nextStage] || [];
    const targets = await this.prisma.user.findMany({
      where: { companyId: user.companyId, isActive: true, OR: [{ role: { in: roles } }, { additionalRoles: { hasSome: roles } }, { role: 'SUPER_ADMIN' }] },
      select: { id: true },
    });
    if (targets.length === 0) return;
    await this.notifications.createBulk(
      targets.map(t => ({
        userId: t.id,
        type: 'QUALITY_ALERT',
        title: `IQC escalated to ${nextStage.replace('_', ' ')}`,
        message: `${(item as any)?.iqc?.iqcNumber} — ${item?.itemName} failed review and needs your decision.`,
        referenceType: 'IQC_ITEM', referenceId: itemId, referenceNumber: (item as any)?.iqc?.iqcNumber,
        priority: 'HIGH',
      })) as any,
      user.companyId, user.id,
    );
  }
}
