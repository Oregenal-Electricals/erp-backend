import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VendorPortalService {
  constructor(private prisma: PrismaService) {}

  async getVendorDashboard(vendorId: string, companyId: string) {
    const vendor = await this.prisma.vendor.findFirst({ where: { id: vendorId, companyId } });
    if (!vendor) throw new NotFoundException('Vendor not found');

    const [openPOs, pendingRFQs, totalPOs, recentPOs] = await Promise.all([
      this.prisma.purchaseOrder.count({ where: { companyId, vendorId, status: { in: ['APPROVED','SENT'] } } }),
      this.prisma.rfq.count({ where: { companyId, status: 'SENT' } }),
      this.prisma.purchaseOrder.count({ where: { companyId, vendorId } }),
      this.prisma.purchaseOrder.findMany({
        where: { companyId, vendorId },
        take: 5, orderBy: { createdAt: 'desc' },
        select: { id: true, poNumber: true, totalAmount: true, status: true, createdAt: true },
      }),
    ]);

    return { vendor: { name: vendor.name, code: vendor.code, email: vendor.email }, stats: { openPOs, pendingRFQs, totalPOs }, recentPOs };
  }

  async getVendorPOs(vendorId: string, companyId: string, query: any) {
    const { status, page = 1, limit = 20 } = query;
    const skip = (Number(page)-1)*Number(limit);
    const where: any = { companyId, vendorId, isActive: true };
    if (status) where.status = status;
    const [data, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: { items: true },
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total/Number(limit)) };
  }

  async getVendorRFQs(vendorId: string, companyId: string) {
    return this.prisma.rfq.findMany({
      where: { companyId, status: { in: ['SENT','CLOSED'] },
        vendors: { some: { vendorId } }
      },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async getVendorQuotations(vendorId: string, companyId: string) {
    return this.prisma.vendorQuotation.findMany({
      where: { companyId, vendorId, isActive: true },
      include: { rfq: { select: { rfqNumber: true } }, items: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}
