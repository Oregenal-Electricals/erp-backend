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
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        name: string;
        description: string | null;
        code: string;
        category: string;
        durationHours: number;
        isMandatory: boolean;
        validityMonths: number | null;
        targetDesignation: string | null;
        targetDepartment: string | null;
    }>;
    updateProgram(id: string, dto: any, user: any): Promise<{
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        name: string;
        description: string | null;
        code: string;
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
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        name: string;
        description: string | null;
        code: string;
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
        companyId: string;
        status: string;
        remarks: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        title: string;
        sessionNumber: string;
        trainingProgramId: string;
        startDate: Date;
        endDate: Date;
        venue: string | null;
        trainer: string | null;
        maxParticipants: number;
    }>;
    updateSession(id: string, dto: any, user: any): Promise<{
        trainingProgram: {
            name: string;
        };
    } & {
        id: string;
        companyId: string;
        status: string;
        remarks: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        title: string;
        sessionNumber: string;
        trainingProgramId: string;
        startDate: Date;
        endDate: Date;
        venue: string | null;
        trainer: string | null;
        maxParticipants: number;
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
            companyId: string;
            status: string;
            remarks: string | null;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            title: string;
            sessionNumber: string;
            trainingProgramId: string;
            startDate: Date;
            endDate: Date;
            venue: string | null;
            trainer: string | null;
            maxParticipants: number;
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getSession(id: string, user: any): Promise<{
        trainingProgram: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            name: string;
            description: string | null;
            code: string;
            category: string;
            durationHours: number;
            isMandatory: boolean;
            validityMonths: number | null;
            targetDesignation: string | null;
            targetDepartment: string | null;
        };
        enrollments: ({
            employee: {
                firstName: string;
                lastName: string;
                employeeNumber: string;
                department: {
                    name: string;
                };
                designation: {
                    name: string;
                };
            };
        } & {
            id: string;
            companyId: string;
            status: string;
            remarks: string | null;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            employeeId: string;
            sessionId: string;
            attendanceMarked: boolean;
            score: number | null;
            passed: boolean | null;
            certificateNumber: string | null;
            certificateDate: Date | null;
            expiryDate: Date | null;
        })[];
    } & {
        id: string;
        companyId: string;
        status: string;
        remarks: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        title: string;
        sessionNumber: string;
        trainingProgramId: string;
        startDate: Date;
        endDate: Date;
        venue: string | null;
        trainer: string | null;
        maxParticipants: number;
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
        companyId: string;
        status: string;
        remarks: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        employeeId: string;
        sessionId: string;
        attendanceMarked: boolean;
        score: number | null;
        passed: boolean | null;
        certificateNumber: string | null;
        certificateDate: Date | null;
        expiryDate: Date | null;
    }>;
    completeSession(id: string, user: any): Promise<{
        id: string;
        companyId: string;
        status: string;
        remarks: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        title: string;
        sessionNumber: string;
        trainingProgramId: string;
        startDate: Date;
        endDate: Date;
        venue: string | null;
        trainer: string | null;
        maxParticipants: number;
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
            companyId: string;
            status: string;
            remarks: string | null;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            title: string;
            sessionNumber: string;
            trainingProgramId: string;
            startDate: Date;
            endDate: Date;
            venue: string | null;
            trainer: string | null;
            maxParticipants: number;
        };
    } & {
        id: string;
        companyId: string;
        status: string;
        remarks: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        employeeId: string;
        sessionId: string;
        attendanceMarked: boolean;
        score: number | null;
        passed: boolean | null;
        certificateNumber: string | null;
        certificateDate: Date | null;
        expiryDate: Date | null;
    })[]>;
}
