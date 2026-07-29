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
exports.TrainingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let TrainingService = class TrainingService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async generateSessionNumber(companyId) {
        const count = await this.prisma.trainingSession.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `TS-${year}-${String(count + 1).padStart(3, '0')}`;
    }
    generateCertNumber(sessionNumber, employeeNumber) {
        return `CERT-${sessionNumber}-${employeeNumber}-${Date.now().toString().slice(-4)}`;
    }
    async createProgram(dto, user) {
        const existing = await this.prisma.trainingProgram.findUnique({ where: { companyId_code: { companyId: user.companyId, code: dto.code } } });
        if (existing)
            throw new common_1.BadRequestException(`Program code ${dto.code} already exists`);
        const prog = await this.prisma.trainingProgram.create({ data: Object.assign(Object.assign({}, dto), { companyId: user.companyId, createdBy: user.id, updatedBy: user.id }) });
        await this.audit.log({ tableName: 'training_programs', recordId: prog.id, action: 'CREATE', newValues: prog, changedBy: user.id });
        return prog;
    }
    async updateProgram(id, dto, user) {
        const prog = await this.prisma.trainingProgram.findFirst({ where: { id, companyId: user.companyId } });
        if (!prog)
            throw new common_1.NotFoundException('Program not found');
        return this.prisma.trainingProgram.update({ where: { id }, data: Object.assign(Object.assign({}, dto), { updatedBy: user.id }) });
    }
    async findAllPrograms(user, query) {
        const { category, search } = query;
        const where = { companyId: user.companyId, isActive: true };
        if (category)
            where.category = category;
        if (search)
            where.name = { contains: search, mode: 'insensitive' };
        return this.prisma.trainingProgram.findMany({
            where, orderBy: { name: 'asc' },
            include: { _count: { select: { sessions: true } } },
        });
    }
    async createSession(dto, user) {
        const prog = await this.prisma.trainingProgram.findFirst({ where: { id: dto.trainingProgramId, companyId: user.companyId } });
        if (!prog)
            throw new common_1.NotFoundException('Training program not found');
        const sessionNumber = await this.generateSessionNumber(user.companyId);
        const session = await this.prisma.trainingSession.create({
            data: Object.assign(Object.assign({}, dto), { sessionNumber, companyId: user.companyId, startDate: new Date(dto.startDate), endDate: new Date(dto.endDate), createdBy: user.id, updatedBy: user.id }),
            include: { trainingProgram: { select: { name: true, category: true } } },
        });
        await this.audit.log({ tableName: 'training_sessions', recordId: session.id, action: 'CREATE', newValues: session, changedBy: user.id });
        return session;
    }
    async updateSession(id, dto, user) {
        const session = await this.prisma.trainingSession.findFirst({ where: { id, companyId: user.companyId } });
        if (!session)
            throw new common_1.NotFoundException('Session not found');
        if (session.status === 'COMPLETED')
            throw new common_1.BadRequestException('Cannot edit completed session');
        return this.prisma.trainingSession.update({
            where: { id }, data: Object.assign(Object.assign(Object.assign(Object.assign({}, dto), (dto.startDate && { startDate: new Date(dto.startDate) })), (dto.endDate && { endDate: new Date(dto.endDate) })), { updatedBy: user.id }),
            include: { trainingProgram: { select: { name: true } } },
        });
    }
    async findAllSessions(user, query) {
        const { status, programId, page = 1, limit = 20 } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = { companyId: user.companyId, isActive: true };
        if (status)
            where.status = status;
        if (programId)
            where.trainingProgramId = programId;
        const [data, total] = await Promise.all([
            this.prisma.trainingSession.findMany({
                where, skip, take: Number(limit), orderBy: { startDate: 'desc' },
                include: {
                    trainingProgram: { select: { name: true, category: true, durationHours: true } },
                    _count: { select: { enrollments: true } },
                },
            }),
            this.prisma.trainingSession.count({ where }),
        ]);
        return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
    }
    async getSession(id, user) {
        const session = await this.prisma.trainingSession.findFirst({
            where: { id, companyId: user.companyId },
            include: {
                trainingProgram: true,
                enrollments: {
                    include: { employee: { select: { firstName: true, lastName: true, employeeNumber: true, department: { select: { name: true } }, designation: { select: { name: true } } } } },
                    orderBy: { employee: { employeeNumber: 'asc' } },
                },
            },
        });
        if (!session)
            throw new common_1.NotFoundException('Session not found');
        return session;
    }
    async enrollEmployees(dto, user) {
        const session = await this.prisma.trainingSession.findFirst({ where: { id: dto.sessionId, companyId: user.companyId } });
        if (!session)
            throw new common_1.NotFoundException('Session not found');
        if (session.status === 'CANCELLED')
            throw new common_1.BadRequestException('Cannot enroll in cancelled session');
        const currentCount = await this.prisma.trainingEnrollment.count({ where: { sessionId: dto.sessionId, status: { not: 'CANCELLED' } } });
        if (currentCount + dto.employeeIds.length > session.maxParticipants) {
            throw new common_1.BadRequestException(`Exceeds max participants (${session.maxParticipants}). Current: ${currentCount}`);
        }
        const results = [];
        for (const empId of dto.employeeIds) {
            const existing = await this.prisma.trainingEnrollment.findUnique({
                where: { companyId_sessionId_employeeId: { companyId: user.companyId, sessionId: dto.sessionId, employeeId: empId } },
            });
            if (existing) {
                results.push({ employeeId: empId, status: 'ALREADY_ENROLLED' });
                continue;
            }
            const enrollment = await this.prisma.trainingEnrollment.create({
                data: { companyId: user.companyId, sessionId: dto.sessionId, employeeId: empId, createdBy: user.id, updatedBy: user.id },
            });
            results.push({ employeeId: empId, enrollmentId: enrollment.id, status: 'ENROLLED' });
        }
        return { sessionId: dto.sessionId, results };
    }
    async markAttendance(sessionId, dto, user) {
        const session = await this.prisma.trainingSession.findFirst({ where: { id: sessionId, companyId: user.companyId } });
        if (!session)
            throw new common_1.NotFoundException('Session not found');
        const results = [];
        for (const rec of dto.records) {
            const enrollment = await this.prisma.trainingEnrollment.findFirst({ where: { id: rec.enrollmentId, companyId: user.companyId } });
            if (!enrollment) {
                results.push({ enrollmentId: rec.enrollmentId, error: 'Not found' });
                continue;
            }
            await this.prisma.trainingEnrollment.update({
                where: { id: rec.enrollmentId },
                data: { attendanceMarked: true, status: rec.attended ? 'ATTENDED' : 'ENROLLED', updatedBy: user.id },
            });
            results.push({ enrollmentId: rec.enrollmentId, attended: rec.attended });
        }
        return { sessionId, results };
    }
    async completeEnrollment(enrollmentId, dto, user) {
        const enrollment = await this.prisma.trainingEnrollment.findFirst({
            where: { id: enrollmentId, companyId: user.companyId },
            include: { employee: { select: { employeeNumber: true } }, session: { select: { sessionNumber: true, trainingProgramId: true } } },
        });
        if (!enrollment)
            throw new common_1.NotFoundException('Enrollment not found');
        const prog = await this.prisma.trainingProgram.findFirst({ where: { id: enrollment.session.trainingProgramId } });
        const passed = dto.passed !== undefined ? dto.passed : (dto.score !== undefined ? dto.score >= 60 : true);
        const certNumber = passed ? this.generateCertNumber(enrollment.session.sessionNumber, enrollment.employee.employeeNumber) : undefined;
        const certDate = passed ? new Date() : undefined;
        const expiryDate = passed && (prog === null || prog === void 0 ? void 0 : prog.validityMonths) ? new Date(new Date().setMonth(new Date().getMonth() + prog.validityMonths)) : undefined;
        return this.prisma.trainingEnrollment.update({
            where: { id: enrollmentId },
            data: {
                status: passed ? 'COMPLETED' : 'FAILED',
                score: dto.score, passed,
                certificateNumber: certNumber,
                certificateDate: certDate,
                expiryDate,
                remarks: dto.remarks,
                updatedBy: user.id,
            },
        });
    }
    async completeSession(id, user) {
        const session = await this.prisma.trainingSession.findFirst({ where: { id, companyId: user.companyId } });
        if (!session)
            throw new common_1.NotFoundException('Session not found');
        return this.prisma.trainingSession.update({ where: { id }, data: { status: 'COMPLETED', updatedBy: user.id } });
    }
    async getStats(user) {
        const [programs, sessions, enrollments, completed, upcoming] = await Promise.all([
            this.prisma.trainingProgram.count({ where: { companyId: user.companyId, isActive: true } }),
            this.prisma.trainingSession.count({ where: { companyId: user.companyId, isActive: true } }),
            this.prisma.trainingEnrollment.count({ where: { companyId: user.companyId } }),
            this.prisma.trainingEnrollment.count({ where: { companyId: user.companyId, status: 'COMPLETED' } }),
            this.prisma.trainingSession.count({ where: { companyId: user.companyId, status: 'SCHEDULED', startDate: { gte: new Date() } } }),
        ]);
        return { programs, sessions, enrollments, completed, upcoming, completionRate: enrollments > 0 ? Math.round(completed / enrollments * 100) : 0 };
    }
    async getEmployeeTrainingHistory(employeeId, user) {
        return this.prisma.trainingEnrollment.findMany({
            where: { employeeId, companyId: user.companyId },
            include: { session: { include: { trainingProgram: { select: { name: true, category: true, durationHours: true } } } } },
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.TrainingService = TrainingService;
exports.TrainingService = TrainingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], TrainingService);
//# sourceMappingURL=training.service.js.map