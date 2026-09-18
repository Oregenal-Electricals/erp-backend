export declare class CreateTransportAssignmentDto {
    dispatchPlanId: string;
    transportType?: string;
    transporterName?: string;
    vehicleNumber?: string;
    vehicleType?: string;
    driverName?: string;
    driverPhone?: string;
    lrNumber?: string;
}
export declare class AssignPackageDto {
    packageId: string;
}
export declare class ReassignVehicleDto {
    vehicleNumber?: string;
    vehicleType?: string;
    driverName?: string;
    driverPhone?: string;
    reason: string;
}
export declare class CancelAssignmentDto {
    reason?: string;
}
