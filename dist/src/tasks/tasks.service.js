"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let TasksService = class TasksService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async generateNumber(companyId) {
        const count = await this.prisma.task.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `TASK-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    includes() {
        return { comments: { orderBy: { createdAt: 'asc' } } };
    }
    async create(dto, user) {
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
    async update(id, dto, user) {
        const task = await this.prisma.task.findFirst({ where: { id, companyId: user.companyId } });
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        if (['COMPLETED', 'CANCELLED'].includes(task.status))
            throw new common_1.BadRequestException(`Cannot edit ${task.status} task`);
        const updated = await this.prisma.task.update({
            where: { id },
            data: Object.assign(Object.assign({}, dto), { dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined, updatedBy: user.id }),
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'tasks', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async updateStatus(id, dto, user) {
        const task = await this.prisma.task.findFirst({ where: { id, companyId: user.companyId } });
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        if (task.status === 'CANCELLED')
            throw new common_1.BadRequestException('Cannot update cancelled task');
        const data = { status: dto.status, updatedBy: user.id };
        if (dto.status === 'COMPLETED') {
            data.completedDate = new Date();
            data.completionNote = dto.completionNote;
        }
        const updated = await this.prisma.task.update({ where: { id }, data, include: this.includes() });
        await this.audit.log({ tableName: 'tasks', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async addComment(id, dto, user) {
        const task = await this.prisma.task.findFirst({ where: { id, companyId: user.companyId } });
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        const comment = await this.prisma.taskComment.create({
            data: { taskId: id, comment: dto.comment, commentBy: user.id, companyId: user.companyId, createdBy: user.id, updatedBy: user.id },
        });
        return comment;
    }
    async findAll(user, query) {
        const { page = 1, limit = 20, status, priority, category, assignedTo, myTasks, search } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = { companyId: user.companyId, isActive: true };
        if (status)
            where.status = status;
        if (priority)
            where.priority = priority;
        if (category)
            where.category = category;
        if (assignedTo)
            where.assignedTo = assignedTo;
        if (myTasks === 'true')
            where.assignedTo = user.id;
        if (search)
            where.OR = [
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
    async findOne(id, user) {
        const task = await this.prisma.task.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        return task;
    }
    async getStats(user) {
        const where = { companyId: user.companyId, isActive: true };
        const now = new Date();
        const [total, open, inProgress, completed, cancelled, myOpen, overdue] = await Promise.all([
            this.prisma.task.count({ where }),
            this.prisma.task.count({ where: Object.assign(Object.assign({}, where), { status: 'OPEN' }) }),
            this.prisma.task.count({ where: Object.assign(Object.assign({}, where), { status: 'IN_PROGRESS' }) }),
            this.prisma.task.count({ where: Object.assign(Object.assign({}, where), { status: 'COMPLETED' }) }),
            this.prisma.task.count({ where: Object.assign(Object.assign({}, where), { status: 'CANCELLED' }) }),
            this.prisma.task.count({ where: Object.assign(Object.assign({}, where), { assignedTo: user.id, status: { in: ['OPEN', 'IN_PROGRESS'] } }) }),
            this.prisma.task.count({ where: Object.assign(Object.assign({}, where), { status: { in: ['OPEN', 'IN_PROGRESS'] }, dueDate: { lt: now } }) }),
        ]);
        return { total, open, inProgress, completed, cancelled, myOpen, overdue };
    }
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], TasksService);
//# sourceMappingURL=tasks.service.js.map