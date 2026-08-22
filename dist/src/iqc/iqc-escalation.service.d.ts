import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RejectedStockService } from '../rejected-stock/rejected-stock.service';
import { StockLedgerService } from '../stock-ledger/stock-ledger.service';
import { CreateIqcCheckTemplateDto, UpdateIqcCheckTemplateDto, AttachTemplateDto, SubmitIqcStageResultDto } from './dto/iqc.dto';
export declare class IqcEscalationService {
    private prisma;
    private audit;
    private notifications;
    private rejectedStock;
    private stockLedger;
    constructor(prisma: PrismaService, audit: AuditService, notifications: NotificationsService, rejectedStock: RejectedStockService, stockLedger: StockLedgerService);
    createTemplate(dto: CreateIqcCheckTemplateDto, user: any): Promise<{
        parameters: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            sortOrder: number;
            category: string;
            templateId: string;
            sNo: number;
            parameterName: string;
            specification: string;
        }[];
    } & {
        id: string;
        companyId: string;
        name: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        revision: string | null;
        rawMaterialId: string | null;
        docCode: string | null;
    }>;
    findAllTemplates(user: any, query: any): Promise<({
        _count: {
            parameters: number;
        };
        rawMaterial: {
            name: string;
            code: string;
        };
    } & {
        id: string;
        companyId: string;
        name: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        revision: string | null;
        rawMaterialId: string | null;
        docCode: string | null;
    })[]>;
    findOneTemplate(id: string, user: any): Promise<{
        rawMaterial: {
            name: string;
            code: string;
        };
        parameters: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            sortOrder: number;
            category: string;
            templateId: string;
            sNo: number;
            parameterName: string;
            specification: string;
        }[];
    } & {
        id: string;
        companyId: string;
        name: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        revision: string | null;
        rawMaterialId: string | null;
        docCode: string | null;
    }>;
    updateTemplate(id: string, dto: UpdateIqcCheckTemplateDto, user: any): Promise<{
        rawMaterial: {
            name: string;
            code: string;
        };
        parameters: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            sortOrder: number;
            category: string;
            templateId: string;
            sNo: number;
            parameterName: string;
            specification: string;
        }[];
    } & {
        id: string;
        companyId: string;
        name: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        revision: string | null;
        rawMaterialId: string | null;
        docCode: string | null;
    }>;
    cloneTemplate(id: string, newName: string, user: any): Promise<{
        parameters: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            sortOrder: number;
            category: string;
            templateId: string;
            sNo: number;
            parameterName: string;
            specification: string;
        }[];
    } & {
        id: string;
        companyId: string;
        name: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        revision: string | null;
        rawMaterialId: string | null;
        docCode: string | null;
    }>;
    attachTemplate(iqcId: string, dto: AttachTemplateDto, user: any): Promise<{
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
        supplierName: string | null;
        grnId: string;
        inspectedBy: string | null;
        templateId: string | null;
        lotQuantity: number | null;
        sampleSize: number | null;
        mrirNo: string | null;
        inspectionDate: Date;
        iqcNumber: string;
        currentStage: string;
        finalOutcome: string;
    }>;
    getEscalationDetail(iqcId: string, user: any): Promise<{
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
            rejectionReason: string | null;
            receivedQty: number;
            acceptedQty: number;
            rejectedQty: number;
            iqcId: string;
            grnItemId: string;
        }[];
        grn: {
            warehouse: {
                name: string;
            };
            warehouseId: string;
            grnNumber: string;
        };
        template: {
            parameters: {
                id: string;
                companyId: string;
                isActive: boolean;
                isTestData: boolean;
                createdAt: Date;
                updatedAt: Date;
                createdBy: string | null;
                updatedBy: string | null;
                sortOrder: number;
                category: string;
                templateId: string;
                sNo: number;
                parameterName: string;
                specification: string;
            }[];
        } & {
            id: string;
            companyId: string;
            name: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            revision: string | null;
            rawMaterialId: string | null;
            docCode: string | null;
        };
        stageResults: ({
            parameterResults: ({
                parameter: {
                    id: string;
                    companyId: string;
                    isActive: boolean;
                    isTestData: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    createdBy: string | null;
                    updatedBy: string | null;
                    sortOrder: number;
                    category: string;
                    templateId: string;
                    sNo: number;
                    parameterName: string;
                    specification: string;
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
                parameterId: string;
                s1: string | null;
                s2: string | null;
                s3: string | null;
                s4: string | null;
                s5: string | null;
                remark: string | null;
                stageResultId: string;
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
            reviewedAt: Date;
            reviewedBy: string;
            remarks: string;
            outcome: string;
            iqcId: string;
            stage: string;
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
        status: string;
        remarks: string | null;
        supplierName: string | null;
        grnId: string;
        inspectedBy: string | null;
        templateId: string | null;
        lotQuantity: number | null;
        sampleSize: number | null;
        mrirNo: string | null;
        inspectionDate: Date;
        iqcNumber: string;
        currentStage: string;
        finalOutcome: string;
    }>;
    submitStageResult(iqcId: string, dto: SubmitIqcStageResultDto, user: any): Promise<{
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
            rejectionReason: string | null;
            receivedQty: number;
            acceptedQty: number;
            rejectedQty: number;
            iqcId: string;
            grnItemId: string;
        }[];
        grn: {
            warehouse: {
                name: string;
            };
            warehouseId: string;
            grnNumber: string;
        };
        template: {
            parameters: {
                id: string;
                companyId: string;
                isActive: boolean;
                isTestData: boolean;
                createdAt: Date;
                updatedAt: Date;
                createdBy: string | null;
                updatedBy: string | null;
                sortOrder: number;
                category: string;
                templateId: string;
                sNo: number;
                parameterName: string;
                specification: string;
            }[];
        } & {
            id: string;
            companyId: string;
            name: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            revision: string | null;
            rawMaterialId: string | null;
            docCode: string | null;
        };
        stageResults: ({
            parameterResults: ({
                parameter: {
                    id: string;
                    companyId: string;
                    isActive: boolean;
                    isTestData: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    createdBy: string | null;
                    updatedBy: string | null;
                    sortOrder: number;
                    category: string;
                    templateId: string;
                    sNo: number;
                    parameterName: string;
                    specification: string;
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
                parameterId: string;
                s1: string | null;
                s2: string | null;
                s3: string | null;
                s4: string | null;
                s5: string | null;
                remark: string | null;
                stageResultId: string;
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
            reviewedAt: Date;
            reviewedBy: string;
            remarks: string;
            outcome: string;
            iqcId: string;
            stage: string;
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
        status: string;
        remarks: string | null;
        supplierName: string | null;
        grnId: string;
        inspectedBy: string | null;
        templateId: string | null;
        lotQuantity: number | null;
        sampleSize: number | null;
        mrirNo: string | null;
        inspectionDate: Date;
        iqcNumber: string;
        currentStage: string;
        finalOutcome: string;
    }>;
    private closeAsPass;
    private closeAsFail;
    private notifyEscalation;
}
