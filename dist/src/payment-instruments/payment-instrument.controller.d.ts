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
            _count: number;
            _sum: {
                amountInr: number;
            };
        })[];
    }>;
    findAll(req: any, query: any): Promise<{
        data: ({
            ipo: {
                vendor: {
                    name: string;
                    code: string;
                };
                currency: string;
                ipoNumber: string;
            };
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
    findByIpo(ipoId: string, req: any): Promise<({
        ipo: {
            status: string;
            vendor: {
                name: string;
                code: string;
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
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
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
    findOne(id: string, req: any): Promise<{
        ipo: {
            status: string;
            vendor: {
                name: string;
                code: string;
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
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
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
    create(dto: CreatePaymentInstrumentDto, req: any): Promise<{
        ipo: {
            status: string;
            vendor: {
                name: string;
                code: string;
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
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
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
    update(id: string, dto: UpdatePaymentInstrumentDto, req: any): Promise<{
        ipo: {
            status: string;
            vendor: {
                name: string;
                code: string;
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
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
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
    open(id: string, req: any): Promise<{
        ipo: {
            status: string;
            vendor: {
                name: string;
                code: string;
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
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
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
    settle(id: string, req: any): Promise<{
        ipo: {
            status: string;
            vendor: {
                name: string;
                code: string;
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
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
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
    cancel(id: string, req: any): Promise<{
        ipo: {
            status: string;
            vendor: {
                name: string;
                code: string;
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
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
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
}
