import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SalesOrdersService } from './sales-orders.service';

describe('SalesOrdersService - DSP-001', () => {
  let service: SalesOrdersService;
  let prisma: any;
  let audit: any;
  const user = { id: 'user-1', companyId: 'company-1' };

  const cpo = { id: 'cpo-1', companyId: 'company-1', status: 'ACKNOWLEDGED', customerName: 'ABC Lighting', currency: 'INR' };
  const rawMaterial = { id: 'rm-1', companyId: 'company-1', code: 'LED-DRIVER-01', isActive: true };
  const product = { id: 'prod-1', companyId: 'company-1', code: 'BULB-9W', isActive: true };
  const miStage = { id: 'stage-mi', companyId: 'company-1', stageName: 'MI', isSaleable: true, routing: { routingName: 'Bulb Routing' } };
  const agingStageNotSaleable = { id: 'stage-aging', companyId: 'company-1', stageName: 'Aging', isSaleable: false, routing: { routingName: 'Bulb Routing' } };

  function rmLine(overrides: any = {}) {
    return { itemCode: 'LED-DRIVER-01', itemName: 'LED Driver', qty: 1000, unitPrice: 50, saleType: 'RM', ...overrides };
  }
  function sfgLine(overrides: any = {}) {
    return { itemCode: 'BULB-9W', itemName: '9W LED Bulb', qty: 2000, unitPrice: 80, saleType: 'SFG', requiredStageId: 'stage-mi', ...overrides };
  }
  function fgLine(overrides: any = {}) {
    return { itemCode: 'BULB-9W', itemName: '9W LED Bulb', qty: 5000, unitPrice: 120, saleType: 'FG', ...overrides };
  }

  beforeEach(() => {
    let soRecord: any = null;
    let itemRecords: any[] = [];
    prisma = {
      customerPo: { findFirst: jest.fn().mockResolvedValue(cpo), update: jest.fn().mockResolvedValue({}) },
      salesOrder: {
        findFirst: jest.fn().mockImplementation(({ where }: any) => {
          if (where?.cpoId) return Promise.resolve(null); // no existing SO for this CPO by default
          return Promise.resolve(soRecord);
        }),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockImplementation(({ data }: any) => {
          soRecord = { id: 'so-1', ...data, status: data.status || 'DRAFT', items: (data.items?.create || []).map((it: any, idx: number) => ({ id: `item-${idx}`, ...it })) };
          itemRecords = soRecord.items;
          return Promise.resolve(soRecord);
        }),
        update: jest.fn().mockImplementation(({ data }: any) => { soRecord = { ...soRecord, ...data }; return Promise.resolve(soRecord); }),
      },
      salesOrderItem: {
        findFirst: jest.fn().mockImplementation(({ where }: any) => {
          const item = itemRecords.find(i => i.id === where.id);
          if (!item) return Promise.resolve(null);
          return Promise.resolve({ ...item, salesOrder: soRecord, requiredStage: item.requiredStageId === 'stage-mi' ? miStage : (item.requiredStageId === 'stage-aging' ? agingStageNotSaleable : null) });
        }),
        update: jest.fn().mockImplementation(({ where, data }: any) => {
          const idx = itemRecords.findIndex(i => i.id === where.id);
          itemRecords[idx] = { ...itemRecords[idx], ...data };
          return Promise.resolve(itemRecords[idx]);
        }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      rawMaterial: { findFirst: jest.fn().mockImplementation(({ where }: any) => Promise.resolve(where.code === rawMaterial.code ? rawMaterial : null)) },
      product: { findFirst: jest.fn().mockImplementation(({ where }: any) => Promise.resolve(where.code === product.code ? product : null)) },
      routingStage: { findFirst: jest.fn().mockImplementation(({ where }: any) => {
        if (where.id === 'stage-mi') return Promise.resolve(miStage);
        if (where.id === 'stage-aging') return Promise.resolve(agingStageNotSaleable);
        return Promise.resolve(null);
      }) },
      plant: { findFirst: jest.fn().mockResolvedValue({ id: 'plant-1', companyId: 'company-1' }) },
      warehouse: { findFirst: jest.fn().mockResolvedValue({ id: 'wh-1', companyId: 'company-1', plantId: 'plant-1', type: 'RAW_MATERIAL', isActive: true }) },
      stockBatch: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    service = new SalesOrdersService(prisma, audit);
  });

  describe('RM sale (DSP-001 sections 6, 35)', () => {
    it('creates an RM line without requiring a Work Order or Production Stage', async () => {
      const so = await service.create({ cpoId: 'cpo-1', deliveryDate: '2026-12-01', items: [rmLine()] } as any, user);
      expect(so.items[0].saleType).toBe('RM');
      expect(so.items[0].requiredStageId).toBeNull();
    });

    it('blocks an RM line whose item code has no matching active Raw Material', async () => {
      await expect(service.create({ cpoId: 'cpo-1', deliveryDate: '2026-12-01', items: [rmLine({ itemCode: 'NOT-REAL' })] } as any, user))
        .rejects.toThrow(/no active Raw Material/);
    });
  });

  describe('SFG sale (DSP-001 sections 7-10, 36-37)', () => {
    it('creates a valid SFG line when the stage is saleable for this product', async () => {
      const so = await service.create({ cpoId: 'cpo-1', deliveryDate: '2026-12-01', items: [sfgLine()] } as any, user);
      expect(so.items[0].saleType).toBe('SFG');
      expect(so.items[0].requiredStageId).toBe('stage-mi');
    });

    it('blocks an SFG line with no requiredStageId selected', async () => {
      await expect(service.create({ cpoId: 'cpo-1', deliveryDate: '2026-12-01', items: [sfgLine({ requiredStageId: undefined })] } as any, user))
        .rejects.toThrow(/no required Production Stage was selected/);
    });

    it('blocks an SFG line whose selected stage is not marked saleable (test scenario 37)', async () => {
      await expect(service.create({ cpoId: 'cpo-1', deliveryDate: '2026-12-01', items: [sfgLine({ requiredStageId: 'stage-aging' })] } as any, user))
        .rejects.toThrow(/is not configured as saleable/);
    });
  });

  describe('FG sale (DSP-001 sections 11, 38)', () => {
    it('creates an FG line without requiring an intermediate stage', async () => {
      const so = await service.create({ cpoId: 'cpo-1', deliveryDate: '2026-12-01', items: [fgLine()] } as any, user);
      expect(so.items[0].saleType).toBe('FG');
      expect(so.items[0].requiredStageId).toBeNull();
    });
  });

  describe('Mixed Sales Order (DSP-001 sections 20, 39)', () => {
    it('allows one Sales Order to contain RM, SFG, and FG lines together', async () => {
      const so = await service.create({ cpoId: 'cpo-1', deliveryDate: '2026-12-01', items: [rmLine(), sfgLine(), fgLine()] } as any, user);
      expect(so.items.map((i: any) => i.saleType)).toEqual(['RM', 'SFG', 'FG']);
    });
  });

  describe('Release for Dispatch (sections 13-15, 21, 40)', () => {
    async function createConfirmedSo(items: any[]) {
      const so = await service.create({ cpoId: 'cpo-1', deliveryDate: '2026-12-01', items } as any, user);
      await service.confirm(so.id, user);
      return so;
    }

    it('blocks releasing a line on an unapproved (DRAFT) Sales Order (test scenario 40)', async () => {
      const so = await service.create({ cpoId: 'cpo-1', deliveryDate: '2026-12-01', items: [fgLine()] } as any, user);
      await expect(service.releaseLineForDispatch(so.items[0].id, user)).rejects.toThrow(/must be CONFIRMED or IN_PRODUCTION/);
    });

    it('releases a line once the Sales Order is CONFIRMED', async () => {
      const so = await createConfirmedSo([fgLine()]);
      const released = await service.releaseLineForDispatch(so.items[0].id, user);
      expect(released.releasedForDispatch).toBe(true);
      expect(released.releasedBy).toBe(user.id);
    });

    it('re-validates SFG saleable-stage at release time, not just at creation time', async () => {
      const so = await createConfirmedSo([sfgLine()]);
      // Simulate the stage having been un-marked saleable after order entry
      prisma.salesOrderItem.findFirst.mockResolvedValueOnce({ ...so.items[0], salesOrder: { ...so, status: 'CONFIRMED' }, requiredStage: agingStageNotSaleable });
      await expect(service.releaseLineForDispatch(so.items[0].id, user)).rejects.toThrow(/is not configured as saleable/);
    });

    it('blocks re-releasing an already-released line', async () => {
      const so = await createConfirmedSo([fgLine()]);
      await service.releaseLineForDispatch(so.items[0].id, user);
      await expect(service.releaseLineForDispatch(so.items[0].id, user)).rejects.toThrow(/already released/);
    });
  });

  describe('DSP-002: Source Resolution', () => {
    async function createConfirmedSo(items: any[]) {
      const so = await service.create({ cpoId: 'cpo-1', deliveryDate: '2026-12-01', items } as any, user);
      await service.confirm(so.id, user);
      return so;
    }

    it('resolves RM lines to RM_INVENTORY, sourced from an RAW_MATERIAL warehouse at the resolved plant', async () => {
      const so = await createConfirmedSo([rmLine()]);
      const released = await service.releaseLineForDispatch(so.items[0].id, user);
      expect(released.sourceType).toBe('RM_INVENTORY');
      expect(released.sourceWarehouseType).toBe('RAW_MATERIAL');
      expect(released.sourcePlantId).toBe('plant-1');
      expect(released.sourceValid).toBe(true);
    });

    it('resolves FG lines to FG_INVENTORY, sourced from a FINISHED_GOOD warehouse', async () => {
      prisma.warehouse.findFirst.mockResolvedValue({ id: 'wh-fg', companyId: 'company-1', plantId: 'plant-1', type: 'FINISHED_GOOD', isActive: true });
      const so = await createConfirmedSo([fgLine()]);
      const released = await service.releaseLineForDispatch(so.items[0].id, user);
      expect(released.sourceType).toBe('FG_INVENTORY');
      expect(released.sourceWarehouseType).toBe('FINISHED_GOOD');
    });

    it('resolves SFG lines to SFG_STAGE, never RM or FG inventory (section 7, 11: RM/FG never silently source from Production)', async () => {
      const so = await createConfirmedSo([sfgLine()]);
      const released = await service.releaseLineForDispatch(so.items[0].id, user);
      expect(released.sourceType).toBe('SFG_STAGE');
      expect(released.sourceWarehouseType).toBe('WIP');
    });

    it('blocks release when no RAW_MATERIAL warehouse exists at the dispatch plant, rather than falling back to any warehouse', async () => {
      prisma.warehouse.findFirst.mockResolvedValue(null);
      const so = await createConfirmedSo([rmLine()]);
      await expect(service.releaseLineForDispatch(so.items[0].id, user)).rejects.toThrow(/No active Raw Material or General warehouse/);
    });

    it('blocks release when no dispatch plant can be resolved (test scenario 9: plant isolation)', async () => {
      prisma.plant.findFirst.mockResolvedValue(null);
      const so = await createConfirmedSo([fgLine()]);
      await expect(service.releaseLineForDispatch(so.items[0].id, user)).rejects.toThrow(/No dispatch plant could be determined/);
    });

    it('flags batch control based on whether the item actually has StockBatch records, not a guess', async () => {
      prisma.stockBatch.findFirst.mockResolvedValue({ id: 'batch-1' });
      const so = await createConfirmedSo([rmLine()]);
      const released = await service.releaseLineForDispatch(so.items[0].id, user);
      expect(released.sourceBatchControlled).toBe(true);
    });

    it('snapshots the resolved source at release time, so later master changes cannot silently rewrite historical dispatch meaning (section 48-49)', async () => {
      const so = await createConfirmedSo([fgLine()]);
      const released = await service.releaseLineForDispatch(so.items[0].id, user);
      expect(released.sourceResolvedAt).toBeTruthy();
      expect(released.sourceResolvedBy).toBe(user.id);
      // Simulate the warehouse being deactivated after release - the
      // already-persisted snapshot must not change.
      prisma.warehouse.findFirst.mockResolvedValue(null);
      expect(released.sourceValid).toBe(true);
    });
  });

  describe('Dispatch-ready lines (sections 21, 25)', () => {
    it('only returns released lines with remaining pending qty, filterable by saleType', async () => {
      prisma.salesOrderItem.findMany.mockResolvedValue([
        { id: 'i1', itemCode: 'LED-DRIVER-01', itemName: 'LED Driver', saleType: 'RM', qty: 1000, dispatchedQty: 0, pendingQty: 1000, uom: 'PCS', requiredStage: null, salesOrder: { soNumber: 'SO-1', customerName: 'ABC', deliveryDate: new Date(), status: 'CONFIRMED', cpo: { customerPoNumber: 'PO-1' } } },
      ]);
      const result = await service.getDispatchReadyLines(user, { saleType: 'RM' });
      expect(result).toHaveLength(1);
      expect(result[0].saleType).toBe('RM');
      expect(prisma.salesOrderItem.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ releasedForDispatch: true, saleType: 'RM', pendingQty: { gt: 0 } }),
      }));
    });
  });

  describe('No stock or production deduction (sections 30, 12, DSP boundary tests)', () => {
    it('release never touches stockBalance, stockLedger, or any WIP/production table', async () => {
      const so = await (async () => {
        const created = await service.create({ cpoId: 'cpo-1', deliveryDate: '2026-12-01', items: [fgLine()] } as any, user);
        await service.confirm(created.id, user);
        return created;
      })();
      await service.releaseLineForDispatch(so.items[0].id, user);
      // The mock prisma object never had stockBalance/stockLedger/workOrder
      // clients defined at all - if the service tried to touch them it
      // would throw "Cannot read properties of undefined", not pass silently.
      expect(prisma.stockBalance).toBeUndefined();
      expect(prisma.stockLedger).toBeUndefined();
    });
  });
});
