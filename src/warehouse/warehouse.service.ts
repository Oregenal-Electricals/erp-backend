import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import {
  CreateWarehouseDto, UpdateWarehouseDto,
  CreateZoneDto, CreateRackDto, CreateBinDto,
} from './dto/warehouse.dto';

@Injectable()
export class WarehouseService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  // ── WAREHOUSE ─────────────────────────────────────────────────

  async createWarehouse(dto: CreateWarehouseDto, user: any) {
    const exists = await this.prisma.warehouse.findUnique({
      where: { companyId_code: { companyId: user.companyId, code: dto.code.toUpperCase() } },
    });
    if (exists) throw new ConflictException(`Warehouse ${dto.code} already exists`);

    const plant = await this.prisma.plant.findUnique({ where: { id: dto.plantId } });
    if (!plant) throw new NotFoundException('Plant not found');

    const wh = await this.prisma.warehouse.create({
      data: { ...dto, code: dto.code.toUpperCase(), companyId: user.companyId, createdBy: user.id, updatedBy: user.id },
      include: this.whIncludes(),
    });
    await this.audit.log({ tableName: 'warehouses', recordId: wh.id, action: 'CREATE', newValues: wh, changedBy: user.id });
    return wh;
  }

  async findAllWarehouses(user: any, plantId?: string) {
    const where: any = { companyId: user.companyId };
    if (plantId) where.plantId = plantId;
    return this.prisma.warehouse.findMany({
      where,
      include: {
        plant: { select: { id: true, name: true, code: true } },
        _count: { select: { zones: true } },
      },
      orderBy: { code: 'asc' },
    });
  }

  async findOneWarehouse(id: string) {
    const wh = await this.prisma.warehouse.findUnique({
      where: { id },
      include: {
        plant: { select: { id: true, name: true, code: true } },
        zones: {
          include: {
            racks: {
              include: {
                bins: true,
                _count: { select: { bins: true } },
              },
              orderBy: { code: 'asc' },
            },
            _count: { select: { racks: true } },
          },
          orderBy: { code: 'asc' },
        },
      },
    });
    if (!wh) throw new NotFoundException('Warehouse not found');
    return wh;
  }

  async updateWarehouse(id: string, dto: UpdateWarehouseDto, user: any) {
    const wh = await this.prisma.warehouse.findUnique({ where: { id } });
    if (!wh) throw new NotFoundException('Warehouse not found');
    const updated = await this.prisma.warehouse.update({ where: { id }, data: { ...dto, updatedBy: user.id }, include: this.whIncludes() });
    await this.audit.log({ tableName: 'warehouses', recordId: id, action: 'UPDATE', oldValues: wh, newValues: dto, changedBy: user.id });
    return updated;
  }

  async getStats(user: any) {
    const base = { companyId: user.companyId };
    const [totalWarehouses, totalZones, totalRacks, totalBins] = await Promise.all([
      this.prisma.warehouse.count({ where: base }),
      this.prisma.zone.count({ where: { warehouse: { companyId: user.companyId } } }),
      this.prisma.rack.count({ where: { zone: { warehouse: { companyId: user.companyId } } } }),
      this.prisma.bin.count({ where: { rack: { zone: { warehouse: { companyId: user.companyId } } } } }),
    ]);
    return { totalWarehouses, totalZones, totalRacks, totalBins };
  }

  // ── ZONE ─────────────────────────────────────────────────────

  async createZone(dto: CreateZoneDto, user: any) {
    const wh = await this.prisma.warehouse.findUnique({ where: { id: dto.warehouseId } });
    if (!wh) throw new NotFoundException('Warehouse not found');

    const exists = await this.prisma.zone.findUnique({
      where: { warehouseId_code: { warehouseId: dto.warehouseId, code: dto.code.toUpperCase() } },
    });
    if (exists) throw new ConflictException(`Zone ${dto.code} already exists in this warehouse`);

    return this.prisma.zone.create({
      data: { ...dto, code: dto.code.toUpperCase(), createdBy: user.id, updatedBy: user.id },
      include: { warehouse: { select: { id: true, name: true } } },
    });
  }

  async findZonesByWarehouse(warehouseId: string) {
    return this.prisma.zone.findMany({
      where: { warehouseId, isActive: true },
      include: { _count: { select: { racks: true } } },
      orderBy: { code: 'asc' },
    });
  }

  // ── RACK ─────────────────────────────────────────────────────

  async createRack(dto: CreateRackDto, user: any) {
    const zone = await this.prisma.zone.findUnique({ where: { id: dto.zoneId } });
    if (!zone) throw new NotFoundException('Zone not found');

    const exists = await this.prisma.rack.findUnique({
      where: { zoneId_code: { zoneId: dto.zoneId, code: dto.code.toUpperCase() } },
    });
    if (exists) throw new ConflictException(`Rack ${dto.code} already exists in this zone`);

    return this.prisma.rack.create({
      data: { ...dto, code: dto.code.toUpperCase(), createdBy: user.id, updatedBy: user.id },
      include: { zone: { select: { id: true, name: true } } },
    });
  }

  async findRacksByZone(zoneId: string) {
    return this.prisma.rack.findMany({
      where: { zoneId, isActive: true },
      include: { _count: { select: { bins: true } } },
      orderBy: { code: 'asc' },
    });
  }

  // ── BIN ──────────────────────────────────────────────────────

  async createBin(dto: CreateBinDto, user: any) {
    const rack = await this.prisma.rack.findUnique({ where: { id: dto.rackId } });
    if (!rack) throw new NotFoundException('Rack not found');

    const exists = await this.prisma.bin.findUnique({
      where: { rackId_code: { rackId: dto.rackId, code: dto.code.toUpperCase() } },
    });
    if (exists) throw new ConflictException(`Bin ${dto.code} already exists in this rack`);

    return this.prisma.bin.create({
      data: { ...dto, code: dto.code.toUpperCase(), createdBy: user.id, updatedBy: user.id },
      include: { rack: { select: { id: true, name: true } } },
    });
  }

  async findBinsByRack(rackId: string) {
    return this.prisma.bin.findMany({
      where: { rackId, isActive: true },
      orderBy: { code: 'asc' },
    });
  }

  private whIncludes() {
    return { plant: { select: { id: true, name: true, code: true } } };
  }
}
