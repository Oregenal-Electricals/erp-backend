import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateTaskDto, UpdateTaskDto, UpdateTaskStatusDto, AddCommentDto } from './dto/task.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private async generateNumber(companyId: string): Promise<string> {
    const count = await this.prisma.task.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `TASK-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private includes() {
    return { comments: { orderBy: { createdAt: 'asc' as const } } };
  }

  async create(dto: CreateTaskDto, user: any) {
    const taskNumber = await this.generateNumber(user.companyId);
    const task = await this.prisma.task.create({
      data: {
        taskNumber, title: dto.title, description: dto.description,
        assignedTo: dto.assignedTo, assignedBy: user.id,
        dueDate: new Date(dto.dueDate),
        priority: dto.priority || 'MEDIUM',
        category: dto.category || 'GENERAL',
        referenceType: dto.referenceType, referenceId: dto.referenceId,
        referenceNumber: dto.referenceNumber,
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
      },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'tasks', recordId: task.id, action: 'CREATE', newValues: task, changedBy: user.id });
    return task;
  }

  async update(id: string, dto: UpdateTaskDto, user: any) {
    const task = await this.prisma.task.findFirst({ where: { id, companyId: user.companyId } });
    if (!task) throw new NotFoundException('Task not found');
    if (['COMPLETED','CANCELLED'].includes(task.status)) throw new BadRequestException(`Cannot edit ${task.status} task`);

    const updated = await this.prisma.task.update({
      where: { id },
      data: { ...dto, dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined, updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'tasks', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async updateStatus(id: string, dto: UpdateTaskStatusDto, user: any) {
    const task = await this.prisma.task.findFirst({ where: { id, companyId: user.companyId } });
    if (!task) throw new NotFoundException('Task not found');
    if (task.status === 'CANCELLED') throw new BadRequestException('Cannot update cancelled task');

    const data: any = { status: dto.status, updatedBy: user.id };
    if (dto.status === 'COMPLETED') { data.completedDate = new Date(); data.completionNote = dto.completionNote; }
    // startedDate not in schema - track via updatedAt

    const updated = await this.prisma.task.update({ where: { id }, data, include: this.includes() });
    await this.audit.log({ tableName: 'tasks', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async addComment(id: string, dto: AddCommentDto, user: any) {
    const task = await this.prisma.task.findFirst({ where: { id, companyId: user.companyId } });
    if (!task) throw new NotFoundException('Task not found');

    const comment = await this.prisma.taskComment.create({
      data: { taskId: id, comment: dto.comment, commentBy: user.id, companyId: user.companyId, createdBy: user.id, updatedBy: user.id },
    });
    return comment;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, status, priority, category, assignedTo, myTasks, search } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { companyId: user.companyId, isActive: true };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;
    if (assignedTo) where.assignedTo = assignedTo;
    if (myTasks === 'true') where.assignedTo = user.id;
    if (search) where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { taskNumber: { contains: search, mode: 'insensitive' } },
      { referenceNumber: { contains: search, mode: 'insensitive' } },
    ];

    const [data, total] = await Promise.all([
      this.prisma.task.findMany({ where, skip, take: Number(limit), orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }], include: { _count: { select: { comments: true } } } }),
      this.prisma.task.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const task = await this.prisma.task.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async getStats(user: any) {
    const where: any = { companyId: user.companyId, isActive: true };
    const now = new Date();
    const [total, open, inProgress, completed, cancelled, myOpen, overdue] = await Promise.all([
      this.prisma.task.count({ where }),
      this.prisma.task.count({ where: { ...where, status: 'OPEN' } }),
      this.prisma.task.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      this.prisma.task.count({ where: { ...where, status: 'COMPLETED' } }),
      this.prisma.task.count({ where: { ...where, status: 'CANCELLED' } }),
      this.prisma.task.count({ where: { ...where, assignedTo: user.id, status: { in: ['OPEN','IN_PROGRESS'] } } }),
      this.prisma.task.count({ where: { ...where, status: { in: ['OPEN','IN_PROGRESS'] }, dueDate: { lt: now } } }),
    ]);
    return { total, open, inProgress, completed, cancelled, myOpen, overdue };
  }
}
