import { ArService } from './ar.service';
import { CreateArInvoiceDto, CreateArPaymentDto } from './dto/ar.dto';
export declare class ArController {
    private readonly arService;
    constructor(arService: ArService);
    getStats(req: any): Promise<{
        total: number;
        sent: number;
        partial: number;
        paid: number;
        overdue: number;
        totalOutstanding: number;
        totalCollected: number;
    }>;
    getAging(req: any): Promise<{
        aging: {
            current: number;
            days30: number;
            days60: number;
            days90: number;
            over90: number;
        };
        invoices: {
            agingDays: number;
            agingBucket: string;
            id: string;
            companyId: string;
            dueDate: Date;
            status: string;
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
            invoiceNumber: string;
            dispatchId: string | null;
            soId: string | null;
            customerName: string;
            customerAddress: string | null;
            invoiceDate: Date;
            paymentTerms: string;
            voucherId: string | null;
            notes: string | null;
        }[];
    }>;
    findAll(req: any, query: any): Promise<{
        data: ({
            dispatch: {
                dispatchNumber: string;
            };
            salesOrder: {
                soNumber: string;
            };
            payments: {
                id: string;
                paymentDate: Date;
                amount: number;
            }[];
        } & {
            id: string;
            companyId: string;
            dueDate: Date;
            status: string;
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
            invoiceNumber: string;
            dispatchId: string | null;
            soId: string | null;
            customerName: string;
            customerAddress: string | null;
            invoiceDate: Date;
            paymentTerms: string;
            voucherId: string | null;
            notes: string | null;
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    findOne(id: string, req: any): Promise<{
        dispatch: {
            dispatchNumber: string;
            lrNumber: string;
        };
        salesOrder: {
            soNumber: string;
            cpo: {
                cpoNumber: string;
                customerPoNumber: string;
            };
        };
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
            invoiceId: string;
            paymentDate: Date;
            amount: number;
            paymentMode: string;
            referenceNumber: string | null;
            bankAccountId: string | null;
        }[];
    } & {
        id: string;
        companyId: string;
        dueDate: Date;
        status: string;
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
        invoiceNumber: string;
        dispatchId: string | null;
        soId: string | null;
        customerName: string;
        customerAddress: string | null;
        invoiceDate: Date;
        paymentTerms: string;
        voucherId: string | null;
        notes: string | null;
    }>;
    create(dto: CreateArInvoiceDto, req: any): Promise<{
        dispatch: {
            dispatchNumber: string;
            lrNumber: string;
        };
        salesOrder: {
            soNumber: string;
            cpo: {
                cpoNumber: string;
                customerPoNumber: string;
            };
        };
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
            invoiceId: string;
            paymentDate: Date;
            amount: number;
            paymentMode: string;
            referenceNumber: string | null;
            bankAccountId: string | null;
        }[];
    } & {
        id: string;
        companyId: string;
        dueDate: Date;
        status: string;
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
        invoiceNumber: string;
        dispatchId: string | null;
        soId: string | null;
        customerName: string;
        customerAddress: string | null;
        invoiceDate: Date;
        paymentTerms: string;
        voucherId: string | null;
        notes: string | null;
    }>;
    createFromDispatch(dispatchId: string, req: any): Promise<{
        dispatch: {
            dispatchNumber: string;
            lrNumber: string;
        };
        salesOrder: {
            soNumber: string;
            cpo: {
                cpoNumber: string;
                customerPoNumber: string;
            };
        };
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
            invoiceId: string;
            paymentDate: Date;
            amount: number;
            paymentMode: string;
            referenceNumber: string | null;
            bankAccountId: string | null;
        }[];
    } & {
        id: string;
        companyId: string;
        dueDate: Date;
        status: string;
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
        invoiceNumber: string;
        dispatchId: string | null;
        soId: string | null;
        customerName: string;
        customerAddress: string | null;
        invoiceDate: Date;
        paymentTerms: string;
        voucherId: string | null;
        notes: string | null;
    }>;
    recordPayment(dto: CreateArPaymentDto, req: any): Promise<{
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
        invoiceId: string;
        paymentDate: Date;
        amount: number;
        paymentMode: string;
        referenceNumber: string | null;
        bankAccountId: string | null;
    }>;
}
