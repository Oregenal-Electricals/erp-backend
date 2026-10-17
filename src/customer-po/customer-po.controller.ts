import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { CustomerPoService } from './customer-po.service';
import { CreateCpoDto, UpdateCpoDto, CancelCpoDto, ParseCpoSourceFileDto } from './dto/customer-po.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('customer-po')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CustomerPoController {
  constructor(private readonly cpoService: CustomerPoService) {}

  @Get('stats')
  @RequirePermissions(Permission.SALES_VIEW)
  getStats(@Request() req: any) { return this.cpoService.getStats(req.user); }

  @Get('shortages/open')
  @RequirePermissions(Permission.PURCHASE_VIEW)
  getAllOpenShortages(@Request() req: any) { return this.cpoService.getAllOpenShortages(req.user); }

  @Post('shortages/mark-raised')
  @RequirePermissions(Permission.PURCHASE_CREATE)
  markShortagesRaised(@Body() body: { items: { itemCode: string; qtyOrdered: number }[]; poId: string }, @Request() req: any) {
    return this.cpoService.markShortagesRaised(body.items, body.poId, req.user);
  }

  @Get()
  @RequirePermissions(Permission.CUSTOMER_PO_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.cpoService.findAll(req.user, query); }

  @Get(':id')
  @RequirePermissions(Permission.SALES_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.cpoService.findOne(id, req.user); }

  @Get(':id/shortages')
  @RequirePermissions(Permission.PURCHASE_VIEW)
  getShortages(@Param('id') id: string, @Request() req: any) { return this.cpoService.getShortages(id, req.user); }

  // Reads an uploaded PO file (before the CPO itself is saved) and
  // returns best-effort extracted fields for the create form to
  // pre-fill. Same SALES_CREATE permission as creating the CPO itself,
  // since this is just a step within that same action. Never persists
  // anything - the file is attached as proof via the existing Documents
  // module once the CPO has been created.
  @Post('parse-source-file')
  @RequirePermissions(Permission.SALES_CREATE)
  parseSourceFile(@Body() dto: ParseCpoSourceFileDto, @Request() req: any) { return this.cpoService.parseSourceFile(dto, req.user); }

  @Post()
  @RequirePermissions(Permission.SALES_CREATE)
  create(@Body() dto: CreateCpoDto, @Request() req: any) { return this.cpoService.create(dto, req.user); }

  @Put(':id')
  @RequirePermissions(Permission.SALES_EDIT)
  update(@Param('id') id: string, @Body() dto: UpdateCpoDto, @Request() req: any) { return this.cpoService.update(id, dto, req.user); }

  @Post(':id/acknowledge')
  @RequirePermissions(Permission.SALES_EDIT)
  acknowledge(@Param('id') id: string, @Request() req: any) { return this.cpoService.acknowledge(id, req.user); }

  @Post(':id/cancel')
  @RequirePermissions(Permission.SALES_EDIT)
  cancel(@Param('id') id: string, @Body() dto: CancelCpoDto, @Request() req: any) { return this.cpoService.cancel(id, dto, req.user); }

  @Post(':id/run-shortage-check')
  @RequirePermissions(Permission.SALES_EDIT)
  runShortageCheck(@Param('id') id: string, @Request() req: any) { return this.cpoService.runShortageCheck(id, req.user); }
}
