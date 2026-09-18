import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { DispatchTransportService } from './dispatch-transport.service';
import { CreateTransportAssignmentDto, AssignPackageDto, ReassignVehicleDto, CancelAssignmentDto } from './dto/dispatch-transport.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('dispatch-transport')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DispatchTransportController {
  constructor(private readonly transportService: DispatchTransportService) {}

  @Get(':id')
  @RequirePermissions(Permission.DISPATCH_TRANSPORT_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.transportService.findOne(id, req.user);
  }

  @Get(':id/ready-for-loading')
  @RequirePermissions(Permission.DISPATCH_TRANSPORT_VIEW)
  checkReadyForLoading(@Param('id') id: string, @Request() req: any) {
    return this.transportService.checkReadyForLoading(id, req.user);
  }

  @Post()
  @RequirePermissions(Permission.DISPATCH_TRANSPORT_ASSIGN)
  createAssignment(@Body() dto: CreateTransportAssignmentDto, @Request() req: any) {
    return this.transportService.createAssignment(dto, req.user);
  }

  @Post(':id/packages')
  @RequirePermissions(Permission.DISPATCH_TRANSPORT_ASSIGN)
  assignPackage(@Param('id') id: string, @Body() dto: AssignPackageDto, @Request() req: any) {
    return this.transportService.assignPackage(id, dto.packageId, req.user);
  }

  @Post(':id/packages/:packageId/unassign')
  @RequirePermissions(Permission.DISPATCH_TRANSPORT_REASSIGN)
  unassignPackage(@Param('id') id: string, @Param('packageId') packageId: string, @Request() req: any) {
    return this.transportService.unassignPackage(id, packageId, req.user);
  }

  @Post(':id/confirm')
  @RequirePermissions(Permission.DISPATCH_TRANSPORT_ASSIGN)
  confirmAssignment(@Param('id') id: string, @Request() req: any) {
    return this.transportService.confirmAssignment(id, req.user);
  }

  @Post(':id/reassign-vehicle')
  @RequirePermissions(Permission.DISPATCH_TRANSPORT_REASSIGN)
  reassignVehicle(@Param('id') id: string, @Body() dto: ReassignVehicleDto, @Request() req: any) {
    return this.transportService.reassignVehicle(id, dto, req.user);
  }

  @Post(':id/cancel')
  @RequirePermissions(Permission.DISPATCH_TRANSPORT_CANCEL)
  cancelAssignment(@Param('id') id: string, @Body() dto: CancelAssignmentDto, @Request() req: any) {
    return this.transportService.cancelAssignment(id, dto.reason, req.user);
  }
}
