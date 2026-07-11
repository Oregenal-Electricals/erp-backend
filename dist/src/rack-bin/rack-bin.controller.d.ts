import { RackBinService } from './rack-bin.service';
import { CreateZoneDto, CreateRackDto, CreateBinDto, BulkCreateBinsDto, UpdateBinStatusDto } from './dto/rack-bin.dto';
export declare class RackBinController {
    private readonly rbService;
    constructor(rbService: RackBinService);
    getStats(wId: string, req: any): Promise<{
        totalZones: number;
        totalRacks: number;
        totalBins: number;
        emptyBins: number;
        partialBins: number;
        fullBins: number;
        utilization: number;
    }>;
    findZones(wId: string, req: any): Promise<({
        _count: {
            racks: number;
        };
    } & {
        id: string;
        companyId: string;
        code: string;
        name: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        warehouseId: string;
    })[]>;
    createZone(dto: CreateZoneDto, req: any): Promise<{
        id: string;
        companyId: string;
        code: string;
        name: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        warehouseId: string;
    }>;
    findRacks(wId: string, req: any, zoneId?: string): Promise<({
        _count: {
            bins: number;
        };
        zone: {
            code: string;
            name: string;
        };
    } & {
        id: string;
        companyId: string;
        code: string;
        name: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        warehouseId: string;
        zoneId: string | null;
        totalBins: number;
    })[]>;
    createRack(dto: CreateRackDto, req: any): Promise<{
        zone: {
            code: string;
            name: string;
        };
    } & {
        id: string;
        companyId: string;
        code: string;
        name: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        warehouseId: string;
        zoneId: string | null;
        totalBins: number;
    }>;
    findBins(rackId: string, req: any): Promise<({
        rack: {
            code: string;
            name: string;
        };
    } & {
        id: string;
        companyId: string;
        code: string;
        name: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        itemCode: string | null;
        warehouseId: string;
        rackId: string;
        maxQty: number | null;
        maxWeight: number | null;
        currentQty: number;
    })[]>;
    findEmptyBins(wId: string, req: any): Promise<({
        rack: {
            code: string;
            name: string;
        };
    } & {
        id: string;
        companyId: string;
        code: string;
        name: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        itemCode: string | null;
        warehouseId: string;
        rackId: string;
        maxQty: number | null;
        maxWeight: number | null;
        currentQty: number;
    })[]>;
    createBin(dto: CreateBinDto, req: any): Promise<{
        rack: {
            code: string;
            name: string;
        };
    } & {
        id: string;
        companyId: string;
        code: string;
        name: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        itemCode: string | null;
        warehouseId: string;
        rackId: string;
        maxQty: number | null;
        maxWeight: number | null;
        currentQty: number;
    }>;
    bulkCreate(dto: BulkCreateBinsDto, req: any): Promise<{
        created: number;
        message: string;
    }>;
    updateStatus(id: string, dto: UpdateBinStatusDto, req: any): Promise<{
        id: string;
        companyId: string;
        code: string;
        name: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        itemCode: string | null;
        warehouseId: string;
        rackId: string;
        maxQty: number | null;
        maxWeight: number | null;
        currentQty: number;
    }>;
}
