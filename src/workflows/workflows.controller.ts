import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { CreateWorkflowDto, SubmitForApprovalDto, ApproveRejectDto } from './dto/workflow.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('workflows')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class WorkflowsController {
  constructor(private readonly wfService: WorkflowsService) {}

  @Get('stats')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getStats(@Request() req: any) { return this.wfService.getStats(req.user); }

  @Get('definitions')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findAllWorkflows(@Request() req: any) { return this.wfService.findAllWorkflows(req.user); }

  @Get('requests')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findAllRequests(@Request() req: any, @Query() query: any) { return this.wfService.findAllRequests(req.user, query); }

  @Get('requests/:id')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findOneRequest(@Param('id') id: string, @Request() req: any) { return this.wfService.findOneRequest(id, req.user); }

  @Post('seed')
  @RequirePermissions(Permission.INVENTORY_CREATE)
  seed(@Request() req: any) { return this.wfService.seedDefaults(req.user.companyId, req.user.id); }

  @Post('definitions')
  @RequirePermissions(Permission.INVENTORY_CREATE)
  create(@Body() dto: CreateWorkflowDto, @Request() req: any) { return this.wfService.create(dto, req.user); }

  @Post('submit')
  @RequirePermissions(Permission.INVENTORY_CREATE)
  submit(@Body() dto: SubmitForApprovalDto, @Request() req: any) { return this.wfService.submit(dto, req.user); }

  @Post('requests/:id/action')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  act(@Param('id') id: string, @Body() dto: ApproveRejectDto, @Request() req: any) { return this.wfService.act(id, dto, req.user); }

  @Post('requests/:id/cancel')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  cancel(@Param('id') id: string, @Request() req: any) { return this.wfService.cancel(id, req.user); }
}
