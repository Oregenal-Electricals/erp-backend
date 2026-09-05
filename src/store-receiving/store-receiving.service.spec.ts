import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StoreReceivingService } from './store-receiving.service';

describe('StoreReceivingService STORE-001', () => {
  let service: StoreReceivingService;
  let prisma: any;
  let audit: any;
  let gateInward: any;

  const user = { id: 'user-1', companyId: 'company-1' };

  const sentToStoresEntry = {
    id: 'gin-1', companyId: 'company-1', ginNumber: 'GI-TEST-001', status: 'SENT_TO_STORES',
    supplierName: 'Vendor A', poId: 'po-1', poNumber: 'PO-TEST-001', invoiceNumber: 'INV-001',
    items: [
      { id: 'gii-1', itemCode: 'DRIVER-01', itemName: 'LED Driver', uom: 'PCS', quantity: 1000 },
      { id: 'gii-2', itemCode: 'PCB-01', itemName: 'PCB', uom: 'PCS', quantity: 1000 },
    ],
  };

  beforeEach(() => {
    prisma = {
      gateInwardEntry: {
        findFirst: jest.fn().mockResolvedValue(sentToStoresEntry),
        findMany: jest.fn().mockResolvedValue([sentToStoresEntry]),
      },
      storeReceiving: {
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({
          id: 'sr-1', ...data,
          items: data.items.create.map((i: any, idx: number) => ({ id: `sri-${idx}`, ...i })),
        })),
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    gateInward = { complete: jest.fn().mockResolvedValue({ id: 'gin-1', status: 'COMPLETED' }) };
    service = new StoreReceivingService(prisma, audit, gateInward);
  });

  describe('MANUAL TEST 1/2 - valid Gate-In, Receive at Store', () => {
    it('creates a Store Receiving record for a SENT_TO_STORES Gate-In with status PHYSICAL_VERIFICATION_PENDING', async () => {
      const result = await service.receiveAtStore({ gateInwardEntryId: 'gin-1' } as any, user);
      expect(result.status).toBe('PHYSICAL_VERIFICATION_PENDING');
      expect(result.gateInwardEntryId).toBe('gin-1');
      expect(result.supplierName).toBe('Vendor A');
      expect(result.poNumber).toBe('PO-TEST-001');
    });
  });

  describe('MANUAL TEST 3 - no usable inventory created', () => {
    it('never touches stockBalance or stockLedger - the mock does not even expose them', async () => {
      await service.receiveAtStore({ gateInwardEntryId: 'gin-1' } as any, user);
      expect(prisma.stockBalance).toBeUndefined();
      expect(prisma.stockLedger).toBeUndefined();
    });
  });

  describe('MANUAL TEST 4 - no QC pass', () => {
    it('never touches productionQc or any QC model', async () => {
      await service.receiveAtStore({ gateInwardEntryId: 'gin-1' } as any, user);
      expect(prisma.productionQc).toBeUndefined();
      expect(prisma.incomingQc).toBeUndefined();
    });
  });

  it('MANUAL TEST - never touches grnHeader/grnItem (no GRN finalization)', async () => {
    await service.receiveAtStore({ gateInwardEntryId: 'gin-1' } as any, user);
    expect(prisma.grnHeader).toBeUndefined();
    expect(prisma.grnItem).toBeUndefined();
  });

  describe('MANUAL TEST 5 - expected vs actual quantity separation', () => {
    it('copies quantity into expectedQty and leaves actualVerifiedQty null - never auto-fills it', async () => {
      const result = await service.receiveAtStore({ gateInwardEntryId: 'gin-1' } as any, user);
      expect(result.items[0].expectedQty).toBe(1000);
      expect(result.items[0].actualVerifiedQty).toBeNull();
      expect(result.items[1].expectedQty).toBe(1000);
      expect(result.items[1].actualVerifiedQty).toBeNull();
    });
  });

  describe('MANUAL TEST 9 - multiple material lines preserved independently', () => {
    it('creates one StoreReceivingItem per GateInwardItem, preserving item code/name/uom per line', async () => {
      const result = await service.receiveAtStore({ gateInwardEntryId: 'gin-1' } as any, user);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].itemCode).toBe('DRIVER-01');
      expect(result.items[0].uom).toBe('PCS');
      expect(result.items[1].itemCode).toBe('PCB-01');
    });
  });

  describe('MANUAL TEST 18 - UOM preservation', () => {
    it('does not collapse or convert UOM across lines', async () => {
      prisma.gateInwardEntry.findFirst.mockResolvedValue({
        ...sentToStoresEntry,
        items: [
          { id: 'gii-1', itemCode: 'WIRE-01', itemName: 'Copper Wire', uom: 'MTR', quantity: 500 },
          { id: 'gii-2', itemCode: 'OIL-01', itemName: 'Lubricant', uom: 'KG', quantity: 20 },
        ],
      });
      const result = await service.receiveAtStore({ gateInwardEntryId: 'gin-1' } as any, user);
      expect(result.items[0].uom).toBe('MTR');
      expect(result.items[1].uom).toBe('KG');
    });
  });

  describe('MANUAL TEST 7 - Gate rejected material blocked', () => {
    it('blocks receipt when Gate-In status is REJECTED', async () => {
      prisma.gateInwardEntry.findFirst.mockResolvedValue({ ...sentToStoresEntry, status: 'REJECTED' });
      await expect(service.receiveAtStore({ gateInwardEntryId: 'gin-1' } as any, user)).rejects.toThrow(BadRequestException);
      await expect(service.receiveAtStore({ gateInwardEntryId: 'gin-1' } as any, user)).rejects.toThrow(/Gate-rejected material/);
    });
  });

  describe('MANUAL TEST 8 - non-SENT_TO_STORES states blocked (covers cancelled/hold/not-yet-sent)', () => {
    it.each(['PENDING', 'VERIFIED', 'GATE_IN', 'GATE_HOLD_PO_NOT_FOUND', 'GATE_HOLD_VENDOR_MISMATCH'])(
      'blocks receipt when Gate-In status is %s',
      async (status) => {
        prisma.gateInwardEntry.findFirst.mockResolvedValue({ ...sentToStoresEntry, status });
        await expect(service.receiveAtStore({ gateInwardEntryId: 'gin-1' } as any, user)).rejects.toThrow(BadRequestException);
      },
    );

    it('blocks a second receipt attempt once the Gate-In is already COMPLETED (already received)', async () => {
      prisma.gateInwardEntry.findFirst.mockResolvedValue({ ...sentToStoresEntry, status: 'COMPLETED' });
      await expect(service.receiveAtStore({ gateInwardEntryId: 'gin-1' } as any, user)).rejects.toThrow(/already been received/);
    });
  });

  describe('MANUAL TEST 6/11/53 - duplicate and concurrent receipt', () => {
    it('converts a unique-constraint violation (P2002) on gateInwardEntryId into a clean duplicate-receipt error', async () => {
      prisma.storeReceiving.create.mockRejectedValue({ code: 'P2002' });
      await expect(service.receiveAtStore({ gateInwardEntryId: 'gin-1' } as any, user)).rejects.toThrow(/already been received at Store/);
    });

    it('re-throws non-P2002 errors unchanged rather than masking them as a duplicate', async () => {
      prisma.storeReceiving.create.mockRejectedValue(new Error('connection lost'));
      await expect(service.receiveAtStore({ gateInwardEntryId: 'gin-1' } as any, user)).rejects.toThrow('connection lost');
    });
  });

  describe('MANUAL TEST 10/11 - Store cannot modify Gate or PO fields', () => {
    it('the DTO carries no Gate field (vehicle number, gate-in time) for the service to write', async () => {
      // ReceiveAtStoreDto only exposes gateInwardEntryId/receivingWarehouseId/remarks -
      // there is no code path here that could write vehicleNumber, gateInAt, etc.
      await service.receiveAtStore({ gateInwardEntryId: 'gin-1', receivingWarehouseId: 'wh-1', remarks: 'note' } as any, user);
      expect(prisma.gateInwardEntry.findFirst).toHaveBeenCalledTimes(1); // read-only lookup, no .update() on gateInwardEntry
    });

    it('never calls a PO update - PO commercial fields are untouched by this module', async () => {
      await service.receiveAtStore({ gateInwardEntryId: 'gin-1' } as any, user);
      expect(prisma.purchaseOrder).toBeUndefined();
    });
  });

  describe('MANUAL TEST 12 - non-PO receipt follows whatever exception policy Gate/Purchase already applied', () => {
    it('receives normally when poId is null but the entry has already reached SENT_TO_STORES (meaning Purchase/Gate already authorized it upstream)', async () => {
      prisma.gateInwardEntry.findFirst.mockResolvedValue({ ...sentToStoresEntry, poId: null, poNumber: null });
      const result = await service.receiveAtStore({ gateInwardEntryId: 'gin-1' } as any, user);
      expect(result.poId).toBeNull();
      expect(result.status).toBe('PHYSICAL_VERIFICATION_PENDING');
    });
  });

  describe('existing Gate architecture regression - reuses complete(), does not duplicate it', () => {
    it('calls GateInwardService.complete() exactly once instead of writing its own status transition', async () => {
      await service.receiveAtStore({ gateInwardEntryId: 'gin-1' } as any, user);
      expect(gateInward.complete).toHaveBeenCalledTimes(1);
      expect(gateInward.complete).toHaveBeenCalledWith('gin-1', user);
    });

    it('throws NotFoundException for a Gate-In that does not exist', async () => {
      prisma.gateInwardEntry.findFirst.mockResolvedValue(null);
      await expect(service.receiveAtStore({ gateInwardEntryId: 'missing' } as any, user)).rejects.toThrow(NotFoundException);
    });
  });

  describe('audit', () => {
    it('logs the Store Receiving creation with the correct table name and record id', async () => {
      const result = await service.receiveAtStore({ gateInwardEntryId: 'gin-1' } as any, user);
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({
        tableName: 'store_receivings', recordId: result.id, action: 'CREATE', changedBy: user.id,
      }));
    });
  });

  describe('pending-from-gate queue', () => {
    it('lists only SENT_TO_STORES entries for this company', async () => {
      await service.findPendingFromGate(user);
      expect(prisma.gateInwardEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ companyId: 'company-1', status: 'SENT_TO_STORES' }) }),
      );
    });
  });
});
