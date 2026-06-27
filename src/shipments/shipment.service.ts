import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateShipmentDto, UpdateShipmentDto, AddContainerDto } from './dto/shipment.dto';

@Injectable()
export class ShipmentService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private async generateNumber(companyId: string): Promise<string> {
    const count = await this.prisma.shipment.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `SHP-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private includes() {
    return {
      ipo: { select: { ipoNumber: true, currency: true, status: true, vendor: { select: { code: true, name: true } } } },
      containers: { where: { isActive: true } },
    };
  }

  async create(dto: CreateShipmentDto, user: any) {
    const ipo = await this.prisma.importPurchaseOrder.findFirst({
      where: { id: dto.ipoId, companyId: user.companyId },
    });
    if (!ipo) throw new NotFoundException('Import PO not found');
    if (!['LC_OPENED', 'PROFORMA_RECEIVED', 'SHIPPED'].includes(ipo.status)) {
      throw new BadRequestException('Import PO must have LC opened before creating shipment');
    }

    const shipmentNumber = await this.generateNumber(user.companyId);
    const shipment = await this.prisma.shipment.create({
      data: {
        ...dto,
        shipmentNumber,
        etd: dto.etd ? new Date(dto.etd) : undefined,
        eta: dto.eta ? new Date(dto.eta) : undefined,
        companyId: user.companyId,
        createdBy: user.id, updatedBy: user.id,
      },
      include: this.includes(),
    });

    await this.audit.log({ tableName: 'shipments', recordId: shipment.id, action: 'CREATE', newValues: shipment, changedBy: user.id });
    return shipment;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, status, shipmentMode } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (search) where.OR = [
      { shipmentNumber: { contains: search, mode: 'insensitive' } },
      { vesselName: { contains: search, mode: 'insensitive' } },
      { blNumber: { contains: search, mode: 'insensitive' } },
    ];
    if (status) where.status = status;
    if (shipmentMode) where.shipmentMode = shipmentMode;

    const [data, total] = await Promise.all([
      this.prisma.shipment.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: {
          ipo: { select: { ipoNumber: true, currency: true, vendor: { select: { code: true, name: true } } } },
          _count: { select: { containers: true } },
        },
      }),
      this.prisma.shipment.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const where: any = { id };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const shipment = await this.prisma.shipment.findFirst({ where, include: this.includes() });
    if (!shipment) throw new NotFoundException('Shipment not found');
    return shipment;
  }

  async findByIpo(ipoId: string, user: any) {
    const where: any = { ipoId };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    return this.prisma.shipment.findMany({ where, orderBy: { createdAt: 'desc' }, include: this.includes() });
  }

  async update(id: string, dto: UpdateShipmentDto, user: any) {
    const shipment = await this.findOne(id, user);
    if (['DELIVERED', 'CANCELLED'].includes(shipment.status)) throw new BadRequestException('Cannot edit delivered or cancelled shipment');
    const updated = await this.prisma.shipment.update({
      where: { id },
      data: {
        ...dto,
        etd: dto.etd ? new Date(dto.etd) : undefined,
        eta: dto.eta ? new Date(dto.eta) : undefined,
        atd: dto.atd ? new Date(dto.atd) : undefined,
        ata: dto.ata ? new Date(dto.ata) : undefined,
        updatedBy: user.id,
      },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'shipments', recordId: id, action: 'UPDATE', oldValues: shipment, newValues: updated, changedBy: user.id });
    return updated;
  }

  async depart(id: string, user: any) {
    const shipment = await this.findOne(id, user);
    if (shipment.status !== 'BOOKED') throw new BadRequestException('Only BOOKED shipments can depart');
    const updated = await this.prisma.shipment.update({
      where: { id }, data: { status: 'DEPARTED', atd: new Date(), updatedBy: user.id }, include: this.includes(),
    });
    await this.audit.log({ tableName: 'shipments', recordId: id, action: 'UPDATE', oldValues: shipment, newValues: updated, changedBy: user.id });
    return updated;
  }

  async arrive(id: string, user: any) {
    const shipment = await this.findOne(id, user);
    if (!['DEPARTED', 'IN_TRANSIT'].includes(shipment.status)) throw new BadRequestException('Only DEPARTED or IN_TRANSIT shipments can arrive');
    const updated = await this.prisma.shipment.update({
      where: { id }, data: { status: 'ARRIVED', ata: new Date(), updatedBy: user.id }, include: this.includes(),
    });
    // Update IPO status to SHIPPED
    await this.prisma.importPurchaseOrder.update({
      where: { id: shipment.ipoId }, data: { status: 'SHIPPED', updatedBy: user.id },
    });
    await this.audit.log({ tableName: 'shipments', recordId: id, action: 'UPDATE', oldValues: shipment, newValues: updated, changedBy: user.id });
    return updated;
  }

  async deliver(id: string, user: any) {
    const shipment = await this.findOne(id, user);
    if (shipment.status !== 'ARRIVED') throw new BadRequestException('Only ARRIVED shipments can be delivered');
    const updated = await this.prisma.shipment.update({
      where: { id }, data: { status: 'DELIVERED', updatedBy: user.id }, include: this.includes(),
    });
    await this.audit.log({ tableName: 'shipments', recordId: id, action: 'UPDATE', oldValues: shipment, newValues: updated, changedBy: user.id });
    return updated;
  }

  async cancel(id: string, user: any) {
    const shipment = await this.findOne(id, user);
    if (['DELIVERED', 'CANCELLED'].includes(shipment.status)) throw new BadRequestException('Cannot cancel delivered or already cancelled shipment');
    const updated = await this.prisma.shipment.update({
      where: { id }, data: { status: 'CANCELLED', updatedBy: user.id }, include: this.includes(),
    });
    await this.audit.log({ tableName: 'shipments', recordId: id, action: 'UPDATE', oldValues: shipment, newValues: updated, changedBy: user.id });
    return updated;
  }

  async addContainer(id: string, dto: AddContainerDto, user: any) {
    const shipment = await this.findOne(id, user);
    if (shipment.shipmentMode !== 'SEA') throw new BadRequestException('Containers are only for SEA shipments');
    if (['DELIVERED', 'CANCELLED'].includes(shipment.status)) throw new BadRequestException('Cannot add containers to delivered or cancelled shipment');
    return this.prisma.shipmentContainer.create({
      data: { ...dto, shipmentId: id, companyId: user.companyId, createdBy: user.id, updatedBy: user.id },
    });
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const [total, booked, departed, arrived, delivered, cancelled] = await Promise.all([
      this.prisma.shipment.count({ where }),
      this.prisma.shipment.count({ where: { ...where, status: 'BOOKED' } }),
      this.prisma.shipment.count({ where: { ...where, status: 'DEPARTED' } }),
      this.prisma.shipment.count({ where: { ...where, status: 'ARRIVED' } }),
      this.prisma.shipment.count({ where: { ...where, status: 'DELIVERED' } }),
      this.prisma.shipment.count({ where: { ...where, status: 'CANCELLED' } }),
    ]);
    const byMode = await this.prisma.shipment.groupBy({ by: ['shipmentMode'], where, _count: true });
    return { total, booked, departed, arrived, delivered, cancelled, byMode };
  }
}
