import { PrismaService } from '../prisma/prisma.service';
export declare class DispatchTraceService {
    private prisma;
    constructor(prisma: PrismaService);
    tracePackage(packageId: string, user: any): Promise<{
        packageId: string;
        packageNumber: string;
        currentStatus: string;
        timeline: any[];
        sourceTrace: ({
            itemCode: string;
            saleType: string;
            source: string;
            batchNumber: string;
            workOrderNumber?: undefined;
            stageName?: undefined;
        } | {
            itemCode: string;
            saleType: string;
            source: string;
            workOrderNumber: string;
            stageName: string;
            batchNumber?: undefined;
        } | {
            itemCode: string;
            saleType: string;
            source: string;
            batchNumber?: undefined;
            workOrderNumber?: undefined;
            stageName?: undefined;
        })[];
    }>;
    trace(query: {
        packageNumber?: string;
        gateOutNumber?: string;
        soNumber?: string;
    }, user: any): Promise<{
        packageId: string;
        packageNumber: string;
        currentStatus: string;
        timeline: any[];
        sourceTrace: ({
            itemCode: string;
            saleType: string;
            source: string;
            batchNumber: string;
            workOrderNumber?: undefined;
            stageName?: undefined;
        } | {
            itemCode: string;
            saleType: string;
            source: string;
            workOrderNumber: string;
            stageName: string;
            batchNumber?: undefined;
        } | {
            itemCode: string;
            saleType: string;
            source: string;
            batchNumber?: undefined;
            workOrderNumber?: undefined;
            stageName?: undefined;
        })[];
    }[]>;
}
