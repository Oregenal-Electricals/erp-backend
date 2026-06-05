import { IdProofType } from '@prisma/client';
export declare class CreateVisitorDto {
    firstName: string;
    lastName: string;
    mobile: string;
    email?: string;
    visitorCompany?: string;
    designation?: string;
    idProofType: IdProofType;
    idProofNumber: string;
}
export declare class UpdateVisitorDto {
    firstName?: string;
    lastName?: string;
    mobile?: string;
    email?: string;
    visitorCompany?: string;
    designation?: string;
}
export declare class CheckInVisitorDto {
    visitorId: string;
    plantId: string;
    hostEmployeeId?: string;
    purpose: string;
    vehicleNumber?: string;
    itemsCarried?: string;
    areasToVisit?: string;
    expectedOutTime?: string;
    remarks?: string;
}
export declare class CheckOutVisitorDto {
    remarks?: string;
}
