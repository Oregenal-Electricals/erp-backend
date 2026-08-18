import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { WorkflowsService } from '../workflows/workflows.service';
import { STAGE_BYPASS_ROLES } from '../common/constants/roles.constant';
import {
  ALL_TABLE_NAMES, HAS_COMPANY_ID, HAS_IS_ACTIVE,
  COMPANY_ID_COLUMN, IS_ACTIVE_COLUMN, buildColumnMap,
} from '../common/utils/schema-columns.util';

const UPDATED_BY_COLUMN = buildColumnMap('updatedBy');
const UPDATED_AT_COLUMN = buildColumnMap('updatedAt');

// Tried in this order to build a human-readable label for the approver to
// see - real tables vary too much to cover every possible name, so this
// stays a short, generic priority list rather than a per-table mapping
// that would need updating every time a new module is added.
const LABEL_FIELD_PRIORITY = [
  'name', 'code', 'title', 'label', 'woNumber', 'poNumber', 'soNumber',
  'cpoNumber', 'bomNumber', 'invoiceNumber', 'employeeCode', 'email', 'firstName',
];

/**
 * Generic delete-with-approval, works for any table via tableName/recordId
 * rather than a bespoke model per module - this is deliberate: retrofitting
 * every module's own delete button to use this happens incrementally,
 * module by module, but the underlying engine supports all of them from
 * day one rather than needing rebuilding each time.
 *
 * Reuses the exact same STAGE_BYPASS_ROLES self-approve gate and
 * WorkflowsService approval engine already used for Work Order Start/
 * Restart/Reassign Qty - a real Plant-Head-or-above deletes immediately;
 * a Test Account also always executes immediately, since test data isn't
 * real and gets purged wholesale anyway - approval friction would defeat
 * the point of a frictionless test account. Everyone else's delete becomes
 * a request with a mandatory reason, reviewed and approved/rejected by a
 * supervisor before anything actually changes. "Delete" always means the
 * existing isActive=false soft-delete convention already used everywhere
 * in this system - never a real SQL DELETE.
 */
@Injectable()
export class DeleteRequestService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private workflows: WorkflowsService,
  ) {}

  private validateTable(tableName: string) {
    if (!ALL_TABLE_NAMES.has(tableName)) throw new BadRequestException(`Unknown table: ${tableName}`);
    if (!HAS_IS_ACTIVE.has(tableName)) throw new BadRequestException(`${tableName} does not support soft delete`);
  }

  private async fetchRecordAndLabel(tableName: string, recordId: string, companyId: string) {
    const scoped = HAS_COMPANY_ID.has(tableName);
    const compCol = COMPANY_ID_COLUMN.get(tableName) || 'companyId';
    const activeCol = IS_ACTIVE_COLUMN.get(tableName) || 'isActive';
    const sql = scoped
      ? `SELECT * FROM "${tableName}" WHERE "id" = $1 AND "${compCol}" = $2`
      : `SELECT * FROM "${tableName}" WHERE "id" = $1`;
    const rows = scoped
      ? await this.prisma.$queryRawUnsafe<any[]>(sql, recordId, companyId)
      : await this.prisma.$queryRawUnsafe<any[]>(sql, recordId);
    const record = rows[0];
    if (!record) throw new NotFoundException('Record not found');
    if (record[activeCol] === false) throw new BadRequestException('This record is already inactive');

    let label = '';
    for (const field of LABEL_FIELD_PRIORITY) {
      if (record[field]) { label = String(record[field]); break; }
    }
    if (!label) label = `${tableName} ${String(recordId).slice(0, 8)}`;

    return { record, label, activeCol, compCol, scoped };
  }

  private async deactivate(tableName: string, recordId: string, activeCol: string, userId: string) {
    const updatedByCol = UPDATED_BY_COLUMN.get(tableName);
    const updatedAtCol = UPDATED_AT_COLUMN.get(tableName);
    // Prisma's automatic @updatedAt bump only fires for Prisma Client
    // calls, not raw SQL - without setting it explicitly here, an
    // approved/auto-executed delete left updatedAt silently stale despite
    // the row genuinely changing, found by actually checking the record
    // after a test run rather than trusting the deactivate call alone.
    const setClauses = [`"${activeCol}" = false`];
    const params: any[] = [recordId];
    if (updatedAtCol) setClauses.push(`"${updatedAtCol}" = now()`);
    if (updatedByCol) { params.push(userId); setClauses.push(`"${updatedByCol}" = $${params.length}`); }
    const sql = `UPDATE "${tableName}" SET ${setClauses.join(', ')} WHERE "id" = $1`;
    await this.prisma.$executeRawUnsafe(sql, ...params);
  }

  async create(tableName: string, recordId: string, reason: string, user: any) {
    this.validateTable(tableName);
    const { label, activeCol } = await this.fetchRecordAndLabel(tableName, recordId, user.companyId);

    const skipApproval = STAGE_BYPASS_ROLES.includes(user.role) || user.isTestUser === true;

    if (skipApproval) {
      await this.deactivate(tableName, recordId, activeCol, user.id);
      const dr = await this.prisma.deleteRequest.create({
        data: {
          companyId: user.companyId, tableName, recordId, recordLabel: label, reason,
          status: 'AUTO_EXECUTED', requestedBy: user.id, decidedBy: user.id, decidedAt: new Date(),
          createdBy: user.id, updatedBy: user.id,
        },
      });
      await this.audit.log({
        tableName, recordId, action: 'DELETE',
        newValues: { isActive: false }, changedBy: user.id, reason,
      });
      return { ...dr, pendingApproval: false };
    }

    const dr = await this.prisma.deleteRequest.create({
      data: {
        companyId: user.companyId, tableName, recordId, recordLabel: label, reason,
        status: 'PENDING', requestedBy: user.id,
        createdBy: user.id, updatedBy: user.id,
      },
    });

    const { request } = await this.workflows.submit({
      documentType: 'DELETE_REQUEST', documentId: dr.id, documentNumber: label,
      remarks: `Delete request for ${tableName} "${label}": ${reason}`,
    }, user);

    const updated = await this.prisma.deleteRequest.update({
      where: { id: dr.id }, data: { approvalRequestId: request?.id },
    });

    return { ...updated, pendingApproval: true, message: 'Submitted for approval - the record is still active until approved' };
  }

  async approve(id: string, user: any) {
    const dr = await this.prisma.deleteRequest.findFirst({ where: { id, companyId: user.companyId } });
    if (!dr) throw new NotFoundException('Delete request not found');
    if (dr.status !== 'PENDING') throw new BadRequestException(`Request is already ${dr.status}`);
    if (!dr.approvalRequestId) throw new BadRequestException('This request has no linked approval - cannot approve');

    const result = await this.workflows.act(dr.approvalRequestId, { action: 'APPROVED' }, user);

    if (result.status === 'APPROVED') {
      const activeCol = IS_ACTIVE_COLUMN.get(dr.tableName) || 'isActive';
      await this.deactivate(dr.tableName, dr.recordId, activeCol, user.id);
      await this.audit.log({
        tableName: dr.tableName, recordId: dr.recordId, action: 'DELETE',
        newValues: { isActive: false }, changedBy: user.id, reason: dr.reason,
      });
      return this.prisma.deleteRequest.update({
        where: { id }, data: { status: 'APPROVED', decidedBy: user.id, decidedAt: new Date(), updatedBy: user.id },
      });
    }
    return dr;
  }

  async reject(id: string, user: any, comments?: string) {
    const dr = await this.prisma.deleteRequest.findFirst({ where: { id, companyId: user.companyId } });
    if (!dr) throw new NotFoundException('Delete request not found');
    if (dr.status !== 'PENDING') throw new BadRequestException(`Request is already ${dr.status}`);
    if (!dr.approvalRequestId) throw new BadRequestException('This request has no linked approval - cannot reject');

    await this.workflows.act(dr.approvalRequestId, { action: 'REJECTED', comments }, user);
    return this.prisma.deleteRequest.update({
      where: { id }, data: { status: 'REJECTED', decidedBy: user.id, decidedAt: new Date(), updatedBy: user.id },
    });
  }

  private async attachRequesterNames(requests: any[]) {
    const userIds = [...new Set(requests.map((r) => r.requestedBy))];
    if (userIds.length === 0) return requests;
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true },
    });
    const nameMap = new Map(users.map((u) => [u.id, `${u.firstName} ${u.lastName}`.trim()]));
    return requests.map((r) => ({ ...r, requestedByName: nameMap.get(r.requestedBy) || 'Unknown' }));
  }

  async listPending(user: any) {
    const requests = await this.prisma.deleteRequest.findMany({
      where: { companyId: user.companyId, status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
    });
    return this.attachRequesterNames(requests);
  }

  async listMine(user: any) {
    return this.prisma.deleteRequest.findMany({
      where: { companyId: user.companyId, requestedBy: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
