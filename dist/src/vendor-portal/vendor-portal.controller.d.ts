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
                hsnCode: string | null;
                uom: string;
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
                poId: string;
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
            paymentTerms: string | null;
            currency: string;
            notes: string | null;
            approvedBy: string | null;
            approvedAt: Date | null;
            totalAmount: number;
            prId: string | null;
            vendorId: string;
            rfqId: string | null;
            deliveryDate: Date;
            deliveryAddress: string | null;
            termsConditions: string | null;
            poDate: Date;
            subtotal: number;
            totalTax: number;
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
            notes: string | null;
            requiredQty: number;
            prItemId: string | null;
            rfqId: string;
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
        closedAt: Date | null;
        paymentTerms: string | null;
        notes: string | null;
        prId: string;
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
        paymentTerms: string | null;
        currency: string;
        notes: string | null;
        totalAmount: number | null;
        vendorId: string;
        rfqId: string;
        validUntil: Date;
        deliveryDays: number;
        quotationNumber: string;
    })[]>;
}
