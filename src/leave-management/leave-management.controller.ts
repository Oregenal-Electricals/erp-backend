import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { LeaveManagementService } from './leave-management.service';
import { CreateLeaveTypeDto, AllocateLeaveDto, ApplyLeaveDto, ApproveLeaveDto } from './dto/leave.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('leave')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LeaveManagementController {
  constructor(private readonly leaveService: LeaveManagementService) {}

  @Get('stats')
  @RequirePermissions(Permission.HR_VIEW)
  getStats(@Request() req: any) { return this.leaveService.getStats(req.user); }

  @Get('types')
  @RequirePermissions(Permission.HR_VIEW)
  getTypes(@Request() req: any) { return this.leaveService.findAllLeaveTypes(req.user); }

  @Post('types')
  @RequirePermissions(Permission.HR_CREATE)
  createType(@Body() dto: CreateLeaveTypeDto, @Request() req: any) { return this.leaveService.createLeaveType(dto, req.user); }

  @Put('types/:id')
  @RequirePermissions(Permission.HR_EDIT)
  updateType(@Param('id') id: string, @Body() dto: any, @Request() req: any) { return this.leaveService.updateLeaveType(id, dto, req.user); }

  @Post('allocate')
  @RequirePermissions(Permission.HR_CREATE)
  allocate(@Body() dto: AllocateLeaveDto, @Request() req: any) { return this.leaveService.allocateLeave(dto, req.user); }

  @Post('bulk-allocate')
  @RequirePermissions(Permission.HR_CREATE)
  bulkAllocate(@Body() body: any, @Request() req: any) { return this.leaveService.bulkAllocate(body.leaveTypeId, body.year, req.user); }

  @Get('balance/:employeeId')
  @RequirePermissions(Permission.HR_VIEW)
  getBalance(@Param('employeeId') empId: string, @Query('year') year: string, @Request() req: any) { return this.leaveService.getEmployeeBalances(empId, Number(year) || new Date().getFullYear(), req.user); }

  @Get()
  @RequirePermissions(Permission.LEAVE_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.leaveService.findAllApplications(req.user, query); }

  @Post('apply')
  @RequirePermissions(Permission.HR_CREATE)
  apply(@Body() dto: ApplyLeaveDto, @Request() req: any) { return this.leaveService.applyLeave(dto, req.user); }

  @Put(':id/approve')
  @RequirePermissions(Permission.HR_APPROVE)
  approve(@Param('id') id: string, @Body() dto: ApproveLeaveDto, @Request() req: any) { return this.leaveService.approveLeave(id, dto, req.user); }

  @Put(':id/cancel')
  @RequirePermissions(Permission.HR_EDIT)
  cancel(@Param('id') id: string, @Request() req: any) { return this.leaveService.cancelLeave(id, req.user); }
}
