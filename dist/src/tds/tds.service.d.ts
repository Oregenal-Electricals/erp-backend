import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { SaveDeclarationDto } from './dto/tds.dto';
export declare class TdsService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private calculateTax;
    private calculateHraExemption;
    saveDeclaration(dto: SaveDeclarationDto, user: any): Promise<any>;
    getDeclaration(employeeId: string, financialYear: string, user: any): Promise<{
        employee: {
            firstName: string;
            lastName: string;
            basicSalary: number;
            hraAmount: number;
            employeeNumber: string;
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
        financialYear: string;
        remarks: string | null;
        employeeId: string;
        otherDeductions: number;
        section80C: number;
        section80D: number;
        section80G: number;
        section80E: number;
        rentPaid: number;
        isMetroCity: boolean;
        regime: string;
        hraExemption: number;
        standardDeduction: number;
        taxableIncome: number;
        annualTax: number;
        monthlyTds: number;
    }>;
    getTdsChallan(month: number, year: number, user: any): Promise<{
        reportType: string;
        month: number;
        year: number;
        runNumber: string;
        payrollStatus: string;
        dueDate: string;
        section: string;
        entries: {
            employeeNumber: string;
            employeeName: string;
            panNumber: string;
            grossSalary: number;
            tdsAmount: number;
        }[];
        totalTds: number;
        employeeCount: number;
    }>;
    getTdsRegister(companyId: string, financialYear: string): Promise<{
        reportType: string;
        financialYear: string;
        companyId: string;
        employees: any[];
        totalTdsDeducted: any;
    }>;
    getForm16Summary(employeeId: string, financialYear: string, user: any): Promise<{
        reportType: string;
        financialYear: string;
        employeeId: string;
        employee: {
            firstName: string;
            lastName: string;
            panNumber: string;
            basicSalary: number;
            hraAmount: number;
            conveyanceAmount: number;
            otherAllowances: number;
            employeeNumber: string;
        };
        grossSalary: number;
        standardDeduction: number;
        hraExemption: number;
        section80C: number;
        section80D: number;
        section80G: number;
        section80E: number;
        otherDeductions: number;
        taxableIncome: number;
        annualTax: number;
        totalTdsDeducted: number;
        balanceTax: number;
        regime: string;
        totalPfContribution: number;
        monthlyDetails: {
            month: number;
            gross: number;
            tds: number;
        }[];
    }>;
    getAllDeclarations(user: any, query: any): Promise<({
        employee: {
            firstName: string;
            lastName: string;
            panNumber: string;
            employeeNumber: string;
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
        financialYear: string;
        remarks: string | null;
        employeeId: string;
        otherDeductions: number;
        section80C: number;
        section80D: number;
        section80G: number;
        section80E: number;
        rentPaid: number;
        isMetroCity: boolean;
        regime: string;
        hraExemption: number;
        standardDeduction: number;
        taxableIncome: number;
        annualTax: number;
        monthlyTds: number;
    })[]>;
}
