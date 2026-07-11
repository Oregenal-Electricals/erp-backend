import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { NcrService } from './ncr.service';
import { CreateNcrDto, UpdateNcrDto } from './dto/ncr.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('ncr')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class NcrController {
  constructor(private readonly ncrService: NcrService) {}

  @Get('stats')
  @RequirePermissions(Permission.QUALITY_VIEW)
  getStats(@Request() req: any) { return this.ncrService.getStats(req.user); }

  @Get()
  @RequirePermissions(Permission.QUALITY_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.ncrService.findAll(req.user, query); }

  @Get(':id')
  @RequirePermissions(Permission.QUALITY_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.ncrService.findOne(id, req.user); }

  @Post()
  @RequirePermissions(Permission.QUALITY_CREATE)
  create(@Body() dto: CreateNcrDto, @Request() req: any) { return this.ncrService.create(dto, req.user); }

  @Put(':id')
  @RequirePermissions(Permission.QUALITY_EDIT)
  update(@Param('id') id: string, @Body() dto: UpdateNcrDto, @Request() req: any) { return this.ncrService.update(id, dto, req.user); }

  @Post(':id/close')
  @RequirePermissions(Permission.QUALITY_EDIT)
  close(@Param('id') id: string, @Request() req: any) { return this.ncrService.close(id, req.user); }
}
