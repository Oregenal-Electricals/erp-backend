import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateCreditLimitDto, UpdateCreditLimitDto, ReleaseCreditHoldDto, CheckCreditDto } from './dto/credit-control.dto';

@Injectable()
export class CreditControlService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async getCustomerPosition(customerName: string, companyId: string) {
    const [creditLimit, arData, activeHolds] = await Promise.all([
      this.prisma.customerCreditLimit.findUnique({ where: { companyId_customerName: { companyId, customerName } } }),
      this.prisma.arInvoice.aggregate({
        where: { companyId, customerName, status: { in: ['SENT','PARTIAL','OVERDUE'] } },
        _sum: { outstandingAmount: true, totalAmount: true },
        _count: { id: true },
      }),
      this.prisma.creditHold.findMany({
        where: { companyId, customerName, status: 'HELD' },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const outstanding = arData._sum.outstandingAmount || 0;
    const limit = creditLimit?.creditLimit || 0;
    const available = Math.max(0, limit - outstanding);
    const utilizationPct = limit > 0 ? Math.round(outstanding / limit * 100 * 100) / 100 : 0;

    return {
      customerName, creditLimit: limit, creditDays: creditLimit?.creditDays || 30,
      outstandingAmount: outstanding, availableCredit: available,
      utilizationPct, invoiceCount: arData._count.id,
      activeHolds: activeHolds.length, holds: activeHolds,
      isOverLimit: outstanding > limit && limit > 0,
      hasLimit: !!creditLimit,
    };
  }

  async checkCredit(dto: CheckCreditDto, user: any) {
    const position = await this.getCustomerPosition(dto.customerName, user.companyId);

    if (!position.hasLimit) return {
      allowed: true, reason: 'No credit limit set for this customer',
      position, holdCreated: false,
    };

    const totalExposure = position.outstandingAmount + dto.orderAmount;
    const allowed = totalExposure <= position.creditLimit;

    if (!allowed && dto.referenceType && dto.referenceId) {
      // Create credit hold
      const hold = await this.prisma.creditHold.create({
        data: {
          customerName: dto.customerName, creditLimitId: null,
          referenceType: dto.referenceType, referenceId: dto.referenceId,
          referenceNumber: dto.referenceNumber || '',
          holdReason: `Credit limit exceeded. Outstanding: ₹${position.outstandingAmount.toLocaleString()}, Order: ₹${dto.orderAmount.toLocaleString()}, Limit: ₹${position.creditLimit.toLocaleString()}`,
          holdAmount: dto.orderAmount, outstandingAtHold: position.outstandingAmount,
          creditLimitAtHold: position.creditLimit,
          companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
        },
      });
      await this.audit.log({ tableName: 'credit_holds', recordId: hold.id, action: 'CREATE', newValues: hold, changedBy: user.id });
      return { allowed: false, reason: hold.holdReason, position, holdCreated: true, holdId: hold.id };
    }

    return { allowed, reason: allowed ? 'Credit check passed' : 'Credit limit would be exceeded', position, holdCreated: false };
  }

  async createCreditLimit(dto: CreateCreditLimitDto, user: any) {
    const existing = await this.prisma.customerCreditLimit.findUnique({
      where: { companyId_customerName: { companyId: user.companyId, customerName: dto.customerName } },
    });
    if (existing) throw new BadRequestException(`Credit limit already exists for ${dto.customerName}`);

    const limit = await this.prisma.customerCreditLimit.create({
      data: {
        customerName: dto.customerName, creditLimit: dto.creditLimit,
        creditDays: dto.creditDays || 30, notes: dto.notes,
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
      },
    });
    await this.audit.log({ tableName: 'customer_credit_limits', recordId: limit.id, action: 'CREATE', newValues: limit, changedBy: user.id });
    return limit;
  }

  async updateCreditLimit(id: string, dto: UpdateCreditLimitDto, user: any) {
    const limit = await this.prisma.customerCreditLimit.findFirst({ where: { id, companyId: user.companyId } });
    if (!limit) throw new NotFoundException('Credit limit not found');

    const updated = await this.prisma.customerCreditLimit.update({
      where: { id }, data: { ...dto, updatedBy: user.id },
    });
    await this.audit.log({ tableName: 'customer_credit_limits', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async releaseHold(id: string, dto: ReleaseCreditHoldDto, user: any) {
    const hold = await this.prisma.creditHold.findFirst({ where: { id, companyId: user.companyId } });
    if (!hold) throw new NotFoundException('Credit hold not found');
    if (hold.status !== 'HELD') throw new BadRequestException(`Hold is already ${hold.status}`);

    const updated = await this.prisma.creditHold.update({
      where: { id },
      data: { status: 'RELEASED', releasedBy: user.id, releaseReason: dto.releaseReason, releasedDate: new Date(), updatedBy: user.id },
    });
    await this.audit.log({ tableName: 'credit_holds', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async findAllLimits(user: any) {
    const limits = await this.prisma.customerCreditLimit.findMany({
      where: { companyId: user.companyId, isActive: true },
      orderBy: { customerName: 'asc' },
    });

    // Enrich with AR data
    const enriched = await Promise.all(limits.map(async l => {
      const pos = await this.getCustomerPosition(l.customerName, user.companyId);
      return { ...l, ...pos };
    }));
    return enriched;
  }

  async findAllHolds(user: any, query: any) {
    const { status, customerName } = query;
    const where: any = { companyId: user.companyId };
    if (status) where.status = status;
    if (customerName) where.customerName = { contains: customerName, mode: 'insensitive' };

    return this.prisma.creditHold.findMany({
      where, orderBy: { createdAt: 'desc' },
    });
  }

  async getStats(user: any) {
    const where: any = { companyId: user.companyId };
    const [totalLimits, totalHolds, activeHolds, overLimitCustomers] = await Promise.all([
      this.prisma.customerCreditLimit.count({ where }),
      this.prisma.creditHold.count({ where }),
      this.prisma.creditHold.count({ where: { ...where, status: 'HELD' } }),
      this.prisma.customerCreditLimit.count({ where }),
    ]);
    const holdValue = await this.prisma.creditHold.aggregate({ where: { ...where, status: 'HELD' }, _sum: { holdAmount: true } });
    return { totalLimits, totalHolds, activeHolds, holdValue: holdValue._sum.holdAmount || 0 };
  }

  async getDashboard(user: any) {
    const limits = await this.findAllLimits(user);
    const overLimit = limits.filter(l => l.isOverLimit);
    const atRisk = limits.filter(l => l.utilizationPct >= 80 && !l.isOverLimit);
    const healthy = limits.filter(l => l.utilizationPct < 80);
    const totalExposure = limits.reduce((s, l) => s + l.outstandingAmount, 0);
    const totalLimit = limits.reduce((s, l) => s + l.creditLimit, 0);
    return { limits, overLimit, atRisk, healthy, totalExposure, totalLimit, utilizationPct: totalLimit > 0 ? Math.round(totalExposure / totalLimit * 100) : 0 };
  }
}
