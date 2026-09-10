import { IqcService } from './iqc.service';

describe('IqcService.create - STORE-005 heldQty exclusion', () => {
  let service: IqcService;
  let prisma: any;
  let audit: any;
  let stockLedger: any;

  const user = { id: 'user-1', companyId: 'company-1' };

  beforeEach(() => {
    prisma = {
      grnHeader: { findFirst: jest.fn() },
      iqcInspection: {
        count: jest.fn().mockResolvedValue(0),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'iqc-1', ...data })),
      },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    stockLedger = {};
    service = new IqcService(prisma, audit, stockLedger);
  });

  it('subtracts heldQty from receivedQty when building the IqcItem - held material never reaches IQC at all', async () => {
    prisma.grnHeader.findFirst.mockResolvedValue({
      id: 'grn-1', status: 'IQC_PENDING',
      items: [{ id: 'gi-1', itemCode: 'DRIVER-01', itemName: 'LED Driver', uom: 'PCS', receivedQty: 1000, heldQty: 20 }],
    });
    await service.create({ grnId: 'grn-1' } as any, user);
    const createCall = prisma.iqcInspection.create.mock.calls[0][0];
    const iqcItem = createCall.data.items.create[0];
    expect(iqcItem.receivedQty).toBe(980);
    expect(iqcItem.acceptedQty).toBe(980);
  });

  it('a line with no discrepancy (heldQty 0) is completely unaffected - full receivedQty flows through as before', async () => {
    prisma.grnHeader.findFirst.mockResolvedValue({
      id: 'grn-1', status: 'IQC_PENDING',
      items: [{ id: 'gi-1', itemCode: 'PCB-01', itemName: 'PCB', uom: 'PCS', receivedQty: 500, heldQty: 0 }],
    });
    await service.create({ grnId: 'grn-1' } as any, user);
    const createCall = prisma.iqcInspection.create.mock.calls[0][0];
    const iqcItem = createCall.data.items.create[0];
    expect(iqcItem.receivedQty).toBe(500);
    expect(iqcItem.acceptedQty).toBe(500);
  });

  it('handles a GrnItem with heldQty undefined (older rows before this migration) as zero, not NaN', async () => {
    prisma.grnHeader.findFirst.mockResolvedValue({
      id: 'grn-1', status: 'IQC_PENDING',
      items: [{ id: 'gi-1', itemCode: 'PCB-01', itemName: 'PCB', uom: 'PCS', receivedQty: 500 }],
    });
    await service.create({ grnId: 'grn-1' } as any, user);
    const createCall = prisma.iqcInspection.create.mock.calls[0][0];
    expect(createCall.data.items.create[0].receivedQty).toBe(500);
  });

  it('mixed GRN: one line fully clean, another partially held - each line computed independently', async () => {
    prisma.grnHeader.findFirst.mockResolvedValue({
      id: 'grn-1', status: 'IQC_PENDING',
      items: [
        { id: 'gi-1', itemCode: 'DRIVER-01', itemName: 'LED Driver', uom: 'PCS', receivedQty: 1000, heldQty: 20 },
        { id: 'gi-2', itemCode: 'PCB-01', itemName: 'PCB', uom: 'PCS', receivedQty: 500, heldQty: 0 },
      ],
    });
    await service.create({ grnId: 'grn-1' } as any, user);
    const items = prisma.iqcInspection.create.mock.calls[0][0].data.items.create;
    expect(items[0].receivedQty).toBe(980);
    expect(items[1].receivedQty).toBe(500);
  });
});
