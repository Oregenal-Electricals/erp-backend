import { StockLedgerService } from './stock-ledger.service';

describe('StockLedgerService.receiveFromIqc - STORE-009 raw material StockBatch creation', () => {
  let service: StockLedgerService;
  let prisma: any;
  let audit: any;
  const user = { id: 'user-1', companyId: 'company-1' };

  const grn = { id: 'grn-1', warehouseId: 'wh-1' };

  beforeEach(() => {
    prisma = {
      iqcInspection: { findFirst: jest.fn() },
      stockLedger: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'ledger-1', ...data })),
      },
      stockBalance: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
      },
      grnItem: { findFirst: jest.fn().mockResolvedValue({ landedCostPerUnit: 10, unitPrice: 10 }) },
      stockBatch: { create: jest.fn().mockResolvedValue({}) },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    service = new StockLedgerService(prisma, audit, {} as any);
  });

  it('creates a StockBatch when the accepted IqcItem has a batchNumber', async () => {
    prisma.iqcInspection.findFirst.mockResolvedValue({
      id: 'iqc-1', status: 'APPROVED', iqcNumber: 'IQC-2026-0001', grnId: 'grn-1', grn,
      items: [{ itemCode: 'DRIVER-01', itemName: 'LED Driver', acceptedQty: 1000, grnItemId: 'gi-1', batchNumber: 'DRV-B001' }],
    });
    await service.receiveFromIqc('iqc-1', user);
    expect(prisma.stockBatch.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        batchNumber: 'DRV-B001', itemCode: 'DRIVER-01', warehouseId: 'wh-1',
        originalQty: 1000, availableQty: 1000, status: 'ACTIVE',
      }),
    }));
  });

  it('does not create a StockBatch when the item has no batchNumber - not every material is batch-tracked', async () => {
    prisma.iqcInspection.findFirst.mockResolvedValue({
      id: 'iqc-1', status: 'APPROVED', iqcNumber: 'IQC-2026-0002', grnId: 'grn-1', grn,
      items: [{ itemCode: 'SCREW-01', itemName: 'Screw', acceptedQty: 500, grnItemId: 'gi-2', batchNumber: null }],
    });
    await service.receiveFromIqc('iqc-1', user);
    expect(prisma.stockBatch.create).not.toHaveBeenCalled();
  });

  it('still posts the stock ledger entry regardless of whether a batch is created', async () => {
    prisma.iqcInspection.findFirst.mockResolvedValue({
      id: 'iqc-1', status: 'APPROVED', iqcNumber: 'IQC-2026-0003', grnId: 'grn-1', grn,
      items: [{ itemCode: 'DRIVER-01', itemName: 'LED Driver', acceptedQty: 800, grnItemId: 'gi-1', batchNumber: 'DRV-B002' }],
    });
    const r = await service.receiveFromIqc('iqc-1', user);
    expect(prisma.stockLedger.create).toHaveBeenCalled();
    expect(r.entries.length).toBe(1);
  });

  it('does not fail the whole receipt if StockBatch creation fails (e.g. duplicate batch number)', async () => {
    prisma.stockBatch.create.mockRejectedValue(new Error('unique constraint'));
    prisma.iqcInspection.findFirst.mockResolvedValue({
      id: 'iqc-1', status: 'APPROVED', iqcNumber: 'IQC-2026-0004', grnId: 'grn-1', grn,
      items: [{ itemCode: 'DRIVER-01', itemName: 'LED Driver', acceptedQty: 800, grnItemId: 'gi-1', batchNumber: 'DRV-B003' }],
    });
    await expect(service.receiveFromIqc('iqc-1', user)).resolves.toBeDefined();
  });
});
