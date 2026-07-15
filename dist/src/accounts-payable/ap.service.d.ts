import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateApBillDto, CreateApPaymentDto } from './dto/ap.dto';
export declare class ApService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private generateBillNumber;
    private generatePaymentNumber;
    private calcDueDate;
    private includes;
    create(dto: CreateApBillDto, user: any): Promise<{
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
            paymentNumber: string;
            paymentDate: Date;
            bankAccountId: string | null;
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
        billNumber: string;
        vendorBillNumber: string;
        billDate: Date;
    }>;
    private createBillVoucher;
    recordPayment(dto: CreateApPaymentDto, user: any): Promise<{
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
        paymentNumber: string;
        paymentDate: Date;
        bankAccountId: string | null;
        billId: string;
    }>;
    private createPaymentVoucher;
    findAll(user: any, query: any): Promise<{
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
            billNumber: string;
            vendorBillNumber: string;
            billDate: Date;
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    findOne(id: string, user: any): Promise<{
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
            paymentNumber: string;
            paymentDate: Date;
            bankAccountId: string | null;
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
        billNumber: string;
        vendorBillNumber: string;
        billDate: Date;
    }>;
    getStats(user: any): Promise<{
        total: number;
        approved: number;
        partial: number;
        paid: number;
        overdue: number;
        totalOutstanding: number;
        totalPaid: number;
    }>;
    getAgingReport(user: any): Promise<{
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
            billNumber: string;
            vendorBillNumber: string;
            billDate: Date;
        }[];
    }>;
}
