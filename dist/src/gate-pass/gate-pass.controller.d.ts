import { GatePassStatus } from '@prisma/client';
import { GatePassService } from './gate-pass.service';
import { CreateGatePassDto, ApproveGatePassDto, CancelGatePassDto, ReturnGatePassDto } from './dto/gate-pass.dto';
export declare class GatePassController {
    private readonly service;
    constructor(service: GatePassService);
    create(dto: CreateGatePassDto, user: any): Promise<{
        employee: {
            id: string;
            firstName: string;
            lastName: string;
            role: string;
            employeeCode: string;
        };
        closedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        plant: {
            id: string;
            name: string;
            code: string;
        };
        requestedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        authorizedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        issuedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        type: import(".prisma/client").$Enums.GatePassType;
        status: import(".prisma/client").$Enums.GatePassStatus;
        employeeId: string | null;
        remarks: string | null;
        unit: string;
        cancelReason: string | null;
        vehicleNumber: string | null;
        closedAt: Date | null;
        plantId: string;
        estimatedValue: number | null;
        quantity: number;
        carrierName: string;
        validFrom: Date | null;
        validTo: Date | null;
        purpose: string;
        passNumber: string;
        authorizedById: string | null;
        authorizedAt: Date | null;
        carrierMobile: string | null;
        carrierIdProof: string | null;
        itemDescription: string;
        returnedAt: Date | null;
        exitType: string | null;
        expectedReturnTime: Date | null;
        actualReturnTime: Date | null;
        departmentName: string | null;
        requestedById: string;
        issuedById: string | null;
        issuedAt: Date | null;
        closedById: string | null;
    }>;
    findAll(user: any, status?: GatePassStatus, type?: string, plantId?: string, search?: string): Promise<({
        employee: {
            id: string;
            firstName: string;
            lastName: string;
            role: string;
            employeeCode: string;
        };
        closedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        plant: {
            id: string;
            name: string;
            code: string;
        };
        requestedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        authorizedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        issuedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        type: import(".prisma/client").$Enums.GatePassType;
        status: import(".prisma/client").$Enums.GatePassStatus;
        employeeId: string | null;
        remarks: string | null;
        unit: string;
        cancelReason: string | null;
        vehicleNumber: string | null;
        closedAt: Date | null;
        plantId: string;
        estimatedValue: number | null;
        quantity: number;
        carrierName: string;
        validFrom: Date | null;
        validTo: Date | null;
        purpose: string;
        passNumber: string;
        authorizedById: string | null;
        authorizedAt: Date | null;
        carrierMobile: string | null;
        carrierIdProof: string | null;
        itemDescription: string;
        returnedAt: Date | null;
        exitType: string | null;
        expectedReturnTime: Date | null;
        actualReturnTime: Date | null;
        departmentName: string | null;
        requestedById: string;
        issuedById: string | null;
        issuedAt: Date | null;
        closedById: string | null;
    })[]>;
    getStats(user: any): Promise<{
        total: number;
        pending: number;
        approved: number;
        issued: number;
        returned: number;
        closed: number;
        cancelled: number;
        returnable: number;
        nonReturnable: number;
        staffExit: number;
    }>;
    findOne(id: string): Promise<{
        employee: {
            id: string;
            firstName: string;
            lastName: string;
            role: string;
            employeeCode: string;
        };
        closedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        plant: {
            id: string;
            name: string;
            code: string;
        };
        requestedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        authorizedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        issuedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        type: import(".prisma/client").$Enums.GatePassType;
        status: import(".prisma/client").$Enums.GatePassStatus;
        employeeId: string | null;
        remarks: string | null;
        unit: string;
        cancelReason: string | null;
        vehicleNumber: string | null;
        closedAt: Date | null;
        plantId: string;
        estimatedValue: number | null;
        quantity: number;
        carrierName: string;
        validFrom: Date | null;
        validTo: Date | null;
        purpose: string;
        passNumber: string;
        authorizedById: string | null;
        authorizedAt: Date | null;
        carrierMobile: string | null;
        carrierIdProof: string | null;
        itemDescription: string;
        returnedAt: Date | null;
        exitType: string | null;
        expectedReturnTime: Date | null;
        actualReturnTime: Date | null;
        departmentName: string | null;
        requestedById: string;
        issuedById: string | null;
        issuedAt: Date | null;
        closedById: string | null;
    }>;
    approve(id: string, dto: ApproveGatePassDto, user: any): Promise<{
        employee: {
            id: string;
            firstName: string;
            lastName: string;
            role: string;
            employeeCode: string;
        };
        closedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        plant: {
            id: string;
            name: string;
            code: string;
        };
        requestedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        authorizedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        issuedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        type: import(".prisma/client").$Enums.GatePassType;
        status: import(".prisma/client").$Enums.GatePassStatus;
        employeeId: string | null;
        remarks: string | null;
        unit: string;
        cancelReason: string | null;
        vehicleNumber: string | null;
        closedAt: Date | null;
        plantId: string;
        estimatedValue: number | null;
        quantity: number;
        carrierName: string;
        validFrom: Date | null;
        validTo: Date | null;
        purpose: string;
        passNumber: string;
        authorizedById: string | null;
        authorizedAt: Date | null;
        carrierMobile: string | null;
        carrierIdProof: string | null;
        itemDescription: string;
        returnedAt: Date | null;
        exitType: string | null;
        expectedReturnTime: Date | null;
        actualReturnTime: Date | null;
        departmentName: string | null;
        requestedById: string;
        issuedById: string | null;
        issuedAt: Date | null;
        closedById: string | null;
    }>;
    issue(id: string, user: any): Promise<{
        employee: {
            id: string;
            firstName: string;
            lastName: string;
            role: string;
            employeeCode: string;
        };
        closedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        plant: {
            id: string;
            name: string;
            code: string;
        };
        requestedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        authorizedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        issuedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        type: import(".prisma/client").$Enums.GatePassType;
        status: import(".prisma/client").$Enums.GatePassStatus;
        employeeId: string | null;
        remarks: string | null;
        unit: string;
        cancelReason: string | null;
        vehicleNumber: string | null;
        closedAt: Date | null;
        plantId: string;
        estimatedValue: number | null;
        quantity: number;
        carrierName: string;
        validFrom: Date | null;
        validTo: Date | null;
        purpose: string;
        passNumber: string;
        authorizedById: string | null;
        authorizedAt: Date | null;
        carrierMobile: string | null;
        carrierIdProof: string | null;
        itemDescription: string;
        returnedAt: Date | null;
        exitType: string | null;
        expectedReturnTime: Date | null;
        actualReturnTime: Date | null;
        departmentName: string | null;
        requestedById: string;
        issuedById: string | null;
        issuedAt: Date | null;
        closedById: string | null;
    }>;
    markReturned(id: string, dto: ReturnGatePassDto, user: any): Promise<{
        employee: {
            id: string;
            firstName: string;
            lastName: string;
            role: string;
            employeeCode: string;
        };
        closedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        plant: {
            id: string;
            name: string;
            code: string;
        };
        requestedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        authorizedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        issuedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        type: import(".prisma/client").$Enums.GatePassType;
        status: import(".prisma/client").$Enums.GatePassStatus;
        employeeId: string | null;
        remarks: string | null;
        unit: string;
        cancelReason: string | null;
        vehicleNumber: string | null;
        closedAt: Date | null;
        plantId: string;
        estimatedValue: number | null;
        quantity: number;
        carrierName: string;
        validFrom: Date | null;
        validTo: Date | null;
        purpose: string;
        passNumber: string;
        authorizedById: string | null;
        authorizedAt: Date | null;
        carrierMobile: string | null;
        carrierIdProof: string | null;
        itemDescription: string;
        returnedAt: Date | null;
        exitType: string | null;
        expectedReturnTime: Date | null;
        actualReturnTime: Date | null;
        departmentName: string | null;
        requestedById: string;
        issuedById: string | null;
        issuedAt: Date | null;
        closedById: string | null;
    }>;
    close(id: string, user: any): Promise<{
        employee: {
            id: string;
            firstName: string;
            lastName: string;
            role: string;
            employeeCode: string;
        };
        closedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        plant: {
            id: string;
            name: string;
            code: string;
        };
        requestedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        authorizedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        issuedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        type: import(".prisma/client").$Enums.GatePassType;
        status: import(".prisma/client").$Enums.GatePassStatus;
        employeeId: string | null;
        remarks: string | null;
        unit: string;
        cancelReason: string | null;
        vehicleNumber: string | null;
        closedAt: Date | null;
        plantId: string;
        estimatedValue: number | null;
        quantity: number;
        carrierName: string;
        validFrom: Date | null;
        validTo: Date | null;
        purpose: string;
        passNumber: string;
        authorizedById: string | null;
        authorizedAt: Date | null;
        carrierMobile: string | null;
        carrierIdProof: string | null;
        itemDescription: string;
        returnedAt: Date | null;
        exitType: string | null;
        expectedReturnTime: Date | null;
        actualReturnTime: Date | null;
        departmentName: string | null;
        requestedById: string;
        issuedById: string | null;
        issuedAt: Date | null;
        closedById: string | null;
    }>;
    cancel(id: string, dto: CancelGatePassDto, user: any): Promise<{
        employee: {
            id: string;
            firstName: string;
            lastName: string;
            role: string;
            employeeCode: string;
        };
        closedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        plant: {
            id: string;
            name: string;
            code: string;
        };
        requestedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        authorizedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        issuedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        type: import(".prisma/client").$Enums.GatePassType;
        status: import(".prisma/client").$Enums.GatePassStatus;
        employeeId: string | null;
        remarks: string | null;
        unit: string;
        cancelReason: string | null;
        vehicleNumber: string | null;
        closedAt: Date | null;
        plantId: string;
        estimatedValue: number | null;
        quantity: number;
        carrierName: string;
        validFrom: Date | null;
        validTo: Date | null;
        purpose: string;
        passNumber: string;
        authorizedById: string | null;
        authorizedAt: Date | null;
        carrierMobile: string | null;
        carrierIdProof: string | null;
        itemDescription: string;
        returnedAt: Date | null;
        exitType: string | null;
        expectedReturnTime: Date | null;
        actualReturnTime: Date | null;
        departmentName: string | null;
        requestedById: string;
        issuedById: string | null;
        issuedAt: Date | null;
        closedById: string | null;
    }>;
}
