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
        byType: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.ShippingDocumentGroupByOutputType, "documentType"[]> & {
            _count: number;
        })[];
    }>;
    findAll(req: any, query: any): Promise<{
        data: ({
            ipo: {
                vendor: {
                    code: string;
                    name: string;
                };
                currency: string;
                ipoNumber: string;
            };
            shipment: {
                status: string;
                shipmentNumber: string;
                shipmentMode: string;
                carrierName: string;
                vesselName: string;
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
            notes: string | null;
            documentType: string;
            documentNumber: string;
            ipoId: string;
            portOfLoading: string | null;
            portOfDischarge: string | null;
            shipmentId: string;
            issueDate: Date | null;
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
        ipo: {
            vendor: {
                code: string;
                name: string;
            };
            currency: string;
            ipoNumber: string;
        };
        shipment: {
            status: string;
            shipmentNumber: string;
            shipmentMode: string;
            carrierName: string;
            vesselName: string;
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
        notes: string | null;
        documentType: string;
        documentNumber: string;
        ipoId: string;
        portOfLoading: string | null;
        portOfDischarge: string | null;
        shipmentId: string;
        issueDate: Date | null;
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
        ipo: {
            vendor: {
                code: string;
                name: string;
            };
            currency: string;
            ipoNumber: string;
        };
        shipment: {
            status: string;
            shipmentNumber: string;
            shipmentMode: string;
            carrierName: string;
            vesselName: string;
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
        notes: string | null;
        documentType: string;
        documentNumber: string;
        ipoId: string;
        portOfLoading: string | null;
        portOfDischarge: string | null;
        shipmentId: string;
        issueDate: Date | null;
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
        ipo: {
            vendor: {
                code: string;
                name: string;
            };
            currency: string;
            ipoNumber: string;
        };
        shipment: {
            status: string;
            shipmentNumber: string;
            shipmentMode: string;
            carrierName: string;
            vesselName: string;
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
        notes: string | null;
        documentType: string;
        documentNumber: string;
        ipoId: string;
        portOfLoading: string | null;
        portOfDischarge: string | null;
        shipmentId: string;
        issueDate: Date | null;
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
        ipo: {
            vendor: {
                code: string;
                name: string;
            };
            currency: string;
            ipoNumber: string;
        };
        shipment: {
            status: string;
            shipmentNumber: string;
            shipmentMode: string;
            carrierName: string;
            vesselName: string;
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
        notes: string | null;
        documentType: string;
        documentNumber: string;
        ipoId: string;
        portOfLoading: string | null;
        portOfDischarge: string | null;
        shipmentId: string;
        issueDate: Date | null;
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
        ipo: {
            vendor: {
                code: string;
                name: string;
            };
            currency: string;
            ipoNumber: string;
        };
        shipment: {
            status: string;
            shipmentNumber: string;
            shipmentMode: string;
            carrierName: string;
            vesselName: string;
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
        notes: string | null;
        documentType: string;
        documentNumber: string;
        ipoId: string;
        portOfLoading: string | null;
        portOfDischarge: string | null;
        shipmentId: string;
        issueDate: Date | null;
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
        ipo: {
            vendor: {
                code: string;
                name: string;
            };
            currency: string;
            ipoNumber: string;
        };
        shipment: {
            status: string;
            shipmentNumber: string;
            shipmentMode: string;
            carrierName: string;
            vesselName: string;
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
        notes: string | null;
        documentType: string;
        documentNumber: string;
        ipoId: string;
        portOfLoading: string | null;
        portOfDischarge: string | null;
        shipmentId: string;
        issueDate: Date | null;
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
