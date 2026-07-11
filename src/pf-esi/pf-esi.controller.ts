import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { PfEsiService } from './pf-esi.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('pf-esi')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PfEsiController {
  constructor(private readonly pfEsiService: PfEsiService) {}

  @Get('rates')
  @RequirePermissions(Permission.HR_VIEW)
  getRates() { return this.pfEsiService.getStatutoryRates(); }

  @Get('pf-challan')
  @RequirePermissions(Permission.HR_VIEW)
  getPfChallan(@Query('month') month: string, @Query('year') year: string, @Request() req: any) {
    return this.pfEsiService.getPfChallan(Number(month), Number(year), req.user.companyId);
  }

  @Get('esi-challan')
  @RequirePermissions(Permission.HR_VIEW)
  getEsiChallan(@Query('month') month: string, @Query('year') year: string, @Request() req: any) {
    return this.pfEsiService.getEsiChallan(Number(month), Number(year), req.user.companyId);
  }

  @Get('pf-register')
  @RequirePermissions(Permission.HR_VIEW)
  getPfRegister(@Query('year') year: string, @Request() req: any) {
    return this.pfEsiService.getPfRegister(req.user.companyId, Number(year) || new Date().getFullYear());
  }

  @Get('esi-register')
  @RequirePermissions(Permission.HR_VIEW)
  getEsiRegister(@Query('year') year: string, @Request() req: any) {
    return this.pfEsiService.getEsiRegister(req.user.companyId, Number(year) || new Date().getFullYear());
  }
}
