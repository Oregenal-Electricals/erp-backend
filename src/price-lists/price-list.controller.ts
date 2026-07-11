import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { PriceListService } from './price-list.service';
import { CreatePriceListDto, UpdatePriceListDto, CreatePriceListItemDto, UpdatePriceListItemDto } from './dto/price-list.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('price-lists')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PriceListController {
  constructor(private readonly priceListService: PriceListService) {}

  @Get('stats')
  @RequirePermissions(Permission.PURCHASE_VIEW)
  getStats(@Request() req: any) { return this.priceListService.getStats(req.user); }

  @Get()
  @RequirePermissions(Permission.PURCHASE_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.priceListService.findAll(req.user, query); }

  @Get(':id')
  @RequirePermissions(Permission.PURCHASE_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.priceListService.findOne(id, req.user); }

  @Post()
  @RequirePermissions(Permission.PURCHASE_CREATE)
  create(@Body() dto: CreatePriceListDto, @Request() req: any) { return this.priceListService.create(dto, req.user); }

  @Put(':id')
  @RequirePermissions(Permission.PURCHASE_EDIT)
  update(@Param('id') id: string, @Body() dto: UpdatePriceListDto, @Request() req: any) { return this.priceListService.update(id, dto, req.user); }

  @Delete(':id')
  @RequirePermissions(Permission.PURCHASE_EDIT)
  remove(@Param('id') id: string, @Request() req: any) { return this.priceListService.remove(id, req.user); }

  @Post(':id/items')
  @RequirePermissions(Permission.PURCHASE_CREATE)
  addItem(@Param('id') id: string, @Body() dto: CreatePriceListItemDto, @Request() req: any) { return this.priceListService.addItem(id, dto, req.user); }

  @Put(':id/items/:itemId')
  @RequirePermissions(Permission.PURCHASE_EDIT)
  updateItem(@Param('id') id: string, @Param('itemId') itemId: string, @Body() dto: UpdatePriceListItemDto, @Request() req: any) { return this.priceListService.updateItem(id, itemId, dto, req.user); }

  @Post(':id/items/:itemId/approve')
  @RequirePermissions(Permission.PURCHASE_EDIT)
  approveItem(@Param('id') id: string, @Param('itemId') itemId: string, @Request() req: any) { return this.priceListService.approveItem(id, itemId, req.user); }

  @Delete(':id/items/:itemId')
  @RequirePermissions(Permission.PURCHASE_EDIT)
  removeItem(@Param('id') id: string, @Param('itemId') itemId: string, @Request() req: any) { return this.priceListService.removeItem(id, itemId, req.user); }
}
