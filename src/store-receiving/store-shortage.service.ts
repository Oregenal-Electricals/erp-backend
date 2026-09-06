import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { LinkBalanceDeliveryDto, ApproveShortClosureDto } from './dto/shortage.dto';

const SHORTAGE_RESULTS = ['SHORT_QUANTITY', 'FULL_SHORT'];

@Injectable()
export class StoreShortageService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private notifications: NotificationsService,
  ) {}

  private async generateNumber(companyId: string): Promise<string> {
    const count = await this.prisma.storeShortage.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `SHT-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  private outstanding(s: { shortQty: number; laterReceivedQty: number; approvedShortClosureQty: number }) {
    return Math.max(s.shortQty - s.laterReceivedQty - s.approvedShortClosureQty, 0);
  }

  private includes() {
    return {
      storeReceivingItem: { include: { storeReceiving: { select: { receivingNumber: true } } } },
      raisedBy: { select: { firstName: true, lastName: true } },
      resolvedBy: { select: { firstName: true, lastName: true } },
    };
  }

  async upsertFromLine(line: any, user: any) {
    const isShortage = SHORTAGE_RESULTS.includes(line.result);
    const existing = await this.prisma.storeShortage.findFirst({ where: { storeReceivingItemId: line.id } });

    if (!isShortage) {
      if (existing) {
        await this.prisma.storeShortage.update({ where: { id: existing.id }, data: { isActive: false, updatedBy: user.id } });
        await this.audit.log({ tableName: 'store_shortages', recordId: existing.id, action: 'UPDATE', oldValues: { isActive: true }, newValues: { isActive: false }, changedBy: user.id });
      }
      return null;
    }

    const gateInwardEntryId = line.storeReceiving.gateInwardEntryId;

    const gin = await this.prisma.gateInwardEntry.findUnique({ where: { id: gateInwardEntryId } });
    let poItemId: string | null = null;
    if (gin?.poId) {
      const poItem = await this.prisma.purchaseOrderItem.findFirst({ where: { poId: gin.poId, itemCode: line.itemCode } });
      poItemId = poItem?.id ?? null;
    }

    let shortage;
    if (existing) {
      shortage = await this.prisma.storeShortage.update({
        where: { id: existing.id },
        data: {
          expectedQty: line.expectedQty, actualQty: line.actualVerifiedQty, shortQty: line.shortQty,
          isActive: true, updatedBy: user.id,
        },
        include: this.includes(),
      });
    } else {
      const discrepancyNumber = await this.generateNumber(user.companyId);
      shortage = await this.prisma.storeShortage.create({
        data: {
          companyId: user.companyId, discrepancyNumber,
          storeReceivingItemId: line.id, gateInwardEntryId,
          poId: gin?.poId, poItemId,
          supplierName: gin?.supplierName || '', itemCode: line.itemCode, itemName: line.itemName, uom: line.uom,
          expectedQty: line.expectedQty, actualQty: line.actualVerifiedQty, shortQty: line.shortQty,
          shortageType: 'UNKNOWN', status: 'SHORT_DETECTED',
          raisedById: user.id, createdBy: user.id, updatedBy: user.id,
        },
        include: this.includes(),
      });
    }

    if (!shortage.purchaseNotifiedAt) {
      const purchaseUsers = await this.prisma.user.findMany({
        where: { companyId: user.companyId, isActive: true, role: { in: ['PURCHASE_MANAGER', 'SUPER_ADMIN'] } },
        select: { id: true },
      });
      if (purchaseUsers.length > 0) {
        await this.notifications.createBulk(
          purchaseUsers.map(u => ({
            userId: u.id,
            type: 'STORE_SHORTAGE_DETECTED',
            title: 'Material shortage detected at Store',
            message: shortage.discrepancyNumber + ' - ' + shortage.supplierName + ' - ' + shortage.itemName + ': expected ' + shortage.expectedQty + ', received ' + shortage.actualQty + ', short ' + shortage.shortQty + ' ' + shortage.uom + '.',
            referenceType: 'STORE_SHORTAGE', referenceId: shortage.id, referenceNumber: shortage.discrepancyNumber,
            priority: 'HIGH',
          })) as any,
          user.companyId, user.id,
        );
      }
      shortage = await this.prisma.storeShortage.update({
        where: { id: shortage.id },
        data: { purchaseNotifiedAt: new Date(), status: 'PURCHASE_NOTIFIED' },
        include: this.includes(),
      });
    }

    await this.audit.log({
      tableName: 'store_shortages', recordId: shortage.id, action: existing ? 'UPDATE' : 'CREATE',
      newValues: { expectedQty: shortage.expectedQty, actualQty: shortage.actualQty, shortQty: shortage.shortQty },
      changedBy: user.id,
    });

    return shortage;
  }

  async findAll(user: any, query: any) {
    const page = parseInt(query?.page) || 1;
    const limit = parseInt(query?.limit) || 20;
    const where: any = { companyId: user.companyId, isActive: true };
    if (query?.status) where.status = query.status;
    const [data, total] = await Promise.all([
      this.prisma.storeShortage.findMany({ where, include: this.includes(), orderBy: { raisedAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.storeShortage.count({ where }),
    ]);
    return {
      data: data.map(s => ({ ...s, outstandingQty: this.outstanding(s) })),
      total, page, limit, totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, user: any) {
    const s = await this.prisma.storeShortage.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
    if (!s) throw new NotFoundException('Shortage record not found');
    return { ...s, outstandingQty: this.outstanding(s) };
  }

  async linkBalanceDelivery(shortageId: string, dto: LinkBalanceDeliveryDto, user: any) {
    const shortage = await this.prisma.storeShortage.findFirst({ where: { id: shortageId, companyId: user.companyId } });
    if (!shortage) throw new NotFoundException('Shortage record not found');

    const outstanding = this.outstanding(shortage);
    if (dto.qty > outstanding) {
      throw new BadRequestException('Cannot link ' + dto.qty + ' - only ' + outstanding + ' is outstanding on this shortage');
    }

    const laterLine = await this.prisma.storeReceivingItem.findFirst({ where: { id: dto.laterStoreReceivingItemId, companyId: user.companyId } });
    if (!laterLine) throw new NotFoundException('Later Store Receiving line not found');
    if (laterLine.id === shortage.storeReceivingItemId) {
      throw new BadRequestException('The balance delivery must be a different (new) Store Receiving line, not the original short receipt');
    }

    const newLaterReceived = shortage.laterReceivedQty + dto.qty;
    const newOutstanding = this.outstanding({ ...shortage, laterReceivedQty: newLaterReceived });
    const newStatus = newOutstanding === 0 ? 'RESOLVED' : 'PARTIALLY_RESOLVED';

    const oldValues = { laterReceivedQty: shortage.laterReceivedQty, status: shortage.status };
    const updated = await this.prisma.storeShortage.update({
      where: { id: shortageId },
      data: {
        laterReceivedQty: newLaterReceived, status: newStatus,
        remarks: dto.remarks, updatedBy: user.id,
        ...(newOutstanding === 0 ? { resolvedById: user.id, resolvedAt: new Date() } : {}),
      },
      include: this.includes(),
    });

    await this.audit.log({
      tableName: 'store_shortages', recordId: shortageId, action: 'UPDATE',
      oldValues, newValues: { laterReceivedQty: newLaterReceived, status: newStatus, linkedLaterLine: laterLine.id },
      changedBy: user.id,
    });

    return { ...updated, outstandingQty: newOutstanding };
  }

  async approveShortClosure(shortageId: string, dto: ApproveShortClosureDto, user: any) {
    const shortage = await this.prisma.storeShortage.findFirst({ where: { id: shortageId, companyId: user.companyId } });
    if (!shortage) throw new NotFoundException('Shortage record not found');

    const outstanding = this.outstanding(shortage);
    if (dto.qty > outstanding) {
      throw new BadRequestException('Cannot approve short closure for ' + dto.qty + ' - only ' + outstanding + ' is outstanding on this shortage');
    }

    const newApprovedClosure = shortage.approvedShortClosureQty + dto.qty;
    const newOutstanding = this.outstanding({ ...shortage, approvedShortClosureQty: newApprovedClosure });
    const newStatus = newOutstanding === 0 ? 'APPROVED_SHORT_CLOSURE' : 'PARTIALLY_RESOLVED';

    const oldValues = { approvedShortClosureQty: shortage.approvedShortClosureQty, status: shortage.status };
    const updated = await this.prisma.storeShortage.update({
      where: { id: shortageId },
      data: {
        approvedShortClosureQty: newApprovedClosure, status: newStatus,
        resolvedById: user.id, resolvedAt: new Date(), remarks: dto.reason, updatedBy: user.id,
      },
      include: this.includes(),
    });

    await this.audit.log({
      tableName: 'store_shortages', recordId: shortageId, action: 'UPDATE',
      oldValues, newValues: { approvedShortClosureQty: newApprovedClosure, status: newStatus, reason: dto.reason },
      changedBy: user.id,
    });

    return { ...updated, outstandingQty: newOutstanding };
  }
}
