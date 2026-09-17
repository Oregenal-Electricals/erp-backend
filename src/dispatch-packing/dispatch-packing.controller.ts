import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { DispatchPackingService } from './dispatch-packing.service';
import { CreatePackingDto, CreatePackageDto, AddPackageItemDto, ReversePackageItemDto } from './dto/dispatch-packing.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('dispatch-packing')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DispatchPackingController {
  constructor(private readonly dpService: DispatchPackingService) {}

  @Get(':id')
  @RequirePermissions(Permission.DISPATCH_PACK_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.dpService.findOne(id, req.user);
  }

  @Post()
  @RequirePermissions(Permission.DISPATCH_PACK_CREATE)
  createPacking(@Body() dto: CreatePackingDto, @Request() req: any) {
    return this.dpService.createPacking(dto.verificationId, req.user);
  }

  @Post(':packingId/packages')
  @RequirePermissions(Permission.DISPATCH_PACK_CREATE)
  createPackage(@Param('packingId') packingId: string, @Body() dto: CreatePackageDto, @Request() req: any) {
    return this.dpService.createPackage(packingId, req.user, dto.packageType, dto.netWeight, dto.grossWeight);
  }

  @Post('packages/:packageId/items')
  @RequirePermissions(Permission.DISPATCH_PACK_CONFIRM)
  addPackageItem(@Param('packageId') packageId: string, @Body() dto: AddPackageItemDto, @Request() req: any) {
    return this.dpService.addPackageItem(packageId, dto.verificationItemId, dto.packedQty, req.user);
  }

  @Post('package-items/:packageItemId/reverse')
  @RequirePermissions(Permission.DISPATCH_PACK_REVERSE)
  reversePackageItem(@Param('packageItemId') packageItemId: string, @Body() dto: ReversePackageItemDto, @Request() req: any) {
    return this.dpService.reversePackageItem(packageItemId, dto.reverseQty, dto.reason, req.user);
  }
}
