import { ContractorsService } from './contractors.service';
import { CreateContractorDto, UpdateContractorDto } from './dto/contractor.dto';
export declare class ContractorsController {
    private contractorsService;
    constructor(contractorsService: ContractorsService);
    findAll(req: any, query: any): Promise<({
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
    findOne(id: string, req: any): Promise<{
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
    create(dto: CreateContractorDto, req: any): Promise<{
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
    update(id: string, dto: UpdateContractorDto, req: any): Promise<{
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
    remove(id: string, req: any): Promise<{
        success: boolean;
    }>;
}
