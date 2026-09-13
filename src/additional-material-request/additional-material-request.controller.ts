import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';
import { AdditionalMaterialRequestService } from './additional-material-request.service';
import { RequestAdditionalMaterialDto, DecideAdditionalMaterialDto } from './dto/additional-material-request.dto';

@Controller('production/additional-material-requests')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdditionalMaterialRequestController {
  constructor(private service: AdditionalMaterialRequestService) {}

  @Get('pending')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findPending(@Request() req: any) {
    return this.service.findPending(req.user);
  }

  @Get('work-order/:workOrderId')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findForWorkOrder(@Param('workOrderId') workOrderId: string, @Request() req: any) {
    return this.service.findForWorkOrder(workOrderId, req.user);
  }

  @Get('remaining/:workOrderId/:itemCode')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getOriginalRemaining(@Param('workOrderId') workOrderId: string, @Param('itemCode') itemCode: string, @Request() req: any) {
    return this.service.getOriginalRemaining(workOrderId, itemCode, req.user);
  }

  @Get(':id')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.service.findOne(id, req.user);
  }

  @Post()
  @RequirePermissions(Permission.ADDITIONAL_MATERIAL_REQUEST)
  request(@Body() dto: RequestAdditionalMaterialDto, @Request() req: any) {
    return this.service.request(dto, req.user);
  }

  @Post(':id/decide')
  @RequirePermissions(Permission.ADDITIONAL_MATERIAL_APPROVE)
  decide(@Param('id') id: string, @Body() dto: DecideAdditionalMaterialDto, @Request() req: any) {
    return this.service.decide(id, dto, req.user);
  }

  @Post(':id/revoke')
  @RequirePermissions(Permission.ADDITIONAL_MATERIAL_APPROVE)
  revoke(@Param('id') id: string, @Request() req: any) {
    return this.service.revoke(id, req.user);
  }
}
