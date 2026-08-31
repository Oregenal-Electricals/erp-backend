import { ShippingDocumentService } from './shipping-document.service';
import { CreateShippingDocumentDto, UpdateShippingDocumentDto } from './dto/shipping-document.dto';
export declare class ShippingDocumentController {
    private readonly sdService;
    constructor(sdService: ShippingDocumentService);
    getStats(req: any): Promise<{
        total: number;
        received: number;
        verified: number;
        surrendered: number;
        byType: (import("@prisma/client").Prisma.PickEnumerable<import("@prisma/client").Prisma.ShippingDocumentGroupByOutputType, "documentType"[]> & {
            _count: number;
        })[];
    }>;
    findAll(req: any, query: any): Promise<{
        data: ({
            shipment: {
                status: string;
                carrierName: string;
                shipmentMode: string;
                vesselName: string;
                shipmentNumber: string;
            };
            ipo: {
                vendor: {
                    name: string;
                    code: string;
                };
                currency: string;
                ipoNumber: string;
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
            documentType: string;
            notes: string | null;
            portOfLoading: string | null;
            portOfDischarge: string | null;
            ipoId: string;
            issueDate: Date | null;
            shipmentId: string;
            documentNumber: string;
            placeOfIssue: string | null;
            shipperName: string | null;
            consigneeName: string | null;
            notifyParty: string | null;
            descriptionOfGoods: string | null;
            freightTerms: string | null;
            numberOfOriginals: number | null;
            originalsReceived: number | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findByShipment(shipmentId: string, req: any): Promise<({
        shipment: {
            status: string;
            carrierName: string;
            shipmentMode: string;
            vesselName: string;
            shipmentNumber: string;
        };
        ipo: {
            vendor: {
                name: string;
                code: string;
            };
            currency: string;
            ipoNumber: string;
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
        documentType: string;
        notes: string | null;
        portOfLoading: string | null;
        portOfDischarge: string | null;
        ipoId: string;
        issueDate: Date | null;
        shipmentId: string;
        documentNumber: string;
        placeOfIssue: string | null;
        shipperName: string | null;
        consigneeName: string | null;
        notifyParty: string | null;
        descriptionOfGoods: string | null;
        freightTerms: string | null;
        numberOfOriginals: number | null;
        originalsReceived: number | null;
    })[]>;
    findOne(id: string, req: any): Promise<{
        shipment: {
            status: string;
            carrierName: string;
            shipmentMode: string;
            vesselName: string;
            shipmentNumber: string;
        };
        ipo: {
            vendor: {
                name: string;
                code: string;
            };
            currency: string;
            ipoNumber: string;
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
        documentType: string;
        notes: string | null;
        portOfLoading: string | null;
        portOfDischarge: string | null;
        ipoId: string;
        issueDate: Date | null;
        shipmentId: string;
        documentNumber: string;
        placeOfIssue: string | null;
        shipperName: string | null;
        consigneeName: string | null;
        notifyParty: string | null;
        descriptionOfGoods: string | null;
        freightTerms: string | null;
        numberOfOriginals: number | null;
        originalsReceived: number | null;
    }>;
    create(dto: CreateShippingDocumentDto, req: any): Promise<{
        shipment: {
            status: string;
            carrierName: string;
            shipmentMode: string;
            vesselName: string;
            shipmentNumber: string;
        };
        ipo: {
            vendor: {
                name: string;
                code: string;
            };
            currency: string;
            ipoNumber: string;
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
        documentType: string;
        notes: string | null;
        portOfLoading: string | null;
        portOfDischarge: string | null;
        ipoId: string;
        issueDate: Date | null;
        shipmentId: string;
        documentNumber: string;
        placeOfIssue: string | null;
        shipperName: string | null;
        consigneeName: string | null;
        notifyParty: string | null;
        descriptionOfGoods: string | null;
        freightTerms: string | null;
        numberOfOriginals: number | null;
        originalsReceived: number | null;
    }>;
    update(id: string, dto: UpdateShippingDocumentDto, req: any): Promise<{
        shipment: {
            status: string;
            carrierName: string;
            shipmentMode: string;
            vesselName: string;
            shipmentNumber: string;
        };
        ipo: {
            vendor: {
                name: string;
                code: string;
            };
            currency: string;
            ipoNumber: string;
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
        documentType: string;
        notes: string | null;
        portOfLoading: string | null;
        portOfDischarge: string | null;
        ipoId: string;
        issueDate: Date | null;
        shipmentId: string;
        documentNumber: string;
        placeOfIssue: string | null;
        shipperName: string | null;
        consigneeName: string | null;
        notifyParty: string | null;
        descriptionOfGoods: string | null;
        freightTerms: string | null;
        numberOfOriginals: number | null;
        originalsReceived: number | null;
    }>;
    verify(id: string, req: any): Promise<{
        shipment: {
            status: string;
            carrierName: string;
            shipmentMode: string;
            vesselName: string;
            shipmentNumber: string;
        };
        ipo: {
            vendor: {
                name: string;
                code: string;
            };
            currency: string;
            ipoNumber: string;
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
        documentType: string;
        notes: string | null;
        portOfLoading: string | null;
        portOfDischarge: string | null;
        ipoId: string;
        issueDate: Date | null;
        shipmentId: string;
        documentNumber: string;
        placeOfIssue: string | null;
        shipperName: string | null;
        consigneeName: string | null;
        notifyParty: string | null;
        descriptionOfGoods: string | null;
        freightTerms: string | null;
        numberOfOriginals: number | null;
        originalsReceived: number | null;
    }>;
    surrender(id: string, req: any): Promise<{
        shipment: {
            status: string;
            carrierName: string;
            shipmentMode: string;
            vesselName: string;
            shipmentNumber: string;
        };
        ipo: {
            vendor: {
                name: string;
                code: string;
            };
            currency: string;
            ipoNumber: string;
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
        documentType: string;
        notes: string | null;
        portOfLoading: string | null;
        portOfDischarge: string | null;
        ipoId: string;
        issueDate: Date | null;
        shipmentId: string;
        documentNumber: string;
        placeOfIssue: string | null;
        shipperName: string | null;
        consigneeName: string | null;
        notifyParty: string | null;
        descriptionOfGoods: string | null;
        freightTerms: string | null;
        numberOfOriginals: number | null;
        originalsReceived: number | null;
    }>;
}
