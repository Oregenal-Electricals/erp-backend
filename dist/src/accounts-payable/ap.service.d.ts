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
    private createBillVoucher;
    recordPayment(dto: CreateApPaymentDto, user: any): Promise<{
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
    private createPaymentVoucher;
    findAll(user: any, query: any): Promise<{
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
    findOne(id: string, user: any): Promise<{
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
}
