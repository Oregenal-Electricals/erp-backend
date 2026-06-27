import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ShipmentService } from './shipment.service';
import { CreateShipmentDto, UpdateShipmentDto, AddContainerDto } from './dto/shipment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('shipments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ShipmentController {
  constructor(private readonly shipmentService: ShipmentService) {}

  @Get('stats')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getStats(@Request() req: any) { return this.shipmentService.getStats(req.user); }

  @Get()
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.shipmentService.findAll(req.user, query); }

  @Get('ipo/:ipoId')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findByIpo(@Param('ipoId') ipoId: string, @Request() req: any) { return this.shipmentService.findByIpo(ipoId, req.user); }

  @Get(':id')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.shipmentService.findOne(id, req.user); }

  @Post()
  @RequirePermissions(Permission.INVENTORY_CREATE)
  create(@Body() dto: CreateShipmentDto, @Request() req: any) { return this.shipmentService.create(dto, req.user); }

  @Put(':id')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  update(@Param('id') id: string, @Body() dto: UpdateShipmentDto, @Request() req: any) { return this.shipmentService.update(id, dto, req.user); }

  @Post(':id/depart')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  depart(@Param('id') id: string, @Request() req: any) { return this.shipmentService.depart(id, req.user); }

  @Post(':id/arrive')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  arrive(@Param('id') id: string, @Request() req: any) { return this.shipmentService.arrive(id, req.user); }

  @Post(':id/deliver')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  deliver(@Param('id') id: string, @Request() req: any) { return this.shipmentService.deliver(id, req.user); }

  @Post(':id/cancel')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  cancel(@Param('id') id: string, @Request() req: any) { return this.shipmentService.cancel(id, req.user); }

  @Post(':id/containers')
  @RequirePermissions(Permission.INVENTORY_CREATE)
  addContainer(@Param('id') id: string, @Body() dto: AddContainerDto, @Request() req: any) { return this.shipmentService.addContainer(id, dto, req.user); }
}
