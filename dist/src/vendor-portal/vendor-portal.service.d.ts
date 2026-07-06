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
                createdAt: Date;
                updatedAt: Date;
                createdBy: string | null;
                updatedBy: string | null;
                isActive: boolean;
                isTestData: boolean;
                companyId: string;
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
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
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
    getVendorRFQs(vendorId: string, companyId: string): Promise<({
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
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
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        description: string | null;
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
    getVendorQuotations(vendorId: string, companyId: string): Promise<({
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
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
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
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
