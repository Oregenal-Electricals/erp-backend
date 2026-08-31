import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateGateEventDto, CorrectGateEventDto } from './dto/gate-event.dto';
export declare class GateEventsService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private includes;
    create(dto: CreateGateEventDto, user: any): Promise<{
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
    findAll(user: any, query: any): Promise<({
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
    findOne(id: string, user: any): Promise<{
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
    correct(id: string, dto: CorrectGateEventDto, user: any): Promise<{
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
