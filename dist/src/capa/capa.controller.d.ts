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
                source: string;
                severity: string;
                ncrNumber: string;
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
    findOne(id: string, req: any): Promise<{
        ncr: {
            description: string;
            source: string;
            severity: string;
            ncrNumber: string;
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
    create(dto: CreateCapaDto, req: any): Promise<{
        ncr: {
            description: string;
            source: string;
            severity: string;
            ncrNumber: string;
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
    update(id: string, dto: UpdateCapaDto, req: any): Promise<{
        ncr: {
            description: string;
            source: string;
            severity: string;
            ncrNumber: string;
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
    verify(id: string, dto: VerifyCapaDto, req: any): Promise<{
        ncr: {
            description: string;
            source: string;
            severity: string;
            ncrNumber: string;
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
}
