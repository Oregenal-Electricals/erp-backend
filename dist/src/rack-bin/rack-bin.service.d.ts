import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateZoneDto, CreateRackDto, CreateBinDto, BulkCreateBinsDto, UpdateBinStatusDto } from './dto/rack-bin.dto';
export declare class RackBinService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    createZone(dto: CreateZoneDto, user: any): Promise<{
        id: string;
        code: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        description: string | null;
        warehouseId: string;
    }>;
    findZones(warehouseId: string, user: any): Promise<({
        _count: {
            racks: number;
        };
    } & {
        id: string;
        code: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        description: string | null;
        warehouseId: string;
    })[]>;
    createRack(dto: CreateRackDto, user: any): Promise<{
        zone: {
            code: string;
            name: string;
        };
    } & {
        id: string;
        code: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        description: string | null;
        warehouseId: string;
        zoneId: string | null;
        totalBins: number;
    }>;
    findRacks(warehouseId: string, user: any, zoneId?: string): Promise<({
        zone: {
            code: string;
            name: string;
        };
        _count: {
            bins: number;
        };
    } & {
        id: string;
        code: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        description: string | null;
        warehouseId: string;
        zoneId: string | null;
        totalBins: number;
    })[]>;
    createBin(dto: CreateBinDto, user: any): Promise<{
        rack: {
            code: string;
            name: string;
        };
    } & {
        id: string;
        code: string;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        status: string;
        itemCode: string | null;
        warehouseId: string;
        maxWeight: number | null;
        rackId: string;
        maxQty: number | null;
        currentQty: number;
    }>;
    bulkCreateBins(dto: BulkCreateBinsDto, user: any): Promise<{
        created: number;
        message: string;
    }>;
    findBins(rackId: string, user: any): Promise<({
        rack: {
            code: string;
            name: string;
        };
    } & {
        id: string;
        code: string;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        status: string;
        itemCode: string | null;
        warehouseId: string;
        maxWeight: number | null;
        rackId: string;
        maxQty: number | null;
        currentQty: number;
    })[]>;
    findEmptyBins(warehouseId: string, user: any): Promise<({
        rack: {
            code: string;
            name: string;
        };
    } & {
        id: string;
        code: string;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        status: string;
        itemCode: string | null;
        warehouseId: string;
        maxWeight: number | null;
        rackId: string;
        maxQty: number | null;
        currentQty: number;
    })[]>;
    updateBinStatus(id: string, dto: UpdateBinStatusDto, user: any): Promise<{
        id: string;
        code: string;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        status: string;
        itemCode: string | null;
        warehouseId: string;
        maxWeight: number | null;
        rackId: string;
        maxQty: number | null;
        currentQty: number;
    }>;
    getWarehouseStats(warehouseId: string, user: any): Promise<{
        totalZones: number;
        totalRacks: number;
        totalBins: number;
        emptyBins: number;
        partialBins: number;
        fullBins: number;
        utilization: number;
    }>;
}
