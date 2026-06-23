import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { PurchaseOrderService } from './purchase-order.service';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto, PoItemDto, UpdatePoItemDto } from './dto/purchase-order.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('purchase-orders')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PurchaseOrderController {
  constructor(private readonly poService: PurchaseOrderService) {}

  @Get('stats')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getStats(@Request() req: any) { return this.poService.getStats(req.user); }

  @Get()
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.poService.findAll(req.user, query); }

  @Get('vendor/:vendorId')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findByVendor(@Param('vendorId') vendorId: string, @Request() req: any) { return this.poService.findByVendor(vendorId, req.user); }

  @Get(':id')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.poService.findOne(id, req.user); }

  @Post()
  @RequirePermissions(Permission.INVENTORY_CREATE)
  create(@Body() dto: CreatePurchaseOrderDto, @Request() req: any) { return this.poService.create(dto, req.user); }

  @Put(':id')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  update(@Param('id') id: string, @Body() dto: UpdatePurchaseOrderDto, @Request() req: any) { return this.poService.update(id, dto, req.user); }

  @Post(':id/approve')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  approve(@Param('id') id: string, @Request() req: any) { return this.poService.approve(id, req.user); }

  @Post(':id/send')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  send(@Param('id') id: string, @Request() req: any) { return this.poService.send(id, req.user); }

  @Post(':id/cancel')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  cancel(@Param('id') id: string, @Request() req: any) { return this.poService.cancel(id, req.user); }

  @Post(':id/items')
  @RequirePermissions(Permission.INVENTORY_CREATE)
  addItem(@Param('id') id: string, @Body() dto: PoItemDto, @Request() req: any) { return this.poService.addItem(id, dto, req.user); }

  @Put(':id/items/:itemId')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  updateItem(@Param('id') id: string, @Param('itemId') itemId: string, @Body() dto: UpdatePoItemDto, @Request() req: any) { return this.poService.updateItem(id, itemId, dto, req.user); }

  @Delete(':id/items/:itemId')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  removeItem(@Param('id') id: string, @Param('itemId') itemId: string, @Request() req: any) { return this.poService.removeItem(id, itemId, req.user); }
}
