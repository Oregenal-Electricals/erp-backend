import { ProformaInvoiceService } from './proforma-invoice.service';
import { CreateProformaInvoiceDto, UpdateProformaInvoiceDto, RejectPiDto } from './dto/proforma-invoice.dto';
export declare class ProformaInvoiceController {
    private readonly piService;
    constructor(piService: ProformaInvoiceService);
    getStats(req: any): Promise<{
        total: number;
        received: number;
        accepted: number;
        rejected: number;
        totalValueInr: number;
        totalValueForeign: number;
    }>;
    findAll(req: any, query: any): Promise<{
        data: ({
            _count: {
                items: number;
            };
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
            bankName: string | null;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            status: string;
            currency: string;
            notes: string | null;
            totalAmount: number;
            validUntil: Date | null;
            rejectionReason: string | null;
            ipoId: string;
            exchangeRate: number;
            subtotalForeign: number;
            piNumber: string;
            vendorPiNumber: string | null;
            piDate: Date;
            bankAddress: string | null;
            swiftCode: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findByIpo(ipoId: string, req: any): Promise<({
        items: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            qty: number;
            sequence: number;
            hsnCode: string | null;
            ipoItemId: string | null;
            unitPriceForeign: number;
            piId: string;
            totalForeign: number;
            totalInr: number;
        }[];
        ipo: {
            status: string;
            vendor: {
                code: string;
                name: string;
            };
            currency: string;
            ipoNumber: string;
            exchangeRate: number;
        };
    } & {
        id: string;
        companyId: string;
        bankName: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        currency: string;
        notes: string | null;
        totalAmount: number;
        validUntil: Date | null;
        rejectionReason: string | null;
        ipoId: string;
        exchangeRate: number;
        subtotalForeign: number;
        piNumber: string;
        vendorPiNumber: string | null;
        piDate: Date;
        bankAddress: string | null;
        swiftCode: string | null;
    })[]>;
    findOne(id: string, req: any): Promise<{
        items: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            qty: number;
            sequence: number;
            hsnCode: string | null;
            ipoItemId: string | null;
            unitPriceForeign: number;
            piId: string;
            totalForeign: number;
            totalInr: number;
        }[];
        ipo: {
            status: string;
            vendor: {
                code: string;
                name: string;
            };
            currency: string;
            ipoNumber: string;
            exchangeRate: number;
        };
    } & {
        id: string;
        companyId: string;
        bankName: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        currency: string;
        notes: string | null;
        totalAmount: number;
        validUntil: Date | null;
        rejectionReason: string | null;
        ipoId: string;
        exchangeRate: number;
        subtotalForeign: number;
        piNumber: string;
        vendorPiNumber: string | null;
        piDate: Date;
        bankAddress: string | null;
        swiftCode: string | null;
    }>;
    create(dto: CreateProformaInvoiceDto, req: any): Promise<{
        items: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            qty: number;
            sequence: number;
            hsnCode: string | null;
            ipoItemId: string | null;
            unitPriceForeign: number;
            piId: string;
            totalForeign: number;
            totalInr: number;
        }[];
        ipo: {
            status: string;
            vendor: {
                code: string;
                name: string;
            };
            currency: string;
            ipoNumber: string;
            exchangeRate: number;
        };
    } & {
        id: string;
        companyId: string;
        bankName: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        currency: string;
        notes: string | null;
        totalAmount: number;
        validUntil: Date | null;
        rejectionReason: string | null;
        ipoId: string;
        exchangeRate: number;
        subtotalForeign: number;
        piNumber: string;
        vendorPiNumber: string | null;
        piDate: Date;
        bankAddress: string | null;
        swiftCode: string | null;
    }>;
    update(id: string, dto: UpdateProformaInvoiceDto, req: any): Promise<{
        items: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            qty: number;
            sequence: number;
            hsnCode: string | null;
            ipoItemId: string | null;
            unitPriceForeign: number;
            piId: string;
            totalForeign: number;
            totalInr: number;
        }[];
        ipo: {
            status: string;
            vendor: {
                code: string;
                name: string;
            };
            currency: string;
            ipoNumber: string;
            exchangeRate: number;
        };
    } & {
        id: string;
        companyId: string;
        bankName: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        currency: string;
        notes: string | null;
        totalAmount: number;
        validUntil: Date | null;
        rejectionReason: string | null;
        ipoId: string;
        exchangeRate: number;
        subtotalForeign: number;
        piNumber: string;
        vendorPiNumber: string | null;
        piDate: Date;
        bankAddress: string | null;
        swiftCode: string | null;
    }>;
    accept(id: string, req: any): Promise<{
        items: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            qty: number;
            sequence: number;
            hsnCode: string | null;
            ipoItemId: string | null;
            unitPriceForeign: number;
            piId: string;
            totalForeign: number;
            totalInr: number;
        }[];
        ipo: {
            status: string;
            vendor: {
                code: string;
                name: string;
            };
            currency: string;
            ipoNumber: string;
            exchangeRate: number;
        };
    } & {
        id: string;
        companyId: string;
        bankName: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        currency: string;
        notes: string | null;
        totalAmount: number;
        validUntil: Date | null;
        rejectionReason: string | null;
        ipoId: string;
        exchangeRate: number;
        subtotalForeign: number;
        piNumber: string;
        vendorPiNumber: string | null;
        piDate: Date;
        bankAddress: string | null;
        swiftCode: string | null;
    }>;
    reject(id: string, dto: RejectPiDto, req: any): Promise<{
        items: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            qty: number;
            sequence: number;
            hsnCode: string | null;
            ipoItemId: string | null;
            unitPriceForeign: number;
            piId: string;
            totalForeign: number;
            totalInr: number;
        }[];
        ipo: {
            status: string;
            vendor: {
                code: string;
                name: string;
            };
            currency: string;
            ipoNumber: string;
            exchangeRate: number;
        };
    } & {
        id: string;
        companyId: string;
        bankName: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        currency: string;
        notes: string | null;
        totalAmount: number;
        validUntil: Date | null;
        rejectionReason: string | null;
        ipoId: string;
        exchangeRate: number;
        subtotalForeign: number;
        piNumber: string;
        vendorPiNumber: string | null;
        piDate: Date;
        bankAddress: string | null;
        swiftCode: string | null;
    }>;
}
