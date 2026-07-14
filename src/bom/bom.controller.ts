import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { BomService } from './bom.service';
import { CreateBomDto, UpdateBomDto, CreateBomItemDto, UpdateBomItemDto } from './dto/bom.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('boms')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BomController {
  constructor(private readonly bomService: BomService) {}

  @Get('stats')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getStats(@Request() req: any) { return this.bomService.getStats(req.user); }

  @Get()
  @RequirePermissions(Permission.BOM_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.bomService.findAll(req.user, query); }

  @Get('product/:productId')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findByProduct(@Param('productId') productId: string, @Request() req: any) { return this.bomService.findByProduct(productId, req.user); }

  @Get(':id')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.bomService.findOne(id, req.user); }

  @Post()
  @RequirePermissions(Permission.INVENTORY_CREATE)
  create(@Body() dto: CreateBomDto, @Request() req: any) { return this.bomService.create(dto, req.user); }

  @Put(':id')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  update(@Param('id') id: string, @Body() dto: UpdateBomDto, @Request() req: any) { return this.bomService.update(id, dto, req.user); }

  @Delete(':id')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  remove(@Param('id') id: string, @Request() req: any) { return this.bomService.remove(id, req.user); }

  @Post(':id/approve')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  approve(@Param('id') id: string, @Request() req: any) { return this.bomService.approve(id, req.user); }

  @Post(':id/obsolete')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  obsolete(@Param('id') id: string, @Request() req: any) { return this.bomService.obsolete(id, req.user); }

  @Post(':id/clone')
  @RequirePermissions(Permission.INVENTORY_CREATE)
  clone(@Param('id') id: string, @Request() req: any) { return this.bomService.clone(id, req.user); }

  @Post(':id/items')
  @RequirePermissions(Permission.INVENTORY_CREATE)
  addItem(@Param('id') id: string, @Body() dto: CreateBomItemDto, @Request() req: any) { return this.bomService.addItem(id, dto, req.user); }

  @Put(':id/items/:itemId')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  updateItem(@Param('id') id: string, @Param('itemId') itemId: string, @Body() dto: UpdateBomItemDto, @Request() req: any) { return this.bomService.updateItem(id, itemId, dto, req.user); }

  @Delete(':id/items/:itemId')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  removeItem(@Param('id') id: string, @Param('itemId') itemId: string, @Request() req: any) { return this.bomService.removeItem(id, itemId, req.user); }
}
