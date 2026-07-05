import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateDepartmentDto, CreateDesignationDto, CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private async generateEmpNumber(companyId: string): Promise<string> {
    const count = await this.prisma.employee.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `EMP-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  // DEPARTMENTS
  async createDepartment(dto: CreateDepartmentDto, user: any) {
    const existing = await this.prisma.hrDepartment.findUnique({ where: { companyId_code: { companyId: user.companyId, code: dto.code } } });
    if (existing) throw new BadRequestException(`Department code ${dto.code} already exists`);
    const dept = await this.prisma.hrDepartment.create({ data: { ...dto, companyId: user.companyId, createdBy: user.id, updatedBy: user.id } });
    await this.audit.log({ tableName: 'hr_departments', recordId: dept.id, action: 'CREATE', newValues: dept, changedBy: user.id });
    return dept;
  }

  async findAllDepartments(user: any) {
    return this.prisma.hrDepartment.findMany({
      where: { companyId: user.companyId, isActive: true },
      include: { _count: { select: { employees: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async updateDepartment(id: string, dto: any, user: any) {
    const dept = await this.prisma.hrDepartment.findFirst({ where: { id, companyId: user.companyId } });
    if (!dept) throw new NotFoundException('Department not found');
    const updated = await this.prisma.hrDepartment.update({ where: { id }, data: { ...dto, updatedBy: user.id } });
    await this.audit.log({ tableName: 'hr_departments', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  // DESIGNATIONS
  async createDesignation(dto: CreateDesignationDto, user: any) {
    const existing = await this.prisma.hrDesignation.findUnique({ where: { companyId_code: { companyId: user.companyId, code: dto.code } } });
    if (existing) throw new BadRequestException(`Designation code ${dto.code} already exists`);
    const desig = await this.prisma.hrDesignation.create({ data: { ...dto, companyId: user.companyId, createdBy: user.id, updatedBy: user.id } });
    await this.audit.log({ tableName: 'hr_designations', recordId: desig.id, action: 'CREATE', newValues: desig, changedBy: user.id });
    return desig;
  }

  async findAllDesignations(user: any) {
    return this.prisma.hrDesignation.findMany({
      where: { companyId: user.companyId, isActive: true },
      include: { _count: { select: { employees: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async updateDesignation(id: string, dto: any, user: any) {
    const desig = await this.prisma.hrDesignation.findFirst({ where: { id, companyId: user.companyId } });
    if (!desig) throw new NotFoundException('Designation not found');
    const updated = await this.prisma.hrDesignation.update({ where: { id }, data: { ...dto, updatedBy: user.id } });
    await this.audit.log({ tableName: 'hr_designations', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  // EMPLOYEES
  async create(dto: CreateEmployeeDto, user: any) {
    const existing = await this.prisma.employee.findUnique({ where: { companyId_email: { companyId: user.companyId, email: dto.email } } });
    if (existing) throw new BadRequestException(`Employee with email ${dto.email} already exists`);

    const dept = await this.prisma.hrDepartment.findFirst({ where: { id: dto.departmentId, companyId: user.companyId } });
    if (!dept) throw new NotFoundException('Department not found');
    const desig = await this.prisma.hrDesignation.findFirst({ where: { id: dto.designationId, companyId: user.companyId } });
    if (!desig) throw new NotFoundException('Designation not found');

    const employeeNumber = await this.generateEmpNumber(user.companyId);
    const emp = await this.prisma.employee.create({
      data: {
        employeeNumber, ...dto,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        dateOfJoining: new Date(dto.dateOfJoining),
        basicSalary: dto.basicSalary || 0,
        hraAmount: dto.hraAmount || 0,
        conveyanceAmount: dto.conveyanceAmount || 0,
        otherAllowances: dto.otherAllowances || 0,
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
      },
      include: { department: true, designation: true },
    });
    await this.audit.log({ tableName: 'employees', recordId: emp.id, action: 'CREATE', newValues: { ...emp, bankAccountNumber: '[REDACTED]', aadharNumber: '[REDACTED]', panNumber: '[REDACTED]' }, changedBy: user.id });
    return emp;
  }

  async update(id: string, dto: UpdateEmployeeDto, user: any) {
    const emp = await this.prisma.employee.findFirst({ where: { id, companyId: user.companyId } });
    if (!emp) throw new NotFoundException('Employee not found');
    const updated = await this.prisma.employee.update({
      where: { id },
      data: { ...dto, dateOfLeaving: dto.dateOfLeaving ? new Date(dto.dateOfLeaving) : undefined, updatedBy: user.id },
      include: { department: true, designation: true },
    });
    await this.audit.log({ tableName: 'employees', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async findAll(user: any, query: any) {
    const { search, departmentId, designationId, status, employmentType, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { companyId: user.companyId, isActive: true };
    if (status) where.status = status;
    if (departmentId) where.departmentId = departmentId;
    if (designationId) where.designationId = designationId;
    if (employmentType) where.employmentType = employmentType;
    if (search) where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { employeeNumber: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];

    const [data, total] = await Promise.all([
      this.prisma.employee.findMany({
        where, skip, take: Number(limit),
        include: { department: { select: { name: true } }, designation: { select: { name: true, grade: true } } },
        orderBy: { employeeNumber: 'asc' },
      }),
      this.prisma.employee.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const emp = await this.prisma.employee.findFirst({
      where: { id, companyId: user.companyId },
      include: { department: true, designation: true, documents: { where: { isActive: true }, select: { id: true, documentType: true, fileName: true, fileSize: true, createdAt: true } } },
    });
    if (!emp) throw new NotFoundException('Employee not found');
    return emp;
  }

  async getStats(user: any) {
    const where: any = { companyId: user.companyId, isActive: true };
    const [total, active, onProbation, contract, resigned] = await Promise.all([
      this.prisma.employee.count({ where }),
      this.prisma.employee.count({ where: { ...where, status: 'ACTIVE' } }),
      this.prisma.employee.count({ where: { ...where, employmentType: 'PROBATION' } }),
      this.prisma.employee.count({ where: { ...where, employmentType: 'CONTRACT' } }),
      this.prisma.employee.count({ where: { ...where, status: 'RESIGNED' } }),
    ]);
    const depts = await this.prisma.hrDepartment.count({ where: { companyId: user.companyId, isActive: true } });
    return { total, active, onProbation, contract, resigned, departments: depts };
  }

  async uploadDocument(employeeId: string, doc: any, user: any) {
    const emp = await this.prisma.employee.findFirst({ where: { id: employeeId, companyId: user.companyId } });
    if (!emp) throw new NotFoundException('Employee not found');
    if (doc.fileSize > 10 * 1024 * 1024) throw new BadRequestException('File too large (max 10MB)');
    const document = await this.prisma.employeeDocument.create({
      data: { employeeId, documentType: doc.documentType, fileName: doc.fileName, fileSize: doc.fileSize, fileData: doc.fileData, mimeType: doc.mimeType || 'application/pdf', remarks: doc.remarks, companyId: user.companyId, createdBy: user.id, updatedBy: user.id },
    });
    return { id: document.id, documentType: document.documentType, fileName: document.fileName };
  }

  async downloadDocument(docId: string, user: any) {
    const doc = await this.prisma.employeeDocument.findFirst({ where: { id: docId, companyId: user.companyId } });
    if (!doc) throw new NotFoundException('Document not found');
    return { fileData: doc.fileData, fileName: doc.fileName, mimeType: doc.mimeType };
  }
}
