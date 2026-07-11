import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ImportOrderService } from './import-order.service';
import { CreateImportPoDto, UpdateImportPoDto, ImportPoItemDto } from './dto/import-order.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('import-orders')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ImportOrderController {
  constructor(private readonly importOrderService: ImportOrderService) {}

  @Get('stats')
  @RequirePermissions(Permission.PURCHASE_VIEW)
  getStats(@Request() req: any) { return this.importOrderService.getStats(req.user); }

  @Get()
  @RequirePermissions(Permission.PURCHASE_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.importOrderService.findAll(req.user, query); }

  @Get(':id')
  @RequirePermissions(Permission.PURCHASE_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.importOrderService.findOne(id, req.user); }

  @Post()
  @RequirePermissions(Permission.PURCHASE_CREATE)
  create(@Body() dto: CreateImportPoDto, @Request() req: any) { return this.importOrderService.create(dto, req.user); }

  @Put(':id')
  @RequirePermissions(Permission.PURCHASE_EDIT)
  update(@Param('id') id: string, @Body() dto: UpdateImportPoDto, @Request() req: any) { return this.importOrderService.update(id, dto, req.user); }

  @Post(':id/approve')
  @RequirePermissions(Permission.PURCHASE_APPROVE)
  approve(@Param('id') id: string, @Request() req: any) { return this.importOrderService.approve(id, req.user); }

  @Post(':id/status/:status')
  @RequirePermissions(Permission.PURCHASE_EDIT)
  updateStatus(@Param('id') id: string, @Param('status') status: string, @Request() req: any) { return this.importOrderService.updateStatus(id, status, req.user); }

  @Post(':id/cancel')
  @RequirePermissions(Permission.PURCHASE_EDIT)
  cancel(@Param('id') id: string, @Request() req: any) { return this.importOrderService.cancel(id, req.user); }

  @Post(':id/items')
  @RequirePermissions(Permission.PURCHASE_CREATE)
  addItem(@Param('id') id: string, @Body() dto: ImportPoItemDto, @Request() req: any) { return this.importOrderService.addItem(id, dto, req.user); }
}
