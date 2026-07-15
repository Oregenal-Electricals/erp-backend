import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateVoucherDto, CancelVoucherDto } from './dto/voucher.dto';
export declare class VouchersService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private generateNumber;
    private includes;
    create(dto: CreateVoucherDto, user: any): Promise<{
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
    post(id: string, user: any): Promise<{
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
    cancel(id: string, dto: CancelVoucherDto, user: any): Promise<{
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
    findAll(user: any, query: any): Promise<{
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
    findOne(id: string, user: any): Promise<{
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
    getStats(user: any): Promise<{
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
    createSalesInvoiceFromDelivery(deliveryId: string, user: any): Promise<{
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
