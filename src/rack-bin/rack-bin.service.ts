import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateZoneDto, CreateRackDto, CreateBinDto, BulkCreateBinsDto, UpdateBinStatusDto } from './dto/rack-bin.dto';

@Injectable()
export class RackBinService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  // ZONES
  async createZone(dto: CreateZoneDto, user: any) {
    const existing = await this.prisma.warehouseZone.findFirst({ where: { companyId: user.companyId, warehouseId: dto.warehouseId, code: dto.code } });
    if (existing) throw new ConflictException(`Zone ${dto.code} already exists`);
    return this.prisma.warehouseZone.create({ data: { ...dto, companyId: user.companyId, createdBy: user.id, updatedBy: user.id } });
  }

  async findZones(warehouseId: string, user: any) {
    return this.prisma.warehouseZone.findMany({
      where: { warehouseId, companyId: user.companyId, isActive: true },
      include: { _count: { select: { racks: true } } },
      orderBy: { code: 'asc' },
    });
  }

  // RACKS
  async createRack(dto: CreateRackDto, user: any) {
    const existing = await this.prisma.warehouseRack.findFirst({ where: { companyId: user.companyId, warehouseId: dto.warehouseId, code: dto.code } });
    if (existing) throw new ConflictException(`Rack ${dto.code} already exists`);
    return this.prisma.warehouseRack.create({
      data: { ...dto, companyId: user.companyId, createdBy: user.id, updatedBy: user.id },
      include: { zone: { select: { code: true, name: true } } },
    });
  }

  async findRacks(warehouseId: string, user: any, zoneId?: string) {
    const where: any = { warehouseId, companyId: user.companyId, isActive: true };
    if (zoneId) where.zoneId = zoneId;
    return this.prisma.warehouseRack.findMany({
      where,
      include: {
        zone: { select: { code: true, name: true } },
        _count: { select: { bins: true } },
      },
      orderBy: { code: 'asc' },
    });
  }

  // BINS
  async createBin(dto: CreateBinDto, user: any) {
    const existing = await this.prisma.warehouseBin.findFirst({ where: { companyId: user.companyId, warehouseId: dto.warehouseId, code: dto.code } });
    if (existing) throw new ConflictException(`Bin ${dto.code} already exists`);
    return this.prisma.warehouseBin.create({
      data: { ...dto, companyId: user.companyId, createdBy: user.id, updatedBy: user.id },
      include: { rack: { select: { code: true, name: true } } },
    });
  }

  async bulkCreateBins(dto: BulkCreateBinsDto, user: any) {
    const bins = [];
    for (let i = 1; i <= dto.count; i++) {
      const code = `${dto.prefix}-${String(i).padStart(2, '0')}`;
      const existing = await this.prisma.warehouseBin.findFirst({ where: { companyId: user.companyId, warehouseId: dto.warehouseId, code } });
      if (!existing) {
        bins.push({ code, warehouseId: dto.warehouseId, rackId: dto.rackId, maxQty: dto.maxQty, companyId: user.companyId, createdBy: user.id, updatedBy: user.id });
      }
    }
    await this.prisma.warehouseBin.createMany({ data: bins });
    // Update rack totalBins
    const totalBins = await this.prisma.warehouseBin.count({ where: { rackId: dto.rackId, companyId: user.companyId } });
    await this.prisma.warehouseRack.update({ where: { id: dto.rackId }, data: { totalBins, updatedBy: user.id } });
    return { created: bins.length, message: `${bins.length} bins created` };
  }

  async findBins(rackId: string, user: any) {
    return this.prisma.warehouseBin.findMany({
      where: { rackId, companyId: user.companyId, isActive: true },
      include: { rack: { select: { code: true, name: true } } },
      orderBy: { code: 'asc' },
    });
  }

  async findEmptyBins(warehouseId: string, user: any) {
    return this.prisma.warehouseBin.findMany({
      where: { warehouseId, companyId: user.companyId, status: 'EMPTY', isActive: true },
      include: { rack: { select: { code: true, name: true } } },
      orderBy: { code: 'asc' },
    });
  }

  async updateBinStatus(id: string, dto: UpdateBinStatusDto, user: any) {
    return this.prisma.warehouseBin.update({
      where: { id }, data: { ...dto, updatedBy: user.id },
    });
  }

  async getWarehouseStats(warehouseId: string, user: any) {
    const where = { warehouseId, companyId: user.companyId };
    const [totalZones, totalRacks, totalBins, emptyBins, partialBins, fullBins] = await Promise.all([
      this.prisma.warehouseZone.count({ where }),
      this.prisma.warehouseRack.count({ where }),
      this.prisma.warehouseBin.count({ where }),
      this.prisma.warehouseBin.count({ where: { ...where, status: 'EMPTY' } }),
      this.prisma.warehouseBin.count({ where: { ...where, status: 'PARTIAL' } }),
      this.prisma.warehouseBin.count({ where: { ...where, status: 'FULL' } }),
    ]);
    const utilization = totalBins > 0 ? Math.round(((totalBins - emptyBins) / totalBins) * 100) : 0;
    return { totalZones, totalRacks, totalBins, emptyBins, partialBins, fullBins, utilization };
  }
}
