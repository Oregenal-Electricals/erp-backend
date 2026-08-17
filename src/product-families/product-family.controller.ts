import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ProductFamilyService } from './product-family.service';
import { CreateProductFamilyDto, UpdateProductFamilyDto, AssignProductsToFamilyDto } from './dto/product-family.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('product-families')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProductFamilyController {
  constructor(private readonly productFamilyService: ProductFamilyService) {}

  @Get()
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findAll(@Request() req: any, @Query() query: any) {
    return this.productFamilyService.findAll(req.user, query);
  }

  @Get(':id')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.productFamilyService.findOne(id, req.user);
  }

  @Post()
  @RequirePermissions(Permission.INVENTORY_CREATE)
  create(@Body() dto: CreateProductFamilyDto, @Request() req: any) {
    return this.productFamilyService.create(dto, req.user);
  }

  @Put(':id')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  update(@Param('id') id: string, @Body() dto: UpdateProductFamilyDto, @Request() req: any) {
    return this.productFamilyService.update(id, dto, req.user);
  }

  @Delete(':id')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  remove(@Param('id') id: string, @Request() req: any) {
    return this.productFamilyService.remove(id, req.user);
  }

  @Post(':id/products')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  assignProducts(@Param('id') id: string, @Body() dto: AssignProductsToFamilyDto, @Request() req: any) {
    return this.productFamilyService.assignProducts(id, dto, req.user);
  }

  @Delete('products/:productId')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  removeProduct(@Param('productId') productId: string, @Request() req: any) {
    return this.productFamilyService.removeProduct(productId, req.user);
  }
}
