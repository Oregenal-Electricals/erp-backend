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
        salesOrder: {
            soNumber: string;
            cpo: {
                customerPoNumber: string;
                cpoNumber: string;
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
            referenceNumber: string | null;
            amount: number;
            paymentMode: string;
            voucherId: string | null;
            invoiceId: string;
            paymentDate: Date;
            bankAccountId: string | null;
            paymentNumber: string;
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
        customerAddress: string | null;
        dueDate: Date;
        customerName: string;
        invoiceNumber: string;
        invoiceDate: Date;
        paymentTerms: string;
        subtotal: number;
        totalAmount: number;
        notes: string | null;
        totalGst: number;
        soId: string | null;
        dispatchId: string | null;
        paidAmount: number;
        outstandingAmount: number;
        voucherId: string | null;
    }>;
    create(dto: CreateArInvoiceDto, user: any): Promise<{
        salesOrder: {
            soNumber: string;
            cpo: {
                customerPoNumber: string;
                cpoNumber: string;
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
            referenceNumber: string | null;
            amount: number;
            paymentMode: string;
            voucherId: string | null;
            invoiceId: string;
            paymentDate: Date;
            bankAccountId: string | null;
            paymentNumber: string;
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
        customerAddress: string | null;
        dueDate: Date;
        customerName: string;
        invoiceNumber: string;
        invoiceDate: Date;
        paymentTerms: string;
        subtotal: number;
        totalAmount: number;
        notes: string | null;
        totalGst: number;
        soId: string | null;
        dispatchId: string | null;
        paidAmount: number;
        outstandingAmount: number;
        voucherId: string | null;
    }>;
    private createInvoiceVoucher;
    recordPayment(dto: CreateArPaymentDto, user: any): Promise<{
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        remarks: string | null;
        referenceNumber: string | null;
        amount: number;
        paymentMode: string;
        voucherId: string | null;
        invoiceId: string;
        paymentDate: Date;
        bankAccountId: string | null;
        paymentNumber: string;
    }>;
    private createReceiptVoucher;
    findAll(user: any, query: any): Promise<{
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
            customerAddress: string | null;
            dueDate: Date;
            customerName: string;
            invoiceNumber: string;
            invoiceDate: Date;
            paymentTerms: string;
            subtotal: number;
            totalAmount: number;
            notes: string | null;
            totalGst: number;
            soId: string | null;
            dispatchId: string | null;
            paidAmount: number;
            outstandingAmount: number;
            voucherId: string | null;
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    findOne(id: string, user: any): Promise<{
        salesOrder: {
            soNumber: string;
            cpo: {
                customerPoNumber: string;
                cpoNumber: string;
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
            referenceNumber: string | null;
            amount: number;
            paymentMode: string;
            voucherId: string | null;
            invoiceId: string;
            paymentDate: Date;
            bankAccountId: string | null;
            paymentNumber: string;
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
        customerAddress: string | null;
        dueDate: Date;
        customerName: string;
        invoiceNumber: string;
        invoiceDate: Date;
        paymentTerms: string;
        subtotal: number;
        totalAmount: number;
        notes: string | null;
        totalGst: number;
        soId: string | null;
        dispatchId: string | null;
        paidAmount: number;
        outstandingAmount: number;
        voucherId: string | null;
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
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            status: string;
            customerAddress: string | null;
            dueDate: Date;
            customerName: string;
            invoiceNumber: string;
            invoiceDate: Date;
            paymentTerms: string;
            subtotal: number;
            totalAmount: number;
            notes: string | null;
            totalGst: number;
            soId: string | null;
            dispatchId: string | null;
            paidAmount: number;
            outstandingAmount: number;
            voucherId: string | null;
        }[];
    }>;
}
