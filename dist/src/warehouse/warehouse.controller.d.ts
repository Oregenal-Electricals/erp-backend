import { WarehouseService } from './warehouse.service';
import { CreateWarehouseDto, UpdateWarehouseDto, CreateZoneDto, CreateRackDto, CreateBinDto } from './dto/warehouse.dto';
export declare class WarehouseController {
    private readonly service;
    constructor(service: WarehouseService);
    create(dto: CreateWarehouseDto, user: any): Promise<{
        plant: {
            id: string;
            name: string;
            code: string;
        };
    } & {
        id: string;
        companyId: string;
        name: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        code: string;
        address: string | null;
        plantId: string;
        type: import(".prisma/client").$Enums.WarehouseType;
        capacity: number | null;
        isDefault: boolean;
    }>;
    findAll(user: any, plantId?: string): Promise<({
        _count: {
            zones: number;
        };
        plant: {
            id: string;
            name: string;
            code: string;
        };
    } & {
        id: string;
        companyId: string;
        name: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        code: string;
        address: string | null;
        plantId: string;
        type: import(".prisma/client").$Enums.WarehouseType;
        capacity: number | null;
        isDefault: boolean;
    })[]>;
    getStats(user: any): Promise<{
        totalWarehouses: number;
        totalZones: number;
        totalRacks: number;
        totalBins: number;
    }>;
    findOne(id: string): Promise<{
        plant: {
            id: string;
            name: string;
            code: string;
        };
        zones: ({
            _count: {
                racks: number;
            };
            racks: ({
                _count: {
                    bins: number;
                };
                bins: {
                    id: string;
                    name: string;
                    description: string | null;
                    isActive: boolean;
                    isTestData: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    createdBy: string;
                    updatedBy: string;
                    code: string;
                    rackId: string;
                    binType: string;
                    maxQty: number | null;
                }[];
            } & {
                id: string;
                name: string;
                description: string | null;
                isActive: boolean;
                isTestData: boolean;
                createdAt: Date;
                updatedAt: Date;
                createdBy: string;
                updatedBy: string;
                code: string;
                zoneId: string;
                maxWeight: number | null;
                maxVolume: number | null;
            })[];
        } & {
            id: string;
            name: string;
            description: string | null;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string;
            updatedBy: string;
            code: string;
            warehouseId: string;
            temperature: string | null;
            isHazmat: boolean;
        })[];
    } & {
        id: string;
        companyId: string;
        name: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        code: string;
        address: string | null;
        plantId: string;
        type: import(".prisma/client").$Enums.WarehouseType;
        capacity: number | null;
        isDefault: boolean;
    }>;
    update(id: string, dto: UpdateWarehouseDto, user: any): Promise<{
        plant: {
            id: string;
            name: string;
            code: string;
        };
    } & {
        id: string;
        companyId: string;
        name: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        code: string;
        address: string | null;
        plantId: string;
        type: import(".prisma/client").$Enums.WarehouseType;
        capacity: number | null;
        isDefault: boolean;
    }>;
    createZone(dto: CreateZoneDto, user: any): Promise<{
        warehouse: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        name: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        code: string;
        warehouseId: string;
        temperature: string | null;
        isHazmat: boolean;
    }>;
    findZones(warehouseId: string): Promise<({
        _count: {
            racks: number;
        };
    } & {
        id: string;
        name: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        code: string;
        warehouseId: string;
        temperature: string | null;
        isHazmat: boolean;
    })[]>;
    createRack(dto: CreateRackDto, user: any): Promise<{
        zone: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        name: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        code: string;
        zoneId: string;
        maxWeight: number | null;
        maxVolume: number | null;
    }>;
    findRacks(zoneId: string): Promise<({
        _count: {
            bins: number;
        };
    } & {
        id: string;
        name: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        code: string;
        zoneId: string;
        maxWeight: number | null;
        maxVolume: number | null;
    })[]>;
    createBin(dto: CreateBinDto, user: any): Promise<{
        rack: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        name: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        code: string;
        rackId: string;
        binType: string;
        maxQty: number | null;
    }>;
    findBins(rackId: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        code: string;
        rackId: string;
        binType: string;
        maxQty: number | null;
    }[]>;
}
