import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { CostSheetService } from './cost-sheet.service';
import { UpdateCostSheetDto } from './dto/cost-sheet.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('production-cost-sheets')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CostSheetController {
  constructor(private readonly csService: CostSheetService) {}

  @Get('stats')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getStats(@Request() req: any) { return this.csService.getStats(req.user); }

  @Get()
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.csService.findAll(req.user, query); }

  @Get(':id')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.csService.findOne(id, req.user); }

  @Post('generate/:woId')
  @RequirePermissions(Permission.INVENTORY_CREATE)
  generate(@Param('woId') woId: string, @Request() req: any) { return this.csService.generateFromWo(woId, req.user); }

  @Put(':id')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  update(@Param('id') id: string, @Body() dto: UpdateCostSheetDto, @Request() req: any) { return this.csService.update(id, dto, req.user); }

  @Post(':id/finalize')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  finalize(@Param('id') id: string, @Request() req: any) { return this.csService.finalize(id, req.user); }
}
