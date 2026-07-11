import { CapaService } from './capa.service';
import { CreateCapaDto, UpdateCapaDto, VerifyCapaDto } from './dto/capa.dto';
export declare class CapaController {
    private readonly capaService;
    constructor(capaService: CapaService);
    getStats(req: any): Promise<{
        total: number;
        assigned: number;
        inProgress: number;
        completed: number;
        verified: number;
        overdue: number;
    }>;
    findAll(req: any, query: any): Promise<{
        data: ({
            ncr: {
                description: string;
                severity: string;
                ncrNumber: string;
                source: string;
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
            remarks: string | null;
            assignedTo: string | null;
            rootCause: string | null;
            correctiveAction: string;
            dueDate: Date;
            capaNumber: string;
            ncrId: string;
            preventiveAction: string | null;
            completedDate: Date | null;
            effectivenessCheck: string | null;
            verifiedBy: string | null;
            verifiedDate: Date | null;
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    findOne(id: string, req: any): Promise<{
        ncr: {
            description: string;
            severity: string;
            ncrNumber: string;
            source: string;
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
        remarks: string | null;
        assignedTo: string | null;
        rootCause: string | null;
        correctiveAction: string;
        dueDate: Date;
        capaNumber: string;
        ncrId: string;
        preventiveAction: string | null;
        completedDate: Date | null;
        effectivenessCheck: string | null;
        verifiedBy: string | null;
        verifiedDate: Date | null;
    }>;
    create(dto: CreateCapaDto, req: any): Promise<{
        ncr: {
            description: string;
            severity: string;
            ncrNumber: string;
            source: string;
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
        remarks: string | null;
        assignedTo: string | null;
        rootCause: string | null;
        correctiveAction: string;
        dueDate: Date;
        capaNumber: string;
        ncrId: string;
        preventiveAction: string | null;
        completedDate: Date | null;
        effectivenessCheck: string | null;
        verifiedBy: string | null;
        verifiedDate: Date | null;
    }>;
    update(id: string, dto: UpdateCapaDto, req: any): Promise<{
        ncr: {
            description: string;
            severity: string;
            ncrNumber: string;
            source: string;
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
        remarks: string | null;
        assignedTo: string | null;
        rootCause: string | null;
        correctiveAction: string;
        dueDate: Date;
        capaNumber: string;
        ncrId: string;
        preventiveAction: string | null;
        completedDate: Date | null;
        effectivenessCheck: string | null;
        verifiedBy: string | null;
        verifiedDate: Date | null;
    }>;
    verify(id: string, dto: VerifyCapaDto, req: any): Promise<{
        ncr: {
            description: string;
            severity: string;
            ncrNumber: string;
            source: string;
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
        remarks: string | null;
        assignedTo: string | null;
        rootCause: string | null;
        correctiveAction: string;
        dueDate: Date;
        capaNumber: string;
        ncrId: string;
        preventiveAction: string | null;
        completedDate: Date | null;
        effectivenessCheck: string | null;
        verifiedBy: string | null;
        verifiedDate: Date | null;
    }>;
}
