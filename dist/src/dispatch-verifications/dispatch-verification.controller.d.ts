import { DispatchVerificationService } from './dispatch-verification.service';
import { CreateVerificationDto, VerifyItemDto, ReverseVerificationDto } from './dto/dispatch-verification.dto';
export declare class DispatchVerificationController {
    private readonly dvService;
    constructor(dvService: DispatchVerificationService);
    findOne(id: string, req: any): Promise<{
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
    createVerification(dto: CreateVerificationDto, req: any): Promise<{
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
    verifyItem(verificationId: string, dto: VerifyItemDto, req: any): Promise<{
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
    reverseVerification(verificationItemId: string, dto: ReverseVerificationDto, req: any): Promise<{
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
}
