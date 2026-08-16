import { StageTransferService } from './stage-transfer.service';
import { GiveTransferDto } from './dto/stage-transfer.dto';
export declare class StageTransferController {
    private stageTransferService;
    constructor(stageTransferService: StageTransferService);
    findAll(req: any, query: any): Promise<({
        fromWorkOrder: {
            id: string;
            woNumber: string;
            productCode: string;
            productName: string;
            stageName: string;
        };
        toWorkOrder: {
            id: string;
            woNumber: string;
            productCode: string;
            productName: string;
            stageName: string;
        };
        givenBy: {
            firstName: string;
            lastName: string;
        };
        receivedBy: {
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        status: string;
        remarks: string | null;
        itemCode: string;
        itemName: string;
        qty: number;
        fromWorkOrderId: string;
        toWorkOrderId: string;
        givenByUserId: string;
        givenAt: Date;
        receivedByUserId: string | null;
        receivedAt: Date | null;
    })[]>;
    give(dto: GiveTransferDto, req: any): Promise<{
        fromWorkOrder: {
            id: string;
            woNumber: string;
            productCode: string;
            productName: string;
            stageName: string;
        };
        toWorkOrder: {
            id: string;
            woNumber: string;
            productCode: string;
            productName: string;
            stageName: string;
        };
        givenBy: {
            firstName: string;
            lastName: string;
        };
        receivedBy: {
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        status: string;
        remarks: string | null;
        itemCode: string;
        itemName: string;
        qty: number;
        fromWorkOrderId: string;
        toWorkOrderId: string;
        givenByUserId: string;
        givenAt: Date;
        receivedByUserId: string | null;
        receivedAt: Date | null;
    }>;
    receive(id: string, req: any): Promise<{
        fromWorkOrder: {
            id: string;
            woNumber: string;
            productCode: string;
            productName: string;
            stageName: string;
        };
        toWorkOrder: {
            id: string;
            woNumber: string;
            productCode: string;
            productName: string;
            stageName: string;
        };
        givenBy: {
            firstName: string;
            lastName: string;
        };
        receivedBy: {
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        status: string;
        remarks: string | null;
        itemCode: string;
        itemName: string;
        qty: number;
        fromWorkOrderId: string;
        toWorkOrderId: string;
        givenByUserId: string;
        givenAt: Date;
        receivedByUserId: string | null;
        receivedAt: Date | null;
    }>;
}
