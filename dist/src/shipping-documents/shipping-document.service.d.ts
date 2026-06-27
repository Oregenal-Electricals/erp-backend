import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateShippingDocumentDto, UpdateShippingDocumentDto } from './dto/shipping-document.dto';
export declare class ShippingDocumentService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private includes;
    create(dto: CreateShippingDocumentDto, user: any): Promise<{
        shipment: {
            status: string;
            carrierName: string;
            shipmentMode: string;
            vesselName: string;
            shipmentNumber: string;
        };
        ipo: {
            vendor: {
                code: string;
                name: string;
            };
            currency: string;
            ipoNumber: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
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
    findAll(user: any, query: any): Promise<{
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
                    code: string;
                    name: string;
                };
                currency: string;
                ipoNumber: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
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
    findOne(id: string, user: any): Promise<{
        shipment: {
            status: string;
            carrierName: string;
            shipmentMode: string;
            vesselName: string;
            shipmentNumber: string;
        };
        ipo: {
            vendor: {
                code: string;
                name: string;
            };
            currency: string;
            ipoNumber: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
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
    findByShipment(shipmentId: string, user: any): Promise<({
        shipment: {
            status: string;
            carrierName: string;
            shipmentMode: string;
            vesselName: string;
            shipmentNumber: string;
        };
        ipo: {
            vendor: {
                code: string;
                name: string;
            };
            currency: string;
            ipoNumber: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
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
    update(id: string, dto: UpdateShippingDocumentDto, user: any): Promise<{
        shipment: {
            status: string;
            carrierName: string;
            shipmentMode: string;
            vesselName: string;
            shipmentNumber: string;
        };
        ipo: {
            vendor: {
                code: string;
                name: string;
            };
            currency: string;
            ipoNumber: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
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
    verify(id: string, user: any): Promise<{
        shipment: {
            status: string;
            carrierName: string;
            shipmentMode: string;
            vesselName: string;
            shipmentNumber: string;
        };
        ipo: {
            vendor: {
                code: string;
                name: string;
            };
            currency: string;
            ipoNumber: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
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
    surrender(id: string, user: any): Promise<{
        shipment: {
            status: string;
            carrierName: string;
            shipmentMode: string;
            vesselName: string;
            shipmentNumber: string;
        };
        ipo: {
            vendor: {
                code: string;
                name: string;
            };
            currency: string;
            ipoNumber: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
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
    getStats(user: any): Promise<{
        total: number;
        received: number;
        verified: number;
        surrendered: number;
        byType: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.ShippingDocumentGroupByOutputType, "documentType"[]> & {
            _count: number;
        })[];
    }>;
}
