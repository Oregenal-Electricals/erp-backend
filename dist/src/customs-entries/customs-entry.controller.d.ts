import { CustomsEntryService } from './customs-entry.service';
import { CreateCustomsEntryDto, UpdateCustomsEntryDto, AssessCustomsEntryDto } from './dto/customs-entry.dto';
export declare class CustomsEntryController {
    private readonly ceService;
    constructor(ceService: CustomsEntryService);
    getStats(req: any): Promise<{
        total: number;
        draft: number;
        filed: number;
        assessed: number;
        dutyPaid: number;
        cleared: number;
        totalDutyPaid: number;
    }>;
    findAll(req: any, query: any): Promise<{
        data: ({
            ipo: {
                status: string;
                vendor: {
                    code: string;
                    name: string;
                };
                currency: string;
                ipoNumber: string;
            };
            shipment: {
                portOfDischarge: string;
                shipmentNumber: string;
                shipmentMode: string;
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
            igstRate: number;
            ipoId: string;
            totalDuty: number;
            cifValue: number;
            bcdRate: number;
            bcdAmount: number;
            swsAmount: number;
            igstAmount: number;
            aidcAmount: number | null;
            shipmentId: string;
            boeNumber: string;
            customsBoeNumber: string | null;
            chaName: string | null;
            portOfEntry: string | null;
            dutyPaidDate: Date | null;
            outOfChargeDate: Date | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findByIpo(ipoId: string, req: any): Promise<({
        ipo: {
            status: string;
            vendor: {
                code: string;
                name: string;
            };
            currency: string;
            ipoNumber: string;
        };
        shipment: {
            portOfDischarge: string;
            shipmentNumber: string;
            shipmentMode: string;
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
        igstRate: number;
        ipoId: string;
        totalDuty: number;
        cifValue: number;
        bcdRate: number;
        bcdAmount: number;
        swsAmount: number;
        igstAmount: number;
        aidcAmount: number | null;
        shipmentId: string;
        boeNumber: string;
        customsBoeNumber: string | null;
        chaName: string | null;
        portOfEntry: string | null;
        dutyPaidDate: Date | null;
        outOfChargeDate: Date | null;
    })[]>;
    findOne(id: string, req: any): Promise<{
        ipo: {
            status: string;
            vendor: {
                code: string;
                name: string;
            };
            currency: string;
            ipoNumber: string;
        };
        shipment: {
            portOfDischarge: string;
            shipmentNumber: string;
            shipmentMode: string;
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
        igstRate: number;
        ipoId: string;
        totalDuty: number;
        cifValue: number;
        bcdRate: number;
        bcdAmount: number;
        swsAmount: number;
        igstAmount: number;
        aidcAmount: number | null;
        shipmentId: string;
        boeNumber: string;
        customsBoeNumber: string | null;
        chaName: string | null;
        portOfEntry: string | null;
        dutyPaidDate: Date | null;
        outOfChargeDate: Date | null;
    }>;
    create(dto: CreateCustomsEntryDto, req: any): Promise<{
        ipo: {
            status: string;
            vendor: {
                code: string;
                name: string;
            };
            currency: string;
            ipoNumber: string;
        };
        shipment: {
            portOfDischarge: string;
            shipmentNumber: string;
            shipmentMode: string;
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
        igstRate: number;
        ipoId: string;
        totalDuty: number;
        cifValue: number;
        bcdRate: number;
        bcdAmount: number;
        swsAmount: number;
        igstAmount: number;
        aidcAmount: number | null;
        shipmentId: string;
        boeNumber: string;
        customsBoeNumber: string | null;
        chaName: string | null;
        portOfEntry: string | null;
        dutyPaidDate: Date | null;
        outOfChargeDate: Date | null;
    }>;
    update(id: string, dto: UpdateCustomsEntryDto, req: any): Promise<{
        ipo: {
            status: string;
            vendor: {
                code: string;
                name: string;
            };
            currency: string;
            ipoNumber: string;
        };
        shipment: {
            portOfDischarge: string;
            shipmentNumber: string;
            shipmentMode: string;
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
        igstRate: number;
        ipoId: string;
        totalDuty: number;
        cifValue: number;
        bcdRate: number;
        bcdAmount: number;
        swsAmount: number;
        igstAmount: number;
        aidcAmount: number | null;
        shipmentId: string;
        boeNumber: string;
        customsBoeNumber: string | null;
        chaName: string | null;
        portOfEntry: string | null;
        dutyPaidDate: Date | null;
        outOfChargeDate: Date | null;
    }>;
    file(id: string, req: any): Promise<{
        ipo: {
            status: string;
            vendor: {
                code: string;
                name: string;
            };
            currency: string;
            ipoNumber: string;
        };
        shipment: {
            portOfDischarge: string;
            shipmentNumber: string;
            shipmentMode: string;
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
        igstRate: number;
        ipoId: string;
        totalDuty: number;
        cifValue: number;
        bcdRate: number;
        bcdAmount: number;
        swsAmount: number;
        igstAmount: number;
        aidcAmount: number | null;
        shipmentId: string;
        boeNumber: string;
        customsBoeNumber: string | null;
        chaName: string | null;
        portOfEntry: string | null;
        dutyPaidDate: Date | null;
        outOfChargeDate: Date | null;
    }>;
    assess(id: string, dto: AssessCustomsEntryDto, req: any): Promise<{
        ipo: {
            status: string;
            vendor: {
                code: string;
                name: string;
            };
            currency: string;
            ipoNumber: string;
        };
        shipment: {
            portOfDischarge: string;
            shipmentNumber: string;
            shipmentMode: string;
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
        igstRate: number;
        ipoId: string;
        totalDuty: number;
        cifValue: number;
        bcdRate: number;
        bcdAmount: number;
        swsAmount: number;
        igstAmount: number;
        aidcAmount: number | null;
        shipmentId: string;
        boeNumber: string;
        customsBoeNumber: string | null;
        chaName: string | null;
        portOfEntry: string | null;
        dutyPaidDate: Date | null;
        outOfChargeDate: Date | null;
    }>;
    payDuty(id: string, req: any): Promise<{
        ipo: {
            status: string;
            vendor: {
                code: string;
                name: string;
            };
            currency: string;
            ipoNumber: string;
        };
        shipment: {
            portOfDischarge: string;
            shipmentNumber: string;
            shipmentMode: string;
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
        igstRate: number;
        ipoId: string;
        totalDuty: number;
        cifValue: number;
        bcdRate: number;
        bcdAmount: number;
        swsAmount: number;
        igstAmount: number;
        aidcAmount: number | null;
        shipmentId: string;
        boeNumber: string;
        customsBoeNumber: string | null;
        chaName: string | null;
        portOfEntry: string | null;
        dutyPaidDate: Date | null;
        outOfChargeDate: Date | null;
    }>;
    outOfCharge(id: string, req: any): Promise<{
        ipo: {
            status: string;
            vendor: {
                code: string;
                name: string;
            };
            currency: string;
            ipoNumber: string;
        };
        shipment: {
            portOfDischarge: string;
            shipmentNumber: string;
            shipmentMode: string;
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
        igstRate: number;
        ipoId: string;
        totalDuty: number;
        cifValue: number;
        bcdRate: number;
        bcdAmount: number;
        swsAmount: number;
        igstAmount: number;
        aidcAmount: number | null;
        shipmentId: string;
        boeNumber: string;
        customsBoeNumber: string | null;
        chaName: string | null;
        portOfEntry: string | null;
        dutyPaidDate: Date | null;
        outOfChargeDate: Date | null;
    }>;
}
