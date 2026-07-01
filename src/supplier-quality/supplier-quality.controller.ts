import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { SupplierQualityService } from './supplier-quality.service';
import { CreateSupplierRatingDto, CreateCarDto, RespondCarDto, VerifyCarDto } from './dto/supplier-quality.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('supplier-quality')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SupplierQualityController {
  constructor(private readonly sqService: SupplierQualityService) {}

  @Get('stats')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getStats(@Request() req: any) { return this.sqService.getStats(req.user); }

  @Get('ratings')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getRatings(@Request() req: any, @Query() query: any) { return this.sqService.getRatings(req.user, query); }

  @Get('scorecard/:vendorId')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getScorecard(@Param('vendorId') vendorId: string, @Request() req: any) { return this.sqService.getVendorScorecard(vendorId, req.user); }

  @Post('ratings')
  @RequirePermissions(Permission.INVENTORY_CREATE)
  generateRating(@Body() dto: CreateSupplierRatingDto, @Request() req: any) { return this.sqService.generateRating(dto, req.user); }

  @Get('cars')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getCars(@Request() req: any, @Query() query: any) { return this.sqService.getCars(req.user, query); }

  @Post('cars')
  @RequirePermissions(Permission.INVENTORY_CREATE)
  createCar(@Body() dto: CreateCarDto, @Request() req: any) { return this.sqService.createCar(dto, req.user); }

  @Post('cars/:id/respond')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  respondCar(@Param('id') id: string, @Body() dto: RespondCarDto, @Request() req: any) { return this.sqService.respondCar(id, dto, req.user); }

  @Post('cars/:id/verify')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  verifyCar(@Param('id') id: string, @Body() dto: VerifyCarDto, @Request() req: any) { return this.sqService.verifyCar(id, dto, req.user); }

  @Post('cars/:id/close')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  closeCar(@Param('id') id: string, @Request() req: any) { return this.sqService.closeCar(id, req.user); }
}
