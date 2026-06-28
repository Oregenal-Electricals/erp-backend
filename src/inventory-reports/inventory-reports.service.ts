import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryReportsService {
  constructor(private prisma: PrismaService) {}

  private dateWhere(fromDate?: string, toDate?: string) {
    if (!fromDate && !toDate) return undefined;
    const obj: any = {};
    if (fromDate) obj.gte = new Date(fromDate);
    if (toDate) obj.lte = new Date(toDate + 'T23:59:59.999Z');
    return obj;
  }

  async getStockRegister(user: any, query: any) {
    const { warehouseId, search } = query;
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (warehouseId) where.warehouseId = warehouseId;
    if (search) where.OR = [
      { itemCode: { contains: search, mode: 'insensitive' } },
      { itemName: { contains: search, mode: 'insensitive' } },
    ];

    const balances = await this.prisma.stockBalance.findMany({
      where,
      include: { warehouse: { select: { name: true, code: true } } },
      orderBy: [{ itemCode: 'asc' }],
    });

    const data = balances.map(b => ({
      itemCode: b.itemCode, itemName: b.itemName,
      warehouse: b.warehouse?.name,
      availableQty: b.availableQty, reservedQty: b.reservedQty,
      unitCost: b.unitCost, stockValue: b.availableQty * b.unitCost,
    }));

    const totalValue = data.reduce((s, d) => s + d.stockValue, 0);
    const totalQty = data.reduce((s, d) => s + d.availableQty, 0);
    return { data, totalItems: data.length, totalValue, totalQty };
  }

  async getGrnRegister(user: any, query: any) {
    const { warehouseId, fromDate, toDate, status } = query;
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (warehouseId) where.warehouseId = warehouseId;
    if (status) where.status = status;
    const dateWhere = this.dateWhere(fromDate, toDate);
    if (dateWhere) where.createdAt = dateWhere;

    const grns = await this.prisma.grnHeader.findMany({
      where, orderBy: { createdAt: 'desc' },
      include: {
        warehouse: { select: { name: true } },
        items: { where: { isActive: true }, select: { itemCode: true, itemName: true, receivedQty: true, acceptedQty: true, rejectedQty: true, unitPrice: true } },
      },
    }) as any[];

    const data = grns.map((g: any) => ({
      grnNumber: g.grnNumber, grnType: g.grnType, status: g.status,
      warehouse: g.warehouse?.name,
      totalItems: g.items?.length || 0,
      totalReceivedQty: g.items?.reduce((s: number, i: any) => s + i.receivedQty, 0) || 0,
      totalAcceptedQty: g.items?.reduce((s: number, i: any) => s + i.acceptedQty, 0) || 0,
      totalRejectedQty: g.items?.reduce((s: number, i: any) => s + i.rejectedQty, 0) || 0,
      totalValue: g.items?.reduce((s: number, i: any) => s + i.acceptedQty * i.unitPrice, 0) || 0,
      date: g.createdAt,
    }));

    const totalValue = data.reduce((s, d) => s + d.totalValue, 0);
    return { data, totalGrns: data.length, totalValue };
  }

  async getIssueRegister(user: any, query: any) {
    const { warehouseId, fromDate, toDate, referenceType } = query;
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (warehouseId) where.warehouseId = warehouseId;
    if (referenceType) where.referenceType = referenceType;
    const dateWhere = this.dateWhere(fromDate, toDate);
    if (dateWhere) where.createdAt = dateWhere;

    const issues = await this.prisma.stockIssue.findMany({
      where: { ...where, status: 'ISSUED' }, orderBy: { createdAt: 'desc' },
      include: {
        warehouse: { select: { name: true } },
        items: { select: { itemCode: true, itemName: true, issuedQty: true, unitCost: true } },
      },
    });

    const data = issues.map(iss => ({
      issueNumber: iss.issueNumber, issuedTo: iss.issuedTo,
      referenceType: iss.referenceType, issueMethod: iss.issueMethod,
      warehouse: iss.warehouse?.name,
      totalItems: iss.items.length,
      totalQty: iss.items.reduce((s, i) => s + i.issuedQty, 0),
      totalValue: iss.items.reduce((s, i) => s + i.issuedQty * i.unitCost, 0),
      date: iss.createdAt,
    }));

    const totalValue = data.reduce((s, d) => s + d.totalValue, 0);
    const totalQty = data.reduce((s, d) => s + d.totalQty, 0);
    return { data, totalIssues: data.length, totalValue, totalQty };
  }

  async getTransferRegister(user: any, query: any) {
    const { fromDate, toDate, transferType } = query;
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (transferType) where.transferType = transferType;
    const dateWhere = this.dateWhere(fromDate, toDate);
    if (dateWhere) where.createdAt = dateWhere;

    const transfers = await this.prisma.stockTransfer.findMany({
      where: { ...where, status: 'CONFIRMED' }, orderBy: { createdAt: 'desc' },
      include: {
        fromWarehouse: { select: { name: true } },
        toWarehouse: { select: { name: true } },
        items: { select: { itemCode: true, itemName: true, qty: true, unitCost: true } },
      },
    });

    const data = transfers.map(t => ({
      transferNumber: t.transferNumber, transferType: t.transferType,
      fromWarehouse: t.fromWarehouse?.name, toWarehouse: t.toWarehouse?.name,
      totalItems: t.items.length,
      totalQty: t.items.reduce((s, i) => s + i.qty, 0),
      totalValue: t.items.reduce((s, i) => s + i.qty * i.unitCost, 0),
      date: t.createdAt,
    }));

    const totalValue = data.reduce((s, d) => s + d.totalValue, 0);
    return { data, totalTransfers: data.length, totalValue };
  }

  async getAbcAnalysis(user: any, query: any) {
    const { warehouseId } = query;
    const companyId = user.companyId;

    // Get consumption data (issues)
    const issues = await this.prisma.stockIssueItem.findMany({
      where: { companyId },
    });

    // Group by itemCode
    const consumption: Record<string, any> = {};
    for (const item of issues) {
      if (!consumption[item.itemCode]) {
        consumption[item.itemCode] = { itemCode: item.itemCode, itemName: item.itemName, totalQty: 0, totalValue: 0 };
      }
      consumption[item.itemCode].totalQty += item.issuedQty;
      consumption[item.itemCode].totalValue += item.issuedQty * item.unitCost;
    }

    // Get current stock value for items with no consumption
    const balances = await this.prisma.stockBalance.findMany({
      where: { companyId, ...(warehouseId ? { warehouseId } : {}) },
    });
    for (const b of balances) {
      if (!consumption[b.itemCode]) {
        consumption[b.itemCode] = { itemCode: b.itemCode, itemName: b.itemName, totalQty: 0, totalValue: 0 };
      }
    }

    const sorted = Object.values(consumption).sort((a: any, b: any) => b.totalValue - a.totalValue);
    const grandTotal = sorted.reduce((s: number, i: any) => s + i.totalValue, 0);

    let cumValue = 0;
    const data = sorted.map((item: any) => {
      cumValue += item.totalValue;
      const cumPercent = grandTotal > 0 ? (cumValue / grandTotal) * 100 : 0;
      let abc = 'C';
      if (cumPercent <= 70) abc = 'A';
      else if (cumPercent <= 90) abc = 'B';
      return { ...item, cumPercent: cumPercent.toFixed(1), abc };
    });

    const aItems = data.filter((d: any) => d.abc === 'A').length;
    const bItems = data.filter((d: any) => d.abc === 'B').length;
    const cItems = data.filter((d: any) => d.abc === 'C').length;

    return { data, totalItems: data.length, grandTotal, aItems, bItems, cItems };
  }
}
