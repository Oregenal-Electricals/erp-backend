import { NcrService } from './ncr.service';
import { CreateNcrDto, UpdateNcrDto } from './dto/ncr.dto';
export declare class NcrController {
    private readonly ncrService;
    constructor(ncrService: NcrService);
    getStats(req: any): Promise<{
        total: number;
        open: number;
        capaPending: number;
        closed: number;
        critical: number;
        major: number;
        minor: number;
    }>;
    findAll(req: any, query: any): Promise<{
        data: ({
            capaRecords: {
                id: string;
                status: string;
            }[];
            workOrder: {
                woNumber: string;
            };
        } & {
            id: string;
            companyId: string;
            description: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            status: string;
            remarks: string | null;
            itemCode: string | null;
            itemName: string | null;
            closedBy: string | null;
            disposition: string | null;
            workOrderId: string | null;
            source: string;
            sourceReferenceId: string | null;
            sourceReferenceNumber: string | null;
            severity: string;
            qtyAffected: number;
            detectedBy: string | null;
            detectedDate: Date;
            ncrNumber: string;
            closedDate: Date | null;
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    findOne(id: string, req: any): Promise<{
        capaRecords: {
            id: string;
            status: string;
            dueDate: Date;
            assignedTo: string;
            capaNumber: string;
        }[];
        workOrder: {
            woNumber: string;
            productName: string;
        };
    } & {
        id: string;
        companyId: string;
        description: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        remarks: string | null;
        itemCode: string | null;
        itemName: string | null;
        closedBy: string | null;
        disposition: string | null;
        workOrderId: string | null;
        source: string;
        sourceReferenceId: string | null;
        sourceReferenceNumber: string | null;
        severity: string;
        qtyAffected: number;
        detectedBy: string | null;
        detectedDate: Date;
        ncrNumber: string;
        closedDate: Date | null;
    }>;
    create(dto: CreateNcrDto, req: any): Promise<{
        capaRecords: {
            id: string;
            status: string;
            dueDate: Date;
            assignedTo: string;
            capaNumber: string;
        }[];
        workOrder: {
            woNumber: string;
            productName: string;
        };
    } & {
        id: string;
        companyId: string;
        description: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        remarks: string | null;
        itemCode: string | null;
        itemName: string | null;
        closedBy: string | null;
        disposition: string | null;
        workOrderId: string | null;
        source: string;
        sourceReferenceId: string | null;
        sourceReferenceNumber: string | null;
        severity: string;
        qtyAffected: number;
        detectedBy: string | null;
        detectedDate: Date;
        ncrNumber: string;
        closedDate: Date | null;
    }>;
    update(id: string, dto: UpdateNcrDto, req: any): Promise<{
        capaRecords: {
            id: string;
            status: string;
            dueDate: Date;
            assignedTo: string;
            capaNumber: string;
        }[];
        workOrder: {
            woNumber: string;
            productName: string;
        };
    } & {
        id: string;
        companyId: string;
        description: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        remarks: string | null;
        itemCode: string | null;
        itemName: string | null;
        closedBy: string | null;
        disposition: string | null;
        workOrderId: string | null;
        source: string;
        sourceReferenceId: string | null;
        sourceReferenceNumber: string | null;
        severity: string;
        qtyAffected: number;
        detectedBy: string | null;
        detectedDate: Date;
        ncrNumber: string;
        closedDate: Date | null;
    }>;
    close(id: string, req: any): Promise<{
        capaRecords: {
            id: string;
            status: string;
            dueDate: Date;
            assignedTo: string;
            capaNumber: string;
        }[];
        workOrder: {
            woNumber: string;
            productName: string;
        };
    } & {
        id: string;
        companyId: string;
        description: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        remarks: string | null;
        itemCode: string | null;
        itemName: string | null;
        closedBy: string | null;
        disposition: string | null;
        workOrderId: string | null;
        source: string;
        sourceReferenceId: string | null;
        sourceReferenceNumber: string | null;
        severity: string;
        qtyAffected: number;
        detectedBy: string | null;
        detectedDate: Date;
        ncrNumber: string;
        closedDate: Date | null;
    }>;
}
