import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateZoneDto, CreateRackDto, CreateBinDto, BulkCreateBinsDto, UpdateBinStatusDto, GenerateRackLocationsDto } from './dto/rack-bin.dto';

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
      // Bins generated via generateRackLocations() carry a vertical-first
      // sequenceOrder; manually-created bins have sequenceOrder = null and
      // simply fall back to code ordering, so this stays backward-compatible.
      orderBy: [{ sequenceOrder: 'asc' }, { code: 'asc' }],
    });
  }

  async findEmptyBins(warehouseId: string, user: any) {
    return this.prisma.warehouseBin.findMany({
      where: { warehouseId, companyId: user.companyId, status: 'EMPTY', isActive: true },
      include: { rack: { select: { code: true, name: true } } },
      orderBy: [{ sequenceOrder: 'asc' }, { code: 'asc' }],
    });
  }

  // STORE task #56 — vertical-first bin/location auto-generation.
  //
  // Physical racks here are vertical: each rack has `bays` side-by-side
  // bay-columns, and each bay-column has `levels` shelf-levels stacked
  // vertically. The old bulkCreateBins() only ever produced a single flat
  // sequence (`PREFIX-01, PREFIX-02, ...`) with no bay/level dimension at
  // all, so there was no horizontal-vs-vertical ordering to begin with.
  // This generates real bay x level coordinates and walks them
  // vertical-first: ALL levels within bay 1 are created before moving on
  // to bay 2 (not all bays at level 1 before moving to level 2).
  async generateRackLocations(dto: GenerateRackLocationsDto, user: any) {
    const rack = await this.prisma.warehouseRack.findFirst({
      where: { id: dto.rackId, warehouseId: dto.warehouseId, companyId: user.companyId },
    });
    if (!rack) throw new NotFoundException('Rack not found in this warehouse');

    if (dto.bays > 676) throw new BadRequestException('bays must be 676 or fewer (A..ZZ)');
    if (dto.levels > 999) throw new BadRequestException('levels must be 999 or fewer');

    const existing = await this.prisma.warehouseBin.findMany({
      where: { rackId: dto.rackId, companyId: user.companyId },
      select: { code: true },
    });
    const existingCodes = new Set(existing.map((b) => b.code));

    const prefix = (dto.codePrefix || rack.code).toUpperCase();
    const toCreate: any[] = [];
    const skipped: string[] = [];

    // Outer loop = bay (column), inner loop = level (shelf) → vertical-first.
    for (let bayIdx = 0; bayIdx < dto.bays; bayIdx++) {
      const bayLetter = this.bayIndexToLetters(bayIdx);
      for (let level = 1; level <= dto.levels; level++) {
        const code = `${prefix}-${bayLetter}${level}`;
        const sequenceOrder = bayIdx * dto.levels + level; // 1-based, vertical-first
        if (existingCodes.has(code)) {
          skipped.push(code);
          continue;
        }
        toCreate.push({
          code,
          bay: bayLetter,
          level,
          sequenceOrder,
          name: `${rack.name} / Bay ${bayLetter} / Level ${level}`,
          warehouseId: dto.warehouseId,
          rackId: dto.rackId,
          maxQty: dto.maxQty,
          maxWeight: dto.maxWeight,
          companyId: user.companyId,
          createdBy: user.id,
          updatedBy: user.id,
        });
      }
    }

    if (toCreate.length > 0) {
      await this.prisma.warehouseBin.createMany({ data: toCreate });
    }

    const totalBins = await this.prisma.warehouseBin.count({ where: { rackId: dto.rackId, companyId: user.companyId } });
    await this.prisma.warehouseRack.update({ where: { id: dto.rackId }, data: { totalBins, updatedBy: user.id } });

    await this.audit.log({
      tableName: 'warehouse_bins',
      recordId: dto.rackId,
      action: 'CREATE',
      newValues: { rackId: dto.rackId, bays: dto.bays, levels: dto.levels, created: toCreate.length, skipped: skipped.length, order: 'VERTICAL_FIRST' },
      changedBy: user.id,
      reason: `Generated ${toCreate.length} vertical-first bin locations for rack ${rack.code}`,
    });

    return {
      created: toCreate.length,
      skipped: skipped.length,
      skippedCodes: skipped,
      totalBinsInRack: totalBins,
      order: 'VERTICAL_FIRST',
      message: `${toCreate.length} bin location(s) created in vertical-first order${skipped.length ? `, ${skipped.length} skipped (already exist)` : ''}`,
    };
  }

  // 0 -> A, 1 -> B, ..., 25 -> Z, 26 -> AA, 27 -> AB, ...
  private bayIndexToLetters(index: number): string {
    let n = index;
    let result = '';
    do {
      result = String.fromCharCode(65 + (n % 26)) + result;
      n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    return result;
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
