import { Controller, Get, Post, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';
import { ManpowerService } from './manpower.service';
import { CreateManpowerAllocationDto, DistributeManpowerDto, RaiseManpowerQueryDto, ResolveManpowerQueryDto, AdjustManpowerDto, TransferManpowerDto, AssignEmployeesDto, EndAssignmentDto } from './dto/manpower.dto';

@Controller('manpower')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ManpowerController {
  constructor(private manpowerService: ManpowerService) {}

  @Get('allocations')
  @RequirePermissions(Permission.MANPOWER_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.manpowerService.findAll(req.user, query); }

  @Get('allocations/:id')
  @RequirePermissions(Permission.MANPOWER_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.manpowerService.findOne(id, req.user); }

  @Get('allocations/:id/chain')
  @RequirePermissions(Permission.MANPOWER_VIEW)
  getChain(@Param('id') id: string, @Request() req: any) { return this.manpowerService.getChain(id, req.user); }

  @Post('allocations')
  @RequirePermissions(Permission.MANPOWER_ALLOCATE)
  create(@Body() dto: CreateManpowerAllocationDto, @Request() req: any) { return this.manpowerService.create(dto, req.user); }

  @Post('allocations/:id/accept')
  @RequirePermissions(Permission.MANPOWER_ACCEPT)
  accept(@Param('id') id: string, @Request() req: any) { return this.manpowerService.accept(id, req.user); }

  @Post('allocations/distribute')
  @RequirePermissions(Permission.MANPOWER_DISTRIBUTE)
  distribute(@Body() dto: DistributeManpowerDto, @Request() req: any) { return this.manpowerService.distribute(dto, req.user); }

  @Post('queries')
  @RequirePermissions(Permission.MANPOWER_QUERY)
  raiseQuery(@Body() dto: RaiseManpowerQueryDto, @Request() req: any) { return this.manpowerService.raiseQuery(dto, req.user); }

  @Post('queries/:id/resolve')
  @RequirePermissions(Permission.MANPOWER_QUERY)
  resolveQuery(@Param('id') id: string, @Body() dto: ResolveManpowerQueryDto, @Request() req: any) { return this.manpowerService.resolveQuery(id, dto, req.user); }

  @Post('allocations/adjust')
  @RequirePermissions(Permission.MANPOWER_ADJUST)
  adjust(@Body() dto: AdjustManpowerDto, @Request() req: any) { return this.manpowerService.requestAdjust(dto, req.user); }

  @Post('allocations/transfer')
  @RequirePermissions(Permission.MANPOWER_ADJUST)
  transfer(@Body() dto: TransferManpowerDto, @Request() req: any) { return this.manpowerService.requestTransfer(dto, req.user); }

  @Post('approvals/:requestId/approve')
  @RequirePermissions(Permission.WORK_ORDER_APPROVE)
  approveRequest(@Param('requestId') requestId: string, @Request() req: any) { return this.manpowerService.approveManpowerRequest(requestId, req.user); }

  @Post('approvals/:requestId/reject')
  @RequirePermissions(Permission.WORK_ORDER_APPROVE)
  rejectRequest(@Param('requestId') requestId: string, @Body() dto: { comments?: string }, @Request() req: any) { return this.manpowerService.rejectManpowerRequest(requestId, req.user, dto?.comments); }

  @Post('assignments')
  @RequirePermissions(Permission.MANPOWER_ASSIGN)
  assignEmployees(@Body() dto: AssignEmployeesDto, @Request() req: any) { return this.manpowerService.assignEmployees(dto, req.user); }

  @Post('assignments/:id/end')
  @RequirePermissions(Permission.MANPOWER_ASSIGN)
  endAssignment(@Param('id') id: string, @Body() dto: EndAssignmentDto, @Request() req: any) { return this.manpowerService.endAssignment(id, dto, req.user); }

  @Get('roster')
  @RequirePermissions(Permission.MANPOWER_VIEW)
  getCurrentRoster(@Query() query: any, @Request() req: any) { return this.manpowerService.getCurrentRoster(query, req.user); }

  @Get('employees/:employeeId/timeline')
  @RequirePermissions(Permission.MANPOWER_VIEW)
  getEmployeeTimeline(@Param('employeeId') employeeId: string, @Query('date') date: string, @Request() req: any) { return this.manpowerService.getEmployeeTimeline(employeeId, date, req.user); }

  @Get('reconciliation')
  @RequirePermissions(Permission.MANPOWER_VIEW)
  getReconciliation(@Query('date') date: string, @Request() req: any) { return this.manpowerService.getReconciliation(date, req.user); }
}
