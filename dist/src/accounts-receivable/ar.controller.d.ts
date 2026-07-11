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
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            status: string;
            paymentTerms: string;
            notes: string | null;
            customerName: string;
            subtotal: number;
            totalGst: number;
            totalAmount: number;
            soId: string | null;
            invoiceNumber: string;
            dispatchId: string | null;
            customerAddress: string | null;
            invoiceDate: Date;
            dueDate: Date;
            paidAmount: number;
            outstandingAmount: number;
            voucherId: string | null;
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
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            status: string;
            paymentTerms: string;
            notes: string | null;
            customerName: string;
            subtotal: number;
            totalGst: number;
            totalAmount: number;
            soId: string | null;
            invoiceNumber: string;
            dispatchId: string | null;
            customerAddress: string | null;
            invoiceDate: Date;
            dueDate: Date;
            paidAmount: number;
            outstandingAmount: number;
            voucherId: string | null;
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    findOne(id: string, req: any): Promise<{
        salesOrder: {
            soNumber: string;
            cpo: {
                cpoNumber: string;
                customerPoNumber: string;
            };
        };
        dispatch: {
            dispatchNumber: string;
            lrNumber: string;
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
            paymentDate: Date;
            paymentMode: string;
            invoiceId: string;
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
        paymentTerms: string;
        notes: string | null;
        customerName: string;
        subtotal: number;
        totalGst: number;
        totalAmount: number;
        soId: string | null;
        invoiceNumber: string;
        dispatchId: string | null;
        customerAddress: string | null;
        invoiceDate: Date;
        dueDate: Date;
        paidAmount: number;
        outstandingAmount: number;
        voucherId: string | null;
    }>;
    create(dto: CreateArInvoiceDto, req: any): Promise<{
        salesOrder: {
            soNumber: string;
            cpo: {
                cpoNumber: string;
                customerPoNumber: string;
            };
        };
        dispatch: {
            dispatchNumber: string;
            lrNumber: string;
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
            paymentDate: Date;
            paymentMode: string;
            invoiceId: string;
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
        paymentTerms: string;
        notes: string | null;
        customerName: string;
        subtotal: number;
        totalGst: number;
        totalAmount: number;
        soId: string | null;
        invoiceNumber: string;
        dispatchId: string | null;
        customerAddress: string | null;
        invoiceDate: Date;
        dueDate: Date;
        paidAmount: number;
        outstandingAmount: number;
        voucherId: string | null;
    }>;
    createFromDispatch(dispatchId: string, req: any): Promise<{
        salesOrder: {
            soNumber: string;
            cpo: {
                cpoNumber: string;
                customerPoNumber: string;
            };
        };
        dispatch: {
            dispatchNumber: string;
            lrNumber: string;
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
            paymentDate: Date;
            paymentMode: string;
            invoiceId: string;
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
        paymentTerms: string;
        notes: string | null;
        customerName: string;
        subtotal: number;
        totalGst: number;
        totalAmount: number;
        soId: string | null;
        invoiceNumber: string;
        dispatchId: string | null;
        customerAddress: string | null;
        invoiceDate: Date;
        dueDate: Date;
        paidAmount: number;
        outstandingAmount: number;
        voucherId: string | null;
    }>;
    recordPayment(dto: CreateArPaymentDto, req: any): Promise<{
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
        paymentDate: Date;
        paymentMode: string;
        invoiceId: string;
    }>;
}
