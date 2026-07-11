import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { GstService } from './gst.service';
import { GenerateGstReturnDto, FileGstReturnDto } from './dto/gst.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('gst')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class GstController {
  constructor(private readonly gstService: GstService) {}

  @Get('dashboard')
  @RequirePermissions(Permission.FINANCE_VIEW)
  getDashboard(@Request() req: any, @Query('period') period?: string) { return this.gstService.getDashboard(req.user, period); }

  @Get('gstr1')
  @RequirePermissions(Permission.FINANCE_VIEW)
  getGstr1(@Request() req: any, @Query('period') period: string) { return this.gstService.getGstr1(req.user, period); }

  @Get('gstr3b')
  @RequirePermissions(Permission.FINANCE_VIEW)
  getGstr3b(@Request() req: any, @Query('period') period: string) { return this.gstService.getGstr3b(req.user, period); }

  @Get('returns')
  @RequirePermissions(Permission.FINANCE_VIEW)
  findAll(@Request() req: any) { return this.gstService.findAll(req.user); }

  @Post('returns/generate')
  @RequirePermissions(Permission.FINANCE_CREATE)
  generate(@Body() dto: GenerateGstReturnDto, @Request() req: any) { return this.gstService.generateReturn(dto, req.user); }

  @Post('returns/:id/file')
  @RequirePermissions(Permission.FINANCE_EDIT)
  file(@Param('id') id: string, @Body() dto: FileGstReturnDto, @Request() req: any) { return this.gstService.fileReturn(id, dto, req.user); }
}
