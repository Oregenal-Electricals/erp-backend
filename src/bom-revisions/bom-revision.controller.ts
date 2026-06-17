import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { BomRevisionService } from './bom-revision.service';
import { CreateBomRevisionDto } from './dto/bom-revision.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('bom-revisions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BomRevisionController {
  constructor(private readonly bomRevisionService: BomRevisionService) {}

  @Get('stats')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getStats(@Request() req: any) { return this.bomRevisionService.getStats(req.user); }

  @Get()
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.bomRevisionService.findAll(req.user, query); }

  @Get('product/:productId')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findByProduct(@Param('productId') productId: string, @Request() req: any) { return this.bomRevisionService.findByProduct(productId, req.user); }

  @Get(':id')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.bomRevisionService.findOne(id, req.user); }

  @Post()
  @RequirePermissions(Permission.INVENTORY_CREATE)
  create(@Body() dto: CreateBomRevisionDto, @Request() req: any) { return this.bomRevisionService.create(dto, req.user); }

  @Post(':id/approve')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  approve(@Param('id') id: string, @Request() req: any) { return this.bomRevisionService.approve(id, req.user); }
}
