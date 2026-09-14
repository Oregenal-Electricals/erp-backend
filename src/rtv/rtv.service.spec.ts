import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RtvService } from './rtv.service';

describe('RtvService - STORE-017', () => {
  let service: RtvService;
  let prisma: any;
  let audit: any;
  const user = { id: 'user-1', companyId: 'company-1' };

  const rejectedItem = { id: 'ri-1', rejectedStockId: 'rs-1', itemCode: 'DRIVER-01', itemName: 'LED Driver', uom: 'PCS', rejectedQty: 100, disposition: 'PENDING' };
  const rejectedStock = { id: 'rs-1', grnId: 'grn-1' };
  const grn = { id: 'grn-1', poId: 'po-1' };
  const po = { id: 'po-1', vendorId: 'vendor-A' };

  function makeRequestDto(overrides: any = {}) {
    return { rejectedStockItemId: 'ri-1', requestedQty: 100, reason: 'IQC_FAILED', ...overrides };
  }

  beforeEach(() => {
    let rtvRecord: any = null;
    let itemRecord = { ...rejectedItem };
    prisma = {
      rejectedStockItem: {
        findFirst: jest.fn().mockImplementation(() => Promise.resolve({ ...itemRecord })),
        update: jest.fn().mockImplementation(({ data }: any) => { itemRecord = { ...itemRecord, ...data, rejectedQty: data.rejectedQty?.decrement !== undefined ? itemRecord.rejectedQty - data.rejectedQty.decrement : (data.rejectedQty ?? itemRecord.rejectedQty) }; return Promise.resolve(itemRecord); }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      rejectedStock: { findFirst: jest.fn().mockResolvedValue(rejectedStock) },
      grnHeader: { findFirst: jest.fn().mockResolvedValue(grn) },
      purchaseOrder: { findFirst: jest.fn().mockResolvedValue(po) },
      rtvRequest: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockImplementation(({ data }: any) => { rtvRecord = { id: 'rtv-1', gateOuts: [], status: 'DRAFT', gateOutQty: 0, preparedQty: 0, ...data }; return Promise.resolve(rtvRecord); }),
        findFirst: jest.fn().mockImplementation(() => Promise.resolve(rtvRecord ? { ...rtvRecord } : null)),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn().mockImplementation(({ data }: any) => { rtvRecord = { ...rtvRecord, ...data }; return Promise.resolve(rtvRecord); }),
      },
      rtvGateOut: { create: jest.fn().mockResolvedValue({}) },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    service = new RtvService(prisma, audit);
  });

  describe('request - authorization chain', () => {
    it('creates a valid RTV request and derives the vendor from the GRN/PO chain (test 1)', async () => {
      const r = await service.request(makeRequestDto() as any, user);
      expect(r.vendorId).toBe('vendor-A');
      expect(r.status).toBe('DRAFT');
      expect(prisma.rejectedStockItem.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ disposition: 'RTV' }) }));
    });

    it('blocks a request exceeding the eligible rejected qty (over-RTV, test 3)', async () => {
      await expect(service.request(makeRequestDto({ requestedQty: 120 }) as any, user)).rejects.toThrow(/exceeds the eligible remaining/);
    });

    it('blocks a request against HOLD-dispositioned material (test 13)', async () => {
      prisma.rejectedStockItem.findFirst.mockResolvedValue({ ...rejectedItem, disposition: 'SCRAPPED' });
      await expect(service.request(makeRequestDto() as any, user)).rejects.toThrow(/disposition is SCRAPPED/);
    });

    it('accounts for other still-active RTV requests when computing eligible qty', async () => {
      prisma.rtvRequest.findMany.mockResolvedValue([{ id: 'other', requestedQty: 60, approvedQty: 60, status: 'AUTHORIZED' }]);
      await expect(service.request(makeRequestDto({ requestedQty: 50 }) as any, user)).rejects.toThrow(/exceeds the eligible remaining/);
    });
  });

  describe('decide - partial authorization', () => {
    it('supports partial RTV approval (test 2)', async () => {
      const created = await service.request(makeRequestDto() as any, user);
      const decided = await service.decide(created.id, { action: 'AUTHORIZED', approvedQty: 60 } as any, user);
      expect(decided.approvedQty).toBe(60);
      expect(decided.status).toBe('AUTHORIZED');
    });

    it('blocks approving more than requested', async () => {
      const created = await service.request(makeRequestDto() as any, user);
      await expect(service.decide(created.id, { action: 'AUTHORIZED', approvedQty: 150 } as any, user)).rejects.toThrow(/cannot exceed the requested/);
    });
  });

  describe('prepare - actual physical pick', () => {
    it('records a short pick rather than assuming approved qty was found (test 4)', async () => {
      const created = await service.request(makeRequestDto() as any, user);
      await service.decide(created.id, { action: 'AUTHORIZED' } as any, user);
      const prepared = await service.prepare(created.id, { preparedQty: 95 } as any, user);
      expect(prepared.preparedQty).toBe(95);
      expect(prepared.status).toBe('READY_FOR_GATE_OUT');
    });

  });

  describe('gateOut - the only point custody actually reduces', () => {
    async function setupReady(preparedQty = 100) {
      const created = await service.request(makeRequestDto() as any, user);
      await service.decide(created.id, { action: 'AUTHORIZED' } as any, user);
      await service.prepare(created.id, { preparedQty } as any, user);
      return created;
    }

    it('does not reduce plant custody merely by preparing (test 7)', async () => {
      await setupReady(100);
      expect(prisma.rejectedStockItem.update).not.toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ rejectedQty: expect.anything() }) }));
    });

    it('supports a partial Gate-Out (test 5)', async () => {
      const rtv = await setupReady(100);
      const r = await service.gateOut(rtv.id, { qty: 60 } as any, user);
      expect(r.gateOutQty).toBe(60);
      expect(r.status).toBe('PARTIALLY_GATE_OUT');
      expect(prisma.rejectedStockItem.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ rejectedQty: { decrement: 60 } }) }));
    });

    it('completes on the final Gate-Out reaching prepared qty (test 6)', async () => {
      const rtv = await setupReady(100);
      await service.gateOut(rtv.id, { qty: 60 } as any, user);
      const r = await service.gateOut(rtv.id, { qty: 40 } as any, user);
      expect(r.gateOutQty).toBe(100);
      expect(r.status).toBe('COMPLETED');
    });

    it('blocks a Gate-Out that exceeds the remaining prepared qty', async () => {
      const rtv = await setupReady(100);
      await service.gateOut(rtv.id, { qty: 60 } as any, user);
      await expect(service.gateOut(rtv.id, { qty: 60 } as any, user)).rejects.toThrow(/exceeds what remains prepared/);
    });

    it('blocks Gate-Out if the rejected item no longer physically has enough', async () => {
      const rtv = await setupReady(100);
      prisma.rejectedStockItem.findFirst.mockResolvedValue({ ...rejectedItem, rejectedQty: 30 });
      await expect(service.gateOut(rtv.id, { qty: 60 } as any, user)).rejects.toThrow(/only 30 remains in rejected plant custody/);
    });
  });

  describe('cancel - never restores what already physically left', () => {
    it('fully cancels an unshipped RTV (test 8)', async () => {
      const created = await service.request(makeRequestDto() as any, user);
      const cancelled = await service.cancel(created.id, user);
      expect(cancelled.status).toBe('CANCELLED');
    });

    it('marks a partially-shipped RTV COMPLETED on cancel, not CANCELLED - the 60 already out stays out (test 9)', async () => {
      const created = await service.request(makeRequestDto() as any, user);
      await service.decide(created.id, { action: 'AUTHORIZED' } as any, user);
      await service.prepare(created.id, { preparedQty: 100 } as any, user);
      await service.gateOut(created.id, { qty: 60 } as any, user);
      const cancelled = await service.cancel(created.id, user);
      expect(cancelled.status).toBe('COMPLETED');
      expect(cancelled.gateOutQty).toBe(60);
    });

    it('blocks cancelling an already-COMPLETED RTV', async () => {
      const created = await service.request(makeRequestDto() as any, user);
      await service.decide(created.id, { action: 'AUTHORIZED' } as any, user);
      await service.prepare(created.id, { preparedQty: 100 } as any, user);
      await service.gateOut(created.id, { qty: 100 } as any, user);
      await expect(service.cancel(created.id, user)).rejects.toThrow(/already COMPLETED/);
    });
  });
});
