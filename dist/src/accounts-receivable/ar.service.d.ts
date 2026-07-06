import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateArInvoiceDto, CreateArPaymentDto } from './dto/ar.dto';
export declare class ArService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private generateInvoiceNumber;
    private generatePaymentNumber;
    private calcDueDate;
    private includes;
    createFromDispatch(dispatchId: string, user: any): Promise<{
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
    create(dto: CreateArInvoiceDto, user: any): Promise<{
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
    private createInvoiceVoucher;
    recordPayment(dto: CreateArPaymentDto, user: any): Promise<{
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
    private createReceiptVoucher;
    findAll(user: any, query: any): Promise<{
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
    findOne(id: string, user: any): Promise<{
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
    getStats(user: any): Promise<{
        total: number;
        sent: number;
        partial: number;
        paid: number;
        overdue: number;
        totalOutstanding: number;
        totalCollected: number;
    }>;
    getAgingReport(user: any): Promise<{
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
}
