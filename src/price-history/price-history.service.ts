import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PriceHistoryService {
  constructor(private prisma: PrismaService) {}

  async getItemHistory(itemCode: string, user: any) {
    const where: any = { itemCode: { contains: itemCode, mode: 'insensitive' } };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;

    const items = await this.prisma.priceListItem.findMany({
      where,
      include: { priceList: { select: { code: true, name: true, listType: true, currency: true } } },
      orderBy: { validFrom: 'desc' },
    });
    return items;
  }

  async getEffectivePrice(itemCode: string, user: any) {
    const now = new Date();
    const where: any = {
      itemCode: { contains: itemCode, mode: 'insensitive' },
      isApproved: true,
      isActive: true,
      validFrom: { lte: now },
      OR: [{ validTo: null }, { validTo: { gte: now } }],
    };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;

    const items = await this.prisma.priceListItem.findMany({
      where,
      include: { priceList: { select: { code: true, name: true, listType: true, currency: true } } },
      orderBy: { validFrom: 'desc' },
    });
    return items;
  }

  async getListHistory(priceListId: string, user: any) {
    const where: any = { priceListId };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;

    const items = await this.prisma.priceListItem.findMany({
      where,
      orderBy: [{ itemCode: 'asc' }, { validFrom: 'desc' }],
    });
    return items;
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;

    const now = new Date();
    const [total, approved, active, expired] = await Promise.all([
      this.prisma.priceListItem.count({ where }),
      this.prisma.priceListItem.count({ where: { ...where, isApproved: true } }),
      this.prisma.priceListItem.count({ where: { ...where, isApproved: true, isActive: true, validFrom: { lte: now }, OR: [{ validTo: null }, { validTo: { gte: now } }] } }),
      this.prisma.priceListItem.count({ where: { ...where, validTo: { lt: now } } }),
    ]);
    return { total, approved, active, expired, pending: total - approved };
  }

  async search(user: any, query: any) {
    const { search, listType, isApproved, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (search) where.OR = [
      { itemCode: { contains: search, mode: 'insensitive' } },
      { itemName: { contains: search, mode: 'insensitive' } },
    ];
    if (isApproved !== undefined) where.isApproved = isApproved === 'true';
    if (listType) where.priceList = { listType };

    const [data, total] = await Promise.all([
      this.prisma.priceListItem.findMany({
        where, skip, take: Number(limit),
        include: { priceList: { select: { code: true, name: true, listType: true, currency: true } } },
        orderBy: { validFrom: 'desc' },
      }),
      this.prisma.priceListItem.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }
}
