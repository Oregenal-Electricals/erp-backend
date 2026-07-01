import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ComplaintService } from './complaint.service';
import { CreateComplaintDto, UpdateComplaintDto, RespondComplaintDto } from './dto/complaint.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('customer-complaints')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ComplaintController {
  constructor(private readonly complaintService: ComplaintService) {}

  @Get('stats')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getStats(@Request() req: any) { return this.complaintService.getStats(req.user); }

  @Get()
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.complaintService.findAll(req.user, query); }

  @Get(':id')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.complaintService.findOne(id, req.user); }

  @Post()
  @RequirePermissions(Permission.INVENTORY_CREATE)
  create(@Body() dto: CreateComplaintDto, @Request() req: any) { return this.complaintService.create(dto, req.user); }

  @Put(':id')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  update(@Param('id') id: string, @Body() dto: UpdateComplaintDto, @Request() req: any) { return this.complaintService.update(id, dto, req.user); }

  @Post(':id/respond')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  respond(@Param('id') id: string, @Body() dto: RespondComplaintDto, @Request() req: any) { return this.complaintService.respond(id, dto, req.user); }

  @Post(':id/close')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  close(@Param('id') id: string, @Request() req: any) { return this.complaintService.close(id, req.user); }
}
