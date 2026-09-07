import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';
import { ProductTargetService } from './product-target.service';
import { CreateProductTargetDto, ReviseProductTargetDto } from './dto/product-target.dto';

@Controller('production/targets')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProductTargetController {
  constructor(private service: ProductTargetService) {}

  @Get()
  @RequirePermissions(Permission.PRODUCTION_TARGET_VIEW)
  findAll(@Request() req: any, @Query() query: any) {
    return this.service.findAll(req.user, query);
  }

  @Get('product/:productId')
  @RequirePermissions(Permission.PRODUCTION_TARGET_VIEW)
  findByProduct(@Param('productId') productId: string, @Request() req: any) {
    return this.service.findByProduct(productId, req.user);
  }

  @Get('product/:productId/current')
  @RequirePermissions(Permission.PRODUCTION_TARGET_VIEW)
  findCurrent(@Param('productId') productId: string, @Request() req: any) {
    return this.service.findCurrent(productId, req.user);
  }

  @Post()
  @RequirePermissions(Permission.PRODUCTION_TARGET_MANAGE)
  create(@Body() dto: CreateProductTargetDto, @Request() req: any) {
    return this.service.create(dto, req.user);
  }

  @Post('product/:productId/revise')
  @RequirePermissions(Permission.PRODUCTION_TARGET_MANAGE)
  revise(@Param('productId') productId: string, @Body() dto: ReviseProductTargetDto, @Request() req: any) {
    return this.service.revise(productId, dto, req.user);
  }
}
