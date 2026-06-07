import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('products')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get('stats')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getStats(@Request() req: any) {
    return this.productService.getStats(req.user);
  }

  @Get()
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findAll(@Request() req: any, @Query() query: any) {
    return this.productService.findAll(req.user, query);
  }

  @Get(':id')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.productService.findOne(id, req.user);
  }

  @Post()
  @RequirePermissions(Permission.INVENTORY_CREATE)
  create(@Body() dto: CreateProductDto, @Request() req: any) {
    return this.productService.create(dto, req.user);
  }

  @Put(':id')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  update(@Param('id') id: string, @Body() dto: UpdateProductDto, @Request() req: any) {
    return this.productService.update(id, dto, req.user);
  }

  @Delete(':id')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  remove(@Param('id') id: string, @Request() req: any) {
    return this.productService.remove(id, req.user);
  }
}
