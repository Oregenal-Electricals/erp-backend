import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';
import { GateMastersService } from './gate-masters.service';
import {
  CreateGateTypeDto, UpdateGateTypeDto, CreateGateDto, UpdateGateDto,
  CreateParkingAreaDto, UpdateParkingAreaDto, CreateParkingSlotDto, UpdateParkingSlotDto,
  CreateVisitPurposeDto, UpdateVisitPurposeDto,
  CreateGatePassTypeMasterDto, UpdateGatePassTypeMasterDto,
  CreateSecurityReasonDto, UpdateSecurityReasonDto,
} from './dto/gate-masters.dto';

@Controller('gate-masters')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class GateMastersController {
  constructor(private service: GateMastersService) {}

  // ---- Gate Types ----
  @Post('gate-types')
  @RequirePermissions(Permission.GATE_MASTER_MANAGE)
  createGateType(@Body() dto: CreateGateTypeDto, @Request() req: any) { return this.service.createGateType(dto, req.user); }
  @Get('gate-types')
  @RequirePermissions(Permission.GATE_MASTER_MANAGE)
  findAllGateTypes(@Request() req: any) { return this.service.findAllGateTypes(req.user); }
  @Put('gate-types/:id')
  @RequirePermissions(Permission.GATE_MASTER_MANAGE)
  updateGateType(@Param('id') id: string, @Body() dto: UpdateGateTypeDto, @Request() req: any) { return this.service.updateGateType(id, dto, req.user); }

  // ---- Gates ----
  @Post('gates')
  @RequirePermissions(Permission.GATE_MASTER_MANAGE)
  createGate(@Body() dto: CreateGateDto, @Request() req: any) { return this.service.createGate(dto, req.user); }
  @Get('gates')
  @RequirePermissions(Permission.GATE_DASHBOARD_VIEW)
  findAllGates(@Request() req: any, @Query('plantId') plantId?: string) { return this.service.findAllGates(req.user, plantId); }
  @Put('gates/:id')
  @RequirePermissions(Permission.GATE_MASTER_MANAGE)
  updateGate(@Param('id') id: string, @Body() dto: UpdateGateDto, @Request() req: any) { return this.service.updateGate(id, dto, req.user); }

  // ---- Parking Areas ----
  @Post('parking-areas')
  @RequirePermissions(Permission.PARKING_MANAGE)
  createParkingArea(@Body() dto: CreateParkingAreaDto, @Request() req: any) { return this.service.createParkingArea(dto, req.user); }
  @Get('parking-areas')
  @RequirePermissions(Permission.GATE_DASHBOARD_VIEW)
  findAllParkingAreas(@Request() req: any, @Query('plantId') plantId?: string) { return this.service.findAllParkingAreas(req.user, plantId); }
  @Put('parking-areas/:id')
  @RequirePermissions(Permission.PARKING_MANAGE)
  updateParkingArea(@Param('id') id: string, @Body() dto: UpdateParkingAreaDto, @Request() req: any) { return this.service.updateParkingArea(id, dto, req.user); }

  // ---- Parking Slots ----
  @Post('parking-slots')
  @RequirePermissions(Permission.PARKING_MANAGE)
  createParkingSlot(@Body() dto: CreateParkingSlotDto, @Request() req: any) { return this.service.createParkingSlot(dto, req.user); }
  @Get('parking-slots')
  @RequirePermissions(Permission.GATE_DASHBOARD_VIEW)
  findAllParkingSlots(@Request() req: any, @Query('parkingAreaId') parkingAreaId?: string) { return this.service.findAllParkingSlots(req.user, parkingAreaId); }
  @Put('parking-slots/:id')
  @RequirePermissions(Permission.PARKING_MANAGE)
  updateParkingSlot(@Param('id') id: string, @Body() dto: UpdateParkingSlotDto, @Request() req: any) { return this.service.updateParkingSlot(id, dto, req.user); }

  // ---- Visit Purposes ----
  @Post('visit-purposes')
  @RequirePermissions(Permission.GATE_MASTER_MANAGE)
  createVisitPurpose(@Body() dto: CreateVisitPurposeDto, @Request() req: any) { return this.service.createVisitPurpose(dto, req.user); }
  @Get('visit-purposes')
  @RequirePermissions(Permission.GATE_DASHBOARD_VIEW)
  findAllVisitPurposes(@Request() req: any) { return this.service.findAllVisitPurposes(req.user); }
  @Put('visit-purposes/:id')
  @RequirePermissions(Permission.GATE_MASTER_MANAGE)
  updateVisitPurpose(@Param('id') id: string, @Body() dto: UpdateVisitPurposeDto, @Request() req: any) { return this.service.updateVisitPurpose(id, dto, req.user); }

  // ---- Gate Pass Type Masters ----
  @Post('pass-types')
  @RequirePermissions(Permission.GATE_MASTER_MANAGE)
  createGatePassTypeMaster(@Body() dto: CreateGatePassTypeMasterDto, @Request() req: any) { return this.service.createGatePassTypeMaster(dto, req.user); }
  @Get('pass-types')
  @RequirePermissions(Permission.GATE_DASHBOARD_VIEW)
  findAllGatePassTypeMasters(@Request() req: any) { return this.service.findAllGatePassTypeMasters(req.user); }
  @Put('pass-types/:id')
  @RequirePermissions(Permission.GATE_MASTER_MANAGE)
  updateGatePassTypeMaster(@Param('id') id: string, @Body() dto: UpdateGatePassTypeMasterDto, @Request() req: any) { return this.service.updateGatePassTypeMaster(id, dto, req.user); }

  // ---- Security Reasons ----
  @Post('security-reasons')
  @RequirePermissions(Permission.GATE_MASTER_MANAGE)
  createSecurityReason(@Body() dto: CreateSecurityReasonDto, @Request() req: any) { return this.service.createSecurityReason(dto, req.user); }
  @Get('security-reasons')
  @RequirePermissions(Permission.GATE_DASHBOARD_VIEW)
  findAllSecurityReasons(@Request() req: any) { return this.service.findAllSecurityReasons(req.user); }
  @Put('security-reasons/:id')
  @RequirePermissions(Permission.GATE_MASTER_MANAGE)
  updateSecurityReason(@Param('id') id: string, @Body() dto: UpdateSecurityReasonDto, @Request() req: any) { return this.service.updateSecurityReason(id, dto, req.user); }
}
