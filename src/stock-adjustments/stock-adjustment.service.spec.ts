import { NotFoundException, BadRequestException } from '@nestjs/common';
import { StockAdjustmentService } from './stock-adjustment.service';

describe('StockAdjustmentService - STORE-016', () => {
  let service: StockAdjustmentService;
  let prisma: any;
  let audit: any;
  let stockLedger: any;
  const user = { id: 'user-1', companyId: 'company-1' };

  function makeDto(overrides: any = {}) {
    return {
      warehouseId: 'wh-1', adjustmentType: 'DECREASE', reason: 'COUNTING_ERROR',
      items: [{ itemCode: 'DRIVER-01', itemName: 'LED Driver', uom: 'PCS', physicalQty: 980, unitCost: 10 }],
      ...overrides,
    };
  }

  beforeEach(() => {
    let record: any = null;
    prisma = {
      stockAdjustment: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockImplementation(({ data }: any) => {
          const items = (data.items?.create || []).map((i: any, idx: number) => ({ id: `item-${idx}`, ...i }));
          record = { id: 'adj-1', ...data, items };
          return Promise.resolve(record);
        }),
        findFirst: jest.fn().mockImplementation(() => Promise.resolve(record ? { ...record } : null)),
        update: jest.fn().mockImplementation(({ data }: any) => { record = { ...record, ...data }; return Promise.resolve(record); }),
      },
      stockBalance: {
        findFirst: jest.fn().mockResolvedValue({ id: 'bal-1', availableQty: 1000, reservedQty: 100 }),
      },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    stockLedger = {
      getMaterialSummary: jest.fn().mockResolvedValue({ available: 1000, hold: 50, rejected: 20, qcPending: 10 }),
      postTransaction: jest.fn().mockResolvedValue({}),
    };
    service = new StockAdjustmentService(prisma, audit, stockLedger);
  });

  describe('create - systemQty is server-computed, never trusted from the caller', () => {
    it('computes systemQty from getMaterialSummary(), ignoring anything the caller might have sent for it', async () => {
      const r = await service.create(makeDto() as any, user);
      expect(stockLedger.getMaterialSummary).toHaveBeenCalledWith('DRIVER-01', user, 'wh-1');
      expect(r.items[0].systemQty).toBe(1000);
      expect(r.items[0].adjustmentQty).toBe(-20); // 980 - 1000
    });

    it('reads systemQty from the HOLD bucket when the line is scoped to HOLD status', async () => {
      const r = await service.create(makeDto({ items: [{ itemCode: 'DRIVER-01', itemName: 'LED Driver', uom: 'PCS', physicalQty: 40, unitCost: 10, status: 'HOLD' }] }) as any, user);
      expect(r.items[0].systemQty).toBe(50);
      expect(r.items[0].status).toBe('HOLD');
    });

    it('reads systemQty from the REJECTED bucket when scoped to REJECTED', async () => {
      const r = await service.create(makeDto({ adjustmentType: 'INCREASE', items: [{ itemCode: 'DRIVER-01', itemName: 'LED Driver', uom: 'PCS', physicalQty: 30, unitCost: 10, status: 'REJECTED' }] }) as any, user);
      expect(r.items[0].systemQty).toBe(20);
      expect(r.items[0].adjustmentQty).toBe(10);
    });

    it('rejects a DECREASE type when the computed variance is actually positive', async () => {
      await expect(service.create(makeDto({ items: [{ itemCode: 'DRIVER-01', itemName: 'LED Driver', uom: 'PCS', physicalQty: 1050, unitCost: 10 }] }) as any, user))
        .rejects.toThrow(/is more than systemQty/);
    });

    it('rejects an INCREASE type when the computed variance is actually negative', async () => {
      await expect(service.create(makeDto({ adjustmentType: 'INCREASE' }) as any, user)).rejects.toThrow(/is less than systemQty/);
    });

    it('blocks a duplicate material+status count line in the same submission', async () => {
      await expect(service.create(makeDto({
        adjustmentType: 'RECOUNT',
        items: [
          { itemCode: 'DRIVER-01', itemName: 'LED Driver', uom: 'PCS', physicalQty: 980, unitCost: 10 },
          { itemCode: 'DRIVER-01', itemName: 'LED Driver', uom: 'PCS', physicalQty: 990, unitCost: 10 },
        ],
      }) as any, user)).rejects.toThrow(/appears more than once/);
    });

    it('reports MATCHED (zero adjustmentQty) when physical equals system', async () => {
      const r = await service.create(makeDto({ adjustmentType: 'RECOUNT', items: [{ itemCode: 'DRIVER-01', itemName: 'LED Driver', uom: 'PCS', physicalQty: 1000, unitCost: 10 }] }) as any, user);
      expect(r.items[0].adjustmentQty).toBe(0);
    });
  });

  describe('approve - posting and reservation-shortfall protection', () => {
    it('posts a valid DECREASE adjustment to the stock ledger', async () => {
      const created = await service.create(makeDto() as any, user);
      await service.approve(created.id, user);
      expect(stockLedger.postTransaction).toHaveBeenCalledWith(expect.objectContaining({ itemCode: 'DRIVER-01', outQty: 20, inQty: 0 }));
    });

    it('blocks approval that would leave Reserved greater than the new Available (STORE-016 test 11)', async () => {
      prisma.stockBalance.findFirst.mockResolvedValue({ id: 'bal-1', availableQty: 1000, reservedQty: 900 });
      const created = await service.create(makeDto({ items: [{ itemCode: 'DRIVER-01', itemName: 'LED Driver', uom: 'PCS', physicalQty: 800, unitCost: 10 }] }) as any, user);
      await expect(service.approve(created.id, user)).rejects.toThrow(/Reservation shortfall|greater than the new Available/);
      expect(stockLedger.postTransaction).not.toHaveBeenCalled();
    });

    it('allows approval when the resulting Available still covers Reserved', async () => {
      prisma.stockBalance.findFirst.mockResolvedValue({ id: 'bal-1', availableQty: 1000, reservedQty: 100 });
      const created = await service.create(makeDto() as any, user); // -20, leaves 980 available >= 100 reserved
      const approved = await service.approve(created.id, user);
      expect(approved.status).toBe('APPROVED');
    });

    it('blocks insufficient-stock decreases', async () => {
      prisma.stockBalance.findFirst.mockResolvedValue({ id: 'bal-1', availableQty: 10, reservedQty: 0 });
      const created = await service.create(makeDto() as any, user);
      await expect(service.approve(created.id, user)).rejects.toThrow(/Insufficient stock/);
    });

    it('blocks posting a HOLD/REJECTED/QC_PENDING variance through the generic path - status preserved, not silently converted to Available', async () => {
      const created = await service.create(makeDto({ items: [{ itemCode: 'DRIVER-01', itemName: 'LED Driver', uom: 'PCS', physicalQty: 40, unitCost: 10, status: 'HOLD' }] }) as any, user);
      await expect(service.approve(created.id, user)).rejects.toThrow(/HOLD variance/);
      expect(stockLedger.postTransaction).not.toHaveBeenCalled();
    });

    it('skips items with zero variance entirely (MATCHED lines need no posting)', async () => {
      const created = await service.create(makeDto({ adjustmentType: 'RECOUNT', items: [{ itemCode: 'DRIVER-01', itemName: 'LED Driver', uom: 'PCS', physicalQty: 1000, unitCost: 10 }] }) as any, user);
      await service.approve(created.id, user);
      expect(stockLedger.postTransaction).not.toHaveBeenCalled();
    });

    it('rejects approving a non-DRAFT adjustment', async () => {
      const created = await service.create(makeDto() as any, user);
      await service.approve(created.id, user);
      await expect(service.approve(created.id, user)).rejects.toThrow(/Only DRAFT/);
    });
  });

  describe('reverse - validated, never a silent delete', () => {
    it('reverses an approved positive adjustment by posting the opposite movement', async () => {
      const created = await service.create(makeDto({ adjustmentType: 'INCREASE', items: [{ itemCode: 'DRIVER-01', itemName: 'LED Driver', uom: 'PCS', physicalQty: 1050, unitCost: 10 }] }) as any, user);
      await service.approve(created.id, user);
      stockLedger.postTransaction.mockClear();
      prisma.stockBalance.findFirst.mockResolvedValue({ id: 'bal-1', availableQty: 1050, reservedQty: 0 });
      const reversal = await service.reverse(created.id, user, 'Wrongly posted');
      expect(stockLedger.postTransaction).toHaveBeenCalledWith(expect.objectContaining({ outQty: 50, inQty: 0, referenceType: 'STOCK_ADJUSTMENT_REVERSAL' }));
      expect(reversal.reversedAdjustmentId).toBe(created.id);
    });

    it('blocks reversing a positive adjustment whose gained stock has since been used downstream (STORE-016 test 19)', async () => {
      const created = await service.create(makeDto({ adjustmentType: 'INCREASE', items: [{ itemCode: 'DRIVER-01', itemName: 'LED Driver', uom: 'PCS', physicalQty: 1100, unitCost: 10 }] }) as any, user);
      await service.approve(created.id, user);
      // +100 originally posted; only 20 remains now (80 already used elsewhere) - full reversal of 100 would go negative.
      prisma.stockBalance.findFirst.mockResolvedValue({ id: 'bal-1', availableQty: 20, reservedQty: 0 });
      await expect(service.reverse(created.id, user, 'test')).rejects.toThrow(/already been used downstream/);
    });

    it('rejects reversing a non-APPROVED adjustment', async () => {
      const created = await service.create(makeDto() as any, user);
      await expect(service.reverse(created.id, user, 'test')).rejects.toThrow(/Only an APPROVED/);
    });

    it('marks the original as REVERSED after a successful reversal', async () => {
      const created = await service.create(makeDto() as any, user);
      await service.approve(created.id, user);
      prisma.stockBalance.findFirst.mockResolvedValue({ id: 'bal-1', availableQty: 980, reservedQty: 0 });
      await service.reverse(created.id, user, 'test');
      expect(prisma.stockAdjustment.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: created.id }, data: expect.objectContaining({ status: 'REVERSED' }) }));
    });
  });
});
