import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { RoutingService } from './routing.service';
import { CreateRoutingDto, StartProductionDto } from './dto/routing.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('routing')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RoutingController {
  constructor(private readonly routingService: RoutingService) {}

  @Get()
  @RequirePermissions(Permission.PRODUCTION_VIEW)
  findAll(@Request() req: any) { return this.routingService.findAll(req.user); }

  @Get(':id')
  @RequirePermissions(Permission.PRODUCTION_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.routingService.findOne(id, req.user); }

  @Get('chain/:routingGroupId')
  @RequirePermissions(Permission.PRODUCTION_VIEW)
  getChain(@Param('routingGroupId') routingGroupId: string, @Request() req: any) { return this.routingService.getChain(routingGroupId, req.user); }

  @Post()
  @RequirePermissions(Permission.PRODUCTION_CREATE)
  create(@Body() dto: CreateRoutingDto, @Request() req: any) { return this.routingService.createRouting(dto, req.user); }

  @Post('start-production')
  @RequirePermissions(Permission.PRODUCTION_CREATE)
  startProduction(@Body() dto: StartProductionDto, @Request() req: any) { return this.routingService.startProduction(dto, req.user); }
}
