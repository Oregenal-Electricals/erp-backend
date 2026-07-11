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
            remarks: string | null;
            paymentTerms: string;
            subtotal: number;
            totalGst: number;
            totalAmount: number;
            vendorId: string | null;
            poId: string | null;
            dueDate: Date;
            paidAmount: number;
            outstandingAmount: number;
            voucherId: string | null;
            billNumber: string;
            vendorBillNumber: string;
            vendorName: string;
            billDate: Date;
        }[];
    }>;
    findAll(req: any, query: any): Promise<{
        data: ({
            vendor: {
                code: string;
                name: string;
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
            remarks: string | null;
            paymentTerms: string;
            subtotal: number;
            totalGst: number;
            totalAmount: number;
            vendorId: string | null;
            poId: string | null;
            dueDate: Date;
            paidAmount: number;
            outstandingAmount: number;
            voucherId: string | null;
            billNumber: string;
            vendorBillNumber: string;
            vendorName: string;
            billDate: Date;
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    findOne(id: string, req: any): Promise<{
        vendor: {
            code: string;
            name: string;
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
            voucherId: string | null;
            referenceNumber: string | null;
            amount: number;
            bankAccountId: string | null;
            paymentNumber: string;
            billId: string;
            paymentDate: Date;
            paymentMode: string;
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
        remarks: string | null;
        paymentTerms: string;
        subtotal: number;
        totalGst: number;
        totalAmount: number;
        vendorId: string | null;
        poId: string | null;
        dueDate: Date;
        paidAmount: number;
        outstandingAmount: number;
        voucherId: string | null;
        billNumber: string;
        vendorBillNumber: string;
        vendorName: string;
        billDate: Date;
    }>;
    create(dto: CreateApBillDto, req: any): Promise<{
        vendor: {
            code: string;
            name: string;
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
            voucherId: string | null;
            referenceNumber: string | null;
            amount: number;
            bankAccountId: string | null;
            paymentNumber: string;
            billId: string;
            paymentDate: Date;
            paymentMode: string;
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
        remarks: string | null;
        paymentTerms: string;
        subtotal: number;
        totalGst: number;
        totalAmount: number;
        vendorId: string | null;
        poId: string | null;
        dueDate: Date;
        paidAmount: number;
        outstandingAmount: number;
        voucherId: string | null;
        billNumber: string;
        vendorBillNumber: string;
        vendorName: string;
        billDate: Date;
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
        voucherId: string | null;
        referenceNumber: string | null;
        amount: number;
        bankAccountId: string | null;
        paymentNumber: string;
        billId: string;
        paymentDate: Date;
        paymentMode: string;
    }>;
}
