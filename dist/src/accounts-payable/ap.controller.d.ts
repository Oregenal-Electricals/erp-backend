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
            dueDate: Date;
            status: string;
            remarks: string | null;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            outstandingAmount: number;
            subtotal: number;
            totalGst: number;
            totalAmount: number;
            paidAmount: number;
            paymentTerms: string;
            voucherId: string | null;
            billNumber: string;
            vendorBillNumber: string;
            vendorId: string | null;
            vendorName: string;
            poId: string | null;
            billDate: Date;
        }[];
    }>;
    findAll(req: any, query: any): Promise<{
        data: ({
            payments: {
                id: string;
                paymentDate: Date;
                amount: number;
            }[];
            vendor: {
                name: string;
                code: string;
            };
            po: {
                poNumber: string;
            };
        } & {
            id: string;
            companyId: string;
            dueDate: Date;
            status: string;
            remarks: string | null;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            outstandingAmount: number;
            subtotal: number;
            totalGst: number;
            totalAmount: number;
            paidAmount: number;
            paymentTerms: string;
            voucherId: string | null;
            billNumber: string;
            vendorBillNumber: string;
            vendorId: string | null;
            vendorName: string;
            poId: string | null;
            billDate: Date;
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    findOne(id: string, req: any): Promise<{
        payments: {
            id: string;
            companyId: string;
            remarks: string | null;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            voucherId: string | null;
            paymentNumber: string;
            paymentDate: Date;
            amount: number;
            paymentMode: string;
            referenceNumber: string | null;
            bankAccountId: string | null;
            billId: string;
        }[];
        vendor: {
            name: string;
            code: string;
        };
        po: {
            poNumber: string;
        };
    } & {
        id: string;
        companyId: string;
        dueDate: Date;
        status: string;
        remarks: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        outstandingAmount: number;
        subtotal: number;
        totalGst: number;
        totalAmount: number;
        paidAmount: number;
        paymentTerms: string;
        voucherId: string | null;
        billNumber: string;
        vendorBillNumber: string;
        vendorId: string | null;
        vendorName: string;
        poId: string | null;
        billDate: Date;
    }>;
    create(dto: CreateApBillDto, req: any): Promise<{
        payments: {
            id: string;
            companyId: string;
            remarks: string | null;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            voucherId: string | null;
            paymentNumber: string;
            paymentDate: Date;
            amount: number;
            paymentMode: string;
            referenceNumber: string | null;
            bankAccountId: string | null;
            billId: string;
        }[];
        vendor: {
            name: string;
            code: string;
        };
        po: {
            poNumber: string;
        };
    } & {
        id: string;
        companyId: string;
        dueDate: Date;
        status: string;
        remarks: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        outstandingAmount: number;
        subtotal: number;
        totalGst: number;
        totalAmount: number;
        paidAmount: number;
        paymentTerms: string;
        voucherId: string | null;
        billNumber: string;
        vendorBillNumber: string;
        vendorId: string | null;
        vendorName: string;
        poId: string | null;
        billDate: Date;
    }>;
    recordPayment(dto: CreateApPaymentDto, req: any): Promise<{
        id: string;
        companyId: string;
        remarks: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        voucherId: string | null;
        paymentNumber: string;
        paymentDate: Date;
        amount: number;
        paymentMode: string;
        referenceNumber: string | null;
        bankAccountId: string | null;
        billId: string;
    }>;
}
