import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { SelectVendorsDto } from './dto/comparison.dto';
export declare class QuotationComparisonService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    getMatrix(rfqId: string, user: any): Promise<{
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
                createdAt: Date;
                updatedAt: Date;
                createdBy: string | null;
                updatedBy: string | null;
                isActive: boolean;
                isTestData: boolean;
                companyId: string;
                rfqId: string;
                selectedItemId: string;
                selectionReason: string | null;
                selectedVendorId: string;
                selectedQuotationId: string;
                rfqItemId: string;
            };
        };
    }>;
    selectVendors(rfqId: string, dto: SelectVendorsDto, user: any): Promise<{
        message: string;
        selections: any[];
    }>;
    getSummary(rfqId: string, user: any): Promise<{
        rfqId: string;
        totalSelections: number;
        vendorSummary: any[];
    }>;
    getStats(user: any): Promise<{
        total: number;
        rfqsWithSelections: number;
    }>;
}
