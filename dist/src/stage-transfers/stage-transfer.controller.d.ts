import { StageTransferService } from './stage-transfer.service';
import { GiveTransferDto, GiveToQcDto } from './dto/stage-transfer.dto';
export declare class StageTransferController {
    private stageTransferService;
    constructor(stageTransferService: StageTransferService);
    findAll(req: any, query: any): Promise<({
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
        toWorkOrderId: string | null;
        fromWorkOrderId: string;
        batchLot: string | null;
        isQcHandover: boolean;
        givenAt: Date;
        receivedAt: Date | null;
        givenByUserId: string;
        receivedByUserId: string | null;
    })[]>;
    give(dto: GiveTransferDto, req: any): Promise<{
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
        toWorkOrderId: string | null;
        fromWorkOrderId: string;
        batchLot: string | null;
        isQcHandover: boolean;
        givenAt: Date;
        receivedAt: Date | null;
        givenByUserId: string;
        receivedByUserId: string | null;
    }>;
    giveToQc(dto: GiveToQcDto, req: any): Promise<{
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
        toWorkOrderId: string | null;
        fromWorkOrderId: string;
        batchLot: string | null;
        isQcHandover: boolean;
        givenAt: Date;
        receivedAt: Date | null;
        givenByUserId: string;
        receivedByUserId: string | null;
    }>;
    receive(id: string, req: any): Promise<{
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
        toWorkOrderId: string | null;
        fromWorkOrderId: string;
        batchLot: string | null;
        isQcHandover: boolean;
        givenAt: Date;
        receivedAt: Date | null;
        givenByUserId: string;
        receivedByUserId: string | null;
    }>;
}
