import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateProgramDto, CreateSessionDto, EnrollDto, MarkAttendanceDto, UpdateEnrollmentDto } from './dto/training.dto';
export declare class TrainingService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private generateSessionNumber;
    private generateCertNumber;
    createProgram(dto: CreateProgramDto, user: any): Promise<{
        id: string;
        code: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        description: string | null;
        category: string;
        durationHours: number;
        isMandatory: boolean;
        validityMonths: number | null;
        targetDesignation: string | null;
        targetDepartment: string | null;
    }>;
    updateProgram(id: string, dto: any, user: any): Promise<{
        id: string;
        code: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        description: string | null;
        category: string;
        durationHours: number;
        isMandatory: boolean;
        validityMonths: number | null;
        targetDesignation: string | null;
        targetDepartment: string | null;
    }>;
    findAllPrograms(user: any, query: any): Promise<({
        _count: {
            sessions: number;
        };
    } & {
        id: string;
        code: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        description: string | null;
        category: string;
        durationHours: number;
        isMandatory: boolean;
        validityMonths: number | null;
        targetDesignation: string | null;
        targetDepartment: string | null;
    })[]>;
    createSession(dto: CreateSessionDto, user: any): Promise<{
        trainingProgram: {
            name: string;
            category: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        startDate: Date;
        endDate: Date;
        status: string;
        title: string;
        remarks: string | null;
        trainingProgramId: string;
        venue: string | null;
        trainer: string | null;
        maxParticipants: number;
        sessionNumber: string;
    }>;
    updateSession(id: string, dto: any, user: any): Promise<{
        trainingProgram: {
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        startDate: Date;
        endDate: Date;
        status: string;
        title: string;
        remarks: string | null;
        trainingProgramId: string;
        venue: string | null;
        trainer: string | null;
        maxParticipants: number;
        sessionNumber: string;
    }>;
    findAllSessions(user: any, query: any): Promise<{
        data: ({
            _count: {
                enrollments: number;
            };
            trainingProgram: {
                name: string;
                category: string;
                durationHours: number;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
            startDate: Date;
            endDate: Date;
            status: string;
            title: string;
            remarks: string | null;
            trainingProgramId: string;
            venue: string | null;
            trainer: string | null;
            maxParticipants: number;
            sessionNumber: string;
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getSession(id: string, user: any): Promise<{
        trainingProgram: {
            id: string;
            code: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
            description: string | null;
            category: string;
            durationHours: number;
            isMandatory: boolean;
            validityMonths: number | null;
            targetDesignation: string | null;
            targetDepartment: string | null;
        };
        enrollments: ({
            employee: {
                department: {
                    name: string;
                };
                firstName: string;
                lastName: string;
                designation: {
                    name: string;
                };
                employeeNumber: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
            status: string;
            remarks: string | null;
            employeeId: string;
            expiryDate: Date | null;
            passed: boolean | null;
            score: number | null;
            sessionId: string;
            attendanceMarked: boolean;
            certificateNumber: string | null;
            certificateDate: Date | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        startDate: Date;
        endDate: Date;
        status: string;
        title: string;
        remarks: string | null;
        trainingProgramId: string;
        venue: string | null;
        trainer: string | null;
        maxParticipants: number;
        sessionNumber: string;
    }>;
    enrollEmployees(dto: EnrollDto, user: any): Promise<{
        sessionId: string;
        results: any[];
    }>;
    markAttendance(sessionId: string, dto: MarkAttendanceDto, user: any): Promise<{
        sessionId: string;
        results: any[];
    }>;
    completeEnrollment(enrollmentId: string, dto: UpdateEnrollmentDto, user: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        status: string;
        remarks: string | null;
        employeeId: string;
        expiryDate: Date | null;
        passed: boolean | null;
        score: number | null;
        sessionId: string;
        attendanceMarked: boolean;
        certificateNumber: string | null;
        certificateDate: Date | null;
    }>;
    completeSession(id: string, user: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        startDate: Date;
        endDate: Date;
        status: string;
        title: string;
        remarks: string | null;
        trainingProgramId: string;
        venue: string | null;
        trainer: string | null;
        maxParticipants: number;
        sessionNumber: string;
    }>;
    getStats(user: any): Promise<{
        programs: number;
        sessions: number;
        enrollments: number;
        completed: number;
        upcoming: number;
        completionRate: number;
    }>;
    getEmployeeTrainingHistory(employeeId: string, user: any): Promise<({
        session: {
            trainingProgram: {
                name: string;
                category: string;
                durationHours: number;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
            startDate: Date;
            endDate: Date;
            status: string;
            title: string;
            remarks: string | null;
            trainingProgramId: string;
            venue: string | null;
            trainer: string | null;
            maxParticipants: number;
            sessionNumber: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        status: string;
        remarks: string | null;
        employeeId: string;
        expiryDate: Date | null;
        passed: boolean | null;
        score: number | null;
        sessionId: string;
        attendanceMarked: boolean;
        certificateNumber: string | null;
        certificateDate: Date | null;
    })[]>;
}
