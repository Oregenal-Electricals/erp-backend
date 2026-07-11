import { VendorPortalService } from './vendor-portal.service';
export declare class VendorPortalController {
    private readonly vpService;
    constructor(vpService: VendorPortalService);
    getDashboard(vendorId: string, req: any): Promise<{
        vendor: {
            name: string;
            code: string;
            email: string;
        };
        stats: {
            openPOs: number;
            pendingRFQs: number;
            totalPOs: number;
        };
        recentPOs: {
            id: string;
            createdAt: Date;
            status: string;
            totalAmount: number;
            poNumber: string;
        }[];
    }>;
    getPOs(vendorId: string, query: any, req: any): Promise<{
        data: ({
            items: {
                id: string;
                companyId: string;
                taxRate: number;
                isActive: boolean;
                isTestData: boolean;
                createdAt: Date;
                updatedAt: Date;
                createdBy: string | null;
                updatedBy: string | null;
                status: string;
                itemCode: string;
                itemName: string;
                uom: string;
                unitPrice: number;
                discount: number | null;
                pendingQty: number;
                poId: string;
                prItemId: string | null;
                quotationItemId: string | null;
                sequence: number;
                hsnCode: string | null;
                orderedQty: number;
                receivedQty: number;
                igstRate: number;
                cgstRate: number;
                sgstRate: number;
                taxAmount: number;
                totalPrice: number;
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
            paymentTerms: string | null;
            currency: string;
            notes: string | null;
            deliveryAddress: string | null;
            poDate: Date;
            deliveryDate: Date;
            subtotal: number;
            totalAmount: number;
            poNumber: string;
            rfqId: string | null;
            vendorId: string;
            prId: string | null;
            totalTax: number;
            approvedBy: string | null;
            approvedAt: Date | null;
            termsConditions: string | null;
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getRFQs(vendorId: string, req: any): Promise<({
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
            notes: string | null;
            uom: string;
            rfqId: string;
            prItemId: string | null;
            requiredQty: number;
        }[];
    } & {
        id: string;
        companyId: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        paymentTerms: string | null;
        notes: string | null;
        prId: string;
        rfqNumber: string;
        title: string;
        responseDeadline: Date;
        deliveryLocation: string | null;
        closedAt: Date | null;
    })[]>;
    getQuotations(vendorId: string, req: any): Promise<({
        items: {
            id: string;
            companyId: string;
            taxRate: number | null;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            itemCode: string;
            itemName: string;
            notes: string | null;
            uom: string;
            quotationId: string;
            unitPrice: number;
            discount: number | null;
            totalPrice: number;
            requiredQty: number;
            deliveryDays: number | null;
            rfqItemId: string | null;
            quotedQty: number;
        }[];
        rfq: {
            rfqNumber: string;
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
        paymentTerms: string | null;
        currency: string;
        notes: string | null;
        totalAmount: number | null;
        rfqId: string;
        vendorId: string;
        quotationNumber: string;
        validUntil: Date;
        deliveryDays: number;
    })[]>;
}
