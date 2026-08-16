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
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            name: string;
            code: string;
            email: string | null;
            phone: string | null;
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
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            city: string | null;
            state: string | null;
            pincode: string | null;
            customerId: string;
            isDefault: boolean;
            addressType: string;
            addressLine: string;
        }[];
        contacts: {
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            name: string;
            email: string | null;
            phone: string | null;
            designation: string | null;
            customerId: string;
            isPrimary: boolean;
        }[];
        gstNumbers: {
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            customerId: string;
            gstNumber: string;
            branchLabel: string | null;
        }[];
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        name: string;
        code: string;
        email: string | null;
        phone: string | null;
    }>;
    create(dto: CreateCustomerDto, req: any): Promise<{
        addresses: {
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            city: string | null;
            state: string | null;
            pincode: string | null;
            customerId: string;
            isDefault: boolean;
            addressType: string;
            addressLine: string;
        }[];
        contacts: {
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            name: string;
            email: string | null;
            phone: string | null;
            designation: string | null;
            customerId: string;
            isPrimary: boolean;
        }[];
        gstNumbers: {
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            customerId: string;
            gstNumber: string;
            branchLabel: string | null;
        }[];
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        name: string;
        code: string;
        email: string | null;
        phone: string | null;
    }>;
    quickCreate(dto: {
        name: string;
        email?: string;
        phone?: string;
    }, req: any): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        name: string;
        code: string;
        email: string | null;
        phone: string | null;
    }>;
    update(id: string, dto: UpdateCustomerDto, req: any): Promise<{
        addresses: {
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            city: string | null;
            state: string | null;
            pincode: string | null;
            customerId: string;
            isDefault: boolean;
            addressType: string;
            addressLine: string;
        }[];
        contacts: {
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            name: string;
            email: string | null;
            phone: string | null;
            designation: string | null;
            customerId: string;
            isPrimary: boolean;
        }[];
        gstNumbers: {
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            customerId: string;
            gstNumber: string;
            branchLabel: string | null;
        }[];
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        name: string;
        code: string;
        email: string | null;
        phone: string | null;
    }>;
    remove(id: string, req: any): Promise<{
        message: string;
    }>;
}
