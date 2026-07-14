import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateNcrDto, UpdateNcrDto } from './dto/ncr.dto';
export declare class NcrService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private generateNumber;
    private includes;
    create(dto: CreateNcrDto, user: any): Promise<{
        capaRecords: {
            id: string;
            status: string;
            dueDate: Date;
            assignedTo: string;
            capaNumber: string;
        }[];
        workOrder: {
            productName: string;
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
        closedBy: string | null;
        itemCode: string | null;
        itemName: string | null;
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
    update(id: string, dto: UpdateNcrDto, user: any): Promise<{
        capaRecords: {
            id: string;
            status: string;
            dueDate: Date;
            assignedTo: string;
            capaNumber: string;
        }[];
        workOrder: {
            productName: string;
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
        closedBy: string | null;
        itemCode: string | null;
        itemName: string | null;
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
    close(id: string, user: any): Promise<{
        capaRecords: {
            id: string;
            status: string;
            dueDate: Date;
            assignedTo: string;
            capaNumber: string;
        }[];
        workOrder: {
            productName: string;
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
        closedBy: string | null;
        itemCode: string | null;
        itemName: string | null;
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
    findAll(user: any, query: any): Promise<{
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
            closedBy: string | null;
            itemCode: string | null;
            itemName: string | null;
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
    findOne(id: string, user: any): Promise<{
        capaRecords: {
            id: string;
            status: string;
            dueDate: Date;
            assignedTo: string;
            capaNumber: string;
        }[];
        workOrder: {
            productName: string;
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
        closedBy: string | null;
        itemCode: string | null;
        itemName: string | null;
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
    getStats(user: any): Promise<{
        total: number;
        open: number;
        capaPending: number;
        closed: number;
        critical: number;
        major: number;
        minor: number;
    }>;
}
