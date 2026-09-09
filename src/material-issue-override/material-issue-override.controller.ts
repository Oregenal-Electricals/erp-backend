import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';
import { MaterialIssueOverrideService } from './material-issue-override.service';
import { RequestOverrideDto, DecideOverrideDto } from './dto/material-issue-override.dto';

@Controller('production/material-issue-overrides')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MaterialIssueOverrideController {
  constructor(private service: MaterialIssueOverrideService) {}

  @Get('pending')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findPending(@Request() req: any) {
    return this.service.findPending(req.user);
  }

  @Get(':id')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.service.findOne(id, req.user);
  }

  @Post()
  @RequirePermissions(Permission.INVENTORY_CREATE)
  request(@Body() dto: RequestOverrideDto, @Request() req: any) {
    return this.service.request(dto, req.user);
  }

  @Post(':id/decide')
  @RequirePermissions(Permission.MATERIAL_ISSUE_OVERRIDE_APPROVE)
  decide(@Param('id') id: string, @Body() dto: DecideOverrideDto, @Request() req: any) {
    return this.service.decide(id, dto, req.user);
  }
}
