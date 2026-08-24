import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateContractorDto, UpdateContractorDto } from './dto/contractor.dto';
export declare class ContractorsService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    create(dto: CreateContractorDto, user: any): Promise<{
        id: string;
        companyId: string;
        name: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        address: string | null;
        phone: string | null;
        email: string | null;
        contactPerson: string | null;
        defaultHourlyRate: number | null;
    }>;
    findAll(user: any, query: any): Promise<({
        _count: {
            employees: number;
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
        address: string | null;
        phone: string | null;
        email: string | null;
        contactPerson: string | null;
        defaultHourlyRate: number | null;
    })[]>;
    findOne(id: string, user: any): Promise<{
        employees: {
            id: string;
            firstName: string;
            lastName: string;
            employeeNumber: string;
            hourlyRate: number;
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
        address: string | null;
        phone: string | null;
        email: string | null;
        contactPerson: string | null;
        defaultHourlyRate: number | null;
    }>;
    update(id: string, dto: UpdateContractorDto, user: any): Promise<{
        id: string;
        companyId: string;
        name: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        address: string | null;
        phone: string | null;
        email: string | null;
        contactPerson: string | null;
        defaultHourlyRate: number | null;
    }>;
    remove(id: string, user: any): Promise<{
        success: boolean;
    }>;
}
