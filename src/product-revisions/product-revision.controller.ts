import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ProductRevisionService } from './product-revision.service';
import { CreateProductRevisionDto, UpdateProductRevisionDto } from './dto/product-revision.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('product-revisions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProductRevisionController {
  constructor(private readonly productRevisionService: ProductRevisionService) {}

  @Get('stats')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getStats(@Request() req: any) { return this.productRevisionService.getStats(req.user); }

  @Get()
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.productRevisionService.findAll(req.user, query); }

  @Get('product/:productId')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findByProduct(@Param('productId') productId: string, @Request() req: any) { return this.productRevisionService.findByProduct(productId, req.user); }

  @Get(':id')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.productRevisionService.findOne(id, req.user); }

  @Post()
  @RequirePermissions(Permission.INVENTORY_CREATE)
  create(@Body() dto: CreateProductRevisionDto, @Request() req: any) { return this.productRevisionService.create(dto, req.user); }

  @Put(':id')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  update(@Param('id') id: string, @Body() dto: UpdateProductRevisionDto, @Request() req: any) { return this.productRevisionService.update(id, dto, req.user); }

  @Post(':id/approve')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  approve(@Param('id') id: string, @Request() req: any) { return this.productRevisionService.approve(id, req.user); }

  @Post(':id/obsolete')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  obsolete(@Param('id') id: string, @Request() req: any) { return this.productRevisionService.obsolete(id, req.user); }
}
