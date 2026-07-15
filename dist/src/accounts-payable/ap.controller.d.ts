import { ApService } from './ap.service';
import { CreateApBillDto, CreateApPaymentDto } from './dto/ap.dto';
export declare class ApController {
    private readonly apService;
    constructor(apService: ApService);
    getStats(req: any): Promise<{
        total: number;
        approved: number;
        partial: number;
        paid: number;
        overdue: number;
        totalOutstanding: number;
        totalPaid: number;
    }>;
    getAging(req: any): Promise<{
        aging: {
            current: number;
            days30: number;
            days60: number;
            days90: number;
            over90: number;
        };
        bills: {
            agingDays: number;
            vendor: {
                name: string;
            };
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
            paymentTerms: string;
            totalAmount: number;
            vendorId: string | null;
            vendorName: string;
            subtotal: number;
            poId: string | null;
            totalGst: number;
            voucherId: string | null;
            paidAmount: number;
            outstandingAmount: number;
            vendorBillNumber: string;
            billDate: Date;
            billNumber: string;
        }[];
    }>;
    findAll(req: any, query: any): Promise<{
        data: ({
            vendor: {
                name: string;
                code: string;
            };
            po: {
                poNumber: string;
            };
            payments: {
                id: string;
                amount: number;
                paymentDate: Date;
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
            dueDate: Date;
            remarks: string | null;
            paymentTerms: string;
            totalAmount: number;
            vendorId: string | null;
            vendorName: string;
            subtotal: number;
            poId: string | null;
            totalGst: number;
            voucherId: string | null;
            paidAmount: number;
            outstandingAmount: number;
            vendorBillNumber: string;
            billDate: Date;
            billNumber: string;
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    findOne(id: string, req: any): Promise<{
        vendor: {
            name: string;
            code: string;
        };
        po: {
            poNumber: string;
        };
        payments: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            remarks: string | null;
            amount: number;
            paymentMode: string;
            referenceNumber: string | null;
            voucherId: string | null;
            paymentDate: Date;
            bankAccountId: string | null;
            paymentNumber: string;
            billId: string;
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
        dueDate: Date;
        remarks: string | null;
        paymentTerms: string;
        totalAmount: number;
        vendorId: string | null;
        vendorName: string;
        subtotal: number;
        poId: string | null;
        totalGst: number;
        voucherId: string | null;
        paidAmount: number;
        outstandingAmount: number;
        vendorBillNumber: string;
        billDate: Date;
        billNumber: string;
    }>;
    create(dto: CreateApBillDto, req: any): Promise<{
        vendor: {
            name: string;
            code: string;
        };
        po: {
            poNumber: string;
        };
        payments: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            remarks: string | null;
            amount: number;
            paymentMode: string;
            referenceNumber: string | null;
            voucherId: string | null;
            paymentDate: Date;
            bankAccountId: string | null;
            paymentNumber: string;
            billId: string;
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
        dueDate: Date;
        remarks: string | null;
        paymentTerms: string;
        totalAmount: number;
        vendorId: string | null;
        vendorName: string;
        subtotal: number;
        poId: string | null;
        totalGst: number;
        voucherId: string | null;
        paidAmount: number;
        outstandingAmount: number;
        vendorBillNumber: string;
        billDate: Date;
        billNumber: string;
    }>;
    recordPayment(dto: CreateApPaymentDto, req: any): Promise<{
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        remarks: string | null;
        amount: number;
        paymentMode: string;
        referenceNumber: string | null;
        voucherId: string | null;
        paymentDate: Date;
        bankAccountId: string | null;
        paymentNumber: string;
        billId: string;
    }>;
}
