import { Controller, Get, Param, Res, UseGuards, Request } from '@nestjs/common';
import { Response } from 'express';
import { PdfEngineService } from './pdf-engine.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('pdf')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PdfEngineController {
  constructor(private readonly pdfService: PdfEngineService) {}

  @Get('purchase-order/:id')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  async poPdf(@Param('id') id: string, @Request() req: any, @Res() res: Response) {
    const pdf = await this.pdfService.generatePurchaseOrderPdf(id, req.user.companyId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="PO-${id}.pdf"`);
    res.send(pdf);
  }

  @Get('invoice/:id')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  async invoicePdf(@Param('id') id: string, @Request() req: any, @Res() res: Response) {
    const pdf = await this.pdfService.generateArInvoicePdf(id, req.user.companyId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="INV-${id}.pdf"`);
    res.send(pdf);
  }

  @Get('dispatch/:id')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  async dispatchPdf(@Param('id') id: string, @Request() req: any, @Res() res: Response) {
    const pdf = await this.pdfService.generateDispatchPdf(id, req.user.companyId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="CHALLAN-${id}.pdf"`);
    res.send(pdf);
  }

  @Get('ncr/:id')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  async ncrPdf(@Param('id') id: string, @Request() req: any, @Res() res: Response) {
    const pdf = await this.pdfService.generateNcrPdf(id, req.user.companyId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="NCR-${id}.pdf"`);
    res.send(pdf);
  }
}
