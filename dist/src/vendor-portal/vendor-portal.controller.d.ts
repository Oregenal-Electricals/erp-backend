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
            poNumber: string;
            totalAmount: number;
        }[];
    }>;
    getPOs(vendorId: string, query: any, req: any): Promise<{
        data: ({
            items: {
                id: string;
                companyId: string;
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
                poId: string;
                hsnCode: string | null;
                igstRate: number;
                cgstRate: number;
                sgstRate: number;
                sequence: number;
                prItemId: string | null;
                unitPrice: number;
                discount: number | null;
                taxRate: number;
                totalPrice: number;
                quotationItemId: string | null;
                orderedQty: number;
                pendingQty: number;
                taxAmount: number;
                receivedQty: number;
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
            poNumber: string;
            rfqId: string | null;
            vendorId: string;
            prId: string | null;
            poDate: Date;
            deliveryDate: Date;
            deliveryAddress: string | null;
            paymentTerms: string | null;
            currency: string;
            subtotal: number;
            totalTax: number;
            totalAmount: number;
            approvedBy: string | null;
            approvedAt: Date | null;
            notes: string | null;
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
            uom: string;
            rfqId: string;
            notes: string | null;
            requiredQty: number;
            prItemId: string | null;
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
        title: string;
        prId: string;
        paymentTerms: string | null;
        notes: string | null;
        closedAt: Date | null;
        responseDeadline: Date;
        deliveryLocation: string | null;
        rfqNumber: string;
    })[]>;
    getQuotations(vendorId: string, req: any): Promise<({
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
            notes: string | null;
            requiredQty: number;
            rfqItemId: string | null;
            deliveryDays: number | null;
            quotedQty: number;
            unitPrice: number;
            discount: number | null;
            taxRate: number | null;
            totalPrice: number;
            quotationId: string;
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
        rfqId: string;
        vendorId: string;
        paymentTerms: string | null;
        currency: string;
        totalAmount: number | null;
        notes: string | null;
        validUntil: Date;
        deliveryDays: number;
        quotationNumber: string;
    })[]>;
}
