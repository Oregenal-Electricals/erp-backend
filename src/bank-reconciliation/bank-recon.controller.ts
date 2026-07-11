import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { BankReconService } from './bank-recon.service';
import { CreateBankStatementDto, ReconcileLineDto } from './dto/bank-recon.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('bank-reconciliation')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BankReconController {
  constructor(private readonly bankReconService: BankReconService) {}

  @Get('stats')
  @RequirePermissions(Permission.FINANCE_VIEW)
  getStats(@Request() req: any) { return this.bankReconService.getStats(req.user); }

  @Get('bank-accounts')
  @RequirePermissions(Permission.FINANCE_VIEW)
  getBankAccounts(@Request() req: any) { return this.bankReconService.getBankAccounts(req.user); }

  @Get('suggestions/:lineId')
  @RequirePermissions(Permission.FINANCE_VIEW)
  getSuggestions(@Param('lineId') lineId: string, @Request() req: any) { return this.bankReconService.getSuggestions(lineId, req.user); }

  @Get()
  @RequirePermissions(Permission.FINANCE_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.bankReconService.findAll(req.user, query); }

  @Get(':id')
  @RequirePermissions(Permission.FINANCE_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.bankReconService.findOne(id, req.user); }

  @Post()
  @RequirePermissions(Permission.FINANCE_CREATE)
  create(@Body() dto: CreateBankStatementDto, @Request() req: any) { return this.bankReconService.create(dto, req.user); }

  @Post('reconcile')
  @RequirePermissions(Permission.FINANCE_EDIT)
  reconcile(@Body() dto: ReconcileLineDto, @Request() req: any) { return this.bankReconService.reconcileLine(dto, req.user); }

  @Post('unreconcile/:lineId')
  @RequirePermissions(Permission.FINANCE_EDIT)
  unreconcile(@Param('lineId') lineId: string, @Request() req: any) { return this.bankReconService.unreconcileLine(lineId, req.user); }
}
