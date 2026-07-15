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
            rejectionReason: string | null;
            bankName: string | null;
            currency: string;
            notes: string | null;
            totalAmount: number;
            validUntil: Date | null;
            exchangeRate: number;
            subtotalForeign: number;
            ipoId: string;
            vendorPiNumber: string | null;
            piDate: Date;
            bankAddress: string | null;
            swiftCode: string | null;
            piNumber: string;
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
            hsnCode: string | null;
            uom: string;
            sequence: number;
            qty: number;
            unitPriceForeign: number;
            totalForeign: number;
            totalInr: number;
            ipoItemId: string | null;
            piId: string;
        }[];
        ipo: {
            status: string;
            vendor: {
                name: string;
                code: string;
            };
            currency: string;
            exchangeRate: number;
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
        rejectionReason: string | null;
        bankName: string | null;
        currency: string;
        notes: string | null;
        totalAmount: number;
        validUntil: Date | null;
        exchangeRate: number;
        subtotalForeign: number;
        ipoId: string;
        vendorPiNumber: string | null;
        piDate: Date;
        bankAddress: string | null;
        swiftCode: string | null;
        piNumber: string;
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
            hsnCode: string | null;
            uom: string;
            sequence: number;
            qty: number;
            unitPriceForeign: number;
            totalForeign: number;
            totalInr: number;
            ipoItemId: string | null;
            piId: string;
        }[];
        ipo: {
            status: string;
            vendor: {
                name: string;
                code: string;
            };
            currency: string;
            exchangeRate: number;
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
        rejectionReason: string | null;
        bankName: string | null;
        currency: string;
        notes: string | null;
        totalAmount: number;
        validUntil: Date | null;
        exchangeRate: number;
        subtotalForeign: number;
        ipoId: string;
        vendorPiNumber: string | null;
        piDate: Date;
        bankAddress: string | null;
        swiftCode: string | null;
        piNumber: string;
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
            hsnCode: string | null;
            uom: string;
            sequence: number;
            qty: number;
            unitPriceForeign: number;
            totalForeign: number;
            totalInr: number;
            ipoItemId: string | null;
            piId: string;
        }[];
        ipo: {
            status: string;
            vendor: {
                name: string;
                code: string;
            };
            currency: string;
            exchangeRate: number;
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
        rejectionReason: string | null;
        bankName: string | null;
        currency: string;
        notes: string | null;
        totalAmount: number;
        validUntil: Date | null;
        exchangeRate: number;
        subtotalForeign: number;
        ipoId: string;
        vendorPiNumber: string | null;
        piDate: Date;
        bankAddress: string | null;
        swiftCode: string | null;
        piNumber: string;
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
            hsnCode: string | null;
            uom: string;
            sequence: number;
            qty: number;
            unitPriceForeign: number;
            totalForeign: number;
            totalInr: number;
            ipoItemId: string | null;
            piId: string;
        }[];
        ipo: {
            status: string;
            vendor: {
                name: string;
                code: string;
            };
            currency: string;
            exchangeRate: number;
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
        rejectionReason: string | null;
        bankName: string | null;
        currency: string;
        notes: string | null;
        totalAmount: number;
        validUntil: Date | null;
        exchangeRate: number;
        subtotalForeign: number;
        ipoId: string;
        vendorPiNumber: string | null;
        piDate: Date;
        bankAddress: string | null;
        swiftCode: string | null;
        piNumber: string;
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
            hsnCode: string | null;
            uom: string;
            sequence: number;
            qty: number;
            unitPriceForeign: number;
            totalForeign: number;
            totalInr: number;
            ipoItemId: string | null;
            piId: string;
        }[];
        ipo: {
            status: string;
            vendor: {
                name: string;
                code: string;
            };
            currency: string;
            exchangeRate: number;
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
        rejectionReason: string | null;
        bankName: string | null;
        currency: string;
        notes: string | null;
        totalAmount: number;
        validUntil: Date | null;
        exchangeRate: number;
        subtotalForeign: number;
        ipoId: string;
        vendorPiNumber: string | null;
        piDate: Date;
        bankAddress: string | null;
        swiftCode: string | null;
        piNumber: string;
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
            hsnCode: string | null;
            uom: string;
            sequence: number;
            qty: number;
            unitPriceForeign: number;
            totalForeign: number;
            totalInr: number;
            ipoItemId: string | null;
            piId: string;
        }[];
        ipo: {
            status: string;
            vendor: {
                name: string;
                code: string;
            };
            currency: string;
            exchangeRate: number;
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
        rejectionReason: string | null;
        bankName: string | null;
        currency: string;
        notes: string | null;
        totalAmount: number;
        validUntil: Date | null;
        exchangeRate: number;
        subtotalForeign: number;
        ipoId: string;
        vendorPiNumber: string | null;
        piDate: Date;
        bankAddress: string | null;
        swiftCode: string | null;
        piNumber: string;
    }>;
}
