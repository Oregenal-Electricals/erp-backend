import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateCapaDto, UpdateCapaDto, VerifyCapaDto } from './dto/capa.dto';
export declare class CapaService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private generateNumber;
    private includes;
    create(dto: CreateCapaDto, user: any): Promise<{
        ncr: {
            description: string;
            source: string;
            severity: string;
            ncrNumber: string;
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
        status: string;
        dueDate: Date;
        remarks: string | null;
        verifiedBy: string | null;
        assignedTo: string | null;
        completedDate: Date | null;
        correctiveAction: string;
        capaNumber: string;
        ncrId: string;
        rootCause: string | null;
        preventiveAction: string | null;
        effectivenessCheck: string | null;
        verifiedDate: Date | null;
    }>;
    update(id: string, dto: UpdateCapaDto, user: any): Promise<{
        ncr: {
            description: string;
            source: string;
            severity: string;
            ncrNumber: string;
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
        status: string;
        dueDate: Date;
        remarks: string | null;
        verifiedBy: string | null;
        assignedTo: string | null;
        completedDate: Date | null;
        correctiveAction: string;
        capaNumber: string;
        ncrId: string;
        rootCause: string | null;
        preventiveAction: string | null;
        effectivenessCheck: string | null;
        verifiedDate: Date | null;
    }>;
    verify(id: string, dto: VerifyCapaDto, user: any): Promise<{
        ncr: {
            description: string;
            source: string;
            severity: string;
            ncrNumber: string;
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
        status: string;
        dueDate: Date;
        remarks: string | null;
        verifiedBy: string | null;
        assignedTo: string | null;
        completedDate: Date | null;
        correctiveAction: string;
        capaNumber: string;
        ncrId: string;
        rootCause: string | null;
        preventiveAction: string | null;
        effectivenessCheck: string | null;
        verifiedDate: Date | null;
    }>;
    findAll(user: any, query: any): Promise<{
        data: ({
            ncr: {
                description: string;
                source: string;
                severity: string;
                ncrNumber: string;
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
            status: string;
            dueDate: Date;
            remarks: string | null;
            verifiedBy: string | null;
            assignedTo: string | null;
            completedDate: Date | null;
            correctiveAction: string;
            capaNumber: string;
            ncrId: string;
            rootCause: string | null;
            preventiveAction: string | null;
            effectivenessCheck: string | null;
            verifiedDate: Date | null;
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    findOne(id: string, user: any): Promise<{
        ncr: {
            description: string;
            source: string;
            severity: string;
            ncrNumber: string;
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
        status: string;
        dueDate: Date;
        remarks: string | null;
        verifiedBy: string | null;
        assignedTo: string | null;
        completedDate: Date | null;
        correctiveAction: string;
        capaNumber: string;
        ncrId: string;
        rootCause: string | null;
        preventiveAction: string | null;
        effectivenessCheck: string | null;
        verifiedDate: Date | null;
    }>;
    getStats(user: any): Promise<{
        total: number;
        assigned: number;
        inProgress: number;
        completed: number;
        verified: number;
        overdue: number;
    }>;
}
