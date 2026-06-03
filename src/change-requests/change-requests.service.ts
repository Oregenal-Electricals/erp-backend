import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { SettingsService } from '../settings/settings.service';
import {
  CreateChangeRequestDto,
  UpdateChangeRequestDto,
  ReviewChangeRequestDto,
  AddCommentDto,
} from './dto/change-request.dto';
import { ChangeRequestStatus, UserRole } from '@prisma/client';

// Roles that can approve/reject
const APPROVER_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.CORPORATE_ADMIN,
  UserRole.PLANT_HEAD,
  UserRole.FINANCE_MANAGER,
  UserRole.HR_MANAGER,
];

@Injectable()
export class ChangeRequestsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private settings: SettingsService,
  ) {}

  // ─────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────
  async create(dto: CreateChangeRequestDto, user: any) {
    // Generate request number
    let requestNumber: string;
    try {
      requestNumber = await this.settings.getNextNumber(user.companyId, 'CR');
    } catch {
      // If CR series not set up, generate manually
      const count = await this.prisma.changeRequest.count({
        where: { companyId: user.companyId },
      });
      const now = new Date();
      const fy =
        now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
      requestNumber = `CR-${String(fy).slice(2)}-${String(fy + 1).slice(2)}-${String(count + 1).padStart(4, '0')}`;
    }

    const cr = await this.prisma.changeRequest.create({
      data: {
        requestNumber,
        title: dto.title,
        description: dto.description,
        type: dto.type,
        priority: dto.priority ?? 'NORMAL',
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        companyId: user.companyId,
        requestedById: user.id,
        createdBy: user.id,
        updatedBy: user.id,
      },
      include: this.includeRelations(),
    });

    await this.audit.log({
      tableName: 'change_requests',
      recordId: cr.id,
      action: 'CREATE',
      newValues: { requestNumber, title: dto.title, type: dto.type },
      changedBy: user.id,
    });

    return cr;
  }

  // ─────────────────────────────────────────────
  // LIST
  // ─────────────────────────────────────────────
  async findAll(
    user: any,
    filters: {
      status?: ChangeRequestStatus;
      type?: string;
      myRequests?: boolean;
      pendingApproval?: boolean;
    },
  ) {
    const where: any = { companyId: user.companyId };

    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;

    // My requests only
    if (filters.myRequests) {
      where.requestedById = user.id;
    }

    // Pending approval — for approvers only
    if (filters.pendingApproval && APPROVER_ROLES.includes(user.role)) {
      where.status = { in: ['SUBMITTED', 'UNDER_REVIEW'] };
    }

    // Non-approvers only see their own requests
    if (!APPROVER_ROLES.includes(user.role) && !filters.myRequests) {
      where.requestedById = user.id;
    }

    return this.prisma.changeRequest.findMany({
      where,
      include: this.includeRelations(),
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─────────────────────────────────────────────
  // GET ONE
  // ─────────────────────────────────────────────
  async findOne(id: string, user: any) {
    const cr = await this.prisma.changeRequest.findUnique({
      where: { id },
      include: {
        ...this.includeRelations(),
        comments: {
          include: {
            commenter: {
              select: { id: true, firstName: true, lastName: true, role: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!cr) throw new NotFoundException('Change request not found');

    // Check access
    const canView =
      APPROVER_ROLES.includes(user.role) || cr.requestedById === user.id;
    if (!canView)
      throw new ForbiddenException('You can only view your own requests');

    // Auto-set to UNDER_REVIEW when approver opens it
    if (
      cr.status === ChangeRequestStatus.SUBMITTED &&
      APPROVER_ROLES.includes(user.role)
    ) {
      await this.prisma.changeRequest.update({
        where: { id },
        data: { status: ChangeRequestStatus.UNDER_REVIEW, updatedBy: user.id },
      });
      cr.status = ChangeRequestStatus.UNDER_REVIEW;
    }

    return cr;
  }

  // ─────────────────────────────────────────────
  // UPDATE (DRAFT only)
  // ─────────────────────────────────────────────
  async update(id: string, dto: UpdateChangeRequestDto, user: any) {
    const cr = await this.prisma.changeRequest.findUnique({ where: { id } });
    if (!cr) throw new NotFoundException('Change request not found');
    if (cr.requestedById !== user.id)
      throw new ForbiddenException('You can only edit your own requests');
    if (cr.status !== ChangeRequestStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT requests can be edited');
    }

    const updated = await this.prisma.changeRequest.update({
      where: { id },
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        updatedBy: user.id,
      },
      include: this.includeRelations(),
    });

    await this.audit.log({
      tableName: 'change_requests',
      recordId: id,
      action: 'UPDATE',
      oldValues: cr,
      newValues: dto,
      changedBy: user.id,
    });

    return updated;
  }

  // ─────────────────────────────────────────────
  // SUBMIT
  // ─────────────────────────────────────────────
  async submit(id: string, user: any) {
    const cr = await this.prisma.changeRequest.findUnique({ where: { id } });
    if (!cr) throw new NotFoundException('Change request not found');
    if (cr.requestedById !== user.id)
      throw new ForbiddenException('You can only submit your own requests');
    if (cr.status !== ChangeRequestStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT requests can be submitted');
    }

    const updated = await this.prisma.changeRequest.update({
      where: { id },
      data: {
        status: ChangeRequestStatus.SUBMITTED,
        submittedAt: new Date(),
        updatedBy: user.id,
      },
      include: this.includeRelations(),
    });

    await this.audit.log({
      tableName: 'change_requests',
      recordId: id,
      action: 'UPDATE',
      oldValues: { status: 'DRAFT' },
      newValues: { status: 'SUBMITTED' },
      changedBy: user.id,
      reason: 'Request submitted for approval',
    });

    return updated;
  }

  // ─────────────────────────────────────────────
  // APPROVE
  // ─────────────────────────────────────────────
  async approve(id: string, dto: ReviewChangeRequestDto, user: any) {
    if (!APPROVER_ROLES.includes(user.role)) {
      throw new ForbiddenException(
        'You do not have permission to approve requests',
      );
    }

    const cr = await this.prisma.changeRequest.findUnique({ where: { id } });
    if (!cr) throw new NotFoundException('Change request not found');
    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(cr.status)) {
      throw new BadRequestException(
        'Only SUBMITTED or UNDER_REVIEW requests can be approved',
      );
    }

    const updated = await this.prisma.changeRequest.update({
      where: { id },
      data: {
        status: ChangeRequestStatus.APPROVED,
        reviewedById: user.id,
        reviewedAt: new Date(),
        reviewComment: dto.reviewComment,
        updatedBy: user.id,
      },
      include: this.includeRelations(),
    });

    await this.audit.log({
      tableName: 'change_requests',
      recordId: id,
      action: 'UPDATE',
      oldValues: { status: cr.status },
      newValues: { status: 'APPROVED' },
      changedBy: user.id,
      reason: `Approved: ${dto.reviewComment}`,
    });

    return updated;
  }

  // ─────────────────────────────────────────────
  // REJECT
  // ─────────────────────────────────────────────
  async reject(id: string, dto: ReviewChangeRequestDto, user: any) {
    if (!APPROVER_ROLES.includes(user.role)) {
      throw new ForbiddenException(
        'You do not have permission to reject requests',
      );
    }

    const cr = await this.prisma.changeRequest.findUnique({ where: { id } });
    if (!cr) throw new NotFoundException('Change request not found');
    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(cr.status)) {
      throw new BadRequestException(
        'Only SUBMITTED or UNDER_REVIEW requests can be rejected',
      );
    }

    const updated = await this.prisma.changeRequest.update({
      where: { id },
      data: {
        status: ChangeRequestStatus.REJECTED,
        reviewedById: user.id,
        reviewedAt: new Date(),
        reviewComment: dto.reviewComment,
        updatedBy: user.id,
      },
      include: this.includeRelations(),
    });

    await this.audit.log({
      tableName: 'change_requests',
      recordId: id,
      action: 'UPDATE',
      oldValues: { status: cr.status },
      newValues: { status: 'REJECTED' },
      changedBy: user.id,
      reason: `Rejected: ${dto.reviewComment}`,
    });

    return updated;
  }

  // ─────────────────────────────────────────────
  // CANCEL
  // ─────────────────────────────────────────────
  async cancel(id: string, user: any) {
    const cr = await this.prisma.changeRequest.findUnique({ where: { id } });
    if (!cr) throw new NotFoundException('Change request not found');
    if (cr.requestedById !== user.id && !APPROVER_ROLES.includes(user.role)) {
      throw new ForbiddenException('You can only cancel your own requests');
    }
    if (['APPROVED', 'REJECTED', 'CANCELLED'].includes(cr.status)) {
      throw new BadRequestException(`Cannot cancel a ${cr.status} request`);
    }

    const updated = await this.prisma.changeRequest.update({
      where: { id },
      data: { status: ChangeRequestStatus.CANCELLED, updatedBy: user.id },
      include: this.includeRelations(),
    });

    await this.audit.log({
      tableName: 'change_requests',
      recordId: id,
      action: 'UPDATE',
      oldValues: { status: cr.status },
      newValues: { status: 'CANCELLED' },
      changedBy: user.id,
      reason: 'Request cancelled',
    });

    return updated;
  }

  // ─────────────────────────────────────────────
  // ADD COMMENT
  // ─────────────────────────────────────────────
  async addComment(id: string, dto: AddCommentDto, user: any) {
    const cr = await this.prisma.changeRequest.findUnique({ where: { id } });
    if (!cr) throw new NotFoundException('Change request not found');

    const canComment =
      APPROVER_ROLES.includes(user.role) || cr.requestedById === user.id;
    if (!canComment)
      throw new ForbiddenException('You cannot comment on this request');

    const comment = await this.prisma.changeRequestComment.create({
      data: {
        changeRequestId: id,
        comment: dto.comment,
        commentBy: user.id,
        createdBy: user.id,
        updatedBy: user.id,
      },
      include: {
        commenter: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
    });

    return comment;
  }

  // ─────────────────────────────────────────────
  // STATS
  // ─────────────────────────────────────────────
  async getStats(user: any) {
    const base = { companyId: user.companyId };
    const myBase = { companyId: user.companyId, requestedById: user.id };

    const [
      total,
      draft,
      submitted,
      underReview,
      approved,
      rejected,
      myTotal,
      pendingApproval,
    ] = await Promise.all([
      this.prisma.changeRequest.count({ where: base }),
      this.prisma.changeRequest.count({ where: { ...base, status: 'DRAFT' } }),
      this.prisma.changeRequest.count({
        where: { ...base, status: 'SUBMITTED' },
      }),
      this.prisma.changeRequest.count({
        where: { ...base, status: 'UNDER_REVIEW' },
      }),
      this.prisma.changeRequest.count({
        where: { ...base, status: 'APPROVED' },
      }),
      this.prisma.changeRequest.count({
        where: { ...base, status: 'REJECTED' },
      }),
      this.prisma.changeRequest.count({ where: myBase }),
      this.prisma.changeRequest.count({
        where: { ...base, status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } },
      }),
    ]);

    return {
      total,
      draft,
      submitted,
      underReview,
      approved,
      rejected,
      myTotal,
      pendingApproval,
    };
  }

  // ─────────────────────────────────────────────
  private includeRelations() {
    return {
      company: { select: { id: true, name: true, code: true } },
      requestedBy: {
        select: { id: true, firstName: true, lastName: true, role: true },
      },
      reviewedBy: {
        select: { id: true, firstName: true, lastName: true, role: true },
      },
    };
  }
}
