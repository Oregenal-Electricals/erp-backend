import { PaymentInstrumentService } from './payment-instrument.service';
import { CreatePaymentInstrumentDto, UpdatePaymentInstrumentDto } from './dto/payment-instrument.dto';
export declare class PaymentInstrumentController {
    private readonly piService;
    constructor(piService: PaymentInstrumentService);
    getStats(req: any): Promise<{
        total: number;
        draft: number;
        opened: number;
        settled: number;
        cancelled: number;
        totalValueInr: number;
        totalValueForeign: number;
        byType: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.PaymentInstrumentGroupByOutputType, "instrumentType"[]> & {
            _sum: {
                amountInr: number;
            };
            _count: number;
        })[];
    }>;
    findAll(req: any, query: any): Promise<{
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
            companyId: string;
            bankName: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            status: string;
            currency: string;
            notes: string | null;
            expiryDate: Date | null;
            amount: number;
            ipoId: string;
            issueDate: Date;
            amountInr: number;
            presentationDays: number | null;
            piId: string | null;
            instrumentNumber: string;
            instrumentType: string;
            bankReference: string | null;
            vendorBankName: string | null;
            vendorSwiftCode: string | null;
            latestShipmentDate: Date | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findByIpo(ipoId: string, req: any): Promise<({
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
            piNumber: string;
            vendorPiNumber: string;
        };
    } & {
        id: string;
        companyId: string;
        bankName: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        currency: string;
        notes: string | null;
        expiryDate: Date | null;
        amount: number;
        ipoId: string;
        issueDate: Date;
        amountInr: number;
        presentationDays: number | null;
        piId: string | null;
        instrumentNumber: string;
        instrumentType: string;
        bankReference: string | null;
        vendorBankName: string | null;
        vendorSwiftCode: string | null;
        latestShipmentDate: Date | null;
    })[]>;
    findOne(id: string, req: any): Promise<{
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
            piNumber: string;
            vendorPiNumber: string;
        };
    } & {
        id: string;
        companyId: string;
        bankName: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        currency: string;
        notes: string | null;
        expiryDate: Date | null;
        amount: number;
        ipoId: string;
        issueDate: Date;
        amountInr: number;
        presentationDays: number | null;
        piId: string | null;
        instrumentNumber: string;
        instrumentType: string;
        bankReference: string | null;
        vendorBankName: string | null;
        vendorSwiftCode: string | null;
        latestShipmentDate: Date | null;
    }>;
    create(dto: CreatePaymentInstrumentDto, req: any): Promise<{
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
            piNumber: string;
            vendorPiNumber: string;
        };
    } & {
        id: string;
        companyId: string;
        bankName: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        currency: string;
        notes: string | null;
        expiryDate: Date | null;
        amount: number;
        ipoId: string;
        issueDate: Date;
        amountInr: number;
        presentationDays: number | null;
        piId: string | null;
        instrumentNumber: string;
        instrumentType: string;
        bankReference: string | null;
        vendorBankName: string | null;
        vendorSwiftCode: string | null;
        latestShipmentDate: Date | null;
    }>;
    update(id: string, dto: UpdatePaymentInstrumentDto, req: any): Promise<{
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
            piNumber: string;
            vendorPiNumber: string;
        };
    } & {
        id: string;
        companyId: string;
        bankName: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        currency: string;
        notes: string | null;
        expiryDate: Date | null;
        amount: number;
        ipoId: string;
        issueDate: Date;
        amountInr: number;
        presentationDays: number | null;
        piId: string | null;
        instrumentNumber: string;
        instrumentType: string;
        bankReference: string | null;
        vendorBankName: string | null;
        vendorSwiftCode: string | null;
        latestShipmentDate: Date | null;
    }>;
    open(id: string, req: any): Promise<{
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
            piNumber: string;
            vendorPiNumber: string;
        };
    } & {
        id: string;
        companyId: string;
        bankName: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        currency: string;
        notes: string | null;
        expiryDate: Date | null;
        amount: number;
        ipoId: string;
        issueDate: Date;
        amountInr: number;
        presentationDays: number | null;
        piId: string | null;
        instrumentNumber: string;
        instrumentType: string;
        bankReference: string | null;
        vendorBankName: string | null;
        vendorSwiftCode: string | null;
        latestShipmentDate: Date | null;
    }>;
    settle(id: string, req: any): Promise<{
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
            piNumber: string;
            vendorPiNumber: string;
        };
    } & {
        id: string;
        companyId: string;
        bankName: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        currency: string;
        notes: string | null;
        expiryDate: Date | null;
        amount: number;
        ipoId: string;
        issueDate: Date;
        amountInr: number;
        presentationDays: number | null;
        piId: string | null;
        instrumentNumber: string;
        instrumentType: string;
        bankReference: string | null;
        vendorBankName: string | null;
        vendorSwiftCode: string | null;
        latestShipmentDate: Date | null;
    }>;
    cancel(id: string, req: any): Promise<{
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
            piNumber: string;
            vendorPiNumber: string;
        };
    } & {
        id: string;
        companyId: string;
        bankName: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        currency: string;
        notes: string | null;
        expiryDate: Date | null;
        amount: number;
        ipoId: string;
        issueDate: Date;
        amountInr: number;
        presentationDays: number | null;
        piId: string | null;
        instrumentNumber: string;
        instrumentType: string;
        bankReference: string | null;
        vendorBankName: string | null;
        vendorSwiftCode: string | null;
        latestShipmentDate: Date | null;
    }>;
}
