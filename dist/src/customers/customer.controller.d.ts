import { CustomerService } from './customer.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
export declare class CustomerController {
    private readonly customerService;
    constructor(customerService: CustomerService);
    getStats(req: any): Promise<{
        total: number;
    }>;
    findAll(req: any, query: any): Promise<{
        data: ({
            _count: {
                addresses: number;
                contacts: number;
                gstNumbers: number;
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
            code: string;
            phone: string | null;
            email: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, req: any): Promise<{
        addresses: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            city: string | null;
            state: string | null;
            pincode: string | null;
            isDefault: boolean;
            customerId: string;
            addressType: string;
            addressLine: string;
        }[];
        contacts: {
            id: string;
            companyId: string;
            name: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            phone: string | null;
            email: string | null;
            designation: string | null;
            customerId: string;
            isPrimary: boolean;
        }[];
        gstNumbers: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            customerId: string;
            gstNumber: string;
            branchLabel: string | null;
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
        code: string;
        phone: string | null;
        email: string | null;
    }>;
    create(dto: CreateCustomerDto, req: any): Promise<{
        addresses: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            city: string | null;
            state: string | null;
            pincode: string | null;
            isDefault: boolean;
            customerId: string;
            addressType: string;
            addressLine: string;
        }[];
        contacts: {
            id: string;
            companyId: string;
            name: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            phone: string | null;
            email: string | null;
            designation: string | null;
            customerId: string;
            isPrimary: boolean;
        }[];
        gstNumbers: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            customerId: string;
            gstNumber: string;
            branchLabel: string | null;
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
        code: string;
        phone: string | null;
        email: string | null;
    }>;
    quickCreate(dto: {
        name: string;
        email?: string;
        phone?: string;
    }, req: any): Promise<{
        id: string;
        companyId: string;
        name: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        code: string;
        phone: string | null;
        email: string | null;
    }>;
    update(id: string, dto: UpdateCustomerDto, req: any): Promise<{
        addresses: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            city: string | null;
            state: string | null;
            pincode: string | null;
            isDefault: boolean;
            customerId: string;
            addressType: string;
            addressLine: string;
        }[];
        contacts: {
            id: string;
            companyId: string;
            name: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            phone: string | null;
            email: string | null;
            designation: string | null;
            customerId: string;
            isPrimary: boolean;
        }[];
        gstNumbers: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            customerId: string;
            gstNumber: string;
            branchLabel: string | null;
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
        code: string;
        phone: string | null;
        email: string | null;
    }>;
    remove(id: string, req: any): Promise<{
        message: string;
    }>;
}
