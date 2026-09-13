import { NotFoundException, BadRequestException } from '@nestjs/common';
import { StockLocationTransferService } from './stock-location-transfer.service';

describe('StockLocationTransferService - STORE-015', () => {
  let service: StockLocationTransferService;
  let prisma: any;
  let audit: any;
  let locationBalance: any;
  const user = { id: 'user-1', companyId: 'company-1' };

  const fromBin = { id: 'bin-A', warehouseId: 'wh-1', code: 'R01/B01', isActive: true, status: 'PARTIAL', currentQty: 500, maxQty: null };
  const toBin = { id: 'bin-B', warehouseId: 'wh-1', code: 'R02/B04', isActive: true, status: 'EMPTY', currentQty: 0, maxQty: null };

  function makeDto(qty: number, overrides: any = {}) {
    return { itemCode: 'DRIVER-01', itemName: 'LED Driver', uom: 'PCS', fromBinId: 'bin-A', toBinId: 'bin-B', qty, ...overrides };
  }

  beforeEach(() => {
    prisma = {
      warehouseBin: {
        findFirst: jest.fn().mockImplementation(({ where }: any) => {
          if (where.id === 'bin-A') return Promise.resolve({ ...fromBin });
          if (where.id === 'bin-B') return Promise.resolve({ ...toBin });
          return Promise.resolve(null);
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      stockTransfer: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'xfer-1', ...data, items: data.items?.create || [] })),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    locationBalance = {
      getBalance: jest.fn().mockResolvedValue({ qty: 500 }),
      adjustQty: jest.fn().mockResolvedValue(0),
      getByBin: jest.fn().mockResolvedValue([]),
      getByItem: jest.fn().mockResolvedValue([]),
    };
    service = new StockLocationTransferService(prisma, audit, locationBalance);
  });

  it('performs a simple free transfer (STORE-015 test 1)', async () => {
    const r = await service.transfer(makeDto(200) as any, user);
    expect(r.id).toBe('xfer-1');
    expect(locationBalance.adjustQty).toHaveBeenCalledWith(expect.objectContaining({ binId: 'bin-A', deltaQty: -200 }));
    expect(locationBalance.adjustQty).toHaveBeenCalledWith(expect.objectContaining({ binId: 'bin-B', deltaQty: 200 }));
  });

  it('supports a full transfer (source goes to exactly zero)', async () => {
    await service.transfer(makeDto(500) as any, user);
    expect(prisma.warehouseBin.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'bin-A' }, data: expect.objectContaining({ currentQty: 0, status: 'EMPTY' }),
    }));
  });

  it('blocks an over-transfer beyond what is actually in the source bin (test 4)', async () => {
    locationBalance.getBalance.mockResolvedValue({ qty: 100 });
    await expect(service.transfer(makeDto(150) as any, user)).rejects.toThrow(/exceeds what is actually available/);
    expect(locationBalance.adjustQty).not.toHaveBeenCalled();
  });

  it('blocks a same-bin transfer (test 5)', async () => {
    await expect(service.transfer(makeDto(100, { toBinId: 'bin-A' }) as any, user)).rejects.toThrow(/cannot be the same/);
  });

  it('blocks a transfer to a different warehouse - not a simple location transfer', async () => {
    prisma.warehouseBin.findFirst = jest.fn().mockImplementation(({ where }: any) => {
      if (where.id === 'bin-A') return Promise.resolve({ ...fromBin });
      if (where.id === 'bin-B') return Promise.resolve({ ...toBin, warehouseId: 'wh-2' });
      return Promise.resolve(null);
    });
    await expect(service.transfer(makeDto(100) as any, user)).rejects.toThrow(/different warehouses/);
  });

  it('blocks a transfer to a BLOCKED destination bin (test 12)', async () => {
    prisma.warehouseBin.findFirst = jest.fn().mockImplementation(({ where }: any) => {
      if (where.id === 'bin-A') return Promise.resolve({ ...fromBin });
      if (where.id === 'bin-B') return Promise.resolve({ ...toBin, status: 'BLOCKED' });
      return Promise.resolve(null);
    });
    await expect(service.transfer(makeDto(100) as any, user)).rejects.toThrow(/blocked or inactive/);
  });

  it('blocks a transfer that would exceed destination bin capacity (test 13)', async () => {
    prisma.warehouseBin.findFirst = jest.fn().mockImplementation(({ where }: any) => {
      if (where.id === 'bin-A') return Promise.resolve({ ...fromBin });
      if (where.id === 'bin-B') return Promise.resolve({ ...toBin, maxQty: 150, currentQty: 100 });
      return Promise.resolve(null);
    });
    await expect(service.transfer(makeDto(100) as any, user)).rejects.toThrow(/can only hold 150/);
  });

  it('preserves status - a HOLD transfer stays HOLD, never defaults to AVAILABLE', async () => {
    await service.transfer(makeDto(100, { status: 'HOLD' }) as any, user);
    expect(locationBalance.adjustQty).toHaveBeenCalledWith(expect.objectContaining({ status: 'HOLD' }));
    expect(locationBalance.getBalance).toHaveBeenCalledWith('company-1', 'DRIVER-01', 'bin-A', null, 'HOLD');
  });

  it('preserves batch identity across the move (STORE-015 test 6)', async () => {
    const r = await service.transfer(makeDto(100, { batchId: 'batch-DRV-B001' }) as any, user);
    expect(r.items[0].batchId).toBe('batch-DRV-B001');
    expect(locationBalance.adjustQty).toHaveBeenCalledWith(expect.objectContaining({ batchId: 'batch-DRV-B001' }));
  });

  it('throws NotFoundException for a source bin that does not exist', async () => {
    await expect(service.transfer(makeDto(100, { fromBinId: 'missing' }) as any, user)).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException for a destination bin that does not exist', async () => {
    await expect(service.transfer(makeDto(100, { toBinId: 'missing' }) as any, user)).rejects.toThrow(NotFoundException);
  });

  it('records the movement via the existing StockTransfer model as INTRA_WAREHOUSE, not a new parallel table', async () => {
    await service.transfer(makeDto(100) as any, user);
    expect(prisma.stockTransfer.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ transferType: 'INTRA_WAREHOUSE', fromBinId: 'bin-A', toBinId: 'bin-B' }),
    }));
  });

  it('logs the audit trail', async () => {
    const r = await service.transfer(makeDto(100) as any, user);
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ tableName: 'stock_transfers', action: 'CREATE', recordId: r.id }));
  });
});
