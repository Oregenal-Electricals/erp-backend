import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { PoAmendmentService } from './po-amendment.service';
import { CreatePoAmendmentDto, RejectAmendmentDto } from './dto/po-amendment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('po-amendments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PoAmendmentController {
  constructor(private readonly poAmendmentService: PoAmendmentService) {}

  @Get('stats')
  @RequirePermissions(Permission.PURCHASE_VIEW)
  getStats(@Request() req: any) { return this.poAmendmentService.getStats(req.user); }

  @Get()
  @RequirePermissions(Permission.PURCHASE_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.poAmendmentService.findAll(req.user, query); }

  @Get('po/:poId')
  @RequirePermissions(Permission.PURCHASE_VIEW)
  findByPo(@Param('poId') poId: string, @Request() req: any) { return this.poAmendmentService.findByPo(poId, req.user); }

  @Get(':id')
  @RequirePermissions(Permission.PURCHASE_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.poAmendmentService.findOne(id, req.user); }

  @Post()
  @RequirePermissions(Permission.PURCHASE_CREATE)
  create(@Body() dto: CreatePoAmendmentDto, @Request() req: any) { return this.poAmendmentService.create(dto, req.user); }

  @Post(':id/submit')
  @RequirePermissions(Permission.PURCHASE_APPROVE)
  submit(@Param('id') id: string, @Request() req: any) { return this.poAmendmentService.submit(id, req.user); }

  @Post(':id/approve')
  @RequirePermissions(Permission.PURCHASE_APPROVE)
  approve(@Param('id') id: string, @Request() req: any) { return this.poAmendmentService.approve(id, req.user); }

  @Post(':id/reject')
  @RequirePermissions(Permission.PURCHASE_APPROVE)
  reject(@Param('id') id: string, @Body() dto: RejectAmendmentDto, @Request() req: any) { return this.poAmendmentService.reject(id, dto, req.user); }
}
