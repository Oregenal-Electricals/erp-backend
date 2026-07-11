import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { RunPayrollDto, UpdatePayrollEntryDto, ApprovePayrollDto } from './dto/payroll.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('payroll')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get('stats')
  @RequirePermissions(Permission.HR_VIEW)
  getStats(@Request() req: any) { return this.payrollService.getStats(req.user); }

  @Get()
  @RequirePermissions(Permission.HR_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.payrollService.findAll(req.user, query); }

  @Get(':id')
  @RequirePermissions(Permission.HR_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.payrollService.findOne(id, req.user); }

  @Post('run')
  @RequirePermissions(Permission.HR_CREATE)
  run(@Body() dto: RunPayrollDto, @Request() req: any) { return this.payrollService.runPayroll(dto, req.user); }

  @Post(':id/recalculate')
  @RequirePermissions(Permission.HR_EDIT)
  recalculate(@Param('id') id: string, @Request() req: any) { return this.payrollService.recalculate(id, req.user); }

  @Put('entries/:id')
  @RequirePermissions(Permission.HR_EDIT)
  updateEntry(@Param('id') id: string, @Body() dto: UpdatePayrollEntryDto, @Request() req: any) { return this.payrollService.updateEntry(id, dto, req.user); }

  @Put(':id/approve')
  @RequirePermissions(Permission.HR_APPROVE)
  approve(@Param('id') id: string, @Body() dto: ApprovePayrollDto, @Request() req: any) { return this.payrollService.approvePayroll(id, dto, req.user); }
}
