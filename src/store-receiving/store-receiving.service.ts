import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { GateInwardService } from '../gate-inward/gate-inward.service';
import { ReceiveAtStoreDto } from './dto/store-receiving.dto';

@Injectable()
export class StoreReceivingService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private gateInward: GateInwardService,
  ) {}

  private async generateNumber(companyId: string): Promise<string> {
    const count = await this.prisma.storeReceiving.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `SR-${year}-${String(count + 1).padStart(6, '0')}`;
  }

  private includes() {
    return {
      gateInwardEntry: { select: { ginNumber: true, supplierName: true, poNumber: true, invoiceNumber: true, gateInAt: true, status: true, remarks: true } },
      receivedBy: { select: { firstName: true, lastName: true } },
      items: true,
    };
  }

  async findPendingFromGate(user: any) {
    return this.prisma.gateInwardEntry.findMany({
      where: { companyId: user.companyId, status: 'SENT_TO_STORES', isActive: true },
      include: { items: true },
      orderBy: { gateInAt: 'asc' },
    });
  }

  async receiveAtStore(dto: ReceiveAtStoreDto, user: any) {
    const entry = await this.prisma.gateInwardEntry.findFirst({
      where: { id: dto.gateInwardEntryId, companyId: user.companyId },
      include: { items: true },
    });
    if (!entry) throw new NotFoundException('Gate inward entry not found');

    if (entry.status !== 'SENT_TO_STORES') {
      throw new BadRequestException(
        `Cannot receive at Store - Gate-In is ${entry.status}, not SENT_TO_STORES. ` +
        (entry.status === 'COMPLETED' ? 'This material has already been received at Store.' :
         entry.status === 'REJECTED' ? 'Gate-rejected material cannot enter normal Store receiving.' :
         entry.status?.startsWith('GATE_HOLD_') ? 'This entry is on a Gate hold and must be resolved by Purchase/Gate first.' :
         'Material must clear the gate and be sent to stores before Store can receive it.'),
      );
    }

    const receivingNumber = await this.generateNumber(user.companyId);

    let created;
    try {
      created = await this.prisma.storeReceiving.create({
        data: {
          companyId: user.companyId,
          receivingNumber,
          gateInwardEntryId: entry.id,
          supplierName: entry.supplierName,
          poId: entry.poId,
          poNumber: entry.poNumber,
          invoiceNumber: entry.invoiceNumber,
          receivingWarehouseId: dto.receivingWarehouseId,
          receivedById: user.id,
          status: 'PHYSICAL_VERIFICATION_PENDING',
          remarks: dto.remarks,
          createdBy: user.id, updatedBy: user.id,
          items: {
            create: entry.items.map(item => ({
              companyId: user.companyId,
              gateInwardItemId: item.id,
              itemCode: item.itemCode,
              itemName: item.itemName,
              uom: item.uom,
              expectedQty: item.quantity,
              actualVerifiedQty: null,
              createdBy: user.id, updatedBy: user.id,
            })),
          },
        },
        include: this.includes(),
      });
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new BadRequestException('This Gate-In has already been received at Store');
      }
      throw e;
    }

    await this.gateInward.complete(entry.id, user);

    await this.audit.log({
      tableName: 'store_receivings', recordId: created.id, action: 'CREATE',
      newValues: created, changedBy: user.id,
    });

    return created;
  }

  async findAll(user: any, query: any) {
    const page = parseInt(query?.page) || 1;
    const limit = parseInt(query?.limit) || 20;
    const where: any = { companyId: user.companyId, isActive: true };
    if (query?.status) where.status = query.status;
    const [data, total] = await Promise.all([
      this.prisma.storeReceiving.findMany({
        where, include: this.includes(), orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit, take: limit,
      }),
      this.prisma.storeReceiving.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, user: any) {
    const record = await this.prisma.storeReceiving.findFirst({
      where: { id, companyId: user.companyId },
      include: this.includes(),
    });
    if (!record) throw new NotFoundException('Store receiving record not found');
    return record;
  }
}
