import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';
import { ProductionMaterialReturnService } from './production-material-return.service';
import { CreateMaterialReturnDto } from './dto/material-return.dto';

@Controller('production/material-returns')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProductionMaterialReturnController {
  constructor(private service: ProductionMaterialReturnService) {}

  @Get('status/:workOrderId')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getPreviousMaterialStatus(@Param('workOrderId') workOrderId: string, @Request() req: any) {
    return this.service.getPreviousMaterialStatus(workOrderId, req.user);
  }

  @Post()
  @RequirePermissions(Permission.INVENTORY_CREATE)
  create(@Body() dto: CreateMaterialReturnDto, @Request() req: any) {
    return this.service.create(dto, req.user);
  }
}
