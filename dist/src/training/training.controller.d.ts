import { TrainingService } from './training.service';
import { CreateProgramDto, CreateSessionDto, EnrollDto, MarkAttendanceDto, UpdateEnrollmentDto } from './dto/training.dto';
export declare class TrainingController {
    private readonly trainingService;
    constructor(trainingService: TrainingService);
    getStats(req: any): Promise<{
        programs: number;
        sessions: number;
        enrollments: number;
        completed: number;
        upcoming: number;
        completionRate: number;
    }>;
    getPrograms(req: any, query: any): Promise<({
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
    createProgram(dto: CreateProgramDto, req: any): Promise<{
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
    updateProgram(id: string, dto: any, req: any): Promise<{
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
    getSessions(req: any, query: any): Promise<{
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
    getSession(id: string, req: any): Promise<{
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
    createSession(dto: CreateSessionDto, req: any): Promise<{
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
    updateSession(id: string, dto: any, req: any): Promise<{
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
    completeSession(id: string, req: any): Promise<{
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
    enroll(dto: EnrollDto, req: any): Promise<{
        sessionId: string;
        results: any[];
    }>;
    markAttendance(id: string, dto: MarkAttendanceDto, req: any): Promise<{
        sessionId: string;
        results: any[];
    }>;
    completeEnrollment(id: string, dto: UpdateEnrollmentDto, req: any): Promise<{
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
    getEmployeeHistory(empId: string, req: any): Promise<({
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
