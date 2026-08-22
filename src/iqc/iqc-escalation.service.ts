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

  async attachTemplate(iqcId: string, dto: AttachTemplateDto, user: any) {
    const iqc = await this.prisma.iqcInspection.findFirst({ where: { id: iqcId, companyId: user.companyId } });
    if (!iqc) throw new NotFoundException('IQC inspection not found');
    await this.findOneTemplate(dto.templateId, user);

    const updated = await this.prisma.iqcInspection.update({
      where: { id: iqcId },
      data: {
        templateId: dto.templateId,
        lotQuantity: dto.lotQuantity,
        sampleSize: dto.sampleSize,
        mrirNo: dto.mrirNo,
        supplierName: dto.supplierName,
        updatedBy: user.id,
      },
    });
    await this.audit.log({ tableName: 'iqc_inspections', recordId: iqcId, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async getEscalationDetail(iqcId: string, user: any) {
    const iqc = await this.prisma.iqcInspection.findFirst({
      where: { id: iqcId, companyId: user.companyId },
      include: {
        template: { include: { parameters: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } } },
        stageResults: {
          where: { isActive: true },
          orderBy: { reviewedAt: 'asc' },
          include: { parameterResults: { include: { parameter: true } } },
        },
        grn: { select: { grnNumber: true, warehouseId: true, warehouse: { select: { name: true } } } },
        items: { where: { isActive: true } },
      },
    });
    if (!iqc) throw new NotFoundException('IQC inspection not found');
    return iqc;
  }

  async submitStageResult(iqcId: string, dto: SubmitIqcStageResultDto, user: any) {
    if (dto.outcome !== 'PASS' && dto.outcome !== 'FAIL') {
      throw new BadRequestException('outcome must be PASS or FAIL');
    }
    if (!dto.remarks || !dto.remarks.trim()) {
      throw new BadRequestException('A remark explaining this decision is required');
    }

    const iqc = await this.getEscalationDetail(iqcId, user);
    if (iqc.currentStage === 'CLOSED') throw new BadRequestException('This inspection is already closed');
    if (!isAuthorizedForStage(iqc.currentStage, user)) {
      throw new ForbiddenException(`You are not authorized to record a decision at the ${iqc.currentStage} stage`);
    }

    const stageResult = await this.prisma.iqcStageResult.create({
      data: {
        companyId: user.companyId,
        iqcId,
        stage: iqc.currentStage,
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
      await this.closeAsPass(iqcId, user);
    } else {
      const currentIdx = STAGE_ORDER.indexOf(iqc.currentStage);
      const isTerminal = currentIdx === STAGE_ORDER.length - 1;
      if (isTerminal) {
        await this.closeAsFail(iqcId, user);
      } else {
        const nextStage = STAGE_ORDER[currentIdx + 1];
        await this.prisma.iqcInspection.update({
          where: { id: iqcId },
          data: { currentStage: nextStage, updatedBy: user.id },
        });
        await this.notifyEscalation(iqcId, nextStage, user);
      }
    }

    await this.audit.log({ tableName: 'iqc_stage_results', recordId: stageResult.id, action: 'CREATE', newValues: stageResult, changedBy: user.id });
    return this.getEscalationDetail(iqcId, user);
  }

  private async closeAsPass(iqcId: string, user: any) {
    const iqc = await this.prisma.iqcInspection.findFirst({ where: { id: iqcId }, include: { items: { where: { isActive: true } } } });
    if (!iqc) return;

    await this.prisma.iqcInspection.update({
      where: { id: iqcId },
      data: { currentStage: 'CLOSED', finalOutcome: 'PASS', status: 'APPROVED', updatedBy: user.id },
    });

    for (const item of iqc.items) {
      if (item.acceptedQty === 0 && item.rejectedQty === 0) {
        await this.prisma.iqcItem.update({ where: { id: item.id }, data: { acceptedQty: item.receivedQty, updatedBy: user.id } });
      }
    }

    await this.stockLedger.receiveFromIqc(iqcId, user);

    const refreshed = await this.prisma.iqcInspection.findFirst({ where: { id: iqcId }, include: { items: { where: { isActive: true } } } });
    if (refreshed) {
      for (const item of refreshed.items) {
        await this.prisma.grnItem.update({
          where: { id: item.grnItemId },
          data: { acceptedQty: item.acceptedQty, rejectedQty: item.rejectedQty, updatedBy: user.id },
        });
      }
      await this.prisma.grnHeader.update({ where: { id: refreshed.grnId }, data: { status: 'ACCEPTED', updatedBy: user.id } });
    }
  }

  private async closeAsFail(iqcId: string, user: any) {
    const iqc = await this.prisma.iqcInspection.findFirst({ where: { id: iqcId }, include: { items: { where: { isActive: true } } } });
    if (!iqc) return;

    await this.prisma.iqcInspection.update({
      where: { id: iqcId },
      data: { currentStage: 'CLOSED', finalOutcome: 'FAIL', status: 'APPROVED', updatedBy: user.id },
    });

    for (const item of iqc.items) {
      await this.prisma.iqcItem.update({
        where: { id: item.id },
        data: { acceptedQty: 0, rejectedQty: item.receivedQty, updatedBy: user.id },
      });
    }

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

  private async notifyEscalation(iqcId: string, nextStage: string, user: any) {
    const iqc = await this.prisma.iqcInspection.findFirst({ where: { id: iqcId } });
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
        message: `${(iqc as any)?.iqcNumber} failed review and needs your decision.`,
        referenceType: 'IQC', referenceId: iqcId, referenceNumber: (iqc as any)?.iqcNumber,
        priority: 'HIGH',
      })) as any,
      user.companyId, user.id,
    );
  }
}
