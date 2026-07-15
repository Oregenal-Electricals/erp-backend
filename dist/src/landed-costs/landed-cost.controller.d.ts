import { LandedCostService } from './landed-cost.service';
import { CreateLandedCostDto, UpdateLandedCostDto } from './dto/landed-cost.dto';
export declare class LandedCostController {
    private readonly lcService;
    constructor(lcService: LandedCostService);
    getStats(req: any): Promise<{
        total: number;
        draft: number;
        finalized: number;
        totalLandedCost: number;
        totalCustomsDuty: number;
        totalFreight: number;
    }>;
    findAll(req: any, query: any): Promise<{
        data: ({
            _count: {
                items: number;
            };
            ipo: {
                vendor: {
                    name: string;
                    code: string;
                };
                currency: string;
                ipoNumber: string;
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
            notes: string | null;
            ipoId: string;
            lcNumber: string;
            invoiceValue: number;
            customsDuty: number;
            freightCharges: number;
            chaCharges: number;
            portCharges: number;
            bankCharges: number;
            insuranceCharges: number;
            otherCharges: number;
            totalLandedCost: number;
            allocationMethod: string;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findByIpo(ipoId: string, req: any): Promise<({
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
            qty: number;
            unitPriceForeign: number;
            ipoItemId: string | null;
            allocationRatio: number;
            allocatedCost: number;
            landedCostPerUnit: number;
            valueForeign: number;
            valueInr: number;
            landedCostId: string;
        }[];
        ipo: {
            status: string;
            vendor: {
                name: string;
                code: string;
            };
            currency: string;
            exchangeRate: number;
            ipoNumber: string;
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
        notes: string | null;
        ipoId: string;
        lcNumber: string;
        invoiceValue: number;
        customsDuty: number;
        freightCharges: number;
        chaCharges: number;
        portCharges: number;
        bankCharges: number;
        insuranceCharges: number;
        otherCharges: number;
        totalLandedCost: number;
        allocationMethod: string;
    })[]>;
    findOne(id: string, req: any): Promise<{
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
            qty: number;
            unitPriceForeign: number;
            ipoItemId: string | null;
            allocationRatio: number;
            allocatedCost: number;
            landedCostPerUnit: number;
            valueForeign: number;
            valueInr: number;
            landedCostId: string;
        }[];
        ipo: {
            status: string;
            vendor: {
                name: string;
                code: string;
            };
            currency: string;
            exchangeRate: number;
            ipoNumber: string;
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
        notes: string | null;
        ipoId: string;
        lcNumber: string;
        invoiceValue: number;
        customsDuty: number;
        freightCharges: number;
        chaCharges: number;
        portCharges: number;
        bankCharges: number;
        insuranceCharges: number;
        otherCharges: number;
        totalLandedCost: number;
        allocationMethod: string;
    }>;
    create(dto: CreateLandedCostDto, req: any): Promise<{
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
            qty: number;
            unitPriceForeign: number;
            ipoItemId: string | null;
            allocationRatio: number;
            allocatedCost: number;
            landedCostPerUnit: number;
            valueForeign: number;
            valueInr: number;
            landedCostId: string;
        }[];
        ipo: {
            status: string;
            vendor: {
                name: string;
                code: string;
            };
            currency: string;
            exchangeRate: number;
            ipoNumber: string;
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
        notes: string | null;
        ipoId: string;
        lcNumber: string;
        invoiceValue: number;
        customsDuty: number;
        freightCharges: number;
        chaCharges: number;
        portCharges: number;
        bankCharges: number;
        insuranceCharges: number;
        otherCharges: number;
        totalLandedCost: number;
        allocationMethod: string;
    }>;
    update(id: string, dto: UpdateLandedCostDto, req: any): Promise<{
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
            qty: number;
            unitPriceForeign: number;
            ipoItemId: string | null;
            allocationRatio: number;
            allocatedCost: number;
            landedCostPerUnit: number;
            valueForeign: number;
            valueInr: number;
            landedCostId: string;
        }[];
        ipo: {
            status: string;
            vendor: {
                name: string;
                code: string;
            };
            currency: string;
            exchangeRate: number;
            ipoNumber: string;
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
        notes: string | null;
        ipoId: string;
        lcNumber: string;
        invoiceValue: number;
        customsDuty: number;
        freightCharges: number;
        chaCharges: number;
        portCharges: number;
        bankCharges: number;
        insuranceCharges: number;
        otherCharges: number;
        totalLandedCost: number;
        allocationMethod: string;
    }>;
    calculate(id: string, req: any): Promise<{
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
            qty: number;
            unitPriceForeign: number;
            ipoItemId: string | null;
            allocationRatio: number;
            allocatedCost: number;
            landedCostPerUnit: number;
            valueForeign: number;
            valueInr: number;
            landedCostId: string;
        }[];
        ipo: {
            status: string;
            vendor: {
                name: string;
                code: string;
            };
            currency: string;
            exchangeRate: number;
            ipoNumber: string;
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
        notes: string | null;
        ipoId: string;
        lcNumber: string;
        invoiceValue: number;
        customsDuty: number;
        freightCharges: number;
        chaCharges: number;
        portCharges: number;
        bankCharges: number;
        insuranceCharges: number;
        otherCharges: number;
        totalLandedCost: number;
        allocationMethod: string;
    }>;
    finalize(id: string, req: any): Promise<{
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
            qty: number;
            unitPriceForeign: number;
            ipoItemId: string | null;
            allocationRatio: number;
            allocatedCost: number;
            landedCostPerUnit: number;
            valueForeign: number;
            valueInr: number;
            landedCostId: string;
        }[];
        ipo: {
            status: string;
            vendor: {
                name: string;
                code: string;
            };
            currency: string;
            exchangeRate: number;
            ipoNumber: string;
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
        notes: string | null;
        ipoId: string;
        lcNumber: string;
        invoiceValue: number;
        customsDuty: number;
        freightCharges: number;
        chaCharges: number;
        portCharges: number;
        bankCharges: number;
        insuranceCharges: number;
        otherCharges: number;
        totalLandedCost: number;
        allocationMethod: string;
    }>;
}
