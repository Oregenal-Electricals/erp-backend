import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ProductionIssueService } from './production-issue.service';
import { CreateProductionIssueDto } from './dto/production-issue.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('production-issues')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProductionIssueController {
  constructor(private readonly piService: ProductionIssueService) {}

  @Get('stats')
  @RequirePermissions(Permission.PRODUCTION_VIEW)
  getStats(@Request() req: any) { return this.piService.getStats(req.user); }

  @Get()
  @RequirePermissions(Permission.PRODUCTION_ISSUE_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.piService.findAll(req.user, query); }

  @Get(':id')
  @RequirePermissions(Permission.PRODUCTION_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.piService.findOne(id, req.user); }

  @Post()
  @RequirePermissions(Permission.PRODUCTION_CREATE)
  create(@Body() dto: CreateProductionIssueDto, @Request() req: any) { return this.piService.create(dto, req.user); }

  @Post('from-mrp/:woId')
  @RequirePermissions(Permission.PRODUCTION_CREATE)
  createFromMrp(@Param('woId') woId: string, @Request() req: any) { return this.piService.createFromMrp(woId, req.user); }

  @Post(':id/confirm')
  @RequirePermissions(Permission.PRODUCTION_EDIT)
  confirm(@Param('id') id: string, @Request() req: any) { return this.piService.confirm(id, req.user); }
}
