import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { TdsService } from './tds.service';
import { SaveDeclarationDto } from './dto/tds.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('tds')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TdsController {
  constructor(private readonly tdsService: TdsService) {}

  @Get()
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getAll(@Request() req: any, @Query() query: any) { return this.tdsService.getAllDeclarations(req.user, query); }

  @Get('challan')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getChallan(@Query('month') month: string, @Query('year') year: string, @Request() req: any) {
    return this.tdsService.getTdsChallan(Number(month), Number(year), req.user);
  }

  @Get('register')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getRegister(@Query('financialYear') fy: string, @Request() req: any) {
    return this.tdsService.getTdsRegister(req.user.companyId, fy || `${new Date().getFullYear()-1}-${String(new Date().getFullYear()).slice(-2)}`);
  }

  @Get('form16/:employeeId')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getForm16(@Param('employeeId') empId: string, @Query('financialYear') fy: string, @Request() req: any) {
    return this.tdsService.getForm16Summary(empId, fy, req.user);
  }

  @Get(':employeeId')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getDeclaration(@Param('employeeId') empId: string, @Query('financialYear') fy: string, @Request() req: any) {
    return this.tdsService.getDeclaration(empId, fy, req.user);
  }

  @Post('declaration')
  @RequirePermissions(Permission.INVENTORY_CREATE)
  saveDeclaration(@Body() dto: SaveDeclarationDto, @Request() req: any) { return this.tdsService.saveDeclaration(dto, req.user); }
}
