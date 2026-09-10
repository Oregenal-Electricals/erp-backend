import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';
import { GrnDiscrepancyService } from './grn-discrepancy.service';
import { RaiseDiscrepancyDto, CorrectDiscrepancyDto } from './dto/grn-discrepancy.dto';

@Controller('grn-discrepancies')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class GrnDiscrepancyController {
  constructor(private service: GrnDiscrepancyService) {}

  @Get()
  @RequirePermissions(Permission.GRN_DISCREPANCY_VIEW)
  findAll(@Request() req: any, @Query() query: any) {
    return this.service.findAll(req.user, query);
  }

  @Get(':id')
  @RequirePermissions(Permission.GRN_DISCREPANCY_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.service.findOne(id, req.user);
  }

  @Post('grn-item/:grnItemId')
  @RequirePermissions(Permission.GRN_DISCREPANCY_CREATE)
  raise(@Param('grnItemId') grnItemId: string, @Body() dto: RaiseDiscrepancyDto, @Request() req: any) {
    return this.service.raise(grnItemId, dto, req.user);
  }

  @Post(':id/correct')
  @RequirePermissions(Permission.GRN_DISCREPANCY_CORRECT)
  correct(@Param('id') id: string, @Body() dto: CorrectDiscrepancyDto, @Request() req: any) {
    return this.service.correct(id, dto, req.user);
  }
}
