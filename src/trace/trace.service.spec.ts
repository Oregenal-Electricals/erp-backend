import { NotFoundException } from '@nestjs/common';
import { TraceService } from './trace.service';

describe('TraceService - STORE-018 (genuinely missing, built here)', () => {
  let service: TraceService;
  let prisma: any;
  const user = { companyId: 'company-1' };

  const batch = { id: 'batch-1', companyId: 'company-1', itemCode: 'DRIVER-01', itemName: 'LED Driver', batchNumber: 'DRV-B001', grnId: 'grn-1', status: 'ACTIVE', availableQty: 400, reservedQty: 100, mfgDate: null, expiryDate: null, receivedDate: new Date('2026-01-01') };

  beforeEach(() => {
    prisma = {
      stockBatch: { findFirst: jest.fn().mockResolvedValue(null), findMany: jest.fn().mockResolvedValue([]) },
      stockBalance: { findFirst: jest.fn().mockResolvedValue(null), findMany: jest.fn().mockResolvedValue([]) },
      grnHeader: { findFirst: jest.fn().mockResolvedValue(null) },
      purchaseOrder: { findFirst: jest.fn().mockResolvedValue(null) },
      iqcItem: { findMany: jest.fn().mockResolvedValue([]) },
      stockPutawayItem: { findMany: jest.fn().mockResolvedValue([]) },
      materialReservation: { findMany: jest.fn().mockResolvedValue([]) },
      productionIssueItem: { findMany: jest.fn().mockResolvedValue([]) },
      productionMaterialReturn: { findMany: jest.fn().mockResolvedValue([]) },
      stockTransferItem: { findMany: jest.fn().mockResolvedValue([]) },
      stockAdjustmentItem: { findMany: jest.fn().mockResolvedValue([]) },
      rtvRequest: { findMany: jest.fn().mockResolvedValue([]) },
      stockLocationBalance: { findMany: jest.fn().mockResolvedValue([]) },
    };
    service = new TraceService(prisma);
  });

  it('resolves an exact batch number match to the full batch-level trace', async () => {
    prisma.stockBatch.findFirst.mockResolvedValue(batch);
    const r = await service.search('DRV-B001', user);
    expect(r.identity.batchNumber).toBe('DRV-B001');
    expect(r.currentState.availableQty).toBe(400);
    expect(r.currentState.freeQty).toBe(300);
  });

  it('assembles GRN and PO into the timeline when the batch has a traceable receipt chain', async () => {
    prisma.stockBatch.findFirst.mockResolvedValue(batch);
    prisma.grnHeader.findFirst.mockResolvedValue({ grnNumber: 'GRN-001', poId: 'po-1', receivedDate: new Date('2026-01-02'), createdAt: new Date('2026-01-02') });
    prisma.purchaseOrder.findFirst.mockResolvedValue({ poNumber: 'PO-001', vendor: { name: 'Vendor A' }, createdAt: new Date('2026-01-01') });
    const r = await service.search('DRV-B001', user);
    expect(r.identity.poNumber).toBe('PO-001');
    expect(r.identity.grnNumber).toBe('GRN-001');
    expect(r.timeline.find((e: any) => e.stage === 'PO')).toBeTruthy();
    expect(r.timeline.find((e: any) => e.stage === 'GRN')).toBeTruthy();
  });

  it('sorts the assembled timeline chronologically regardless of query order', async () => {
    prisma.stockBatch.findFirst.mockResolvedValue(batch);
    prisma.stockPutawayItem.findMany.mockResolvedValue([{ qty: 100, bin: { code: 'R01/B01' }, putaway: { putawayNumber: 'PUT-1', createdAt: new Date('2026-03-01') } }]);
    prisma.productionIssueItem.findMany.mockResolvedValue([{ issuedQty: 50, productionIssue: { issueNumber: 'PI-1', createdAt: new Date('2026-02-01'), workOrder: { woNumber: 'WO-1' } } }]);
    const r = await service.search('DRV-B001', user);
    const stages = r.timeline.map((e: any) => e.stage);
    expect(stages.indexOf('ISSUE')).toBeLessThan(stages.indexOf('PUT_AWAY'));
  });

  it('includes RTV and its Gate-Out events for a rejected/returned batch', async () => {
    prisma.stockBatch.findFirst.mockResolvedValue(batch);
    prisma.rtvRequest.findMany.mockResolvedValue([{
      rtvNumber: 'RTV-1', requestedQty: 50, status: 'COMPLETED', vendor: { name: 'Vendor A' }, createdAt: new Date('2026-04-01'),
      gateOuts: [{ qty: 50, gatedOutAt: new Date('2026-04-05') }],
    }]);
    const r = await service.search('DRV-B001', user);
    expect(r.timeline.find((e: any) => e.stage === 'RTV')).toBeTruthy();
    expect(r.timeline.find((e: any) => e.stage === 'GATE_OUT')).toBeTruthy();
  });

  it('falls back to item-level trace when the query matches an item code with multiple batches, not one exact batch number', async () => {
    prisma.stockBatch.findFirst.mockImplementation(({ where }: any) => Promise.resolve(where.batchNumber ? null : { ...batch }));
    prisma.stockBalance.findMany.mockResolvedValue([{ itemCode: 'DRIVER-01', itemName: 'LED Driver', availableQty: 400, reservedQty: 100 }]);
    prisma.stockBatch.findMany.mockResolvedValue([batch]);
    const r = await service.search('DRIVER-01', user);
    expect(r.identity.itemCode).toBe('DRIVER-01');
    expect(r.currentState.batches).toHaveLength(1);
    expect(r.note).toMatch(/search a specific batch number/);
  });

  it('throws NotFoundException for a query matching nothing at all', async () => {
    await expect(service.search('NOTHING-HERE', user)).rejects.toThrow(NotFoundException);
  });
});
