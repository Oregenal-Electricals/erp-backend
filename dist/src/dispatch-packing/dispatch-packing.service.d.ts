import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
export declare class DispatchPackingService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private generatePackingNumber;
    private generatePackageNumber;
    private includes;
    createPacking(verificationId: string, user: any): Promise<{
        salesOrder: {
            customerName: string;
            soNumber: string;
        };
        verification: {
            verificationNumber: string;
        };
        packages: ({
            items: {
                id: string;
                isActive: boolean;
                isTestData: boolean;
                createdAt: Date;
                updatedAt: Date;
                createdBy: string | null;
                updatedBy: string | null;
                status: string;
                reason: string | null;
                itemCode: string;
                itemName: string;
                saleType: string;
                reversedQty: number;
                verificationItemId: string;
                packedQty: number;
                packageId: string;
            }[];
        } & {
            id: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            status: string;
            netWeight: number | null;
            grossWeight: number | null;
            packageNumber: string;
            packageType: string;
            packingId: string;
            assignedTransportAssignmentId: string | null;
        })[];
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
        remarks: string | null;
        customerName: string;
        soId: string;
        verificationId: string;
        packingNumber: string;
    }>;
    createPackage(packingId: string, user: any, packageType?: string, netWeight?: number, grossWeight?: number): Promise<{
        items: {
            id: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            status: string;
            reason: string | null;
            itemCode: string;
            itemName: string;
            saleType: string;
            reversedQty: number;
            verificationItemId: string;
            packedQty: number;
            packageId: string;
        }[];
    } & {
        id: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        netWeight: number | null;
        grossWeight: number | null;
        packageNumber: string;
        packageType: string;
        packingId: string;
        assignedTransportAssignmentId: string | null;
    }>;
    private remainingToPack;
    private revalidateQuality;
    addPackageItem(packageId: string, verificationItemId: string, packedQty: number, user: any): Promise<{
        id: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        reason: string | null;
        itemCode: string;
        itemName: string;
        saleType: string;
        reversedQty: number;
        verificationItemId: string;
        packedQty: number;
        packageId: string;
    }>;
    private refreshPackingStatus;
    reversePackageItem(packageItemId: string, reverseQty: number, reason: string | undefined, user: any): Promise<{
        id: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        reason: string | null;
        itemCode: string;
        itemName: string;
        saleType: string;
        reversedQty: number;
        verificationItemId: string;
        packedQty: number;
        packageId: string;
    }>;
    findOne(id: string, user: any): Promise<{
        salesOrder: {
            customerName: string;
            soNumber: string;
        };
        verification: {
            verificationNumber: string;
        };
        packages: ({
            items: {
                id: string;
                isActive: boolean;
                isTestData: boolean;
                createdAt: Date;
                updatedAt: Date;
                createdBy: string | null;
                updatedBy: string | null;
                status: string;
                reason: string | null;
                itemCode: string;
                itemName: string;
                saleType: string;
                reversedQty: number;
                verificationItemId: string;
                packedQty: number;
                packageId: string;
            }[];
        } & {
            id: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            status: string;
            netWeight: number | null;
            grossWeight: number | null;
            packageNumber: string;
            packageType: string;
            packingId: string;
            assignedTransportAssignmentId: string | null;
        })[];
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
        remarks: string | null;
        customerName: string;
        soId: string;
        verificationId: string;
        packingNumber: string;
    }>;
}
