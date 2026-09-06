import { PrismaService } from '../prisma/prisma.service';
export declare class VendorPortalService {
    private prisma;
    constructor(prisma: PrismaService);
    getVendorDashboard(vendorId: string, companyId: string): Promise<{
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
    getVendorPOs(vendorId: string, companyId: string, query: any): Promise<{
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
                prItemId: string | null;
                quotationItemId: string | null;
                sequence: number;
                hsnCode: string | null;
                orderedQty: number;
                receivedQty: number;
                pendingQty: number;
                unitPrice: number;
                discount: number | null;
                taxRate: number;
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
            priceApprovalReason: string | null;
            termsConditions: string | null;
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getVendorRFQs(vendorId: string, companyId: string): Promise<({
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
        title: string;
        prId: string;
        paymentTerms: string | null;
        notes: string | null;
        closedAt: Date | null;
        responseDeadline: Date;
        deliveryLocation: string | null;
        rfqNumber: string;
    })[]>;
    getVendorQuotations(vendorId: string, companyId: string): Promise<({
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
            unitPrice: number;
            discount: number | null;
            taxRate: number | null;
            totalPrice: number;
            requiredQty: number;
            rfqItemId: string | null;
            deliveryDays: number | null;
            quotedQty: number;
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
