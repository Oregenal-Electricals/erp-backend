export declare class CreateDepartmentDto {
    code: string;
    name: string;
    description?: string;
    headUserId?: string;
}
export declare class CreateDesignationDto {
    code: string;
    name: string;
    grade?: string;
    description?: string;
}
export declare class CreateEmployeeDto {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth?: string;
    dateOfJoining: string;
    departmentId: string;
    designationId: string;
    reportingManagerId?: string;
    employmentType?: string;
    gender?: string;
    panNumber?: string;
    aadharNumber?: string;
    pfNumber?: string;
    esiNumber?: string;
    bankAccountNumber?: string;
    bankIfscCode?: string;
    bankName?: string;
    basicSalary?: number;
    hraAmount?: number;
    conveyanceAmount?: number;
    otherAllowances?: number;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    userId?: string;
    remarks?: string;
}
export declare class UpdateEmployeeDto {
    firstName?: string;
    lastName?: string;
    phone?: string;
    departmentId?: string;
    designationId?: string;
    reportingManagerId?: string;
    employmentType?: string;
    basicSalary?: number;
    hraAmount?: number;
    conveyanceAmount?: number;
    otherAllowances?: number;
    status?: string;
    dateOfLeaving?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    panNumber?: string;
    pfNumber?: string;
    esiNumber?: string;
    bankAccountNumber?: string;
    bankIfscCode?: string;
    bankName?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    remarks?: string;
}
