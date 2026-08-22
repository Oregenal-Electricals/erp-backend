import { IqcService } from './iqc.service';
import { IqcEscalationService } from './iqc-escalation.service';
import { CreateIqcDto, UpdateIqcItemsDto, CreateIqcCheckTemplateDto, UpdateIqcCheckTemplateDto, AttachTemplateDto, SubmitIqcStageResultDto } from './dto/iqc.dto';
export declare class IqcController {
    private readonly iqcService;
    private readonly escalation;
    constructor(iqcService: IqcService, escalation: IqcEscalationService);
    getStats(req: any): Promise<{
        total: number;
        pending: number;
        inProgress: number;
        approved: number;
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
        rawMaterialId: string | null;
        docCode: string | null;
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
        rawMaterialId: string | null;
        docCode: string | null;
    }>;
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
        rawMaterialId: string | null;
        docCode: string | null;
    }>;
    updateTemplate(id: string, dto: UpdateIqcCheckTemplateDto, req: any): Promise<{
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
        rawMaterialId: string | null;
        docCode: string | null;
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
                grnType: string;
                grnNumber: string;
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
            inspectedBy: string | null;
            inspectionDate: Date;
            iqcNumber: string;
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
            receivedQty: number;
            acceptedQty: number;
            rejectedQty: number;
            templateId: string | null;
            sampleSize: number | null;
            iqcId: string;
            grnItemId: string;
            currentStage: string;
            finalOutcome: string;
        }[];
        grn: {
            warehouse: {
                name: string;
            };
            warehouseId: string;
            grnType: string;
            grnNumber: string;
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
        inspectedBy: string | null;
        inspectionDate: Date;
        iqcNumber: string;
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
            receivedQty: number;
            acceptedQty: number;
            rejectedQty: number;
            templateId: string | null;
            sampleSize: number | null;
            iqcId: string;
            grnItemId: string;
            currentStage: string;
            finalOutcome: string;
        }[];
        grn: {
            warehouse: {
                name: string;
            };
            warehouseId: string;
            grnType: string;
            grnNumber: string;
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
        inspectedBy: string | null;
        inspectionDate: Date;
        iqcNumber: string;
    }>;
    getItemEscalationDetail(itemId: string, req: any): Promise<{
        iqc: {
            grn: {
                po: {
                    vendor: {
                        name: string;
                    };
                };
                warehouseId: string;
                grnNumber: string;
            };
            inspectionDate: Date;
            iqcNumber: string;
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
        receivedQty: number;
        acceptedQty: number;
        rejectedQty: number;
        templateId: string | null;
        sampleSize: number | null;
        iqcId: string;
        grnItemId: string;
        currentStage: string;
        finalOutcome: string;
    }>;
    create(dto: CreateIqcDto, req: any): Promise<{
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
            templateId: string | null;
            sampleSize: number | null;
            iqcId: string;
            grnItemId: string;
            currentStage: string;
            finalOutcome: string;
        }[];
        grn: {
            warehouse: {
                name: string;
            };
            warehouseId: string;
            grnType: string;
            grnNumber: string;
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
        inspectedBy: string | null;
        inspectionDate: Date;
        iqcNumber: string;
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
            receivedQty: number;
            acceptedQty: number;
            rejectedQty: number;
            templateId: string | null;
            sampleSize: number | null;
            iqcId: string;
            grnItemId: string;
            currentStage: string;
            finalOutcome: string;
        }[];
        grn: {
            warehouse: {
                name: string;
            };
            warehouseId: string;
            grnType: string;
            grnNumber: string;
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
        inspectedBy: string | null;
        inspectionDate: Date;
        iqcNumber: string;
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
            receivedQty: number;
            acceptedQty: number;
            rejectedQty: number;
            templateId: string | null;
            sampleSize: number | null;
            iqcId: string;
            grnItemId: string;
            currentStage: string;
            finalOutcome: string;
        }[];
        grn: {
            warehouse: {
                name: string;
            };
            warehouseId: string;
            grnType: string;
            grnNumber: string;
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
        inspectedBy: string | null;
        inspectionDate: Date;
        iqcNumber: string;
    }>;
    attachTemplate(itemId: string, dto: AttachTemplateDto, req: any): Promise<{
        iqc: {
            grn: {
                po: {
                    vendor: {
                        name: string;
                    };
                };
                warehouseId: string;
                grnNumber: string;
            };
            inspectionDate: Date;
            iqcNumber: string;
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
        receivedQty: number;
        acceptedQty: number;
        rejectedQty: number;
        templateId: string | null;
        sampleSize: number | null;
        iqcId: string;
        grnItemId: string;
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
                warehouseId: string;
                grnNumber: string;
            };
            inspectionDate: Date;
            iqcNumber: string;
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
        receivedQty: number;
        acceptedQty: number;
        rejectedQty: number;
        templateId: string | null;
        sampleSize: number | null;
        iqcId: string;
        grnItemId: string;
        currentStage: string;
        finalOutcome: string;
    }>;
}
