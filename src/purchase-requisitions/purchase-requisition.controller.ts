import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { PurchaseRequisitionService } from './purchase-requisition.service';
import { CreatePurchaseRequisitionDto, UpdatePurchaseRequisitionDto, PrItemDto, RejectPrDto } from './dto/purchase-requisition.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('purchase-requisitions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PurchaseRequisitionController {
  constructor(private readonly prService: PurchaseRequisitionService) {}

  @Get('stats')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getStats(@Request() req: any) { return this.prService.getStats(req.user); }

  @Get()
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.prService.findAll(req.user, query); }

  @Get(':id')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.prService.findOne(id, req.user); }

  @Post()
  @RequirePermissions(Permission.INVENTORY_CREATE)
  create(@Body() dto: CreatePurchaseRequisitionDto, @Request() req: any) { return this.prService.create(dto, req.user); }

  @Put(':id')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  update(@Param('id') id: string, @Body() dto: UpdatePurchaseRequisitionDto, @Request() req: any) { return this.prService.update(id, dto, req.user); }

  @Post(':id/submit')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  submit(@Param('id') id: string, @Request() req: any) { return this.prService.submit(id, req.user); }

  @Post(':id/approve')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  approve(@Param('id') id: string, @Request() req: any) { return this.prService.approve(id, req.user); }

  @Post(':id/reject')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  reject(@Param('id') id: string, @Body() dto: RejectPrDto, @Request() req: any) { return this.prService.reject(id, dto, req.user); }

  @Post(':id/items')
  @RequirePermissions(Permission.INVENTORY_CREATE)
  addItem(@Param('id') id: string, @Body() dto: PrItemDto, @Request() req: any) { return this.prService.addItem(id, dto, req.user); }

  @Delete(':id/items/:itemId')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  removeItem(@Param('id') id: string, @Param('itemId') itemId: string, @Request() req: any) { return this.prService.removeItem(id, itemId, req.user); }
}
