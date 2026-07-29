import { QuotationComparisonService } from './quotation-comparison.service';
import { SelectVendorsDto } from './dto/comparison.dto';
export declare class QuotationComparisonController {
    private readonly compService;
    constructor(compService: QuotationComparisonService);
    getStats(req: any): Promise<{
        total: number;
        rfqsWithSelections: number;
    }>;
    getMatrix(rfqId: string, req: any): Promise<{
        rfq: {
            id: string;
            rfqNumber: string;
            title: string;
            status: string;
        };
        quotations: {
            id: string;
            quotationNumber: string;
            vendorId: string;
            vendorName: string;
            vendorCode: string;
            status: string;
            totalAmount: number;
            deliveryDays: number;
        }[];
        matrix: {
            rfqItemId: string;
            itemCode: string;
            itemName: string;
            uom: string;
            requiredQty: number;
            vendors: {
                rank: number;
                quotationId: string;
                quotationNumber: string;
                vendorId: string;
                vendorCode: string;
                vendorName: string;
                quotationItemId: string;
                quotedQty: number;
                unitPrice: number;
                discount: number;
                taxRate: number;
                totalPrice: number;
                deliveryDays: number;
                hasQuote: boolean;
            }[];
            selectedVendorId: string;
            selectedQuotationId: string;
            selectionReason: string;
        }[];
        totalQuotations: number;
        totalItems: number;
        selections: {
            [k: string]: {
                id: string;
                companyId: string;
                isActive: boolean;
                isTestData: boolean;
                createdAt: Date;
                updatedAt: Date;
                createdBy: string | null;
                updatedBy: string | null;
                rfqId: string;
                selectedItemId: string;
                selectionReason: string | null;
                selectedVendorId: string;
                selectedQuotationId: string;
                rfqItemId: string;
            };
        };
    }>;
    getSummary(rfqId: string, req: any): Promise<{
        rfqId: string;
        totalSelections: number;
        vendorSummary: any[];
    }>;
    selectVendors(rfqId: string, dto: SelectVendorsDto, req: any): Promise<{
        message: string;
        selections: any[];
    }>;
}
