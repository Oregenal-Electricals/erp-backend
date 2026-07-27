import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { GiveTransferDto } from './dto/stage-transfer.dto';
export declare class StageTransferService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private includes;
    give(dto: GiveTransferDto, user: any): Promise<{
        receivedBy: {
            firstName: string;
            lastName: string;
        };
        fromWorkOrder: {
            id: string;
            stageName: string;
            productCode: string;
            productName: string;
            woNumber: string;
        };
        toWorkOrder: {
            id: string;
            stageName: string;
            productCode: string;
            productName: string;
            woNumber: string;
        };
        givenBy: {
            firstName: string;
            lastName: string;
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
        remarks: string | null;
        itemCode: string;
        itemName: string;
        qty: number;
        fromWorkOrderId: string;
        toWorkOrderId: string;
        givenAt: Date;
        receivedAt: Date | null;
        givenByUserId: string;
        receivedByUserId: string | null;
    }>;
    receive(id: string, user: any): Promise<{
        receivedBy: {
            firstName: string;
            lastName: string;
        };
        fromWorkOrder: {
            id: string;
            stageName: string;
            productCode: string;
            productName: string;
            woNumber: string;
        };
        toWorkOrder: {
            id: string;
            stageName: string;
            productCode: string;
            productName: string;
            woNumber: string;
        };
        givenBy: {
            firstName: string;
            lastName: string;
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
        remarks: string | null;
        itemCode: string;
        itemName: string;
        qty: number;
        fromWorkOrderId: string;
        toWorkOrderId: string;
        givenAt: Date;
        receivedAt: Date | null;
        givenByUserId: string;
        receivedByUserId: string | null;
    }>;
    findAll(user: any, query: any): Promise<({
        receivedBy: {
            firstName: string;
            lastName: string;
        };
        fromWorkOrder: {
            id: string;
            stageName: string;
            productCode: string;
            productName: string;
            woNumber: string;
        };
        toWorkOrder: {
            id: string;
            stageName: string;
            productCode: string;
            productName: string;
            woNumber: string;
        };
        givenBy: {
            firstName: string;
            lastName: string;
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
        remarks: string | null;
        itemCode: string;
        itemName: string;
        qty: number;
        fromWorkOrderId: string;
        toWorkOrderId: string;
        givenAt: Date;
        receivedAt: Date | null;
        givenByUserId: string;
        receivedByUserId: string | null;
    })[]>;
}
