"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TdsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const OLD_SLABS = [
    { from: 0, to: 250000, rate: 0 },
    { from: 250000, to: 500000, rate: 0.05 },
    { from: 500000, to: 1000000, rate: 0.20 },
    { from: 1000000, to: Infinity, rate: 0.30 },
];
const NEW_SLABS = [
    { from: 0, to: 300000, rate: 0 },
    { from: 300000, to: 600000, rate: 0.05 },
    { from: 600000, to: 900000, rate: 0.10 },
    { from: 900000, to: 1200000, rate: 0.15 },
    { from: 1200000, to: 1500000, rate: 0.20 },
    { from: 1500000, to: Infinity, rate: 0.30 },
];
const STANDARD_DEDUCTION = 50000;
const SECTION_80C_LIMIT = 150000;
const SECTION_80D_LIMIT = 25000;
const REBATE_87A_LIMIT = 700000;
const REBATE_87A_AMOUNT = 25000;
let TdsService = class TdsService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    calculateTax(taxableIncome, regime) {
        if (taxableIncome <= 0)
            return 0;
        const slabs = regime === 'NEW' ? NEW_SLABS : OLD_SLABS;
        let tax = 0;
        for (const slab of slabs) {
            if (taxableIncome <= slab.from)
                break;
            const taxable = Math.min(taxableIncome, slab.to) - slab.from;
            tax += taxable * slab.rate;
        }
        if (regime === 'NEW' && taxableIncome <= REBATE_87A_LIMIT) {
            tax = Math.max(0, tax - Math.min(tax, REBATE_87A_AMOUNT));
        }
        if (regime === 'OLD' && taxableIncome <= 500000) {
            tax = 0;
        }
        const cess = tax * 0.04;
        return Math.round((tax + cess) * 100) / 100;
    }
    calculateHraExemption(annualBasic, annualHra, annualRentPaid, isMetroCity) {
        if (annualRentPaid <= 0)
            return 0;
        const metroRate = isMetroCity ? 0.5 : 0.4;
        const exempt = Math.min(annualHra, annualBasic * metroRate, annualRentPaid - annualBasic * 0.1);
        return Math.max(0, exempt);
    }
    async saveDeclaration(dto, user) {
        const emp = await this.prisma.employee.findFirst({
            where: { id: dto.employeeId, companyId: user.companyId },
        });
        if (!emp)
            throw new common_1.NotFoundException('Employee not found');
        const regime = dto.regime || 'NEW';
        const annualBasic = emp.basicSalary * 12;
        const annualHra = emp.hraAmount * 12;
        const annualGross = (emp.basicSalary + emp.hraAmount + emp.conveyanceAmount + emp.otherAllowances) * 12;
        const annualRentPaid = (dto.rentPaid || 0) * 12;
        const hraExemption = this.calculateHraExemption(annualBasic, annualHra, annualRentPaid, dto.isMetroCity || false);
        const section80C = Math.min(dto.section80C || 0, SECTION_80C_LIMIT);
        const section80D = Math.min(dto.section80D || 0, SECTION_80D_LIMIT);
        const section80G = dto.section80G || 0;
        const section80E = dto.section80E || 0;
        const otherDed = dto.otherDeductions || 0;
        let taxableIncome;
        if (regime === 'NEW') {
            taxableIncome = Math.max(0, annualGross - STANDARD_DEDUCTION);
        }
        else {
            taxableIncome = Math.max(0, annualGross - STANDARD_DEDUCTION - hraExemption - section80C - section80D - section80G - section80E - otherDed);
        }
        const annualTax = this.calculateTax(taxableIncome, regime);
        const monthlyTds = Math.round(annualTax / 12 * 100) / 100;
        const existing = await this.prisma.tdsDeclaration.findUnique({
            where: { companyId_employeeId_financialYear: { companyId: user.companyId, employeeId: dto.employeeId, financialYear: dto.financialYear } },
        });
        const data = {
            section80C: section80C, section80D, section80G, section80E,
            otherDeductions: otherDed, rentPaid: dto.rentPaid || 0,
            isMetroCity: dto.isMetroCity || false, hraExemption,
            standardDeduction: STANDARD_DEDUCTION,
            taxableIncome, annualTax, monthlyTds,
            regime, remarks: dto.remarks,
        };
        let decl;
        if (existing) {
            decl = await this.prisma.tdsDeclaration.update({
                where: { id: existing.id },
                data: Object.assign(Object.assign({}, data), { updatedBy: user.id }),
            });
        }
        else {
            decl = await this.prisma.tdsDeclaration.create({
                data: Object.assign(Object.assign({}, data), { companyId: user.companyId, employeeId: dto.employeeId, financialYear: dto.financialYear, createdBy: user.id, updatedBy: user.id }),
            });
        }
        await this.audit.log({ tableName: 'tds_declarations', recordId: decl.id, action: existing ? 'UPDATE' : 'CREATE', newValues: decl, changedBy: user.id });
        return Object.assign(Object.assign({}, decl), { annualGross, annualBasic, annualHra, hraExemption, breakdown: {
                annualGross, standardDeduction: STANDARD_DEDUCTION,
                hraExemption: regime === 'OLD' ? hraExemption : 0,
                section80C: regime === 'OLD' ? section80C : 0,
                section80D: regime === 'OLD' ? section80D : 0,
                section80G: regime === 'OLD' ? section80G : 0,
                section80E: regime === 'OLD' ? section80E : 0,
                otherDeductions: regime === 'OLD' ? otherDed : 0,
                taxableIncome, annualTax, monthlyTds, regime,
            } });
    }
    async getDeclaration(employeeId, financialYear, user) {
        return this.prisma.tdsDeclaration.findUnique({
            where: { companyId_employeeId_financialYear: { companyId: user.companyId, employeeId, financialYear } },
            include: { employee: { select: { firstName: true, lastName: true, employeeNumber: true, basicSalary: true, hraAmount: true } } },
        });
    }
    async getTdsChallan(month, year, user) {
        const run = await this.prisma.payrollRun.findUnique({
            where: { companyId_month_year: { companyId: user.companyId, month, year } },
            include: {
                entries: {
                    include: {
                        employee: { select: { firstName: true, lastName: true, employeeNumber: true, panNumber: true } },
                    },
                    where: { tdsAmount: { gt: 0 } },
                },
            },
        });
        if (!run)
            throw new common_1.NotFoundException(`No payroll run found for ${month}/${year}`);
        const entries = run.entries.map(e => ({
            employeeNumber: e.employee.employeeNumber,
            employeeName: `${e.employee.firstName} ${e.employee.lastName}`,
            panNumber: e.employee.panNumber || '—',
            grossSalary: e.grossEarnings,
            tdsAmount: e.tdsAmount,
        }));
        const totalTds = entries.reduce((s, e) => s + e.tdsAmount, 0);
        return {
            reportType: 'TDS_CHALLAN',
            month, year, runNumber: run.runNumber,
            payrollStatus: run.status,
            dueDate: `7/${month > 12 ? 1 : month + 1}/${month > 11 ? year + 1 : year}`,
            section: '192 - Salary',
            entries, totalTds, employeeCount: entries.length,
        };
    }
    async getTdsRegister(companyId, financialYear) {
        const [startYear] = financialYear.split('-').map(Number);
        const from = new Date(startYear, 3, 1);
        const to = new Date(startYear + 1, 2, 31, 23, 59, 59);
        const declarations = await this.prisma.tdsDeclaration.findMany({
            where: { companyId, financialYear },
            include: { employee: { select: { firstName: true, lastName: true, employeeNumber: true, panNumber: true } } },
        });
        const runs = await this.prisma.payrollRun.findMany({
            where: { companyId, createdAt: { gte: from, lte: to }, status: { not: 'DRAFT' } },
            include: { entries: { select: { employeeId: true, tdsAmount: true, grossEarnings: true, month: true } } },
            orderBy: { month: 'asc' },
        });
        const empMap = {};
        declarations.forEach(d => {
            empMap[d.employeeId] = {
                employeeId: d.employeeId,
                employeeNumber: d.employee.employeeNumber,
                employeeName: `${d.employee.firstName} ${d.employee.lastName}`,
                panNumber: d.employee.panNumber || '—',
                taxableIncome: d.taxableIncome,
                annualTax: d.annualTax,
                monthlyTds: d.monthlyTds,
                regime: d.regime,
                months: {},
                totalTdsDeducted: 0,
            };
        });
        runs.forEach(run => {
            run.entries.forEach(e => {
                if (!empMap[e.employeeId])
                    return;
                empMap[e.employeeId].months[run.month] = { tdsAmount: e.tdsAmount, grossEarnings: e.grossEarnings };
                empMap[e.employeeId].totalTdsDeducted += e.tdsAmount;
            });
        });
        return {
            reportType: 'TDS_REGISTER',
            financialYear, companyId,
            employees: Object.values(empMap),
            totalTdsDeducted: Object.values(empMap).reduce((s, e) => s + e.totalTdsDeducted, 0),
        };
    }
    async getForm16Summary(employeeId, financialYear, user) {
        const decl = await this.prisma.tdsDeclaration.findUnique({
            where: { companyId_employeeId_financialYear: { companyId: user.companyId, employeeId, financialYear } },
            include: { employee: { select: { firstName: true, lastName: true, employeeNumber: true, panNumber: true, basicSalary: true, hraAmount: true, conveyanceAmount: true, otherAllowances: true } } },
        });
        if (!decl)
            throw new common_1.NotFoundException('TDS declaration not found for this employee and financial year');
        const [startYear] = financialYear.split('-').map(Number);
        const from = new Date(startYear, 3, 1);
        const to = new Date(startYear + 1, 2, 31, 23, 59, 59);
        const entries = await this.prisma.payrollEntry.findMany({
            where: { companyId: user.companyId, employeeId, createdAt: { gte: from, lte: to }, status: { not: 'DRAFT' } },
            orderBy: { month: 'asc' },
        });
        const totalGross = entries.reduce((s, e) => s + e.grossEarnings, 0);
        const totalTds = entries.reduce((s, e) => s + e.tdsAmount, 0);
        const totalPf = entries.reduce((s, e) => s + e.pfEmployee, 0);
        return {
            reportType: 'FORM_16_SUMMARY',
            financialYear, employeeId,
            employee: decl.employee,
            grossSalary: totalGross,
            standardDeduction: STANDARD_DEDUCTION,
            hraExemption: decl.hraExemption,
            section80C: decl.section80C,
            section80D: decl.section80D,
            section80G: decl.section80G,
            section80E: decl.section80E,
            otherDeductions: decl.otherDeductions,
            taxableIncome: decl.taxableIncome,
            annualTax: decl.annualTax,
            totalTdsDeducted: totalTds,
            balanceTax: Math.max(0, decl.annualTax - totalTds),
            regime: decl.regime,
            totalPfContribution: totalPf,
            monthlyDetails: entries.map(e => ({ month: e.month, gross: e.grossEarnings, tds: e.tdsAmount })),
        };
    }
    async getAllDeclarations(user, query) {
        const { financialYear } = query;
        const where = { companyId: user.companyId };
        if (financialYear)
            where.financialYear = financialYear;
        return this.prisma.tdsDeclaration.findMany({
            where,
            include: { employee: { select: { firstName: true, lastName: true, employeeNumber: true, panNumber: true } } },
            orderBy: { employee: { employeeNumber: 'asc' } },
        });
    }
};
exports.TdsService = TdsService;
exports.TdsService = TdsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], TdsService);
//# sourceMappingURL=tds.service.js.map