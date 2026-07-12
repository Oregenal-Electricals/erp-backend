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
    createProgram(dto: CreateProgramDto, req: any): Promise<{
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
    updateProgram(id: string, dto: any, req: any): Promise<{
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
    getSession(id: string, req: any): Promise<{
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
    createSession(dto: CreateSessionDto, req: any): Promise<{
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
    updateSession(id: string, dto: any, req: any): Promise<{
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
    completeSession(id: string, req: any): Promise<{
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
    getEmployeeHistory(empId: string, req: any): Promise<({
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
