import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { StockPutawayService } from './stock-putaway.service';
import { CreatePutawayDto, UpdatePutawayItemsDto } from './dto/stock-putaway.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('stock-putaway')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StockPutawayController {
  constructor(private readonly spService: StockPutawayService) {}

  @Get('stats')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getStats(@Request() req: any) { return this.spService.getStats(req.user); }

  @Get()
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.spService.findAll(req.user, query); }

  @Get(':id')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.spService.findOne(id, req.user); }

  @Post()
  @RequirePermissions(Permission.INVENTORY_CREATE)
  create(@Body() dto: CreatePutawayDto, @Request() req: any) { return this.spService.create(dto, req.user); }

  @Put(':id/items')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  updateItems(@Param('id') id: string, @Body() dto: UpdatePutawayItemsDto, @Request() req: any) { return this.spService.updateItems(id, dto, req.user); }

  @Post(':id/complete')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  complete(@Param('id') id: string, @Request() req: any) { return this.spService.complete(id, req.user); }
}
