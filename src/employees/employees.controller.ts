import { Controller, Get, Post, Put, Body, Param, Query, Res, UseGuards, Request } from '@nestjs/common';
import { Response } from 'express';
import { EmployeesService } from './employees.service';
import { CreateDepartmentDto, CreateDesignationDto, CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('employees')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EmployeesController {
  constructor(private readonly empService: EmployeesService) {}

  @Get('me')
  @RequirePermissions(Permission.HR_VIEW)
  findMe(@Request() req: any) { return this.empService.findMe(req.user); }

  @Get('stats')
  @RequirePermissions(Permission.HR_VIEW)
  getStats(@Request() req: any) { return this.empService.getStats(req.user); }

  @Get('departments')
  @RequirePermissions(Permission.HR_VIEW)
  getDepts(@Request() req: any) { return this.empService.findAllDepartments(req.user); }

  @Post('departments')
  @RequirePermissions(Permission.HR_CREATE)
  createDept(@Body() dto: CreateDepartmentDto, @Request() req: any) { return this.empService.createDepartment(dto, req.user); }

  @Put('departments/:id')
  @RequirePermissions(Permission.HR_EDIT)
  updateDept(@Param('id') id: string, @Body() dto: any, @Request() req: any) { return this.empService.updateDepartment(id, dto, req.user); }

  @Get('designations')
  @RequirePermissions(Permission.HR_VIEW)
  getDesigs(@Request() req: any) { return this.empService.findAllDesignations(req.user); }

  @Post('designations')
  @RequirePermissions(Permission.HR_CREATE)
  createDesig(@Body() dto: CreateDesignationDto, @Request() req: any) { return this.empService.createDesignation(dto, req.user); }

  @Put('designations/:id')
  @RequirePermissions(Permission.HR_EDIT)
  updateDesig(@Param('id') id: string, @Body() dto: any, @Request() req: any) { return this.empService.updateDesignation(id, dto, req.user); }

  @Get()
  @RequirePermissions(Permission.EMPLOYEE_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.empService.findAll(req.user, query); }

  @Get(':id')
  @RequirePermissions(Permission.HR_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.empService.findOne(id, req.user); }

  @Post()
  @RequirePermissions(Permission.HR_CREATE)
  create(@Body() dto: CreateEmployeeDto, @Request() req: any) { return this.empService.create(dto, req.user); }

  @Put(':id')
  @RequirePermissions(Permission.HR_EDIT)
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto, @Request() req: any) { return this.empService.update(id, dto, req.user); }

  @Post(':id/documents')
  @RequirePermissions(Permission.HR_CREATE)
  uploadDoc(@Param('id') id: string, @Body() doc: any, @Request() req: any) { return this.empService.uploadDocument(id, doc, req.user); }

  @Get('documents/:docId/download')
  @RequirePermissions(Permission.HR_VIEW)
  async downloadDoc(@Param('docId') docId: string, @Request() req: any, @Res() res: Response) {
    const { fileData, fileName, mimeType } = await this.empService.downloadDocument(docId, req.user);
    const buffer = Buffer.from(fileData, 'base64');
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  }
}
