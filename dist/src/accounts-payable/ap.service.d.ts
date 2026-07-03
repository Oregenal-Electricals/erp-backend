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
            code: string;
            name: string;
        };
        po: {
            poNumber: string;
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
            paymentDate: Date;
            bankAccountId: string | null;
            paymentNumber: string;
            billId: string;
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
    private createBillVoucher;
    recordPayment(dto: CreateApPaymentDto, user: any): Promise<{
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
        paymentDate: Date;
        bankAccountId: string | null;
        paymentNumber: string;
        billId: string;
    }>;
    private createPaymentVoucher;
    findAll(user: any, query: any): Promise<{
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
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
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
    findOne(id: string, user: any): Promise<{
        vendor: {
            code: string;
            name: string;
        };
        po: {
            poNumber: string;
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
            paymentDate: Date;
            bankAccountId: string | null;
            paymentNumber: string;
            billId: string;
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
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
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
}
