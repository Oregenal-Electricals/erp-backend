import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { SelectVendorsDto } from './dto/comparison.dto';

@Injectable()
export class QuotationComparisonService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async getMatrix(rfqId: string, user: any) {
    const rfq = await this.prisma.rfq.findFirst({
      where: { id: rfqId, companyId: user.companyId },
      include: {
        items: { where: { isActive: true }, orderBy: { createdAt: 'asc' } },
        vendors: { where: { isActive: true }, include: { vendor: { select: { id: true, code: true, name: true } } } },
      },
    });
    if (!rfq) throw new NotFoundException('RFQ not found');

    // Get all finalized quotations for this RFQ
    const quotations = await this.prisma.vendorQuotation.findMany({
      where: { rfqId, companyId: user.companyId, status: { in: ['SUBMITTED', 'FINALIZED'] } },
      include: {
        vendor: { select: { id: true, code: true, name: true } },
        items: { where: { isActive: true } },
      },
    });

    // Get existing selections
    const selections = await this.prisma.quotationComparison.findMany({
      where: { rfqId, companyId: user.companyId },
    });
    const selectionMap = Object.fromEntries(selections.map(s => [s.rfqItemId, s]));

    // Build comparison matrix
    const matrix = rfq.items.map(rfqItem => {
      const vendorPrices = quotations.map(q => {
        const qItem = q.items.find(i => i.rfqItemId === rfqItem.id);
        return {
          quotationId: q.id,
          quotationNumber: q.quotationNumber,
          vendorId: q.vendorId,
          vendorCode: q.vendor.code,
          vendorName: q.vendor.name,
          quotationItemId: qItem?.id || null,
          quotedQty: qItem?.quotedQty || null,
          unitPrice: qItem?.unitPrice || null,
          discount: qItem?.discount || 0,
          taxRate: qItem?.taxRate || 0,
          totalPrice: qItem?.totalPrice || null,
          deliveryDays: qItem?.deliveryDays || q.deliveryDays,
          hasQuote: !!qItem && qItem.unitPrice > 0,
        };
      });

      // Rank vendors by total price (L1, L2, L3)
      const ranked = [...vendorPrices]
        .filter(v => v.hasQuote && v.totalPrice !== null)
        .sort((a, b) => (a.totalPrice || 0) - (b.totalPrice || 0));

      const withRank = vendorPrices.map(v => ({
        ...v,
        rank: ranked.findIndex(r => r.vendorId === v.vendorId) + 1 || null,
      }));

      return {
        rfqItemId: rfqItem.id,
        itemCode: rfqItem.itemCode,
        itemName: rfqItem.itemName,
        uom: rfqItem.uom,
        requiredQty: rfqItem.requiredQty,
        vendors: withRank,
        selectedVendorId: selectionMap[rfqItem.id]?.selectedVendorId || null,
        selectedQuotationId: selectionMap[rfqItem.id]?.selectedQuotationId || null,
        selectionReason: selectionMap[rfqItem.id]?.selectionReason || null,
      };
    });

    return {
      rfq: { id: rfq.id, rfqNumber: rfq.rfqNumber, title: rfq.title, status: rfq.status },
      quotations: quotations.map(q => ({ id: q.id, quotationNumber: q.quotationNumber, vendorId: q.vendorId, vendorName: q.vendor.name, vendorCode: q.vendor.code, status: q.status, totalAmount: q.totalAmount, deliveryDays: q.deliveryDays })),
      matrix,
      totalQuotations: quotations.length,
      totalItems: rfq.items.length,
      selections: selectionMap,
    };
  }

  async selectVendors(rfqId: string, dto: SelectVendorsDto, user: any) {
    const rfq = await this.prisma.rfq.findFirst({ where: { id: rfqId, companyId: user.companyId } });
    if (!rfq) throw new NotFoundException('RFQ not found');

    const results = [];
    for (const sel of dto.selections) {
      const result = await this.prisma.quotationComparison.upsert({
        where: { companyId_rfqId_rfqItemId: { companyId: user.companyId, rfqId, rfqItemId: sel.rfqItemId } },
        create: {
          companyId: user.companyId, rfqId,
          rfqItemId: sel.rfqItemId,
          selectedVendorId: sel.selectedVendorId,
          selectedQuotationId: sel.selectedQuotationId,
          selectedItemId: sel.selectedItemId,
          selectionReason: sel.selectionReason,
          createdBy: user.id, updatedBy: user.id,
        },
        update: {
          selectedVendorId: sel.selectedVendorId,
          selectedQuotationId: sel.selectedQuotationId,
          selectedItemId: sel.selectedItemId,
          selectionReason: sel.selectionReason,
          updatedBy: user.id,
        },
      });
      results.push(result);
    }

    await this.audit.log({ tableName: 'quotation_comparisons', recordId: rfqId, action: 'UPDATE', newValues: results, changedBy: user.id });
    return { message: `${results.length} selections saved`, selections: results };
  }

  async getSummary(rfqId: string, user: any) {
    const selections = await this.prisma.quotationComparison.findMany({
      where: { rfqId, companyId: user.companyId, isActive: true },
      include: {
        selectedVendor: { select: { code: true, name: true } },
        selectedQuotation: { select: { quotationNumber: true, deliveryDays: true, paymentTerms: true } },
        rfqItem: { select: { itemCode: true, itemName: true, uom: true, requiredQty: true } },
      },
    });

    // Group by vendor
    const byVendor: Record<string, any> = {};
    for (const sel of selections) {
      const vendorId = sel.selectedVendorId;
      if (!byVendor[vendorId]) {
        byVendor[vendorId] = {
          vendorId,
          vendorCode: sel.selectedVendor.code,
          vendorName: sel.selectedVendor.name,
          quotationNumber: sel.selectedQuotation.quotationNumber,
          deliveryDays: sel.selectedQuotation.deliveryDays,
          paymentTerms: sel.selectedQuotation.paymentTerms,
          items: [],
        };
      }
      byVendor[vendorId].items.push({
        rfqItemId: sel.rfqItemId,
        itemCode: sel.rfqItem.itemCode,
        itemName: sel.rfqItem.itemName,
        uom: sel.rfqItem.uom,
        requiredQty: sel.rfqItem.requiredQty,
        selectionReason: sel.selectionReason,
      });
    }

    return {
      rfqId,
      totalSelections: selections.length,
      vendorSummary: Object.values(byVendor),
    };
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const total = await this.prisma.quotationComparison.count({ where });
    const rfqs = await this.prisma.quotationComparison.groupBy({ by: ['rfqId'], where });
    return { total, rfqsWithSelections: rfqs.length };
  }
}
