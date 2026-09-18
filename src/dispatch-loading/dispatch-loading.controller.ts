import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { DispatchLoadingService } from './dispatch-loading.service';
import { StartLoadingDto, LoadPackageDto, UnloadPackageDto } from './dto/dispatch-loading.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('dispatch-loading')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DispatchLoadingController {
  constructor(private readonly loadingService: DispatchLoadingService) {}

  @Get(':id')
  @RequirePermissions(Permission.DISPATCH_LOADING_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.loadingService.findOne(id, req.user);
  }

  @Post()
  @RequirePermissions(Permission.DISPATCH_LOADING_START)
  startLoading(@Body() dto: StartLoadingDto, @Request() req: any) {
    return this.loadingService.startLoading(dto.transportAssignmentId, dto.actualVehicleNumber, req.user);
  }

  @Post(':id/packages')
  @RequirePermissions(Permission.DISPATCH_LOADING_CONFIRM)
  loadPackage(@Param('id') id: string, @Body() dto: LoadPackageDto, @Request() req: any) {
    return this.loadingService.loadPackage(id, dto.packageId, dto.actualVehicleNumber, req.user);
  }

  @Post('items/:itemId/unload')
  @RequirePermissions(Permission.DISPATCH_LOADING_UNLOAD)
  unloadPackage(@Param('itemId') itemId: string, @Body() dto: UnloadPackageDto, @Request() req: any) {
    return this.loadingService.unloadPackage(itemId, dto.reason, req.user);
  }

  @Post(':id/complete')
  @RequirePermissions(Permission.DISPATCH_LOADING_COMPLETE)
  completeLoading(@Param('id') id: string, @Request() req: any) {
    return this.loadingService.completeLoading(id, req.user);
  }
}
