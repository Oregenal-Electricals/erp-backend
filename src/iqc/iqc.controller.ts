import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IqcService } from './iqc.service';
import { IqcEscalationService } from './iqc-escalation.service';
import { IqcTemplateImportService } from './iqc-template-import.service';
import {
  CreateIqcDto, UpdateIqcItemsDto,
  CreateIqcCheckTemplateDto, UpdateIqcCheckTemplateDto,
  AttachTemplateDto, SubmitIqcStageResultDto, ConfirmTemplateImportDto,
} from './dto/iqc.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('iqc')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class IqcController {
  constructor(
    private readonly iqcService: IqcService,
    private readonly escalation: IqcEscalationService,
    private readonly templateImport: IqcTemplateImportService,
  ) {}

  @Get('stats')
  @RequirePermissions(Permission.QUALITY_VIEW)
  getStats(@Request() req: any) { return this.iqcService.getStats(req.user); }

  @Post('templates/import/parse')
  @RequirePermissions(Permission.QUALITY_CREATE)
  @UseInterceptors(FileInterceptor('file'))
  parseTemplateImport(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.templateImport.parseWorkbook(file);
  }

  @Post('templates/import/confirm')
  @RequirePermissions(Permission.QUALITY_CREATE)
  confirmTemplateImport(@Body() dto: ConfirmTemplateImportDto, @Request() req: any) {
    return this.templateImport.confirmImport(dto.templates, req.user);
  }

  @Get('templates')
  @RequirePermissions(Permission.QUALITY_VIEW)
  findAllTemplates(@Request() req: any, @Query() query: any) { return this.escalation.findAllTemplates(req.user, query); }

  @Get('templates/:id')
  @RequirePermissions(Permission.QUALITY_VIEW)
  findOneTemplate(@Param('id') id: string, @Request() req: any) { return this.escalation.findOneTemplate(id, req.user); }

  @Get('templates/:id/history')
  @RequirePermissions(Permission.QUALITY_VIEW)
  getVersionHistory(@Param('id') id: string, @Request() req: any) { return this.escalation.getVersionHistory(id, req.user); }

  @Post('templates')
  @RequirePermissions(Permission.QUALITY_CREATE)
  createTemplate(@Body() dto: CreateIqcCheckTemplateDto, @Request() req: any) { return this.escalation.createTemplate(dto, req.user); }

  @Put('templates/:id')
  @RequirePermissions(Permission.QUALITY_EDIT)
  updateTemplate(@Param('id') id: string, @Body() dto: UpdateIqcCheckTemplateDto, @Request() req: any) { return this.escalation.updateTemplate(id, dto, req.user); }

  @Post('templates/:id/clone')
  @RequirePermissions(Permission.QUALITY_CREATE)
  cloneTemplate(@Param('id') id: string, @Body('name') name: string, @Request() req: any) { return this.escalation.cloneTemplate(id, name, req.user); }

  @Get()
  @RequirePermissions(Permission.IQC_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.iqcService.findAll(req.user, query); }

  @Get('grn/:grnId')
  @RequirePermissions(Permission.QUALITY_VIEW)
  findByGrn(@Param('grnId') grnId: string, @Request() req: any) { return this.iqcService.findByGrn(grnId, req.user); }

  @Get(':id')
  @RequirePermissions(Permission.QUALITY_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.iqcService.findOne(id, req.user); }

  @Get('items/:itemId/escalation')
  @RequirePermissions(Permission.QUALITY_VIEW)
  getItemEscalationDetail(@Param('itemId') itemId: string, @Request() req: any) { return this.escalation.getItemEscalationDetail(itemId, req.user); }

  @Post()
  @RequirePermissions(Permission.QUALITY_CREATE)
  create(@Body() dto: CreateIqcDto, @Request() req: any) { return this.iqcService.create(dto, req.user); }

  @Put(':id/items')
  @RequirePermissions(Permission.QUALITY_EDIT)
  updateItems(@Param('id') id: string, @Body() dto: UpdateIqcItemsDto, @Request() req: any) { return this.iqcService.updateItems(id, dto, req.user); }

  @Post(':id/approve')
  @RequirePermissions(Permission.QUALITY_EDIT)
  approve(@Param('id') id: string, @Request() req: any) { return this.iqcService.approve(id, req.user); }

  @Post('items/:itemId/attach-template')
  @RequirePermissions(Permission.QUALITY_EDIT)
  attachTemplate(@Param('itemId') itemId: string, @Body() dto: AttachTemplateDto, @Request() req: any) { return this.escalation.attachTemplate(itemId, dto, req.user); }

  @Post('items/:itemId/stage-result')
  @RequirePermissions(Permission.QUALITY_EDIT)
  submitStageResult(@Param('itemId') itemId: string, @Body() dto: SubmitIqcStageResultDto, @Request() req: any) { return this.escalation.submitStageResult(itemId, dto, req.user); }
}
