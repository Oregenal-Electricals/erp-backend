import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateCustomsEntryDto, UpdateCustomsEntryDto, AssessCustomsEntryDto } from './dto/customs-entry.dto';
export declare class CustomsEntryService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private generateBoeNumber;
    private calcDuty;
    private includes;
    create(dto: CreateCustomsEntryDto, user: any): Promise<{
        shipment: {
            portOfDischarge: string;
            shipmentMode: string;
            shipmentNumber: string;
        };
        ipo: {
            status: string;
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
        igstRate: number;
        bcdRate: number;
        ipoId: string;
        shipmentId: string;
        customsBoeNumber: string | null;
        chaName: string | null;
        portOfEntry: string | null;
        cifValue: number;
        aidcAmount: number | null;
        bcdAmount: number;
        swsAmount: number;
        igstAmount: number;
        totalDuty: number;
        boeNumber: string;
        dutyPaidDate: Date | null;
        outOfChargeDate: Date | null;
    }>;
    findAll(user: any, query: any): Promise<{
        data: ({
            shipment: {
                portOfDischarge: string;
                shipmentMode: string;
                shipmentNumber: string;
            };
            ipo: {
                status: string;
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
            igstRate: number;
            bcdRate: number;
            ipoId: string;
            shipmentId: string;
            customsBoeNumber: string | null;
            chaName: string | null;
            portOfEntry: string | null;
            cifValue: number;
            aidcAmount: number | null;
            bcdAmount: number;
            swsAmount: number;
            igstAmount: number;
            totalDuty: number;
            boeNumber: string;
            dutyPaidDate: Date | null;
            outOfChargeDate: Date | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, user: any): Promise<{
        shipment: {
            portOfDischarge: string;
            shipmentMode: string;
            shipmentNumber: string;
        };
        ipo: {
            status: string;
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
        igstRate: number;
        bcdRate: number;
        ipoId: string;
        shipmentId: string;
        customsBoeNumber: string | null;
        chaName: string | null;
        portOfEntry: string | null;
        cifValue: number;
        aidcAmount: number | null;
        bcdAmount: number;
        swsAmount: number;
        igstAmount: number;
        totalDuty: number;
        boeNumber: string;
        dutyPaidDate: Date | null;
        outOfChargeDate: Date | null;
    }>;
    findByIpo(ipoId: string, user: any): Promise<({
        shipment: {
            portOfDischarge: string;
            shipmentMode: string;
            shipmentNumber: string;
        };
        ipo: {
            status: string;
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
        igstRate: number;
        bcdRate: number;
        ipoId: string;
        shipmentId: string;
        customsBoeNumber: string | null;
        chaName: string | null;
        portOfEntry: string | null;
        cifValue: number;
        aidcAmount: number | null;
        bcdAmount: number;
        swsAmount: number;
        igstAmount: number;
        totalDuty: number;
        boeNumber: string;
        dutyPaidDate: Date | null;
        outOfChargeDate: Date | null;
    })[]>;
    update(id: string, dto: UpdateCustomsEntryDto, user: any): Promise<{
        shipment: {
            portOfDischarge: string;
            shipmentMode: string;
            shipmentNumber: string;
        };
        ipo: {
            status: string;
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
        igstRate: number;
        bcdRate: number;
        ipoId: string;
        shipmentId: string;
        customsBoeNumber: string | null;
        chaName: string | null;
        portOfEntry: string | null;
        cifValue: number;
        aidcAmount: number | null;
        bcdAmount: number;
        swsAmount: number;
        igstAmount: number;
        totalDuty: number;
        boeNumber: string;
        dutyPaidDate: Date | null;
        outOfChargeDate: Date | null;
    }>;
    file(id: string, user: any): Promise<{
        shipment: {
            portOfDischarge: string;
            shipmentMode: string;
            shipmentNumber: string;
        };
        ipo: {
            status: string;
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
        igstRate: number;
        bcdRate: number;
        ipoId: string;
        shipmentId: string;
        customsBoeNumber: string | null;
        chaName: string | null;
        portOfEntry: string | null;
        cifValue: number;
        aidcAmount: number | null;
        bcdAmount: number;
        swsAmount: number;
        igstAmount: number;
        totalDuty: number;
        boeNumber: string;
        dutyPaidDate: Date | null;
        outOfChargeDate: Date | null;
    }>;
    assess(id: string, dto: AssessCustomsEntryDto, user: any): Promise<{
        shipment: {
            portOfDischarge: string;
            shipmentMode: string;
            shipmentNumber: string;
        };
        ipo: {
            status: string;
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
        igstRate: number;
        bcdRate: number;
        ipoId: string;
        shipmentId: string;
        customsBoeNumber: string | null;
        chaName: string | null;
        portOfEntry: string | null;
        cifValue: number;
        aidcAmount: number | null;
        bcdAmount: number;
        swsAmount: number;
        igstAmount: number;
        totalDuty: number;
        boeNumber: string;
        dutyPaidDate: Date | null;
        outOfChargeDate: Date | null;
    }>;
    payDuty(id: string, user: any): Promise<{
        shipment: {
            portOfDischarge: string;
            shipmentMode: string;
            shipmentNumber: string;
        };
        ipo: {
            status: string;
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
        igstRate: number;
        bcdRate: number;
        ipoId: string;
        shipmentId: string;
        customsBoeNumber: string | null;
        chaName: string | null;
        portOfEntry: string | null;
        cifValue: number;
        aidcAmount: number | null;
        bcdAmount: number;
        swsAmount: number;
        igstAmount: number;
        totalDuty: number;
        boeNumber: string;
        dutyPaidDate: Date | null;
        outOfChargeDate: Date | null;
    }>;
    outOfCharge(id: string, user: any): Promise<{
        shipment: {
            portOfDischarge: string;
            shipmentMode: string;
            shipmentNumber: string;
        };
        ipo: {
            status: string;
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
        igstRate: number;
        bcdRate: number;
        ipoId: string;
        shipmentId: string;
        customsBoeNumber: string | null;
        chaName: string | null;
        portOfEntry: string | null;
        cifValue: number;
        aidcAmount: number | null;
        bcdAmount: number;
        swsAmount: number;
        igstAmount: number;
        totalDuty: number;
        boeNumber: string;
        dutyPaidDate: Date | null;
        outOfChargeDate: Date | null;
    }>;
    getStats(user: any): Promise<{
        total: number;
        draft: number;
        filed: number;
        assessed: number;
        dutyPaid: number;
        cleared: number;
        totalDutyPaid: number;
    }>;
}
