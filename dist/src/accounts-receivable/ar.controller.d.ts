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
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
            status: string;
            dueDate: Date;
            customerName: string;
            invoiceNumber: string;
            invoiceDate: Date;
            customerAddress: string | null;
            paymentTerms: string;
            notes: string | null;
            totalAmount: number;
            subtotal: number;
            totalGst: number;
            soId: string | null;
            dispatchId: string | null;
            voucherId: string | null;
            paidAmount: number;
            outstandingAmount: number;
        }[];
    }>;
    findAll(req: any, query: any): Promise<{
        data: ({
            salesOrder: {
                soNumber: string;
            };
            dispatch: {
                dispatchNumber: string;
            };
            payments: {
                id: string;
                amount: number;
                paymentDate: Date;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
            status: string;
            dueDate: Date;
            customerName: string;
            invoiceNumber: string;
            invoiceDate: Date;
            customerAddress: string | null;
            paymentTerms: string;
            notes: string | null;
            totalAmount: number;
            subtotal: number;
            totalGst: number;
            soId: string | null;
            dispatchId: string | null;
            voucherId: string | null;
            paidAmount: number;
            outstandingAmount: number;
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    findOne(id: string, req: any): Promise<{
        salesOrder: {
            cpo: {
                customerPoNumber: string;
                cpoNumber: string;
            };
            soNumber: string;
        };
        dispatch: {
            lrNumber: string;
            dispatchNumber: string;
        };
        payments: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
            remarks: string | null;
            amount: number;
            paymentMode: string;
            referenceNumber: string | null;
            voucherId: string | null;
            invoiceId: string;
            paymentDate: Date;
            bankAccountId: string | null;
            paymentNumber: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        status: string;
        dueDate: Date;
        customerName: string;
        invoiceNumber: string;
        invoiceDate: Date;
        customerAddress: string | null;
        paymentTerms: string;
        notes: string | null;
        totalAmount: number;
        subtotal: number;
        totalGst: number;
        soId: string | null;
        dispatchId: string | null;
        voucherId: string | null;
        paidAmount: number;
        outstandingAmount: number;
    }>;
    create(dto: CreateArInvoiceDto, req: any): Promise<{
        salesOrder: {
            cpo: {
                customerPoNumber: string;
                cpoNumber: string;
            };
            soNumber: string;
        };
        dispatch: {
            lrNumber: string;
            dispatchNumber: string;
        };
        payments: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
            remarks: string | null;
            amount: number;
            paymentMode: string;
            referenceNumber: string | null;
            voucherId: string | null;
            invoiceId: string;
            paymentDate: Date;
            bankAccountId: string | null;
            paymentNumber: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        status: string;
        dueDate: Date;
        customerName: string;
        invoiceNumber: string;
        invoiceDate: Date;
        customerAddress: string | null;
        paymentTerms: string;
        notes: string | null;
        totalAmount: number;
        subtotal: number;
        totalGst: number;
        soId: string | null;
        dispatchId: string | null;
        voucherId: string | null;
        paidAmount: number;
        outstandingAmount: number;
    }>;
    createFromDispatch(dispatchId: string, req: any): Promise<{
        salesOrder: {
            cpo: {
                customerPoNumber: string;
                cpoNumber: string;
            };
            soNumber: string;
        };
        dispatch: {
            lrNumber: string;
            dispatchNumber: string;
        };
        payments: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
            remarks: string | null;
            amount: number;
            paymentMode: string;
            referenceNumber: string | null;
            voucherId: string | null;
            invoiceId: string;
            paymentDate: Date;
            bankAccountId: string | null;
            paymentNumber: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        status: string;
        dueDate: Date;
        customerName: string;
        invoiceNumber: string;
        invoiceDate: Date;
        customerAddress: string | null;
        paymentTerms: string;
        notes: string | null;
        totalAmount: number;
        subtotal: number;
        totalGst: number;
        soId: string | null;
        dispatchId: string | null;
        voucherId: string | null;
        paidAmount: number;
        outstandingAmount: number;
    }>;
    recordPayment(dto: CreateArPaymentDto, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        remarks: string | null;
        amount: number;
        paymentMode: string;
        referenceNumber: string | null;
        voucherId: string | null;
        invoiceId: string;
        paymentDate: Date;
        bankAccountId: string | null;
        paymentNumber: string;
    }>;
}
