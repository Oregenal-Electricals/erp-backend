import { IqcService } from './iqc.service';
import { IqcEscalationService } from './iqc-escalation.service';
import { IqcTemplateImportService } from './iqc-template-import.service';
import { CreateIqcDto, UpdateIqcItemsDto, ConfirmReceiptDto, CreateIqcCheckTemplateDto, UpdateIqcCheckTemplateDto, AttachTemplateDto, SubmitIqcStageResultDto, ConfirmTemplateImportDto } from './dto/iqc.dto';
export declare class IqcController {
    private readonly iqcService;
    private readonly escalation;
    private readonly templateImport;
    constructor(iqcService: IqcService, escalation: IqcEscalationService, templateImport: IqcTemplateImportService);
    getStats(req: any): Promise<{
        total: number;
        pending: number;
        inProgress: number;
        approved: number;
    }>;
    parseTemplateImport(file: Express.Multer.File): import("./iqc-template-import.service").ParsedTemplate[];
    confirmTemplateImport(dto: ConfirmTemplateImportDto, req: any): Promise<{
        createdCount: number;
        created: string[];
        skippedCount: number;
        skipped: {
            sheetName: string;
            reason: string;
        }[];
    }>;
    findAllTemplates(req: any, query: any): Promise<({
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
        version: number;
        rawMaterialId: string | null;
        docCode: string | null;
        isCurrent: boolean;
        reviewed: boolean;
    })[]>;
    findOneTemplate(id: string, req: any): Promise<{
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
        version: number;
        rawMaterialId: string | null;
        docCode: string | null;
        isCurrent: boolean;
        reviewed: boolean;
    }>;
    getVersionHistory(id: string, req: any): Promise<({
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
        version: number;
        rawMaterialId: string | null;
        docCode: string | null;
        isCurrent: boolean;
        reviewed: boolean;
    })[]>;
    createTemplate(dto: CreateIqcCheckTemplateDto, req: any): Promise<{
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
        version: number;
        rawMaterialId: string | null;
        docCode: string | null;
        isCurrent: boolean;
        reviewed: boolean;
    }>;
    updateTemplate(id: string, dto: UpdateIqcCheckTemplateDto, req: any): Promise<{
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
        version: number;
        rawMaterialId: string | null;
        docCode: string | null;
        isCurrent: boolean;
        reviewed: boolean;
    }>;
    cloneTemplate(id: string, name: string, req: any): Promise<{
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
        version: number;
        rawMaterialId: string | null;
        docCode: string | null;
        isCurrent: boolean;
        reviewed: boolean;
    }>;
    findAll(req: any, query: any): Promise<{
        data: ({
            _count: {
                items: number;
            };
            grn: {
                warehouse: {
                    name: string;
                };
                grnNumber: string;
                grnType: string;
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
            grnId: string;
            iqcNumber: string;
            inspectedBy: string | null;
            inspectionDate: Date;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findByGrn(grnId: string, req: any): Promise<({
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
            batchNumber: string | null;
            grnItemId: string;
            receivedQty: number;
            acceptedQty: number;
            rejectedQty: number;
            holdQty: number;
            holdReason: string | null;
            confirmedQty: number | null;
            templateId: string | null;
            sampleSize: number | null;
            iqcId: string;
            putAwayQty: number;
            currentStage: string;
            finalOutcome: string;
        }[];
        grn: {
            warehouse: {
                name: string;
            };
            grnNumber: string;
            grnType: string;
            warehouseId: string;
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
        grnId: string;
        iqcNumber: string;
        inspectedBy: string | null;
        inspectionDate: Date;
    })[]>;
    findOne(id: string, req: any): Promise<{
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
            batchNumber: string | null;
            grnItemId: string;
            receivedQty: number;
            acceptedQty: number;
            rejectedQty: number;
            holdQty: number;
            holdReason: string | null;
            confirmedQty: number | null;
            templateId: string | null;
            sampleSize: number | null;
            iqcId: string;
            putAwayQty: number;
            currentStage: string;
            finalOutcome: string;
        }[];
        grn: {
            warehouse: {
                name: string;
            };
            grnNumber: string;
            grnType: string;
            warehouseId: string;
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
        grnId: string;
        iqcNumber: string;
        inspectedBy: string | null;
        inspectionDate: Date;
    }>;
    getItemEscalationDetail(itemId: string, req: any): Promise<{
        iqc: {
            grn: {
                po: {
                    vendor: {
                        name: string;
                    };
                };
                grnNumber: string;
                warehouseId: string;
            };
            iqcNumber: string;
            inspectionDate: Date;
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
            version: number;
            rawMaterialId: string | null;
            docCode: string | null;
            isCurrent: boolean;
            reviewed: boolean;
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
            iqcItemId: string;
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
        itemCode: string;
        itemName: string;
        uom: string;
        rejectionReason: string | null;
        batchNumber: string | null;
        grnItemId: string;
        receivedQty: number;
        acceptedQty: number;
        rejectedQty: number;
        holdQty: number;
        holdReason: string | null;
        confirmedQty: number | null;
        templateId: string | null;
        sampleSize: number | null;
        iqcId: string;
        putAwayQty: number;
        currentStage: string;
        finalOutcome: string;
    }>;
    create(dto: CreateIqcDto, req: any): Promise<({
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
            batchNumber: string | null;
            grnItemId: string;
            receivedQty: number;
            acceptedQty: number;
            rejectedQty: number;
            holdQty: number;
            holdReason: string | null;
            confirmedQty: number | null;
            templateId: string | null;
            sampleSize: number | null;
            iqcId: string;
            putAwayQty: number;
            currentStage: string;
            finalOutcome: string;
        }[];
        grn: {
            warehouse: {
                name: string;
            };
            grnNumber: string;
            grnType: string;
            warehouseId: string;
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
        grnId: string;
        iqcNumber: string;
        inspectedBy: string | null;
        inspectionDate: Date;
    }) | {
        skippedIqc: boolean;
        grn: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            status: string;
            vehicleNumber: string | null;
            remarks: string | null;
            poId: string | null;
            invoiceNumber: string | null;
            invoiceDate: Date | null;
            gateInwardEntryId: string | null;
            grnNumber: string;
            grnType: string;
            ipoId: string | null;
            landedCostId: string | null;
            warehouseId: string;
            receivedDate: Date;
            dcNumber: string | null;
            physicallyVerifiedAt: Date | null;
            reversedById: string | null;
            reversedAt: Date | null;
            reversalReason: string | null;
        };
    }>;
    confirmReceipt(id: string, dto: ConfirmReceiptDto, req: any): Promise<{
        handoverMismatches: any[];
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
            batchNumber: string | null;
            grnItemId: string;
            receivedQty: number;
            acceptedQty: number;
            rejectedQty: number;
            holdQty: number;
            holdReason: string | null;
            confirmedQty: number | null;
            templateId: string | null;
            sampleSize: number | null;
            iqcId: string;
            putAwayQty: number;
            currentStage: string;
            finalOutcome: string;
        }[];
        grn: {
            warehouse: {
                name: string;
            };
            grnNumber: string;
            grnType: string;
            warehouseId: string;
        };
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
        grnId: string;
        iqcNumber: string;
        inspectedBy: string | null;
        inspectionDate: Date;
    }>;
    updateItems(id: string, dto: UpdateIqcItemsDto, req: any): Promise<{
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
            batchNumber: string | null;
            grnItemId: string;
            receivedQty: number;
            acceptedQty: number;
            rejectedQty: number;
            holdQty: number;
            holdReason: string | null;
            confirmedQty: number | null;
            templateId: string | null;
            sampleSize: number | null;
            iqcId: string;
            putAwayQty: number;
            currentStage: string;
            finalOutcome: string;
        }[];
        grn: {
            warehouse: {
                name: string;
            };
            grnNumber: string;
            grnType: string;
            warehouseId: string;
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
        grnId: string;
        iqcNumber: string;
        inspectedBy: string | null;
        inspectionDate: Date;
    }>;
    approve(id: string, req: any): Promise<{
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
            batchNumber: string | null;
            grnItemId: string;
            receivedQty: number;
            acceptedQty: number;
            rejectedQty: number;
            holdQty: number;
            holdReason: string | null;
            confirmedQty: number | null;
            templateId: string | null;
            sampleSize: number | null;
            iqcId: string;
            putAwayQty: number;
            currentStage: string;
            finalOutcome: string;
        }[];
        grn: {
            warehouse: {
                name: string;
            };
            grnNumber: string;
            grnType: string;
            warehouseId: string;
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
        grnId: string;
        iqcNumber: string;
        inspectedBy: string | null;
        inspectionDate: Date;
    }>;
    attachTemplate(itemId: string, dto: AttachTemplateDto, req: any): Promise<{
        iqc: {
            grn: {
                po: {
                    vendor: {
                        name: string;
                    };
                };
                grnNumber: string;
                warehouseId: string;
            };
            iqcNumber: string;
            inspectionDate: Date;
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
            version: number;
            rawMaterialId: string | null;
            docCode: string | null;
            isCurrent: boolean;
            reviewed: boolean;
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
            iqcItemId: string;
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
        itemCode: string;
        itemName: string;
        uom: string;
        rejectionReason: string | null;
        batchNumber: string | null;
        grnItemId: string;
        receivedQty: number;
        acceptedQty: number;
        rejectedQty: number;
        holdQty: number;
        holdReason: string | null;
        confirmedQty: number | null;
        templateId: string | null;
        sampleSize: number | null;
        iqcId: string;
        putAwayQty: number;
        currentStage: string;
        finalOutcome: string;
    }>;
    submitStageResult(itemId: string, dto: SubmitIqcStageResultDto, req: any): Promise<{
        iqc: {
            grn: {
                po: {
                    vendor: {
                        name: string;
                    };
                };
                grnNumber: string;
                warehouseId: string;
            };
            iqcNumber: string;
            inspectionDate: Date;
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
            version: number;
            rawMaterialId: string | null;
            docCode: string | null;
            isCurrent: boolean;
            reviewed: boolean;
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
            iqcItemId: string;
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
        itemCode: string;
        itemName: string;
        uom: string;
        rejectionReason: string | null;
        batchNumber: string | null;
        grnItemId: string;
        receivedQty: number;
        acceptedQty: number;
        rejectedQty: number;
        holdQty: number;
        holdReason: string | null;
        confirmedQty: number | null;
        templateId: string | null;
        sampleSize: number | null;
        iqcId: string;
        putAwayQty: number;
        currentStage: string;
        finalOutcome: string;
    }>;
}
