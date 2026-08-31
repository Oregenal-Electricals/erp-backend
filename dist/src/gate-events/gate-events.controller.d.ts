import { GateEventsService } from './gate-events.service';
import { CreateGateEventDto, CorrectGateEventDto } from './dto/gate-event.dto';
export declare class GateEventsController {
    private service;
    constructor(service: GateEventsService);
    create(dto: CreateGateEventDto, req: any): Promise<{
        vehicle: {
            id: string;
            vehicleNumber: string;
            vehicleType: import("@prisma/client").$Enums.VehicleType;
        };
        gate: {
            id: string;
            name: string;
            code: string;
        };
        securityUser: {
            id: string;
            firstName: string;
            lastName: string;
        };
        correctionOfEvent: {
            id: string;
            eventType: string;
            eventTime: Date;
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
        plantId: string;
        vehicleNumber: string | null;
        remarks: string | null;
        vehicleId: string | null;
        referenceType: string | null;
        referenceId: string | null;
        gateId: string | null;
        eventType: string;
        personId: string | null;
        personName: string | null;
        eventTime: Date;
        source: string;
        securityUserId: string;
        correctionOfEventId: string | null;
    }>;
    findAll(req: any, query: any): Promise<({
        vehicle: {
            id: string;
            vehicleNumber: string;
            vehicleType: import("@prisma/client").$Enums.VehicleType;
        };
        gate: {
            id: string;
            name: string;
            code: string;
        };
        securityUser: {
            id: string;
            firstName: string;
            lastName: string;
        };
        correctionOfEvent: {
            id: string;
            eventType: string;
            eventTime: Date;
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
        plantId: string;
        vehicleNumber: string | null;
        remarks: string | null;
        vehicleId: string | null;
        referenceType: string | null;
        referenceId: string | null;
        gateId: string | null;
        eventType: string;
        personId: string | null;
        personName: string | null;
        eventTime: Date;
        source: string;
        securityUserId: string;
        correctionOfEventId: string | null;
    })[]>;
    findOne(id: string, req: any): Promise<{
        vehicle: {
            id: string;
            vehicleNumber: string;
            vehicleType: import("@prisma/client").$Enums.VehicleType;
        };
        gate: {
            id: string;
            name: string;
            code: string;
        };
        securityUser: {
            id: string;
            firstName: string;
            lastName: string;
        };
        correctionOfEvent: {
            id: string;
            eventType: string;
            eventTime: Date;
        };
        corrections: ({
            vehicle: {
                id: string;
                vehicleNumber: string;
                vehicleType: import("@prisma/client").$Enums.VehicleType;
            };
            gate: {
                id: string;
                name: string;
                code: string;
            };
            securityUser: {
                id: string;
                firstName: string;
                lastName: string;
            };
            correctionOfEvent: {
                id: string;
                eventType: string;
                eventTime: Date;
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
            plantId: string;
            vehicleNumber: string | null;
            remarks: string | null;
            vehicleId: string | null;
            referenceType: string | null;
            referenceId: string | null;
            gateId: string | null;
            eventType: string;
            personId: string | null;
            personName: string | null;
            eventTime: Date;
            source: string;
            securityUserId: string;
            correctionOfEventId: string | null;
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
        plantId: string;
        vehicleNumber: string | null;
        remarks: string | null;
        vehicleId: string | null;
        referenceType: string | null;
        referenceId: string | null;
        gateId: string | null;
        eventType: string;
        personId: string | null;
        personName: string | null;
        eventTime: Date;
        source: string;
        securityUserId: string;
        correctionOfEventId: string | null;
    }>;
    correct(id: string, dto: CorrectGateEventDto, req: any): Promise<{
        vehicle: {
            id: string;
            vehicleNumber: string;
            vehicleType: import("@prisma/client").$Enums.VehicleType;
        };
        gate: {
            id: string;
            name: string;
            code: string;
        };
        securityUser: {
            id: string;
            firstName: string;
            lastName: string;
        };
        correctionOfEvent: {
            id: string;
            eventType: string;
            eventTime: Date;
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
        plantId: string;
        vehicleNumber: string | null;
        remarks: string | null;
        vehicleId: string | null;
        referenceType: string | null;
        referenceId: string | null;
        gateId: string | null;
        eventType: string;
        personId: string | null;
        personName: string | null;
        eventTime: Date;
        source: string;
        securityUserId: string;
        correctionOfEventId: string | null;
    }>;
}
