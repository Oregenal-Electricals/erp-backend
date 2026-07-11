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
            workOrder: {
                woNumber: string;
            };
            capaRecords: {
                id: string;
                status: string;
            }[];
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
            severity: string;
            qtyAffected: number;
            closedDate: Date | null;
            closedBy: string | null;
            ncrNumber: string;
            source: string;
            sourceReferenceId: string | null;
            sourceReferenceNumber: string | null;
            workOrderId: string | null;
            detectedBy: string | null;
            detectedDate: Date;
            disposition: string | null;
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    findOne(id: string, req: any): Promise<{
        workOrder: {
            woNumber: string;
            productName: string;
        };
        capaRecords: {
            id: string;
            status: string;
            assignedTo: string;
            dueDate: Date;
            capaNumber: string;
        }[];
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
        severity: string;
        qtyAffected: number;
        closedDate: Date | null;
        closedBy: string | null;
        ncrNumber: string;
        source: string;
        sourceReferenceId: string | null;
        sourceReferenceNumber: string | null;
        workOrderId: string | null;
        detectedBy: string | null;
        detectedDate: Date;
        disposition: string | null;
    }>;
    create(dto: CreateNcrDto, req: any): Promise<{
        workOrder: {
            woNumber: string;
            productName: string;
        };
        capaRecords: {
            id: string;
            status: string;
            assignedTo: string;
            dueDate: Date;
            capaNumber: string;
        }[];
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
        severity: string;
        qtyAffected: number;
        closedDate: Date | null;
        closedBy: string | null;
        ncrNumber: string;
        source: string;
        sourceReferenceId: string | null;
        sourceReferenceNumber: string | null;
        workOrderId: string | null;
        detectedBy: string | null;
        detectedDate: Date;
        disposition: string | null;
    }>;
    update(id: string, dto: UpdateNcrDto, req: any): Promise<{
        workOrder: {
            woNumber: string;
            productName: string;
        };
        capaRecords: {
            id: string;
            status: string;
            assignedTo: string;
            dueDate: Date;
            capaNumber: string;
        }[];
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
        severity: string;
        qtyAffected: number;
        closedDate: Date | null;
        closedBy: string | null;
        ncrNumber: string;
        source: string;
        sourceReferenceId: string | null;
        sourceReferenceNumber: string | null;
        workOrderId: string | null;
        detectedBy: string | null;
        detectedDate: Date;
        disposition: string | null;
    }>;
    close(id: string, req: any): Promise<{
        workOrder: {
            woNumber: string;
            productName: string;
        };
        capaRecords: {
            id: string;
            status: string;
            assignedTo: string;
            dueDate: Date;
            capaNumber: string;
        }[];
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
        severity: string;
        qtyAffected: number;
        closedDate: Date | null;
        closedBy: string | null;
        ncrNumber: string;
        source: string;
        sourceReferenceId: string | null;
        sourceReferenceNumber: string | null;
        workOrderId: string | null;
        detectedBy: string | null;
        detectedDate: Date;
        disposition: string | null;
    }>;
}
