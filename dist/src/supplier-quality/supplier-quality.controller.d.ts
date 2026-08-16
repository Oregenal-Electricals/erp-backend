import { SupplierQualityService } from './supplier-quality.service';
import { CreateSupplierRatingDto, CreateCarDto, RespondCarDto, VerifyCarDto } from './dto/supplier-quality.dto';
export declare class SupplierQualityController {
    private readonly sqService;
    constructor(sqService: SupplierQualityService);
    getStats(req: any): Promise<{
        totalRatings: number;
        totalCars: number;
        openCars: number;
        blacklisted: number;
        probation: number;
    }>;
    getRatings(req: any, query: any): Promise<{
        data: ({
            vendor: {
                name: string;
                code: string;
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
            remarks: string | null;
            rating: string;
            vendorId: string;
            period: string;
            periodType: string;
            totalReceived: number;
            totalRejected: number;
            defectRate: number;
            ncrCount: number;
            carCount: number;
            onTimeDelivery: number;
            qualityScore: number;
            avlStatus: string;
        })[];
        total: number;
    }>;
    getScorecard(vendorId: string, req: any): Promise<{
        vendor: {
            name: string;
            code: string;
        };
        ratings: {
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            remarks: string | null;
            rating: string;
            vendorId: string;
            period: string;
            periodType: string;
            totalReceived: number;
            totalRejected: number;
            defectRate: number;
            ncrCount: number;
            carCount: number;
            onTimeDelivery: number;
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
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            description: string;
            status: string;
            remarks: string | null;
            severity: string;
            closedDate: Date | null;
            vendorId: string;
            dueDate: Date;
            ncrId: string | null;
            verifiedBy: string | null;
            verifiedDate: Date | null;
            carNumber: string;
            supplierResponse: string | null;
            supplierRootCause: string | null;
            supplierAction: string | null;
            respondedDate: Date | null;
        })[];
        totalCars: number;
        openCars: number;
    }>;
    generateRating(dto: CreateSupplierRatingDto, req: any): Promise<any>;
    getCars(req: any, query: any): Promise<{
        data: ({
            vendor: {
                name: string;
                code: string;
            };
            ncr: {
                severity: string;
                ncrNumber: string;
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
            description: string;
            status: string;
            remarks: string | null;
            severity: string;
            closedDate: Date | null;
            vendorId: string;
            dueDate: Date;
            ncrId: string | null;
            verifiedBy: string | null;
            verifiedDate: Date | null;
            carNumber: string;
            supplierResponse: string | null;
            supplierRootCause: string | null;
            supplierAction: string | null;
            respondedDate: Date | null;
        })[];
        total: number;
    }>;
    createCar(dto: CreateCarDto, req: any): Promise<{
        vendor: {
            name: string;
            code: string;
        };
        ncr: {
            ncrNumber: string;
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
        description: string;
        status: string;
        remarks: string | null;
        severity: string;
        closedDate: Date | null;
        vendorId: string;
        dueDate: Date;
        ncrId: string | null;
        verifiedBy: string | null;
        verifiedDate: Date | null;
        carNumber: string;
        supplierResponse: string | null;
        supplierRootCause: string | null;
        supplierAction: string | null;
        respondedDate: Date | null;
    }>;
    respondCar(id: string, dto: RespondCarDto, req: any): Promise<{
        vendor: {
            name: string;
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
        description: string;
        status: string;
        remarks: string | null;
        severity: string;
        closedDate: Date | null;
        vendorId: string;
        dueDate: Date;
        ncrId: string | null;
        verifiedBy: string | null;
        verifiedDate: Date | null;
        carNumber: string;
        supplierResponse: string | null;
        supplierRootCause: string | null;
        supplierAction: string | null;
        respondedDate: Date | null;
    }>;
    verifyCar(id: string, dto: VerifyCarDto, req: any): Promise<{
        vendor: {
            name: string;
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
        description: string;
        status: string;
        remarks: string | null;
        severity: string;
        closedDate: Date | null;
        vendorId: string;
        dueDate: Date;
        ncrId: string | null;
        verifiedBy: string | null;
        verifiedDate: Date | null;
        carNumber: string;
        supplierResponse: string | null;
        supplierRootCause: string | null;
        supplierAction: string | null;
        respondedDate: Date | null;
    }>;
    closeCar(id: string, req: any): Promise<{
        vendor: {
            name: string;
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
        description: string;
        status: string;
        remarks: string | null;
        severity: string;
        closedDate: Date | null;
        vendorId: string;
        dueDate: Date;
        ncrId: string | null;
        verifiedBy: string | null;
        verifiedDate: Date | null;
        carNumber: string;
        supplierResponse: string | null;
        supplierRootCause: string | null;
        supplierAction: string | null;
        respondedDate: Date | null;
    }>;
}
