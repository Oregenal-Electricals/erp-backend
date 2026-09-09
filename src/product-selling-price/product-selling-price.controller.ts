import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';
import { ProductSellingPriceService } from './product-selling-price.service';
import { CreateSellingPriceDto, ReviseSellingPriceDto } from './dto/product-selling-price.dto';

@Controller('products/selling-prices')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProductSellingPriceController {
  constructor(private service: ProductSellingPriceService) {}

  @Get()
  @RequirePermissions(Permission.PRODUCT_SELLING_PRICE_VIEW)
  findAll(@Request() req: any, @Query() query: any) {
    return this.service.findAll(req.user, query);
  }

  @Get('product/:productId')
  @RequirePermissions(Permission.PRODUCT_SELLING_PRICE_VIEW)
  findByProduct(@Param('productId') productId: string, @Request() req: any) {
    return this.service.findByProduct(productId, req.user);
  }

  @Get('product/:productId/current')
  @RequirePermissions(Permission.PRODUCT_SELLING_PRICE_VIEW)
  findCurrent(@Param('productId') productId: string, @Request() req: any) {
    return this.service.findCurrent(productId, req.user);
  }

  @Post()
  @RequirePermissions(Permission.PRODUCT_SELLING_PRICE_MANAGE)
  create(@Body() dto: CreateSellingPriceDto, @Request() req: any) {
    return this.service.create(dto, req.user);
  }

  @Post('product/:productId/revise')
  @RequirePermissions(Permission.PRODUCT_SELLING_PRICE_MANAGE)
  revise(@Param('productId') productId: string, @Body() dto: ReviseSellingPriceDto, @Request() req: any) {
    return this.service.revise(productId, dto, req.user);
  }
}
