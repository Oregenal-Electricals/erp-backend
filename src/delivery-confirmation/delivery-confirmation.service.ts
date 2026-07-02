import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateDeliveryConfirmationDto } from './dto/delivery-confirmation.dto';

@Injectable()
export class DeliveryConfirmationService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private async generateNumber(companyId: string): Promise<string> {
    const count = await this.prisma.deliveryConfirmation.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `DC-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private includes() {
    return {
      dispatch: {
        select: {
          dispatchNumber: true, vehicleNumber: true, lrNumber: true,
          salesOrder: { select: { soNumber: true, customerName: true, cpo: { select: { cpoNumber: true, customerPoNumber: true } } } },
        },
      },
    };
  }

  async create(dto: CreateDeliveryConfirmationDto, user: any) {
    // Validate dispatch
    const dispatch = await this.prisma.dispatch.findFirst({
      where: { id: dto.dispatchId, companyId: user.companyId },
      include: { salesOrder: { include: { items: true, cpo: true } } },
    });
    if (!dispatch) throw new NotFoundException('Dispatch not found');
    if (dispatch.status !== 'DISPATCHED') throw new BadRequestException('Dispatch must be in DISPATCHED status');

    // Check if DC already exists
    const existing = await this.prisma.deliveryConfirmation.findUnique({ where: { dispatchId: dto.dispatchId } });
    if (existing) throw new BadRequestException('Delivery confirmation already exists for this dispatch');

    const dcNumber = await this.generateNumber(user.companyId);

    const dc = await this.prisma.deliveryConfirmation.create({
      data: {
        dcNumber, dispatchId: dto.dispatchId,
        deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : new Date(),
        receiverName: dto.receiverName, receiverPhone: dto.receiverPhone,
        podNumber: dto.podNumber, condition: dto.condition || 'GOOD',
        shortageQty: dto.shortageQty || 0, damageNotes: dto.damageNotes,
        remarks: dto.remarks,
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
      },
      include: this.includes(),
    });

    // Update dispatch status to DELIVERED
    await this.prisma.dispatch.update({
      where: { id: dto.dispatchId },
      data: { status: 'DELIVERED', updatedBy: user.id },
    });

    // Update SO status to COMPLETED if all items dispatched
    const so = dispatch.salesOrder;
    if (so) {
      const allItemsDispatched = so.items.every(i => i.pendingQty <= 0);
      if (allItemsDispatched) {
        await this.prisma.salesOrder.update({
          where: { id: so.id },
          data: { status: 'COMPLETED', updatedBy: user.id },
        });
        // Check if all SOs for this CPO are completed → CPO COMPLETED
        if (so.cpoId) {
          const cpoSos = await this.prisma.salesOrder.findMany({
            where: { cpoId: so.cpoId, companyId: user.companyId },
          });
          const allCompleted = cpoSos.every(s => s.status === 'COMPLETED' || s.id === so.id);
          if (allCompleted) {
            await this.prisma.customerPo.update({
              where: { id: so.cpoId },
              data: { status: 'COMPLETED', updatedBy: user.id },
            });
          }
        }
      }
    }

    await this.audit.log({ tableName: 'delivery_confirmations', recordId: dc.id, action: 'CREATE', newValues: dc, changedBy: user.id });
    return dc;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, condition } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { companyId: user.companyId };
    if (search) where.OR = [
      { dcNumber: { contains: search, mode: 'insensitive' } },
      { receiverName: { contains: search, mode: 'insensitive' } },
      { podNumber: { contains: search, mode: 'insensitive' } },
    ];
    if (condition) where.condition = condition;

    const [data, total] = await Promise.all([
      this.prisma.deliveryConfirmation.findMany({
        where, skip, take: Number(limit), orderBy: { deliveryDate: 'desc' },
        include: { dispatch: { select: { dispatchNumber: true, vehicleNumber: true, salesOrder: { select: { soNumber: true, customerName: true } } } } },
      }),
      this.prisma.deliveryConfirmation.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const dc = await this.prisma.deliveryConfirmation.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
    if (!dc) throw new NotFoundException('Delivery confirmation not found');
    return dc;
  }

  async getStats(user: any) {
    const where: any = { companyId: user.companyId };
    const [total, good, damaged, partial] = await Promise.all([
      this.prisma.deliveryConfirmation.count({ where }),
      this.prisma.deliveryConfirmation.count({ where: { ...where, condition: 'GOOD' } }),
      this.prisma.deliveryConfirmation.count({ where: { ...where, condition: 'DAMAGED' } }),
      this.prisma.deliveryConfirmation.count({ where: { ...where, condition: 'PARTIAL' } }),
    ]);
    return { total, good, damaged, partial };
  }
}
