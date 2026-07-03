import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request, Res } from '@nestjs/common';
import { Response } from 'express';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto, NewVersionDto } from './dto/document.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('documents')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DocumentsController {
  constructor(private readonly docsService: DocumentsService) {}

  @Get('stats')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getStats(@Request() req: any) { return this.docsService.getStats(req.user); }

  @Get()
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.docsService.findAll(req.user, query); }

  @Get(':id')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.docsService.findOne(id, req.user); }

  @Get(':id/download')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  async download(@Param('id') id: string, @Request() req: any, @Res() res: Response) {
    const { fileData, fileName, mimeType } = await this.docsService.download(id, req.user);
    const buffer = Buffer.from(fileData, 'base64');
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  }

  @Post()
  @RequirePermissions(Permission.INVENTORY_CREATE)
  create(@Body() dto: CreateDocumentDto, @Request() req: any) { return this.docsService.create(dto, req.user); }

  @Post('version')
  @RequirePermissions(Permission.INVENTORY_CREATE)
  createVersion(@Body() dto: NewVersionDto, @Request() req: any) { return this.docsService.createVersion(dto, req.user); }

  @Delete(':id')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  delete(@Param('id') id: string, @Request() req: any) { return this.docsService.delete(id, req.user); }
}
