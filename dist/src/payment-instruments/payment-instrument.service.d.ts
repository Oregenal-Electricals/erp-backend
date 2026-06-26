import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreatePaymentInstrumentDto, UpdatePaymentInstrumentDto } from './dto/payment-instrument.dto';
export declare class PaymentInstrumentService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private generateNumber;
    private includes;
    create(dto: CreatePaymentInstrumentDto, user: any): Promise<{
        ipo: {
            status: string;
            vendor: {
                code: string;
                name: string;
            };
            currency: string;
            ipoNumber: string;
        };
        pi: {
            vendorPiNumber: string;
            piNumber: string;
        };
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
        bankName: string;
        currency: string;
        notes: string | null;
        amount: number;
        ipoId: string;
        piId: string | null;
        instrumentType: string;
        bankReference: string | null;
        vendorBankName: string | null;
        vendorSwiftCode: string | null;
        amountInr: number;
        issueDate: Date;
        expiryDate: Date | null;
        latestShipmentDate: Date | null;
        presentationDays: number | null;
        instrumentNumber: string;
    }>;
    findAll(user: any, query: any): Promise<{
        data: ({
            ipo: {
                vendor: {
                    code: string;
                    name: string;
                };
                currency: string;
                ipoNumber: string;
            };
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
            bankName: string;
            currency: string;
            notes: string | null;
            amount: number;
            ipoId: string;
            piId: string | null;
            instrumentType: string;
            bankReference: string | null;
            vendorBankName: string | null;
            vendorSwiftCode: string | null;
            amountInr: number;
            issueDate: Date;
            expiryDate: Date | null;
            latestShipmentDate: Date | null;
            presentationDays: number | null;
            instrumentNumber: string;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, user: any): Promise<{
        ipo: {
            status: string;
            vendor: {
                code: string;
                name: string;
            };
            currency: string;
            ipoNumber: string;
        };
        pi: {
            vendorPiNumber: string;
            piNumber: string;
        };
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
        bankName: string;
        currency: string;
        notes: string | null;
        amount: number;
        ipoId: string;
        piId: string | null;
        instrumentType: string;
        bankReference: string | null;
        vendorBankName: string | null;
        vendorSwiftCode: string | null;
        amountInr: number;
        issueDate: Date;
        expiryDate: Date | null;
        latestShipmentDate: Date | null;
        presentationDays: number | null;
        instrumentNumber: string;
    }>;
    findByIpo(ipoId: string, user: any): Promise<({
        ipo: {
            status: string;
            vendor: {
                code: string;
                name: string;
            };
            currency: string;
            ipoNumber: string;
        };
        pi: {
            vendorPiNumber: string;
            piNumber: string;
        };
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
        bankName: string;
        currency: string;
        notes: string | null;
        amount: number;
        ipoId: string;
        piId: string | null;
        instrumentType: string;
        bankReference: string | null;
        vendorBankName: string | null;
        vendorSwiftCode: string | null;
        amountInr: number;
        issueDate: Date;
        expiryDate: Date | null;
        latestShipmentDate: Date | null;
        presentationDays: number | null;
        instrumentNumber: string;
    })[]>;
    update(id: string, dto: UpdatePaymentInstrumentDto, user: any): Promise<{
        ipo: {
            status: string;
            vendor: {
                code: string;
                name: string;
            };
            currency: string;
            ipoNumber: string;
        };
        pi: {
            vendorPiNumber: string;
            piNumber: string;
        };
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
        bankName: string;
        currency: string;
        notes: string | null;
        amount: number;
        ipoId: string;
        piId: string | null;
        instrumentType: string;
        bankReference: string | null;
        vendorBankName: string | null;
        vendorSwiftCode: string | null;
        amountInr: number;
        issueDate: Date;
        expiryDate: Date | null;
        latestShipmentDate: Date | null;
        presentationDays: number | null;
        instrumentNumber: string;
    }>;
    open(id: string, user: any): Promise<{
        ipo: {
            status: string;
            vendor: {
                code: string;
                name: string;
            };
            currency: string;
            ipoNumber: string;
        };
        pi: {
            vendorPiNumber: string;
            piNumber: string;
        };
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
        bankName: string;
        currency: string;
        notes: string | null;
        amount: number;
        ipoId: string;
        piId: string | null;
        instrumentType: string;
        bankReference: string | null;
        vendorBankName: string | null;
        vendorSwiftCode: string | null;
        amountInr: number;
        issueDate: Date;
        expiryDate: Date | null;
        latestShipmentDate: Date | null;
        presentationDays: number | null;
        instrumentNumber: string;
    }>;
    settle(id: string, user: any): Promise<{
        ipo: {
            status: string;
            vendor: {
                code: string;
                name: string;
            };
            currency: string;
            ipoNumber: string;
        };
        pi: {
            vendorPiNumber: string;
            piNumber: string;
        };
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
        bankName: string;
        currency: string;
        notes: string | null;
        amount: number;
        ipoId: string;
        piId: string | null;
        instrumentType: string;
        bankReference: string | null;
        vendorBankName: string | null;
        vendorSwiftCode: string | null;
        amountInr: number;
        issueDate: Date;
        expiryDate: Date | null;
        latestShipmentDate: Date | null;
        presentationDays: number | null;
        instrumentNumber: string;
    }>;
    cancel(id: string, user: any): Promise<{
        ipo: {
            status: string;
            vendor: {
                code: string;
                name: string;
            };
            currency: string;
            ipoNumber: string;
        };
        pi: {
            vendorPiNumber: string;
            piNumber: string;
        };
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
        bankName: string;
        currency: string;
        notes: string | null;
        amount: number;
        ipoId: string;
        piId: string | null;
        instrumentType: string;
        bankReference: string | null;
        vendorBankName: string | null;
        vendorSwiftCode: string | null;
        amountInr: number;
        issueDate: Date;
        expiryDate: Date | null;
        latestShipmentDate: Date | null;
        presentationDays: number | null;
        instrumentNumber: string;
    }>;
    getStats(user: any): Promise<{
        total: number;
        draft: number;
        opened: number;
        settled: number;
        cancelled: number;
        totalValueInr: number;
        totalValueForeign: number;
        byType: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.PaymentInstrumentGroupByOutputType, "instrumentType"[]> & {
            _count: number;
            _sum: {
                amountInr: number;
            };
        })[];
    }>;
}
