import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { CapaService } from './capa.service';
import { CreateCapaDto, UpdateCapaDto, VerifyCapaDto } from './dto/capa.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('capa')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CapaController {
  constructor(private readonly capaService: CapaService) {}

  @Get('stats')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getStats(@Request() req: any) { return this.capaService.getStats(req.user); }

  @Get()
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.capaService.findAll(req.user, query); }

  @Get(':id')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.capaService.findOne(id, req.user); }

  @Post()
  @RequirePermissions(Permission.INVENTORY_CREATE)
  create(@Body() dto: CreateCapaDto, @Request() req: any) { return this.capaService.create(dto, req.user); }

  @Put(':id')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  update(@Param('id') id: string, @Body() dto: UpdateCapaDto, @Request() req: any) { return this.capaService.update(id, dto, req.user); }

  @Post(':id/verify')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  verify(@Param('id') id: string, @Body() dto: VerifyCapaDto, @Request() req: any) { return this.capaService.verify(id, dto, req.user); }
}
