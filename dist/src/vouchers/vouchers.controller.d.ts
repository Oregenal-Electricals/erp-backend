import { VouchersService } from './vouchers.service';
import { CreateVoucherDto, CancelVoucherDto } from './dto/voucher.dto';
export declare class VouchersController {
    private readonly vouchersService;
    constructor(vouchersService: VouchersService);
    getStats(req: any): Promise<{
        total: number;
        draft: number;
        posted: number;
        cancelled: number;
        totalPostedValue: number;
        byType: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.VoucherGroupByOutputType, "voucherType"[]> & {
            _count: {
                id: number;
            };
        })[];
    }>;
    findAll(req: any, query: any): Promise<{
        data: ({
            entries: {
                account: {
                    accountCode: string;
                    accountName: string;
                };
                amount: number;
                entryType: string;
            }[];
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
            totalAmount: number;
            cancelReason: string | null;
            cancelledDate: Date | null;
            referenceType: string | null;
            referenceId: string | null;
            referenceNumber: string | null;
            narration: string | null;
            voucherType: string;
            voucherDate: Date;
            partyName: string | null;
            voucherNumber: string;
            postedDate: Date | null;
            postedBy: string | null;
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    findOne(id: string, req: any): Promise<{
        entries: ({
            account: {
                accountCode: string;
                accountName: string;
                accountType: string;
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
            amount: number;
            accountId: string;
            entryType: string;
            narration: string | null;
            voucherId: string;
        })[];
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
        totalAmount: number;
        cancelReason: string | null;
        cancelledDate: Date | null;
        referenceType: string | null;
        referenceId: string | null;
        referenceNumber: string | null;
        narration: string | null;
        voucherType: string;
        voucherDate: Date;
        partyName: string | null;
        voucherNumber: string;
        postedDate: Date | null;
        postedBy: string | null;
    }>;
    create(dto: CreateVoucherDto, req: any): Promise<{
        entries: ({
            account: {
                accountCode: string;
                accountName: string;
                accountType: string;
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
            amount: number;
            accountId: string;
            entryType: string;
            narration: string | null;
            voucherId: string;
        })[];
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
        totalAmount: number;
        cancelReason: string | null;
        cancelledDate: Date | null;
        referenceType: string | null;
        referenceId: string | null;
        referenceNumber: string | null;
        narration: string | null;
        voucherType: string;
        voucherDate: Date;
        partyName: string | null;
        voucherNumber: string;
        postedDate: Date | null;
        postedBy: string | null;
    }>;
    post(id: string, req: any): Promise<{
        entries: ({
            account: {
                accountCode: string;
                accountName: string;
                accountType: string;
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
            amount: number;
            accountId: string;
            entryType: string;
            narration: string | null;
            voucherId: string;
        })[];
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
        totalAmount: number;
        cancelReason: string | null;
        cancelledDate: Date | null;
        referenceType: string | null;
        referenceId: string | null;
        referenceNumber: string | null;
        narration: string | null;
        voucherType: string;
        voucherDate: Date;
        partyName: string | null;
        voucherNumber: string;
        postedDate: Date | null;
        postedBy: string | null;
    }>;
    cancel(id: string, dto: CancelVoucherDto, req: any): Promise<{
        entries: ({
            account: {
                accountCode: string;
                accountName: string;
                accountType: string;
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
            amount: number;
            accountId: string;
            entryType: string;
            narration: string | null;
            voucherId: string;
        })[];
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
        totalAmount: number;
        cancelReason: string | null;
        cancelledDate: Date | null;
        referenceType: string | null;
        referenceId: string | null;
        referenceNumber: string | null;
        narration: string | null;
        voucherType: string;
        voucherDate: Date;
        partyName: string | null;
        voucherNumber: string;
        postedDate: Date | null;
        postedBy: string | null;
    }>;
    fromDelivery(deliveryId: string, req: any): Promise<{
        entries: ({
            account: {
                accountCode: string;
                accountName: string;
                accountType: string;
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
            amount: number;
            accountId: string;
            entryType: string;
            narration: string | null;
            voucherId: string;
        })[];
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
        totalAmount: number;
        cancelReason: string | null;
        cancelledDate: Date | null;
        referenceType: string | null;
        referenceId: string | null;
        referenceNumber: string | null;
        narration: string | null;
        voucherType: string;
        voucherDate: Date;
        partyName: string | null;
        voucherNumber: string;
        postedDate: Date | null;
        postedBy: string | null;
    }>;
}
