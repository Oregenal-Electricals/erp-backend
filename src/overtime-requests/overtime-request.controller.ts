import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { OvertimeRequestService } from './overtime-request.service';
import { CreateOvertimeRequestDto, AdjustOvertimeRequestDto } from './dto/overtime-request.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('overtime-requests')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OvertimeRequestController {
  constructor(private readonly service: OvertimeRequestService) {}

  @Get()
  @RequirePermissions(Permission.OVERTIME_REQUEST_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.service.findAll(req.user, query); }

  @Get(':id')
  @RequirePermissions(Permission.OVERTIME_REQUEST_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.service.findOne(id, req.user); }

  @Post()
  @RequirePermissions(Permission.OVERTIME_REQUEST_CREATE)
  create(@Body() dto: CreateOvertimeRequestDto, @Request() req: any) { return this.service.create(dto, req.user); }

  // Management narrowing the requested men/hours before approving via
  // the generic workflow Approve button - see OvertimeRequestService.adjust().
  @Patch(':id/adjust')
  @RequirePermissions(Permission.OVERTIME_REQUEST_ADJUST)
  adjust(@Param('id') id: string, @Body() dto: AdjustOvertimeRequestDto, @Request() req: any) { return this.service.adjust(id, dto, req.user); }
}
