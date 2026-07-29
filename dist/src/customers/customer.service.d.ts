import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
export declare class CustomerService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private includes;
    create(dto: CreateCustomerDto, user: any): Promise<{
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
            addressType: string;
            addressLine: string;
            customerId: string;
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
            isPrimary: boolean;
            customerId: string;
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
            gstNumber: string;
            branchLabel: string | null;
            customerId: string;
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
    findAll(user: any, query: any): Promise<{
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
    findOne(id: string, user: any): Promise<{
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
            addressType: string;
            addressLine: string;
            customerId: string;
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
            isPrimary: boolean;
            customerId: string;
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
            gstNumber: string;
            branchLabel: string | null;
            customerId: string;
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
    update(id: string, dto: UpdateCustomerDto, user: any): Promise<{
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
            addressType: string;
            addressLine: string;
            customerId: string;
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
            isPrimary: boolean;
            customerId: string;
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
            gstNumber: string;
            branchLabel: string | null;
            customerId: string;
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
    remove(id: string, user: any): Promise<{
        message: string;
    }>;
    getStats(user: any): Promise<{
        total: number;
    }>;
}
