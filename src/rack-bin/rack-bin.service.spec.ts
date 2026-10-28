import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RackBinService } from './rack-bin.service';

describe('RackBinService - generateRackLocations (task #56, vertical-first numbering)', () => {
  let service: RackBinService;
  let prisma: any;
  let audit: any;

  const user = { id: 'user-1', companyId: 'company-1' };

  const rack = { id: 'rack-1', companyId: 'company-1', warehouseId: 'wh-1', code: 'RACK01', name: 'Rack 1', totalBins: 0 };

  let createdBins: any[] = [];

  beforeEach(() => {
    createdBins = [];
    prisma = {
      warehouseRack: {
        findFirst: jest.fn().mockResolvedValue(rack),
        update: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ ...rack, ...data })),
      },
      warehouseBin: {
        findMany: jest.fn().mockResolvedValue([]), // no pre-existing bins by default
        createMany: jest.fn().mockImplementation(({ data }: any) => {
          createdBins = data;
          return Promise.resolve({ count: data.length });
        }),
        count: jest.fn().mockImplementation(() => Promise.resolve(createdBins.length)),
      },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    service = new RackBinService(prisma, audit);
  });

  it('walks vertical-first: all levels within bay A before moving to bay B', async () => {
    await service.generateRackLocations({ warehouseId: 'wh-1', rackId: 'rack-1', bays: 3, levels: 5 }, user);

    expect(createdBins).toHaveLength(15);
    // First 5 created rows must all be bay A (levels 1..5), in order,
    // BEFORE any bay B row appears — that is what "vertical-first" means.
    const codes = createdBins.map((b) => b.code);
    expect(codes.slice(0, 5)).toEqual(['RACK01-A1', 'RACK01-A2', 'RACK01-A3', 'RACK01-A4', 'RACK01-A5']);
    expect(codes.slice(5, 10)).toEqual(['RACK01-B1', 'RACK01-B2', 'RACK01-B3', 'RACK01-B4', 'RACK01-B5']);
    expect(codes.slice(10, 15)).toEqual(['RACK01-C1', 'RACK01-C2', 'RACK01-C3', 'RACK01-C4', 'RACK01-C5']);
  });

  it('assigns a monotonically increasing sequenceOrder that matches vertical-first order, and tags bay/level', async () => {
    await service.generateRackLocations({ warehouseId: 'wh-1', rackId: 'rack-1', bays: 2, levels: 3 }, user);

    expect(createdBins.map((b) => b.sequenceOrder)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(createdBins[0]).toMatchObject({ bay: 'A', level: 1, sequenceOrder: 1 });
    expect(createdBins[3]).toMatchObject({ bay: 'B', level: 1, sequenceOrder: 4 });
  });

  it('would number horizontal-first (row-by-row) differently than vertical-first, proving the fix changes real ordering', async () => {
    await service.generateRackLocations({ warehouseId: 'wh-1', rackId: 'rack-1', bays: 3, levels: 2 }, user);
    const codes = createdBins.map((b) => b.code);
    // Vertical-first: A1,A2,B1,B2,C1,C2 — NOT the horizontal-first A1,B1,C1,A2,B2,C2.
    expect(codes).toEqual(['RACK01-A1', 'RACK01-A2', 'RACK01-B1', 'RACK01-B2', 'RACK01-C1', 'RACK01-C2']);
  });

  it('skips codes that already exist on the rack instead of duplicating them', async () => {
    prisma.warehouseBin.findMany.mockResolvedValue([{ code: 'RACK01-A1' }]);
    const result = await service.generateRackLocations({ warehouseId: 'wh-1', rackId: 'rack-1', bays: 2, levels: 1 }, user);

    expect(result.created).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.skippedCodes).toEqual(['RACK01-A1']);
    expect(createdBins.map((b) => b.code)).toEqual(['RACK01-B1']);
  });

  it('uses bayLetter AA, AB, ... once bay count exceeds 26 (A-Z exhausted)', async () => {
    await service.generateRackLocations({ warehouseId: 'wh-1', rackId: 'rack-1', bays: 27, levels: 1 }, user);
    expect(createdBins[25].code).toBe('RACK01-Z1');
    expect(createdBins[26].code).toBe('RACK01-AA1');
  });

  it('updates the rack totalBins count after generation', async () => {
    await service.generateRackLocations({ warehouseId: 'wh-1', rackId: 'rack-1', bays: 2, levels: 2 }, user);
    expect(prisma.warehouseRack.update).toHaveBeenCalledWith({
      where: { id: 'rack-1' },
      data: { totalBins: 4, updatedBy: user.id },
    });
  });

  it('writes an audit log entry recording the vertical-first generation', async () => {
    await service.generateRackLocations({ warehouseId: 'wh-1', rackId: 'rack-1', bays: 1, levels: 1 }, user);
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({
      tableName: 'warehouse_bins',
      action: 'CREATE',
      changedBy: user.id,
      newValues: expect.objectContaining({ order: 'VERTICAL_FIRST' }),
    }));
  });

  it('throws NotFoundException when the rack does not belong to the warehouse/company', async () => {
    prisma.warehouseRack.findFirst.mockResolvedValue(null);
    await expect(service.generateRackLocations({ warehouseId: 'wh-1', rackId: 'missing', bays: 1, levels: 1 }, user))
      .rejects.toThrow(NotFoundException);
  });

  it('rejects an unreasonably large bay or level count', async () => {
    await expect(service.generateRackLocations({ warehouseId: 'wh-1', rackId: 'rack-1', bays: 1000, levels: 1 }, user))
      .rejects.toThrow(BadRequestException);
    await expect(service.generateRackLocations({ warehouseId: 'wh-1', rackId: 'rack-1', bays: 1, levels: 1000 }, user))
      .rejects.toThrow(BadRequestException);
  });

  it('honours an explicit codePrefix instead of the rack code', async () => {
    await service.generateRackLocations({ warehouseId: 'wh-1', rackId: 'rack-1', bays: 1, levels: 1, codePrefix: 'custom' }, user);
    expect(createdBins[0].code).toBe('CUSTOM-A1');
  });
});

describe('RackBinService - findBins ordering stays backward-compatible', () => {
  it('orders by sequenceOrder first, falling back to code for manually-entered bins (sequenceOrder null)', async () => {
    const prisma: any = {
      warehouseBin: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const audit: any = { log: jest.fn() };
    const service = new RackBinService(prisma, audit);

    await service.findBins('rack-1', { id: 'user-1', companyId: 'company-1' });

    expect(prisma.warehouseBin.findMany).toHaveBeenCalledWith(expect.objectContaining({
      orderBy: [{ sequenceOrder: 'asc' }, { code: 'asc' }],
    }));
  });
});
