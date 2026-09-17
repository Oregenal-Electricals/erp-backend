import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
export declare class DispatchVerificationService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private generateNumber;
    private includes;
    createVerification(pickListId: string, user: any): Promise<{
        items: {
            id: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            status: string;
            reason: string | null;
            itemCode: string;
            itemName: string;
            saleType: string;
            soItemId: string;
            reversedQty: number;
            pickListItemId: string;
            verifiedQty: number;
            exceptionQty: number;
            exceptionReason: string | null;
            verificationId: string;
        }[];
        salesOrder: {
            customerName: string;
            soNumber: string;
        };
        pickList: {
            pickListNumber: string;
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
        customerName: string;
        soId: string;
        pickListId: string;
        verificationNumber: string;
    }>;
    private remainingToVerify;
    private revalidateQuality;
    verifyItem(verificationId: string, pickListItemId: string, verifiedQty: number, user: any): Promise<{
        id: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        reason: string | null;
        itemCode: string;
        itemName: string;
        saleType: string;
        soItemId: string;
        reversedQty: number;
        pickListItemId: string;
        verifiedQty: number;
        exceptionQty: number;
        exceptionReason: string | null;
        verificationId: string;
    }>;
    private refreshVerificationStatus;
    reverseVerification(verificationItemId: string, reverseQty: number, reason: string | undefined, user: any): Promise<{
        id: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        reason: string | null;
        itemCode: string;
        itemName: string;
        saleType: string;
        soItemId: string;
        reversedQty: number;
        pickListItemId: string;
        verifiedQty: number;
        exceptionQty: number;
        exceptionReason: string | null;
        verificationId: string;
    }>;
    findOne(id: string, user: any): Promise<{
        items: {
            id: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            status: string;
            reason: string | null;
            itemCode: string;
            itemName: string;
            saleType: string;
            soItemId: string;
            reversedQty: number;
            pickListItemId: string;
            verifiedQty: number;
            exceptionQty: number;
            exceptionReason: string | null;
            verificationId: string;
        }[];
        salesOrder: {
            customerName: string;
            soNumber: string;
        };
        pickList: {
            pickListNumber: string;
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
        customerName: string;
        soId: string;
        pickListId: string;
        verificationNumber: string;
    }>;
}
