import { Controller, Get, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { DebitNotesService } from './debit-notes.service';
import { UpdateDebitNoteStatusDto } from './dto/debit-note.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('debit-notes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DebitNotesController {
  constructor(private readonly service: DebitNotesService) {}

  @Get('stats')
  @RequirePermissions(Permission.DEBIT_NOTE_VIEW)
  getStats(@Request() req: any) { return this.service.getStats(req.user); }

  @Get('vendor/:vendorId')
  @RequirePermissions(Permission.DEBIT_NOTE_VIEW)
  findByVendor(@Param('vendorId') vendorId: string, @Request() req: any) { return this.service.findByVendor(vendorId, req.user); }

  @Get()
  @RequirePermissions(Permission.DEBIT_NOTE_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.service.findAll(req.user, query); }

  @Get(':id')
  @RequirePermissions(Permission.DEBIT_NOTE_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.service.findOne(id, req.user); }

  @Put(':id/status')
  @RequirePermissions(Permission.DEBIT_NOTE_MANAGE)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateDebitNoteStatusDto, @Request() req: any) { return this.service.updateStatus(id, dto, req.user); }
}
