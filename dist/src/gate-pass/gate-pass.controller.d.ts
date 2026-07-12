import { GatePassStatus } from '@prisma/client';
import { GatePassService } from './gate-pass.service';
import { CreateGatePassDto, ApproveGatePassDto, CancelGatePassDto, ReturnGatePassDto } from './dto/gate-pass.dto';
export declare class GatePassController {
    private readonly service;
    constructor(service: GatePassService);
    create(dto: CreateGatePassDto, user: any): Promise<{
        plant: {
            id: string;
            code: string;
            name: string;
        };
        employee: {
            id: string;
            employeeCode: string;
            firstName: string;
            lastName: string;
            role: import("@prisma/client").$Enums.UserRole;
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
        closedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        plantId: string;
        unit: string;
        status: import("@prisma/client").$Enums.GatePassStatus;
        type: import("@prisma/client").$Enums.GatePassType;
        requestedById: string;
        purpose: string;
        vehicleNumber: string | null;
        remarks: string | null;
        passNumber: string;
        quantity: number;
        cancelReason: string | null;
        authorizedAt: Date | null;
        authorizedById: string | null;
        carrierName: string;
        carrierMobile: string | null;
        carrierIdProof: string | null;
        itemDescription: string;
        estimatedValue: number | null;
        validFrom: Date | null;
        validTo: Date | null;
        employeeId: string | null;
        exitType: string | null;
        expectedReturnTime: Date | null;
        departmentName: string | null;
        returnedAt: Date | null;
        actualReturnTime: Date | null;
        issuedAt: Date | null;
        closedAt: Date | null;
        issuedById: string | null;
        closedById: string | null;
    }>;
    findAll(user: any, status?: GatePassStatus, type?: string, plantId?: string, search?: string): Promise<({
        plant: {
            id: string;
            code: string;
            name: string;
        };
        employee: {
            id: string;
            employeeCode: string;
            firstName: string;
            lastName: string;
            role: import("@prisma/client").$Enums.UserRole;
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
        closedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        plantId: string;
        unit: string;
        status: import("@prisma/client").$Enums.GatePassStatus;
        type: import("@prisma/client").$Enums.GatePassType;
        requestedById: string;
        purpose: string;
        vehicleNumber: string | null;
        remarks: string | null;
        passNumber: string;
        quantity: number;
        cancelReason: string | null;
        authorizedAt: Date | null;
        authorizedById: string | null;
        carrierName: string;
        carrierMobile: string | null;
        carrierIdProof: string | null;
        itemDescription: string;
        estimatedValue: number | null;
        validFrom: Date | null;
        validTo: Date | null;
        employeeId: string | null;
        exitType: string | null;
        expectedReturnTime: Date | null;
        departmentName: string | null;
        returnedAt: Date | null;
        actualReturnTime: Date | null;
        issuedAt: Date | null;
        closedAt: Date | null;
        issuedById: string | null;
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
        plant: {
            id: string;
            code: string;
            name: string;
        };
        employee: {
            id: string;
            employeeCode: string;
            firstName: string;
            lastName: string;
            role: import("@prisma/client").$Enums.UserRole;
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
        closedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        plantId: string;
        unit: string;
        status: import("@prisma/client").$Enums.GatePassStatus;
        type: import("@prisma/client").$Enums.GatePassType;
        requestedById: string;
        purpose: string;
        vehicleNumber: string | null;
        remarks: string | null;
        passNumber: string;
        quantity: number;
        cancelReason: string | null;
        authorizedAt: Date | null;
        authorizedById: string | null;
        carrierName: string;
        carrierMobile: string | null;
        carrierIdProof: string | null;
        itemDescription: string;
        estimatedValue: number | null;
        validFrom: Date | null;
        validTo: Date | null;
        employeeId: string | null;
        exitType: string | null;
        expectedReturnTime: Date | null;
        departmentName: string | null;
        returnedAt: Date | null;
        actualReturnTime: Date | null;
        issuedAt: Date | null;
        closedAt: Date | null;
        issuedById: string | null;
        closedById: string | null;
    }>;
    approve(id: string, dto: ApproveGatePassDto, user: any): Promise<{
        plant: {
            id: string;
            code: string;
            name: string;
        };
        employee: {
            id: string;
            employeeCode: string;
            firstName: string;
            lastName: string;
            role: import("@prisma/client").$Enums.UserRole;
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
        closedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        plantId: string;
        unit: string;
        status: import("@prisma/client").$Enums.GatePassStatus;
        type: import("@prisma/client").$Enums.GatePassType;
        requestedById: string;
        purpose: string;
        vehicleNumber: string | null;
        remarks: string | null;
        passNumber: string;
        quantity: number;
        cancelReason: string | null;
        authorizedAt: Date | null;
        authorizedById: string | null;
        carrierName: string;
        carrierMobile: string | null;
        carrierIdProof: string | null;
        itemDescription: string;
        estimatedValue: number | null;
        validFrom: Date | null;
        validTo: Date | null;
        employeeId: string | null;
        exitType: string | null;
        expectedReturnTime: Date | null;
        departmentName: string | null;
        returnedAt: Date | null;
        actualReturnTime: Date | null;
        issuedAt: Date | null;
        closedAt: Date | null;
        issuedById: string | null;
        closedById: string | null;
    }>;
    issue(id: string, user: any): Promise<{
        plant: {
            id: string;
            code: string;
            name: string;
        };
        employee: {
            id: string;
            employeeCode: string;
            firstName: string;
            lastName: string;
            role: import("@prisma/client").$Enums.UserRole;
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
        closedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        plantId: string;
        unit: string;
        status: import("@prisma/client").$Enums.GatePassStatus;
        type: import("@prisma/client").$Enums.GatePassType;
        requestedById: string;
        purpose: string;
        vehicleNumber: string | null;
        remarks: string | null;
        passNumber: string;
        quantity: number;
        cancelReason: string | null;
        authorizedAt: Date | null;
        authorizedById: string | null;
        carrierName: string;
        carrierMobile: string | null;
        carrierIdProof: string | null;
        itemDescription: string;
        estimatedValue: number | null;
        validFrom: Date | null;
        validTo: Date | null;
        employeeId: string | null;
        exitType: string | null;
        expectedReturnTime: Date | null;
        departmentName: string | null;
        returnedAt: Date | null;
        actualReturnTime: Date | null;
        issuedAt: Date | null;
        closedAt: Date | null;
        issuedById: string | null;
        closedById: string | null;
    }>;
    markReturned(id: string, dto: ReturnGatePassDto, user: any): Promise<{
        plant: {
            id: string;
            code: string;
            name: string;
        };
        employee: {
            id: string;
            employeeCode: string;
            firstName: string;
            lastName: string;
            role: import("@prisma/client").$Enums.UserRole;
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
        closedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        plantId: string;
        unit: string;
        status: import("@prisma/client").$Enums.GatePassStatus;
        type: import("@prisma/client").$Enums.GatePassType;
        requestedById: string;
        purpose: string;
        vehicleNumber: string | null;
        remarks: string | null;
        passNumber: string;
        quantity: number;
        cancelReason: string | null;
        authorizedAt: Date | null;
        authorizedById: string | null;
        carrierName: string;
        carrierMobile: string | null;
        carrierIdProof: string | null;
        itemDescription: string;
        estimatedValue: number | null;
        validFrom: Date | null;
        validTo: Date | null;
        employeeId: string | null;
        exitType: string | null;
        expectedReturnTime: Date | null;
        departmentName: string | null;
        returnedAt: Date | null;
        actualReturnTime: Date | null;
        issuedAt: Date | null;
        closedAt: Date | null;
        issuedById: string | null;
        closedById: string | null;
    }>;
    close(id: string, user: any): Promise<{
        plant: {
            id: string;
            code: string;
            name: string;
        };
        employee: {
            id: string;
            employeeCode: string;
            firstName: string;
            lastName: string;
            role: import("@prisma/client").$Enums.UserRole;
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
        closedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        plantId: string;
        unit: string;
        status: import("@prisma/client").$Enums.GatePassStatus;
        type: import("@prisma/client").$Enums.GatePassType;
        requestedById: string;
        purpose: string;
        vehicleNumber: string | null;
        remarks: string | null;
        passNumber: string;
        quantity: number;
        cancelReason: string | null;
        authorizedAt: Date | null;
        authorizedById: string | null;
        carrierName: string;
        carrierMobile: string | null;
        carrierIdProof: string | null;
        itemDescription: string;
        estimatedValue: number | null;
        validFrom: Date | null;
        validTo: Date | null;
        employeeId: string | null;
        exitType: string | null;
        expectedReturnTime: Date | null;
        departmentName: string | null;
        returnedAt: Date | null;
        actualReturnTime: Date | null;
        issuedAt: Date | null;
        closedAt: Date | null;
        issuedById: string | null;
        closedById: string | null;
    }>;
    cancel(id: string, dto: CancelGatePassDto, user: any): Promise<{
        plant: {
            id: string;
            code: string;
            name: string;
        };
        employee: {
            id: string;
            employeeCode: string;
            firstName: string;
            lastName: string;
            role: import("@prisma/client").$Enums.UserRole;
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
        closedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        plantId: string;
        unit: string;
        status: import("@prisma/client").$Enums.GatePassStatus;
        type: import("@prisma/client").$Enums.GatePassType;
        requestedById: string;
        purpose: string;
        vehicleNumber: string | null;
        remarks: string | null;
        passNumber: string;
        quantity: number;
        cancelReason: string | null;
        authorizedAt: Date | null;
        authorizedById: string | null;
        carrierName: string;
        carrierMobile: string | null;
        carrierIdProof: string | null;
        itemDescription: string;
        estimatedValue: number | null;
        validFrom: Date | null;
        validTo: Date | null;
        employeeId: string | null;
        exitType: string | null;
        expectedReturnTime: Date | null;
        departmentName: string | null;
        returnedAt: Date | null;
        actualReturnTime: Date | null;
        issuedAt: Date | null;
        closedAt: Date | null;
        issuedById: string | null;
        closedById: string | null;
    }>;
}
