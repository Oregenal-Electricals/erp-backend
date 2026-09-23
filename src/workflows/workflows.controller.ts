import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { CreateWorkflowDto, UpdateWorkflowDto, SubmitForApprovalDto, ApproveRejectDto } from './dto/workflow.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('workflows')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class WorkflowsController {
  constructor(private readonly wfService: WorkflowsService) {}

  @Get('stats')
  @RequirePermissions(Permission.WORKFLOW_VIEW)
  getStats(@Request() req: any) { return this.wfService.getStats(req.user); }

  @Get('definitions')
  @RequirePermissions(Permission.WORKFLOW_VIEW)
  findAllWorkflows(@Request() req: any) { return this.wfService.findAllWorkflows(req.user); }

  @Get('requests')
  @RequirePermissions(Permission.WORKFLOW_VIEW)
  findAllRequests(@Request() req: any, @Query() query: any) { return this.wfService.findAllRequests(req.user, query); }

  @Get('my-approvals')
  @RequirePermissions(Permission.WORKFLOW_ACT)
  findMyApprovals(@Request() req: any) { return this.wfService.findMyApprovals(req.user); }

  @Get('requests/:id')
  @RequirePermissions(Permission.WORKFLOW_VIEW)
  findOneRequest(@Param('id') id: string, @Request() req: any) { return this.wfService.findOneRequest(id, req.user); }

  @Post('seed')
  @RequirePermissions(Permission.WORKFLOW_MANAGE)
  seed(@Request() req: any) { return this.wfService.seedDefaults(req.user.companyId, req.user.id); }

  @Post('definitions')
  @RequirePermissions(Permission.WORKFLOW_MANAGE)
  create(@Body() dto: CreateWorkflowDto, @Request() req: any) { return this.wfService.create(dto, req.user); }

  @Put('definitions/:id')
  @RequirePermissions(Permission.WORKFLOW_MANAGE)
  update(@Param('id') id: string, @Body() dto: UpdateWorkflowDto, @Request() req: any) { return this.wfService.update(id, dto, req.user); }

  @Post('submit')
  @RequirePermissions(Permission.WORKFLOW_SUBMIT)
  submit(@Body() dto: SubmitForApprovalDto, @Request() req: any) { return this.wfService.submit(dto, req.user); }

  @Post('requests/:id/action')
  @RequirePermissions(Permission.WORKFLOW_ACT)
  act(@Param('id') id: string, @Body() dto: ApproveRejectDto, @Request() req: any) { return this.wfService.act(id, dto, req.user); }

  @Post('requests/:id/cancel')
  @RequirePermissions(Permission.WORKFLOW_SUBMIT)
  cancel(@Param('id') id: string, @Request() req: any) { return this.wfService.cancel(id, req.user); }
}
