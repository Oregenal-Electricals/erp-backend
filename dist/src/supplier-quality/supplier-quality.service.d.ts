import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateSupplierRatingDto, CreateCarDto, RespondCarDto, VerifyCarDto } from './dto/supplier-quality.dto';
export declare class SupplierQualityService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private calculateScore;
    generateRating(dto: CreateSupplierRatingDto, user: any): Promise<any>;
    getRatings(user: any, query: any): Promise<{
        data: ({
            vendor: {
                code: string;
                name: string;
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
            remarks: string | null;
            rating: string;
            vendorId: string;
            period: string;
            periodType: string;
            totalReceived: number;
            totalRejected: number;
            onTimeDelivery: number;
            defectRate: number;
            ncrCount: number;
            carCount: number;
            qualityScore: number;
            avlStatus: string;
        })[];
        total: number;
    }>;
    getVendorScorecard(vendorId: string, user: any): Promise<{
        vendor: {
            code: string;
            name: string;
        };
        ratings: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
            remarks: string | null;
            rating: string;
            vendorId: string;
            period: string;
            periodType: string;
            totalReceived: number;
            totalRejected: number;
            onTimeDelivery: number;
            defectRate: number;
            ncrCount: number;
            carCount: number;
            qualityScore: number;
            avlStatus: string;
        }[];
        cars: ({
            ncr: {
                severity: string;
                ncrNumber: string;
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
            description: string;
            status: string;
            dueDate: Date;
            remarks: string | null;
            verifiedBy: string | null;
            vendorId: string;
            severity: string;
            closedDate: Date | null;
            ncrId: string | null;
            verifiedDate: Date | null;
            supplierResponse: string | null;
            supplierRootCause: string | null;
            supplierAction: string | null;
            carNumber: string;
            respondedDate: Date | null;
        })[];
        totalCars: number;
        openCars: number;
    }>;
    createCar(dto: CreateCarDto, user: any): Promise<{
        vendor: {
            code: string;
            name: string;
        };
        ncr: {
            ncrNumber: string;
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
        description: string;
        status: string;
        dueDate: Date;
        remarks: string | null;
        verifiedBy: string | null;
        vendorId: string;
        severity: string;
        closedDate: Date | null;
        ncrId: string | null;
        verifiedDate: Date | null;
        supplierResponse: string | null;
        supplierRootCause: string | null;
        supplierAction: string | null;
        carNumber: string;
        respondedDate: Date | null;
    }>;
    respondCar(id: string, dto: RespondCarDto, user: any): Promise<{
        vendor: {
            name: string;
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
        description: string;
        status: string;
        dueDate: Date;
        remarks: string | null;
        verifiedBy: string | null;
        vendorId: string;
        severity: string;
        closedDate: Date | null;
        ncrId: string | null;
        verifiedDate: Date | null;
        supplierResponse: string | null;
        supplierRootCause: string | null;
        supplierAction: string | null;
        carNumber: string;
        respondedDate: Date | null;
    }>;
    verifyCar(id: string, dto: VerifyCarDto, user: any): Promise<{
        vendor: {
            name: string;
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
        description: string;
        status: string;
        dueDate: Date;
        remarks: string | null;
        verifiedBy: string | null;
        vendorId: string;
        severity: string;
        closedDate: Date | null;
        ncrId: string | null;
        verifiedDate: Date | null;
        supplierResponse: string | null;
        supplierRootCause: string | null;
        supplierAction: string | null;
        carNumber: string;
        respondedDate: Date | null;
    }>;
    closeCar(id: string, user: any): Promise<{
        vendor: {
            name: string;
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
        description: string;
        status: string;
        dueDate: Date;
        remarks: string | null;
        verifiedBy: string | null;
        vendorId: string;
        severity: string;
        closedDate: Date | null;
        ncrId: string | null;
        verifiedDate: Date | null;
        supplierResponse: string | null;
        supplierRootCause: string | null;
        supplierAction: string | null;
        carNumber: string;
        respondedDate: Date | null;
    }>;
    getCars(user: any, query: any): Promise<{
        data: ({
            vendor: {
                code: string;
                name: string;
            };
            ncr: {
                severity: string;
                ncrNumber: string;
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
            description: string;
            status: string;
            dueDate: Date;
            remarks: string | null;
            verifiedBy: string | null;
            vendorId: string;
            severity: string;
            closedDate: Date | null;
            ncrId: string | null;
            verifiedDate: Date | null;
            supplierResponse: string | null;
            supplierRootCause: string | null;
            supplierAction: string | null;
            carNumber: string;
            respondedDate: Date | null;
        })[];
        total: number;
    }>;
    getStats(user: any): Promise<{
        totalRatings: number;
        totalCars: number;
        openCars: number;
        blacklisted: number;
        probation: number;
    }>;
}
