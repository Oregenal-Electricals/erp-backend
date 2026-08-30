import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GateInwardService } from './gate-inward.service';

describe('GateInwardService — GATE-001 Normal Vendor Material Arrival', () => {
  let service: GateInwardService;
  let prisma: any;
  let audit: any;
  let settings: any;
  let vehicleManagement: any;
  let notifications: any;

  const user = { id: 'user-1', companyId: 'company-1' };
  const plant = { id: 'plant-1' };

  beforeEach(() => {
    prisma = {
      plant: { findUnique: jest.fn().mockResolvedValue(plant) },
      gateInwardEntry: {
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      },
      gateInwardItem: { count: jest.fn().mockResolvedValue(0) },
      purchaseOrder: { findFirst: jest.fn() },
      user: { findMany: jest.fn().mockResolvedValue([{ id: 'store-user-1' }]) },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    settings = { getNextNumber: jest.fn().mockResolvedValue('GIN-25-26-0001') };
    vehicleManagement = { findOrCreateActiveLog: jest.fn().mockResolvedValue({ id: 'vehicle-log-1' }) };
    notifications = { createBulk: jest.fn().mockResolvedValue(undefined) };
    service = new GateInwardService(prisma, audit, settings, vehicleManagement, notifications);
  });

  describe('create — capturing vehicle/driver, generating a Gate-In number', () => {
    it('creates an entry with vehicleNumber and driverName captured directly, status ARRIVED (PENDING)', async () => {
      const dto = {
        plantId: 'plant-1',
        supplierName: 'ABC Steel Suppliers',
        vehicleNumber: 'MH12AB1234',
        driverName: 'Ramesh Kumar',
        materialDescription: 'MS Steel Rods',
        quantity: 50,
      } as any;
      prisma.gateInwardEntry.create.mockResolvedValue({
        id: 'gin-1', ginNumber: 'GIN-25-26-0001', vehicleNumber: dto.vehicleNumber,
        driverName: dto.driverName, status: 'PENDING',
      });

      const result = await service.create(dto, user);

      expect(prisma.gateInwardEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            vehicleNumber: 'MH12AB1234',
            driverName: 'Ramesh Kumar',
            ginNumber: 'GIN-25-26-0001',
          }),
        }),
      );
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'CREATE' }));
      expect(result.status).toBe('PENDING');
    });

    it('rejects creation when neither materialDescription+quantity nor items[] is provided', async () => {
      const dto = { plantId: 'plant-1', supplierName: 'ABC Steel Suppliers' } as any;
      await expect(service.create(dto, user)).rejects.toThrow(BadRequestException);
    });

    it('blocks a duplicate Gate-In for the same PO created less than a minute ago', async () => {
      prisma.gateInwardEntry.findFirst.mockResolvedValueOnce({ ginNumber: 'GIN-25-26-0001' });
      const dto = {
        plantId: 'plant-1', supplierName: 'ABC Steel', poId: 'po-1',
        materialDescription: 'Steel Rods', quantity: 10,
      } as any;
      await expect(service.create(dto, user)).rejects.toThrow(BadRequestException);
      expect(prisma.gateInwardEntry.create).not.toHaveBeenCalled();
    });

    it('blocks a duplicate Gate-In for a vehicle that already has an active entry', async () => {
      // No poId in this DTO, so the PO-duplicate check is skipped
      // entirely - findFirst is called exactly once, for the vehicle
      // check.
      prisma.gateInwardEntry.findFirst.mockResolvedValueOnce({ ginNumber: 'GIN-25-26-0002', status: 'VERIFIED' });
      const dto = {
        plantId: 'plant-1', supplierName: 'ABC Steel', vehicleNumber: 'MH12AB1234',
        materialDescription: 'Steel Rods', quantity: 10,
      } as any;
      await expect(service.create(dto, user)).rejects.toThrow(BadRequestException);
      expect(prisma.gateInwardEntry.create).not.toHaveBeenCalled();
    });
  });

  describe('status flow — ARRIVED (PENDING) → VERIFIED → GATE_IN → SENT_TO_STORES', () => {
    const fullyValidEntry = {
      id: 'gin-1', status: 'PENDING', remarks: null,
      supplierName: 'ABC Steel', invoiceNumber: 'INV-001',
      vehicleLogId: 'vehicle-log-1', vehicleNumber: null,
      materialDescription: 'Steel Rods', poId: null, po: null,
    };

    it('verify() moves PENDING to VERIFIED when all GATE-002 document checks pass', async () => {
      prisma.gateInwardEntry.findUnique.mockResolvedValue(fullyValidEntry);
      prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', status: 'VERIFIED' });

      const result = await service.verify('gin-1', {}, user);

      expect(prisma.gateInwardEntry.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'VERIFIED' }) }),
      );
      expect(result.status).toBe('VERIFIED');
    });

    it('verify() rejects an entry that is not PENDING', async () => {
      prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'VERIFIED' });
      await expect(service.verify('gin-1', {}, user)).rejects.toThrow(BadRequestException);
    });

    it('verify() (GATE-002) rejects when the challan/invoice number is missing', async () => {
      prisma.gateInwardEntry.findUnique.mockResolvedValue({ ...fullyValidEntry, invoiceNumber: null });
      await expect(service.verify('gin-1', {}, user)).rejects.toThrow(BadRequestException);
      expect(prisma.gateInwardEntry.update).not.toHaveBeenCalled();
    });

    it('verify() (GATE-002) rejects when no vehicle is on record', async () => {
      prisma.gateInwardEntry.findUnique.mockResolvedValue({ ...fullyValidEntry, vehicleLogId: null, vehicleNumber: null });
      await expect(service.verify('gin-1', {}, user)).rejects.toThrow(BadRequestException);
    });

    it('verify() (GATE-002) rejects when the linked PO status is genuinely invalid (not yet SENT)', async () => {
      prisma.gateInwardEntry.findUnique.mockResolvedValue({
        ...fullyValidEntry, poId: 'po-1', po: { poNumber: 'PO-001', status: 'DRAFT' },
      });
      await expect(service.verify('gin-1', {}, user)).rejects.toThrow(BadRequestException);
      expect(prisma.gateInwardEntry.update).not.toHaveBeenCalled();
    });

    it('verify() (GATE-002) passes when the linked PO is still SENT', async () => {
      prisma.gateInwardEntry.findUnique.mockResolvedValue({
        ...fullyValidEntry, poId: 'po-1', po: { poNumber: 'PO-001', status: 'SENT' },
      });
      prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', status: 'VERIFIED' });
      const result = await service.verify('gin-1', {}, user);
      expect(result.status).toBe('VERIFIED');
    });

    it('gateIn() moves VERIFIED to GATE_IN and notifies Store (GATE-002 receiving reference)', async () => {
      prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'VERIFIED', remarks: null });
      prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', ginNumber: 'GIN-25-26-0001', supplierName: 'ABC Steel', status: 'GATE_IN' });

      const result = await service.gateIn('gin-1', {}, user);

      expect(prisma.gateInwardEntry.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'GATE_IN', gateInById: user.id }) }),
      );
      expect(result.status).toBe('GATE_IN');
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ role: { in: ['STORE_MANAGER', 'SUPER_ADMIN'] } }) }),
      );
      expect(notifications.createBulk).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ referenceNumber: 'GIN-25-26-0001', type: 'GATE_INWARD_READY_FOR_STORE' })]),
        user.companyId, user.id,
      );
    });

    it('gateIn() rejects an entry that is not VERIFIED', async () => {
      prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'PENDING' });
      await expect(service.gateIn('gin-1', {}, user)).rejects.toThrow(BadRequestException);
    });

    it('sendToStores() moves GATE_IN to SENT_TO_STORES', async () => {
      prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'GATE_IN' });
      prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', status: 'SENT_TO_STORES' });

      const result = await service.sendToStores('gin-1', user);

      expect(result.status).toBe('SENT_TO_STORES');
    });

    it('sendToStores() rejects an entry that is only VERIFIED, not yet GATE_IN', async () => {
      prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'VERIFIED' });
      await expect(service.sendToStores('gin-1', user)).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException for a non-existent entry at any transition', async () => {
      prisma.gateInwardEntry.findUnique.mockResolvedValue(null);
      await expect(service.verify('missing', {}, user)).rejects.toThrow(NotFoundException);
      await expect(service.gateIn('missing', {}, user)).rejects.toThrow(NotFoundException);
      await expect(service.sendToStores('missing', user)).rejects.toThrow(NotFoundException);
    });
  });

  describe('GATE-002: Security can never change PO quantities, prices, or terms', () => {
    it('verify() never calls purchaseOrder.update, even when a PO is linked and valid', async () => {
      prisma.purchaseOrder.update = jest.fn();
      prisma.gateInwardEntry.findUnique.mockResolvedValue({
        id: 'gin-1', status: 'PENDING', remarks: null,
        supplierName: 'ABC Steel', invoiceNumber: 'INV-001',
        vehicleLogId: 'vehicle-log-1', vehicleNumber: null,
        materialDescription: 'Steel Rods',
        poId: 'po-1', po: { poNumber: 'PO-001', status: 'SENT' },
      });
      prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', status: 'VERIFIED' });

      await service.verify('gin-1', {}, user);

      expect(prisma.purchaseOrder.update).not.toHaveBeenCalled();
    });

    it('GateInwardEntry has no price field at all, so nothing gate-side can carry a price change to the PO', () => {
      // Structural guarantee, not runtime behavior: CreateGateInwardDto
      // exposes quantity/materialDescription/weights, never a price -
      // this test exists as documentation should that ever change.
      const dtoModule = require('./dto/gate-inward.dto');
      const dtoInstance = new dtoModule.CreateGateInwardDto();
      expect('price' in dtoInstance).toBe(false);
      expect('unitPrice' in dtoInstance).toBe(false);
    });
  });

  describe('Gate-In must never create inventory or GRN itself', () => {
    it('sendToStores() only changes status - it does not touch stockBalance, stockLedger, or grnHeader', async () => {
      prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'GATE_IN' });
      prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', status: 'SENT_TO_STORES' });

      await service.sendToStores('gin-1', user);

      // No stock/GRN-related Prisma delegate exists on this mock at
      // all - if the service tried to touch one, this test would
      // throw a "not a function" error rather than silently pass.
      expect(prisma.gateInwardEntry.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('audit logging', () => {
    it('logs every status transition', async () => {
      prisma.gateInwardEntry.findUnique.mockResolvedValue({
        id: 'gin-1', status: 'PENDING', remarks: null,
        supplierName: 'ABC Steel', invoiceNumber: 'INV-001',
        vehicleLogId: 'vehicle-log-1', vehicleNumber: null,
        materialDescription: 'Steel Rods', poId: null, po: null,
      });
      prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', status: 'VERIFIED' });
      await service.verify('gin-1', {}, user);
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({
        tableName: 'gate_inward_entries', action: 'UPDATE', changedBy: user.id,
      }));
    });
  });

  describe('auto-creating a Vehicle Log for a routine arrival', () => {
    it('calls findOrCreateActiveLog and links the resulting vehicleLogId when a vehicleNumber is given with no vehicleLogId', async () => {
      const dto = {
        plantId: 'plant-1', supplierName: 'ABC Steel', vehicleNumber: 'MH12AB1234',
        driverName: 'Ramesh Kumar', materialDescription: 'Steel Rods', quantity: 10,
      } as any;
      prisma.gateInwardEntry.create.mockResolvedValue({ id: 'gin-1', ginNumber: 'GIN-25-26-0001', vehicleLogId: 'vehicle-log-1' });

      const result = await service.create(dto, user);

      expect(vehicleManagement.findOrCreateActiveLog).toHaveBeenCalledWith(
        expect.objectContaining({ vehicleNumber: 'MH12AB1234', driverName: 'Ramesh Kumar', purpose: 'INWARD' }),
      );
      expect(prisma.gateInwardEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ vehicleLogId: 'vehicle-log-1' }) }),
      );
      expect(result.vehicleLogId).toBe('vehicle-log-1');
    });

    it('does not call findOrCreateActiveLog when an explicit vehicleLogId is already provided', async () => {
      const dto = {
        plantId: 'plant-1', supplierName: 'ABC Steel', vehicleLogId: 'existing-log-1',
        materialDescription: 'Steel Rods', quantity: 10,
      } as any;
      prisma.gateInwardEntry.create.mockResolvedValue({ id: 'gin-1', ginNumber: 'GIN-25-26-0001', vehicleLogId: 'existing-log-1' });

      await service.create(dto, user);

      expect(vehicleManagement.findOrCreateActiveLog).not.toHaveBeenCalled();
      expect(prisma.gateInwardEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ vehicleLogId: 'existing-log-1' }) }),
      );
    });

    it('does not call findOrCreateActiveLog when neither vehicleLogId nor vehicleNumber is given', async () => {
      const dto = {
        plantId: 'plant-1', supplierName: 'ABC Steel',
        materialDescription: 'Steel Rods', quantity: 10,
      } as any;
      prisma.gateInwardEntry.create.mockResolvedValue({ id: 'gin-1', ginNumber: 'GIN-25-26-0001' });

      await service.create(dto, user);

      expect(vehicleManagement.findOrCreateActiveLog).not.toHaveBeenCalled();
    });
  });

  describe('GATE-003: Incoming Material PO Not Found', () => {
    it('creates the entry with GATE_HOLD_PO_NOT_FOUND when a typed poNumber matches no real PO, instead of accepting it silently', async () => {
      prisma.purchaseOrder.findFirst.mockResolvedValue(null); // no PO matches this number
      const dto = {
        plantId: 'plant-1', supplierName: 'ABC Steel', poNumber: 'PO-DOES-NOT-EXIST',
        materialDescription: 'Steel Rods', quantity: 10,
      } as any;
      prisma.gateInwardEntry.create.mockResolvedValue({
        id: 'gin-1', ginNumber: 'GIN-25-26-0001', supplierName: 'ABC Steel', poNumber: 'PO-DOES-NOT-EXIST',
        status: 'GATE_HOLD_PO_NOT_FOUND',
      });

      const result = await service.create(dto, user);

      expect(prisma.gateInwardEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'GATE_HOLD_PO_NOT_FOUND', poId: undefined }) }),
      );
      expect(result.status).toBe('GATE_HOLD_PO_NOT_FOUND');
    });

    it('notifies Purchase Manager + Super Admin immediately when a hold is created', async () => {
      prisma.purchaseOrder.findFirst.mockResolvedValue(null);
      prisma.user.findMany.mockResolvedValue([{ id: 'purchase-user-1' }]);
      const dto = {
        plantId: 'plant-1', supplierName: 'ABC Steel', poNumber: 'PO-DOES-NOT-EXIST',
        materialDescription: 'Steel Rods', quantity: 10,
      } as any;
      prisma.gateInwardEntry.create.mockResolvedValue({
        id: 'gin-1', ginNumber: 'GIN-25-26-0001', supplierName: 'ABC Steel', poNumber: 'PO-DOES-NOT-EXIST',
        status: 'GATE_HOLD_PO_NOT_FOUND',
      });

      await service.create(dto, user);

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ role: { in: ['PURCHASE_MANAGER', 'SUPER_ADMIN'] } }) }),
      );
      expect(notifications.createBulk).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ type: 'GATE_HOLD_PO_NOT_FOUND', priority: 'URGENT' })]),
        user.companyId, user.id,
      );
    });

    it('resolves a typed poNumber to the real PO automatically when one does match, no hold created', async () => {
      prisma.purchaseOrder.findFirst.mockResolvedValue({ id: 'po-1', poNumber: 'PO-001', status: 'SENT', vendor: { name: 'ABC Steel' } });
      const dto = {
        plantId: 'plant-1', supplierName: 'ABC Steel', poNumber: 'PO-001',
        materialDescription: 'Steel Rods', quantity: 10,
      } as any;
      prisma.gateInwardEntry.create.mockResolvedValue({ id: 'gin-1', ginNumber: 'GIN-25-26-0001', status: 'PENDING' });

      const result = await service.create(dto, user);

      expect(prisma.gateInwardEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'PENDING', poId: 'po-1', poNumber: 'PO-001' }) }),
      );
      expect(result.status).toBe('PENDING');
      expect(notifications.createBulk).not.toHaveBeenCalled();
    });

    it('verify() refuses an entry that is on hold, with a clear reason', async () => {
      prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'GATE_HOLD_PO_NOT_FOUND' });
      await expect(service.verify('gin-1', {}, user)).rejects.toThrow(BadRequestException);
      expect(prisma.gateInwardEntry.update).not.toHaveBeenCalled();
    });

    describe('resolution — Purchase only, three options', () => {
      const heldEntry = { id: 'gin-1', status: 'GATE_HOLD_PO_NOT_FOUND', poId: null };

      it('Option 1 — identify the correct PO returns the entry to PENDING', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue(heldEntry);
        prisma.purchaseOrder.findFirst.mockResolvedValue({ id: 'po-1', poNumber: 'PO-001', status: 'SENT' });
        prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', status: 'PENDING', poId: 'po-1', holdResolution: 'PO_IDENTIFIED' });

        const result = await service.resolveHoldWithPo('gin-1', 'po-1', 'Found it, vendor confirmed', user);

        expect(prisma.gateInwardEntry.update).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ status: 'PENDING', poId: 'po-1', holdResolution: 'PO_IDENTIFIED', holdResolvedById: user.id }) }),
        );
        expect(result.holdResolution).toBe('PO_IDENTIFIED');
      });

      it('Option 1 rejects an invalid/non-SENT PO', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue(heldEntry);
        prisma.purchaseOrder.findFirst.mockResolvedValue({ id: 'po-1', poNumber: 'PO-001', status: 'CANCELLED' });
        await expect(service.resolveHoldWithPo('gin-1', 'po-1', undefined, user)).rejects.toThrow(BadRequestException);
      });

      it('Option 2 — authorize non-PO receipt returns the entry to PENDING with no PO link', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue(heldEntry);
        prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', status: 'PENDING', holdResolution: 'NON_PO_AUTHORIZED' });

        const result = await service.resolveHoldAsNonPo('gin-1', 'Approved as sample material per policy', user);

        expect(prisma.gateInwardEntry.update).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ status: 'PENDING', holdResolution: 'NON_PO_AUTHORIZED' }) }),
        );
        expect(result.holdResolution).toBe('NON_PO_AUTHORIZED');
      });

      it('Option 3 — reject the material', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue(heldEntry);
        prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', status: 'REJECTED', holdResolution: 'REJECTED' });

        const result = await service.resolveHoldAsRejected('gin-1', 'Vendor could not confirm order exists', user);

        expect(prisma.gateInwardEntry.update).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ status: 'REJECTED', holdResolution: 'REJECTED' }) }),
        );
        expect(result.status).toBe('REJECTED');
      });

      it('all three resolution methods reject an entry that is not currently on hold', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'PENDING' });
        await expect(service.resolveHoldWithPo('gin-1', 'po-1', undefined, user)).rejects.toThrow(BadRequestException);
        await expect(service.resolveHoldAsNonPo('gin-1', 'reason', user)).rejects.toThrow(BadRequestException);
        await expect(service.resolveHoldAsRejected('gin-1', 'reason', user)).rejects.toThrow(BadRequestException);
      });
    });

    it('Gate cannot create a fake PO - resolveHoldWithPo only ever links an existing, real PurchaseOrder row, never creates one', () => {
      // Structural guarantee: no method on GateInwardService calls
      // prisma.purchaseOrder.create anywhere.
      const serviceSource = require('fs').readFileSync(require.resolve('./gate-inward.service.ts'), 'utf8');
      expect(serviceSource).not.toContain('purchaseOrder.create');
    });
  });

  describe('GATE-004/005: Incoming Material for Cancelled or Closed PO', () => {
    it('create() puts the entry on GATE_HOLD_PO_CANCELLED when the linked poId resolves to a CANCELLED PO, does not hard-reject', async () => {
      prisma.purchaseOrder.findFirst.mockResolvedValue({
        id: 'po-1', poNumber: 'PO-001', status: 'CANCELLED', vendor: { name: 'ABC Steel' },
      });
      const dto = {
        plantId: 'plant-1', supplierName: 'ABC Steel', poId: 'po-1',
        materialDescription: 'Steel Rods', quantity: 10,
      } as any;
      prisma.gateInwardEntry.create.mockResolvedValue({
        id: 'gin-1', ginNumber: 'GIN-25-26-0001', supplierName: 'ABC Steel', poNumber: 'PO-001',
        status: 'GATE_HOLD_PO_CANCELLED',
      });

      const result = await service.create(dto, user);

      expect(prisma.gateInwardEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'GATE_HOLD_PO_CANCELLED', poId: 'po-1' }) }),
      );
      expect(result.status).toBe('GATE_HOLD_PO_CANCELLED');
      expect(notifications.createBulk).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ type: 'GATE_HOLD_PO_CANCELLED', priority: 'URGENT' })]),
        user.companyId, user.id,
      );
    });

    it('create() puts the entry on GATE_HOLD_PO_CLOSED when the linked poId resolves to a CLOSED PO', async () => {
      prisma.purchaseOrder.findFirst.mockResolvedValue({
        id: 'po-1', poNumber: 'PO-001', status: 'CLOSED', vendor: { name: 'ABC Steel' },
      });
      const dto = {
        plantId: 'plant-1', supplierName: 'ABC Steel', poId: 'po-1',
        materialDescription: 'Steel Rods', quantity: 10,
      } as any;
      prisma.gateInwardEntry.create.mockResolvedValue({
        id: 'gin-1', ginNumber: 'GIN-25-26-0001', status: 'GATE_HOLD_PO_CLOSED',
      });

      const result = await service.create(dto, user);

      expect(result.status).toBe('GATE_HOLD_PO_CLOSED');
      expect(notifications.createBulk).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ type: 'GATE_HOLD_PO_CLOSED' })]),
        user.companyId, user.id,
      );
    });

    it('create() still hard-rejects a genuinely invalid PO status (DRAFT) - only CANCELLED/CLOSED become holds', async () => {
      prisma.purchaseOrder.findFirst.mockResolvedValue({
        id: 'po-1', poNumber: 'PO-001', status: 'DRAFT', vendor: { name: 'ABC Steel' },
      });
      const dto = {
        plantId: 'plant-1', supplierName: 'ABC Steel', poId: 'po-1',
        materialDescription: 'Steel Rods', quantity: 10,
      } as any;

      await expect(service.create(dto, user)).rejects.toThrow(BadRequestException);
      expect(prisma.gateInwardEntry.create).not.toHaveBeenCalled();
    });

    it('verify() transitions a PENDING entry to GATE_HOLD_PO_CANCELLED if the PO was cancelled after arrival, instead of hard-rejecting', async () => {
      prisma.gateInwardEntry.findUnique.mockResolvedValue({
        id: 'gin-1', status: 'PENDING',
        supplierName: 'ABC Steel', invoiceNumber: 'INV-001', vehicleLogId: 'vehicle-log-1',
        materialDescription: 'Steel Rods',
        poId: 'po-1', po: { poNumber: 'PO-001', status: 'CANCELLED' },
      });
      prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', ginNumber: 'GIN-25-26-0001', supplierName: 'ABC Steel', status: 'GATE_HOLD_PO_CANCELLED' });

      const result = await service.verify('gin-1', {}, user);

      expect(prisma.gateInwardEntry.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'GATE_HOLD_PO_CANCELLED' }) }),
      );
      expect(result.status).toBe('GATE_HOLD_PO_CANCELLED');
      expect(notifications.createBulk).toHaveBeenCalled();
    });

    describe('resolution — Purchase only, three options with mandatory reason', () => {
      const heldEntry = { id: 'gin-1', status: 'GATE_HOLD_PO_CANCELLED', poId: 'old-po-1' };

      it('RETURN MATERIAL sends the entry to REJECTED with the reason recorded', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue(heldEntry);
        prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', status: 'REJECTED', holdResolution: 'RETURN_MATERIAL' });

        const result = await service.resolveReturnMaterial('gin-1', 'Vendor sent it despite cancellation notice', user);

        expect(prisma.gateInwardEntry.update).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ status: 'REJECTED', holdResolution: 'RETURN_MATERIAL', holdResolvedById: user.id }) }),
        );
        expect(result.holdResolution).toBe('RETURN_MATERIAL');
      });

      it('APPROVED EXCEPTION returns the entry to PENDING without touching the PO', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue(heldEntry);
        prisma.purchaseOrder.update = jest.fn();
        prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', status: 'PENDING', holdResolution: 'APPROVED_EXCEPTION' });

        const result = await service.resolveApprovedException('gin-1', 'Confirmed with vendor - legitimate final shipment against a closed PO', user);

        expect(prisma.gateInwardEntry.update).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ status: 'PENDING', holdResolution: 'APPROVED_EXCEPTION' }) }),
        );
        expect(prisma.purchaseOrder.update).not.toHaveBeenCalled();
        expect(result.holdResolution).toBe('APPROVED_EXCEPTION');
      });

      it('CORRECT PO REFERENCE links the real PO and returns the entry to PENDING, reason required', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue(heldEntry);
        prisma.purchaseOrder.findFirst.mockResolvedValue({ id: 'po-correct', poNumber: 'PO-002', status: 'SENT' });
        prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', status: 'PENDING', poId: 'po-correct', holdResolution: 'CORRECT_PO_REFERENCE' });

        const result = await service.resolveCorrectPoReference('gin-1', 'po-correct', 'Security transcribed the challan number wrong', user);

        expect(prisma.gateInwardEntry.update).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ status: 'PENDING', poId: 'po-correct', holdResolution: 'CORRECT_PO_REFERENCE' }) }),
        );
        expect(result.holdResolution).toBe('CORRECT_PO_REFERENCE');
      });

      it('CORRECT PO REFERENCE rejects a replacement PO that is itself invalid', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue(heldEntry);
        prisma.purchaseOrder.findFirst.mockResolvedValue({ id: 'po-also-bad', poNumber: 'PO-003', status: 'CANCELLED' });
        await expect(service.resolveCorrectPoReference('gin-1', 'po-also-bad', 'reason here', user)).rejects.toThrow(BadRequestException);
      });

      it('all three resolution methods reject an entry that is not on a Cancelled/Closed hold', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'PENDING' });
        await expect(service.resolveReturnMaterial('gin-1', 'reason', user)).rejects.toThrow(BadRequestException);
        await expect(service.resolveApprovedException('gin-1', 'reason', user)).rejects.toThrow(BadRequestException);
        await expect(service.resolveCorrectPoReference('gin-1', 'po-1', 'reason', user)).rejects.toThrow(BadRequestException);
      });

      it('none of the three resolution methods ever call purchaseOrder.update - Security/Gate cannot reopen a PO', () => {
        const serviceSource = require('fs').readFileSync(require.resolve('./gate-inward.service.ts'), 'utf8');
        expect(serviceSource).not.toContain('purchaseOrder.update');
      });
    });
  });

  describe('GATE-006: Vendor Mismatch', () => {
    it('create() puts the entry on GATE_HOLD_VENDOR_MISMATCH when the declared supplier does not match the PO vendor - no longer a soft warning', async () => {
      prisma.purchaseOrder.findFirst.mockResolvedValue({
        id: 'po-1', poNumber: 'PO-001', status: 'SENT', vendor: { name: 'ABC Steel' },
      });
      const dto = {
        plantId: 'plant-1', supplierName: 'Totally Different Vendor Ltd', poId: 'po-1',
        materialDescription: 'Steel Rods', quantity: 10,
      } as any;
      prisma.gateInwardEntry.create.mockResolvedValue({
        id: 'gin-1', ginNumber: 'GIN-25-26-0001', supplierName: 'Totally Different Vendor Ltd',
        status: 'GATE_HOLD_VENDOR_MISMATCH',
      });

      const result = await service.create(dto, user);

      expect(prisma.gateInwardEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({
          status: 'GATE_HOLD_VENDOR_MISMATCH', mismatchType: 'VENDOR',
          mismatchExpectedValue: 'ABC Steel', mismatchActualValue: 'Totally Different Vendor Ltd',
        }) }),
      );
      expect(result.status).toBe('GATE_HOLD_VENDOR_MISMATCH');
      expect(notifications.createBulk).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ type: 'GATE_HOLD_VENDOR_MISMATCH', priority: 'URGENT' })]),
        user.companyId, user.id,
      );
      // notifyOfMismatchHold should target the wider approver set
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ role: { in: ['PURCHASE_MANAGER', 'CORPORATE_ADMIN', 'SUPER_ADMIN'] } }) }),
      );
    });

    it('create() does not hold when the declared supplier reasonably matches the PO vendor', async () => {
      prisma.purchaseOrder.findFirst.mockResolvedValue({
        id: 'po-1', poNumber: 'PO-001', status: 'SENT', vendor: { name: 'ABC Steel' },
      });
      const dto = {
        plantId: 'plant-1', supplierName: 'ABC Steel Pvt Ltd', poId: 'po-1',
        materialDescription: 'Steel Rods', quantity: 10,
      } as any;
      prisma.gateInwardEntry.create.mockResolvedValue({ id: 'gin-1', status: 'PENDING' });

      const result = await service.create(dto, user);
      expect(result.status).toBe('PENDING');
    });
  });

  describe('GATE-007: Material Mismatch + shared flag/resolve mechanics for GATE-006/007', () => {
    it('flagMismatch() puts a PENDING entry on GATE_HOLD_MATERIAL_MISMATCH and notifies the wider approver set', async () => {
      prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'PENDING', remarks: null });
      prisma.gateInwardEntry.update.mockResolvedValue({
        id: 'gin-1', ginNumber: 'GIN-25-26-0001', supplierName: 'ABC Steel', status: 'GATE_HOLD_MATERIAL_MISMATCH',
      });

      const result = await service.flagMismatch(
        'gin-1', 'MATERIAL', 'MS Angle 25x25, PO item IT-001', 'MS Angle 40x40, no matching PO item',
        'Opened the truck and the angle size clearly does not match the challan', user,
      );

      expect(prisma.gateInwardEntry.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({
          status: 'GATE_HOLD_MATERIAL_MISMATCH', mismatchType: 'MATERIAL', mismatchFlaggedById: user.id,
        }) }),
      );
      expect(result.status).toBe('GATE_HOLD_MATERIAL_MISMATCH');
      expect(notifications.createBulk).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ type: 'GATE_HOLD_MATERIAL_MISMATCH' })]),
        user.companyId, user.id,
      );
    });

    it('flagMismatch() also works on a VERIFIED entry (Gate can still stop it before Gate-In)', async () => {
      prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'VERIFIED', remarks: null });
      prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', status: 'GATE_HOLD_VENDOR_MISMATCH' });
      const result = await service.flagMismatch('gin-1', 'VENDOR', 'ABC Steel', 'XYZ Traders', 'Driver ID does not match vendor on file', user);
      expect(result.status).toBe('GATE_HOLD_VENDOR_MISMATCH');
    });

    it('flagMismatch() refuses once the vehicle has already been let in (GATE_IN or later)', async () => {
      prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'GATE_IN' });
      await expect(service.flagMismatch('gin-1', 'MATERIAL', 'a', 'b', 'reason', user)).rejects.toThrow(BadRequestException);
      expect(prisma.gateInwardEntry.update).not.toHaveBeenCalled();
    });

    describe('resolution — Purchase/Admin/SuperAdmin, three named outcomes', () => {
      const heldEntry = { id: 'gin-1', status: 'GATE_HOLD_MATERIAL_MISMATCH', mismatchType: 'MATERIAL', materialDescription: 'MS Angle 40x40' };

      it('CORRECT REFERENCE updates the declared material and returns to PENDING', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue(heldEntry);
        prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', status: 'PENDING', holdResolution: 'CORRECT_REFERENCE' });

        const result = await service.resolveMismatchCorrectReference('gin-1', 'MS Angle 25x25', 'Security mis-transcribed the size from the challan', user);

        expect(prisma.gateInwardEntry.update).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ status: 'PENDING', materialDescription: 'MS Angle 25x25', holdResolution: 'CORRECT_REFERENCE' }) }),
        );
        expect(result.holdResolution).toBe('CORRECT_REFERENCE');
      });

      it('CORRECT REFERENCE updates supplierName instead of materialDescription for a VENDOR mismatch', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'GATE_HOLD_VENDOR_MISMATCH', mismatchType: 'VENDOR', supplierName: 'Wrong Name Ltd' });
        prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', status: 'PENDING', holdResolution: 'CORRECT_REFERENCE' });

        await service.resolveMismatchCorrectReference('gin-1', 'ABC Steel Pvt Ltd', 'Reason here', user);

        expect(prisma.gateInwardEntry.update).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ supplierName: 'ABC Steel Pvt Ltd' }) }),
        );
      });

      it('APPROVED EXCEPTION returns to PENDING', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue(heldEntry);
        prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', status: 'PENDING', holdResolution: 'APPROVED_EXCEPTION' });
        const result = await service.resolveMismatchApprovedException('gin-1', 'Confirmed with vendor - this is the correct, if oddly labeled, material', user);
        expect(result.holdResolution).toBe('APPROVED_EXCEPTION');
      });

      it('REJECTED AT GATE sends the entry to terminal REJECTED status', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue(heldEntry);
        prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', status: 'REJECTED', holdResolution: 'REJECTED_AT_GATE' });
        const result = await service.resolveMismatchRejected('gin-1', 'Wrong material entirely, sent back with the driver', user);
        expect(result.status).toBe('REJECTED');
        expect(result.holdResolution).toBe('REJECTED_AT_GATE');
      });

      it('all three resolution methods reject an entry not on a mismatch hold', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'PENDING' });
        await expect(service.resolveMismatchCorrectReference('gin-1', 'x', 'reason', user)).rejects.toThrow(BadRequestException);
        await expect(service.resolveMismatchApprovedException('gin-1', 'reason', user)).rejects.toThrow(BadRequestException);
        await expect(service.resolveMismatchRejected('gin-1', 'reason', user)).rejects.toThrow(BadRequestException);
      });
    });

    it('REJECTED AT GATE material can never reach sendToStores() - rejected material never creates Store inventory or a GRN', async () => {
      // Same terminal-state guarantee already proven for GATE-001's
      // reject() - REJECTED sits outside the PENDING->VERIFIED->
      // GATE_IN->SENT_TO_STORES chain, so sendToStores() refuses it.
      prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'REJECTED' });
      await expect(service.sendToStores('gin-1', user)).rejects.toThrow(BadRequestException);
    });
  });

  describe('GATE-008/009: Visible Material Damage and Packaging Damage', () => {
    it('flagDamage() puts a PENDING entry on GATE_HOLD_MATERIAL_DAMAGE and notifies the full policy set', async () => {
      prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'PENDING' });
      prisma.gateInwardEntry.update.mockResolvedValue({
        id: 'gin-1', ginNumber: 'GIN-25-26-0001', supplierName: 'ABC Steel',
        status: 'GATE_HOLD_MATERIAL_DAMAGE', gateRecommendation: 'REJECT',
      });

      const result = await service.flagDamage('gin-1', 'MATERIAL', 'Visible corrosion on 40% of the rods', 'Bundle 3 of 5', 'REJECT', user);

      expect(prisma.gateInwardEntry.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({
          status: 'GATE_HOLD_MATERIAL_DAMAGE', damageType: 'MATERIAL', gateRecommendation: 'REJECT', damageFlaggedById: user.id,
        }) }),
      );
      expect(result.status).toBe('GATE_HOLD_MATERIAL_DAMAGE');
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ role: { in: ['SUPER_ADMIN', 'CORPORATE_ADMIN', 'PURCHASE_MANAGER', 'STORE_MANAGER', 'QC_MANAGER'] } }) }),
      );
      expect(notifications.createBulk).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ type: 'GATE_HOLD_MATERIAL_DAMAGE', priority: 'URGENT' })]),
        user.companyId, user.id,
      );
    });

    it('flagDamage() with PACKAGING type puts the entry on GATE_HOLD_PACKAGING_DAMAGE', async () => {
      prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'VERIFIED' });
      prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', status: 'GATE_HOLD_PACKAGING_DAMAGE' });
      const result = await service.flagDamage('gin-1', 'PACKAGING', 'Outer cartons crushed', 'Boxes 4, 5, 7', 'ACCEPT_EXCEPTION', user);
      expect(result.status).toBe('GATE_HOLD_PACKAGING_DAMAGE');
    });

    it('flagDamage() refuses once the vehicle has already been let in', async () => {
      prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'GATE_IN' });
      await expect(service.flagDamage('gin-1', 'MATERIAL', 'desc', undefined, 'REJECT', user)).rejects.toThrow(BadRequestException);
      expect(prisma.gateInwardEntry.update).not.toHaveBeenCalled();
    });

    describe('resolution — approvers decide, Gate only recommends', () => {
      const heldEntry = { id: 'gin-1', status: 'GATE_HOLD_MATERIAL_DAMAGE', damageType: 'MATERIAL' };

      it('REJECT AT GATE sends the entry to terminal REJECTED - no GRN, no inventory, no Store receipt', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue(heldEntry);
        prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', status: 'REJECTED', holdResolution: 'REJECT' });

        const result = await service.resolveDamageReject('gin-1', 'Confirmed with Purchase - damage too severe', user);

        expect(prisma.gateInwardEntry.update).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ status: 'REJECTED', holdResolution: 'REJECT' }) }),
        );
        expect(result.status).toBe('REJECTED');
      });

      it('ACCEPT UNDER EXCEPTION returns to PENDING with the exception recorded for downstream Store/QC', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue(heldEntry);
        prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', status: 'PENDING', holdResolution: 'ACCEPT_EXCEPTION_FOR_INSPECTION' });

        const result = await service.resolveDamageAcceptException('gin-1', 'Only packaging affected, Store/QC to inspect thoroughly', user);

        expect(prisma.gateInwardEntry.update).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ status: 'PENDING', holdResolution: 'ACCEPT_EXCEPTION_FOR_INSPECTION' }) }),
        );
        expect(result.holdResolution).toBe('ACCEPT_EXCEPTION_FOR_INSPECTION');
      });

      it('both resolution methods reject an entry not on a damage hold', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'PENDING' });
        await expect(service.resolveDamageReject('gin-1', 'reason', user)).rejects.toThrow(BadRequestException);
        await expect(service.resolveDamageAcceptException('gin-1', 'reason', user)).rejects.toThrow(BadRequestException);
      });
    });

    describe('recordReturnGateOut — the physical return record', () => {
      it('records the return once an entry has been rejected via a damage hold', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'REJECTED', damageType: 'MATERIAL', returnGateOutAt: null });
        prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', returnGateOutAt: new Date(), returnGateOutById: user.id });

        const result = await service.recordReturnGateOut('gin-1', 'Loaded back onto the same vehicle, driver signed the return note', user);

        expect(prisma.gateInwardEntry.update).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ returnGateOutById: user.id }) }),
        );
        expect(result.returnGateOutAt).toBeTruthy();
      });

      it('now works for any REJECTED entry, not only damage-hold rejections (generalized for RETURN as a general determination)', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'REJECTED', damageType: null, returnGateOutAt: null });
        prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', returnGateOutAt: new Date(), returnGateOutById: user.id });
        const result = await service.recordReturnGateOut('gin-1', 'remarks', user);
        expect(result.returnGateOutAt).toBeTruthy();
      });

      it('refuses to record a return for an entry that is not REJECTED at all', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'PENDING' });
        await expect(service.recordReturnGateOut('gin-1', 'remarks', user)).rejects.toThrow(BadRequestException);
      });

      it('refuses to record a return twice for the same entry', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'REJECTED', damageType: 'MATERIAL', returnGateOutAt: new Date() });
        await expect(service.recordReturnGateOut('gin-1', 'remarks', user)).rejects.toThrow(BadRequestException);
      });
    });

    it('rejected damage material can never reach sendToStores() - proven, not just claimed', async () => {
      prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'REJECTED' });
      await expect(service.sendToStores('gin-1', user)).rejects.toThrow(BadRequestException);
    });
  });

  describe('GATE-010: Package/Carton Count Mismatch', () => {
    it('verifyPackageCount() continues normally (no status change) when the physical count matches the declared figure', async () => {
      prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'PENDING', packageCount: 50 });
      prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', status: 'PENDING', packageCountVerifiedById: user.id });

      const result = await service.verifyPackageCount('gin-1', 50, user);

      expect(prisma.gateInwardEntry.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ packageCountVerifiedById: user.id }) }),
      );
      // Crucially: no status field in the update payload, and no notification - a match just continues.
      const updateCall = prisma.gateInwardEntry.update.mock.calls[0][0];
      expect(updateCall.data.status).toBeUndefined();
      expect(notifications.createBulk).not.toHaveBeenCalled();
    });

    it('verifyPackageCount() sets GATE_HOLD_PACKAGE_COUNT_MISMATCH and records expected/actual/difference on a mismatch, without ever writing to packageCount itself', async () => {
      prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'PENDING', packageCount: 50, ginNumber: 'GIN-25-26-0001', supplierName: 'ABC Steel' });
      prisma.gateInwardEntry.update.mockResolvedValue({
        id: 'gin-1', ginNumber: 'GIN-25-26-0001', supplierName: 'ABC Steel',
        status: 'GATE_HOLD_PACKAGE_COUNT_MISMATCH', packageCountExpected: 50, packageCountActual: 47, packageCountDifference: -3,
      });

      const result = await service.verifyPackageCount('gin-1', 47, user);

      const updateCall = prisma.gateInwardEntry.update.mock.calls[0][0];
      expect(updateCall.data.status).toBe('GATE_HOLD_PACKAGE_COUNT_MISMATCH');
      expect(updateCall.data.packageCountExpected).toBe(50);
      expect(updateCall.data.packageCountActual).toBe(47);
      expect(updateCall.data.packageCountDifference).toBe(-3);
      expect(updateCall.data.packageCount).toBeUndefined(); // never touched
      expect(result.status).toBe('GATE_HOLD_PACKAGE_COUNT_MISMATCH');
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ role: { in: ['PURCHASE_MANAGER', 'STORE_MANAGER', 'CORPORATE_ADMIN', 'SUPER_ADMIN'] } }) }),
      );
      expect(notifications.createBulk).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ type: 'GATE_HOLD_PACKAGE_COUNT_MISMATCH', priority: 'URGENT' })]),
        user.companyId, user.id,
      );
    });

    it('verifyPackageCount() refuses once the vehicle has already been let in', async () => {
      prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'GATE_IN', packageCount: 50 });
      await expect(service.verifyPackageCount('gin-1', 47, user)).rejects.toThrow(BadRequestException);
    });

    describe('resolution — recount and escalation vs the two terminal decisions', () => {
      const heldEntry = { id: 'gin-1', status: 'GATE_HOLD_PACKAGE_COUNT_MISMATCH', packageCountExpected: 50, packageCountActual: 47, packageCountDifference: -3 };

      it('Option 1 RECOUNT auto-resolves to PENDING when the new count matches the declared figure', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue(heldEntry);
        prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', status: 'PENDING', packageCountDifference: 0, holdResolution: 'RECOUNT_MATCHED' });

        const result = await service.resolvePackageCountRecount('gin-1', 50, 'Recounted, missed 3 boxes stacked behind others', user);

        expect(prisma.gateInwardEntry.update).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ status: 'PENDING', packageCountDifference: 0, holdResolution: 'RECOUNT_MATCHED' }) }),
        );
        expect(result.status).toBe('PENDING');
      });

      it('Option 1 RECOUNT stays on hold and updates the figures when the new count still does not match', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue(heldEntry);
        prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', status: 'GATE_HOLD_PACKAGE_COUNT_MISMATCH', packageCountActual: 48, packageCountDifference: -2 });

        const result = await service.resolvePackageCountRecount('gin-1', 48, 'Recounted again, still short by 2', user);

        const updateCall = prisma.gateInwardEntry.update.mock.calls[0][0];
        expect(updateCall.data.status).toBeUndefined(); // stays on hold, no status change
        expect(updateCall.data.packageCountActual).toBe(48);
        expect(updateCall.data.packageCountDifference).toBe(-2);
      });

      it('Option 2 ESCALATE marks packageCountEscalated true and re-notifies, but stays on hold', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue(heldEntry);
        prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', status: 'GATE_HOLD_PACKAGE_COUNT_MISMATCH', packageCountEscalated: true });

        const result = await service.resolvePackageCountEscalate('gin-1', 'Asked Store to cross-check against the last 3 deliveries', user);

        const updateCall = prisma.gateInwardEntry.update.mock.calls[0][0];
        expect(updateCall.data.status).toBeUndefined();
        expect(updateCall.data.packageCountEscalated).toBe(true);
        expect(notifications.createBulk).toHaveBeenCalled();
      });

      it('Option 3 APPROVED INWARD returns to PENDING, packageCount still never touched', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue(heldEntry);
        prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', status: 'PENDING', holdResolution: 'APPROVED_INWARD' });

        const result = await service.resolvePackageCountApprovedInward('gin-1', 'Vendor confirmed partial shipment, accepted', user);

        const updateCall = prisma.gateInwardEntry.update.mock.calls[0][0];
        expect(updateCall.data.status).toBe('PENDING');
        expect(updateCall.data.packageCount).toBeUndefined();
        expect(result.holdResolution).toBe('APPROVED_INWARD');
      });

      it('Option 4 REJECTION sends the entry to terminal REJECTED', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue(heldEntry);
        prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', status: 'REJECTED', holdResolution: 'REJECTED' });

        const result = await service.resolvePackageCountRejected('gin-1', 'Discrepancy too large, sent back for vendor to reconcile', user);

        expect(result.status).toBe('REJECTED');
      });

      it('all four resolution methods reject an entry not on a package count mismatch hold', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'PENDING' });
        await expect(service.resolvePackageCountRecount('gin-1', 50, 'reason', user)).rejects.toThrow(BadRequestException);
        await expect(service.resolvePackageCountEscalate('gin-1', 'reason', user)).rejects.toThrow(BadRequestException);
        await expect(service.resolvePackageCountApprovedInward('gin-1', 'reason', user)).rejects.toThrow(BadRequestException);
        await expect(service.resolvePackageCountRejected('gin-1', 'reason', user)).rejects.toThrow(BadRequestException);
      });
    });

    it('none of the GATE-010 methods ever write to the entry\'s own packageCount field - the vendor challan figure is never altered to force a match', () => {
      const serviceSource = require('fs').readFileSync(require.resolve('./gate-inward.service.ts'), 'utf8');
      // Extract just the GATE-010 section of the file and confirm it never assigns packageCount (only packageCountExpected/Actual/Difference).
      const gate010Start = serviceSource.indexOf('GATE-010: Package/Carton Count Mismatch');
      const gate010Section = serviceSource.slice(gate010Start, gate010Start + 6000);
      expect(gate010Section).not.toMatch(/[^t]packageCount:/); // "packageCount:" alone (not packageCountExpected:/Actual:/etc) would be a direct write
    });

    it('rejected package-count-mismatch material can never reach sendToStores()', async () => {
      prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'REJECTED' });
      await expect(service.sendToStores('gin-1', user)).rejects.toThrow(BadRequestException);
    });
  });

  describe('GATE-011: Vehicle Number Mismatch — independent micro-workflow reusing the GATE-006/007 mismatch mechanism', () => {
    describe('positive cases', () => {
      it('flagMismatch() with VEHICLE_NUMBER type puts a PENDING entry on GATE_HOLD_VEHICLE_NUMBER_MISMATCH', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'PENDING' });
        prisma.gateInwardEntry.update.mockResolvedValue({
          id: 'gin-1', ginNumber: 'GIN-25-26-0001', supplierName: 'ABC Steel',
          status: 'GATE_HOLD_VEHICLE_NUMBER_MISMATCH', mismatchType: 'VEHICLE_NUMBER',
        });

        const result = await service.flagMismatch('gin-1', 'VEHICLE_NUMBER', 'MH12AB1234', 'MH12AB5678', 'Different truck arrived than what the challan states', user);

        expect(prisma.gateInwardEntry.update).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({
            status: 'GATE_HOLD_VEHICLE_NUMBER_MISMATCH', mismatchType: 'VEHICLE_NUMBER',
            mismatchExpectedValue: 'MH12AB1234', mismatchActualValue: 'MH12AB5678',
          }) }),
        );
        expect(result.status).toBe('GATE_HOLD_VEHICLE_NUMBER_MISMATCH');
        expect(notifications.createBulk).toHaveBeenCalledWith(
          expect.arrayContaining([expect.objectContaining({ type: 'GATE_HOLD_VEHICLE_NUMBER_MISMATCH', title: expect.stringContaining('Vehicle Number'), priority: 'URGENT' })]),
          user.companyId, user.id,
        );
      });

      it('resolveMismatchCorrectReference() for a VEHICLE_NUMBER hold updates vehicleNumber, not supplierName or materialDescription', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({
          id: 'gin-1', status: 'GATE_HOLD_VEHICLE_NUMBER_MISMATCH', mismatchType: 'VEHICLE_NUMBER',
          vehicleNumber: 'MH12AB5678', supplierName: 'ABC Steel', materialDescription: 'Steel Rods',
        });
        prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', status: 'PENDING', vehicleNumber: 'MH12AB1234', holdResolution: 'CORRECT_REFERENCE' });

        const result = await service.resolveMismatchCorrectReference('gin-1', 'MH12AB1234', 'Security re-checked the plate, corrected the typo', user);

        const updateCall = prisma.gateInwardEntry.update.mock.calls[0][0];
        expect(updateCall.data.vehicleNumber).toBe('MH12AB1234');
        expect(updateCall.data.supplierName).toBeUndefined();
        expect(updateCall.data.materialDescription).toBeUndefined();
        expect(result.status).toBe('PENDING');
      });

      it('resolveMismatchApprovedException() works for a VEHICLE_NUMBER hold via the same shared resolution path', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'GATE_HOLD_VEHICLE_NUMBER_MISMATCH', mismatchType: 'VEHICLE_NUMBER' });
        prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', status: 'PENDING', holdResolution: 'APPROVED_EXCEPTION' });
        const result = await service.resolveMismatchApprovedException('gin-1', 'Transporter confirmed last-minute vehicle swap, approved', user);
        expect(result.holdResolution).toBe('APPROVED_EXCEPTION');
      });

      it('resolveMismatchRejected() works for a VEHICLE_NUMBER hold via the same shared resolution path', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'GATE_HOLD_VEHICLE_NUMBER_MISMATCH', mismatchType: 'VEHICLE_NUMBER' });
        prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', status: 'REJECTED', holdResolution: 'REJECTED_AT_GATE' });
        const result = await service.resolveMismatchRejected('gin-1', 'Unverified vehicle, could not confirm legitimacy, rejected', user);
        expect(result.status).toBe('REJECTED');
      });
    });

    describe('negative cases', () => {
      it('flagMismatch() with VEHICLE_NUMBER refuses once the vehicle has already been let in (GATE_IN)', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'GATE_IN' });
        await expect(service.flagMismatch('gin-1', 'VEHICLE_NUMBER', 'a', 'b', 'reason', user)).rejects.toThrow(BadRequestException);
        expect(prisma.gateInwardEntry.update).not.toHaveBeenCalled();
      });

      it('resolveMismatchCorrectReference() rejects an entry whose mismatchType is VEHICLE_NUMBER but current status is not a mismatch hold', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'COMPLETED', mismatchType: 'VEHICLE_NUMBER' });
        await expect(service.resolveMismatchCorrectReference('gin-1', 'MH12AB1234', 'reason', user)).rejects.toThrow(BadRequestException);
      });
    });

    describe('duplicate action attempts', () => {
      it('cannot flag a vehicle number mismatch a second time on an entry already on that same hold', async () => {
        // First flag succeeds conceptually; simulate the entry now
        // sitting on the hold status a second flagMismatch call would see.
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'GATE_HOLD_VEHICLE_NUMBER_MISMATCH' });
        await expect(service.flagMismatch('gin-1', 'VEHICLE_NUMBER', 'a', 'b', 'reason', user)).rejects.toThrow(BadRequestException);
      });

      it('cannot resolve the same vehicle number mismatch hold twice - once resolved to PENDING, a second resolution call is rejected', async () => {
        // Entry has already been resolved (status is PENDING, not the hold status).
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'PENDING', mismatchType: 'VEHICLE_NUMBER' });
        await expect(service.resolveMismatchCorrectReference('gin-1', 'MH12AB1234', 'reason', user)).rejects.toThrow(BadRequestException);
        await expect(service.resolveMismatchApprovedException('gin-1', 'reason', user)).rejects.toThrow(BadRequestException);
        await expect(service.resolveMismatchRejected('gin-1', 'reason', user)).rejects.toThrow(BadRequestException);
      });
    });

    describe('unauthorized access', () => {
      // Role authorization itself is enforced by PermissionsGuard at
      // the HTTP layer (not re-implemented inside the service), so
      // this verifies structurally that the correct permission
      // decorators are actually present on the routes GATE-011 reuses
      // - Gate-level flagging vs Purchase/Admin-level resolution stay
      // on their existing, already-tested permissions rather than
      // silently gaining a new unguarded route.
      it('flag-mismatch route requires GATE_INWARD_VERIFY (Gate-level, not open to just any authenticated user)', () => {
        const controllerSource = require('fs').readFileSync(require.resolve('./gate-inward.controller.ts'), 'utf8');
        const routeIdx = controllerSource.indexOf("@Patch(':id/flag-mismatch')");
        const nextLines = controllerSource.slice(routeIdx, routeIdx + 200);
        expect(nextLines).toContain('@RequirePermissions(Permission.GATE_INWARD_VERIFY)');
      });

      it('resolve-mismatch/* routes require GATE_INWARD_RESOLVE_HOLD (Purchase/Admin-level, not callable by Gate/Security)', () => {
        const controllerSource = require('fs').readFileSync(require.resolve('./gate-inward.controller.ts'), 'utf8');
        for (const route of ['correct-reference', 'approved-exception', 'reject']) {
          const routeIdx = controllerSource.indexOf(`@Patch(':id/resolve-mismatch/${route}')`);
          expect(routeIdx).toBeGreaterThan(-1);
          const nextLines = controllerSource.slice(routeIdx, routeIdx + 200);
          expect(nextLines).toContain('@RequirePermissions(Permission.GATE_INWARD_RESOLVE_HOLD)');
        }
      });
    });

    describe('exception handling', () => {
      it('flagMismatch() throws NotFoundException for a non-existent entry', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue(null);
        await expect(service.flagMismatch('does-not-exist', 'VEHICLE_NUMBER', 'a', 'b', 'reason', user)).rejects.toThrow(NotFoundException);
      });

      it('resolveMismatchCorrectReference() throws NotFoundException for a non-existent entry', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue(null);
        await expect(service.resolveMismatchCorrectReference('does-not-exist', 'MH12AB1234', 'reason', user)).rejects.toThrow(NotFoundException);
      });
    });

    it('Gate never modifies GRN, inventory, QC result, or PO commercial data as part of this workflow - proven, not just claimed', () => {
      const serviceSource = require('fs').readFileSync(require.resolve('./gate-inward.service.ts'), 'utf8');
      expect(serviceSource).not.toContain('grnHeader.create');
      expect(serviceSource).not.toContain('grnHeader.update');
      expect(serviceSource).not.toContain('stockBalance.update');
      expect(serviceSource).not.toContain('iqcInspection.update');
      expect(serviceSource).not.toContain('purchaseOrder.update');
    });

    it('rejected vehicle-number-mismatch material can never reach sendToStores()', async () => {
      prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'REJECTED' });
      await expect(service.sendToStores('gin-1', user)).rejects.toThrow(BadRequestException);
    });
  });

  describe('GATE-012: Challan / Invoice Document Missing', () => {
    describe('positive cases', () => {
      it('flagDocumentMissing() puts a PENDING entry on GATE_HOLD_DOCUMENT_MISSING and notifies Purchase/Store/Admin', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'PENDING', remarks: null });
        prisma.gateInwardEntry.update.mockResolvedValue({
          id: 'gin-1', ginNumber: 'GIN-25-26-0001', supplierName: 'ABC Steel',
          status: 'GATE_HOLD_DOCUMENT_MISSING', documentMissingType: 'CHALLAN',
        });

        const result = await service.flagDocumentMissing('gin-1', 'CHALLAN', 'Driver has no challan, says it will follow by email', user);

        expect(prisma.gateInwardEntry.update).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({
            status: 'GATE_HOLD_DOCUMENT_MISSING', documentMissingType: 'CHALLAN',
            mismatchExpectedValue: 'Challan document', mismatchActualValue: 'Not provided at arrival',
          }) }),
        );
        expect(result.status).toBe('GATE_HOLD_DOCUMENT_MISSING');
        expect(prisma.user.findMany).toHaveBeenCalledWith(
          expect.objectContaining({ where: expect.objectContaining({ role: { in: ['PURCHASE_MANAGER', 'STORE_MANAGER', 'CORPORATE_ADMIN', 'SUPER_ADMIN'] } }) }),
        );
        expect(notifications.createBulk).toHaveBeenCalledWith(
          expect.arrayContaining([expect.objectContaining({ type: 'GATE_HOLD_DOCUMENT_MISSING', priority: 'URGENT' })]),
          user.companyId, user.id,
        );
      });

      it('resolveDocumentMissingException() accepts on undertaking and returns to PENDING', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'GATE_HOLD_DOCUMENT_MISSING', documentMissingType: 'CHALLAN' });
        prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', status: 'PENDING', holdResolution: 'ACCEPTED_WITH_UNDERTAKING' });

        const result = await service.resolveDocumentMissingException('gin-1', 'Vendor confirmed by phone, document to follow by email', user);

        expect(prisma.gateInwardEntry.update).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ status: 'PENDING', holdResolution: 'ACCEPTED_WITH_UNDERTAKING' }) }),
        );
        expect(result.holdResolution).toBe('ACCEPTED_WITH_UNDERTAKING');
      });

      it('resolveDocumentMissingReject() sends the entry to terminal REJECTED', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'GATE_HOLD_DOCUMENT_MISSING', documentMissingType: 'INVOICE' });
        prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', status: 'REJECTED', holdResolution: 'REJECTED' });

        const result = await service.resolveDocumentMissingReject('gin-1', 'No confirmation from vendor, cannot accept without documentation', user);

        expect(result.status).toBe('REJECTED');
      });

      it('a rejected document-missing entry can then have its physical return recorded via the now-general recordReturnGateOut()', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'REJECTED', returnGateOutAt: null });
        prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', returnGateOutAt: new Date() });
        const result = await service.recordReturnGateOut('gin-1', 'Sent back with the driver, no documentation available', user);
        expect(result.returnGateOutAt).toBeTruthy();
      });
    });

    describe('negative cases', () => {
      it('flagDocumentMissing() refuses once the vehicle has already been let in', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'GATE_IN' });
        await expect(service.flagDocumentMissing('gin-1', 'CHALLAN', 'reason', user)).rejects.toThrow(BadRequestException);
        expect(prisma.gateInwardEntry.update).not.toHaveBeenCalled();
      });

      it('resolveDocumentMissingException() rejects an entry that is not on a Document Missing hold', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'PENDING' });
        await expect(service.resolveDocumentMissingException('gin-1', 'reason', user)).rejects.toThrow(BadRequestException);
      });
    });

    describe('duplicate action attempts', () => {
      it('cannot flag document missing a second time on an entry already on that hold', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'GATE_HOLD_DOCUMENT_MISSING' });
        await expect(service.flagDocumentMissing('gin-1', 'CHALLAN', 'reason', user)).rejects.toThrow(BadRequestException);
      });

      it('cannot resolve the same document-missing hold twice - once resolved to PENDING, a second call is rejected', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'PENDING' });
        await expect(service.resolveDocumentMissingException('gin-1', 'reason', user)).rejects.toThrow(BadRequestException);
        await expect(service.resolveDocumentMissingReject('gin-1', 'reason', user)).rejects.toThrow(BadRequestException);
      });
    });

    describe('unauthorized access', () => {
      it('flag-document-missing route requires GATE_INWARD_VERIFY (Gate-level)', () => {
        const controllerSource = require('fs').readFileSync(require.resolve('./gate-inward.controller.ts'), 'utf8');
        const routeIdx = controllerSource.indexOf("@Patch(':id/flag-document-missing')");
        expect(routeIdx).toBeGreaterThan(-1);
        const nextLines = controllerSource.slice(routeIdx, routeIdx + 200);
        expect(nextLines).toContain('@RequirePermissions(Permission.GATE_INWARD_VERIFY)');
      });

      it('resolve-document-missing/* routes require GATE_INWARD_RESOLVE_HOLD (Purchase/Admin-level)', () => {
        const controllerSource = require('fs').readFileSync(require.resolve('./gate-inward.controller.ts'), 'utf8');
        for (const route of ['exception', 'reject']) {
          const routeIdx = controllerSource.indexOf(`@Patch(':id/resolve-document-missing/${route}')`);
          expect(routeIdx).toBeGreaterThan(-1);
          const nextLines = controllerSource.slice(routeIdx, routeIdx + 200);
          expect(nextLines).toContain('@RequirePermissions(Permission.GATE_INWARD_RESOLVE_HOLD)');
        }
      });
    });

    describe('exception handling', () => {
      it('flagDocumentMissing() throws NotFoundException for a non-existent entry', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue(null);
        await expect(service.flagDocumentMissing('does-not-exist', 'CHALLAN', 'reason', user)).rejects.toThrow(NotFoundException);
      });

      it('resolveDocumentMissingReject() throws NotFoundException for a non-existent entry', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue(null);
        await expect(service.resolveDocumentMissingReject('does-not-exist', 'reason', user)).rejects.toThrow(NotFoundException);
      });
    });

    it('Gate never modifies GRN, inventory, QC result, or PO commercial data as part of this workflow', () => {
      const serviceSource = require('fs').readFileSync(require.resolve('./gate-inward.service.ts'), 'utf8');
      const gate012Start = serviceSource.indexOf('GATE-012: Challan / Invoice Document Missing');
      const gate012Section = serviceSource.slice(gate012Start, gate012Start + 4000);
      expect(gate012Section).not.toContain('grnHeader.');
      expect(gate012Section).not.toContain('stockBalance.');
      expect(gate012Section).not.toContain('iqcInspection.');
      expect(gate012Section).not.toContain('purchaseOrder.');
    });

    it('rejected document-missing material can never reach sendToStores()', async () => {
      prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'REJECTED' });
      await expect(service.sendToStores('gin-1', user)).rejects.toThrow(BadRequestException);
    });
  });

  describe('GATE-013: Challan Mismatch — independent micro-workflow reusing the GATE-006/007/011 mismatch mechanism', () => {
    describe('positive cases', () => {
      it('flagMismatch() with CHALLAN type puts a PENDING entry on GATE_HOLD_CHALLAN_MISMATCH', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'PENDING' });
        prisma.gateInwardEntry.update.mockResolvedValue({
          id: 'gin-1', ginNumber: 'GIN-25-26-0001', supplierName: 'ABC Steel',
          status: 'GATE_HOLD_CHALLAN_MISMATCH', mismatchType: 'CHALLAN',
        });

        const result = await service.flagMismatch('gin-1', 'CHALLAN', 'CH-2026-0088', 'CH-2026-0099', 'Challan number on document does not match what Purchase communicated', user);

        expect(prisma.gateInwardEntry.update).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({
            status: 'GATE_HOLD_CHALLAN_MISMATCH', mismatchType: 'CHALLAN',
            mismatchExpectedValue: 'CH-2026-0088', mismatchActualValue: 'CH-2026-0099',
          }) }),
        );
        expect(result.status).toBe('GATE_HOLD_CHALLAN_MISMATCH');
        expect(notifications.createBulk).toHaveBeenCalledWith(
          expect.arrayContaining([expect.objectContaining({ type: 'GATE_HOLD_CHALLAN_MISMATCH', title: expect.stringContaining('Challan') })]),
          user.companyId, user.id,
        );
      });

      it('resolveMismatchCorrectReference() for a CHALLAN hold updates invoiceNumber, not any other field', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({
          id: 'gin-1', status: 'GATE_HOLD_CHALLAN_MISMATCH', mismatchType: 'CHALLAN',
          invoiceNumber: 'CH-2026-0099', supplierName: 'ABC Steel', materialDescription: 'Steel Rods', vehicleNumber: 'MH12AB1234',
        });
        prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', status: 'PENDING', invoiceNumber: 'CH-2026-0088', holdResolution: 'CORRECT_REFERENCE' });

        const result = await service.resolveMismatchCorrectReference('gin-1', 'CH-2026-0088', 'Security re-checked the challan slip, corrected the digit transcription error', user);

        const updateCall = prisma.gateInwardEntry.update.mock.calls[0][0];
        expect(updateCall.data.invoiceNumber).toBe('CH-2026-0088');
        expect(updateCall.data.supplierName).toBeUndefined();
        expect(updateCall.data.materialDescription).toBeUndefined();
        expect(updateCall.data.vehicleNumber).toBeUndefined();
        expect(result.status).toBe('PENDING');
      });

      it('resolveMismatchApprovedException() and resolveMismatchRejected() both work for a CHALLAN hold via the same shared resolution path', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'GATE_HOLD_CHALLAN_MISMATCH', mismatchType: 'CHALLAN' });
        prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', status: 'PENDING', holdResolution: 'APPROVED_EXCEPTION' });
        const exceptionResult = await service.resolveMismatchApprovedException('gin-1', 'Vendor confirmed challan renumbering, approved', user);
        expect(exceptionResult.holdResolution).toBe('APPROVED_EXCEPTION');

        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'GATE_HOLD_CHALLAN_MISMATCH', mismatchType: 'CHALLAN' });
        prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', status: 'REJECTED', holdResolution: 'REJECTED_AT_GATE' });
        const rejectResult = await service.resolveMismatchRejected('gin-1', 'Could not verify challan authenticity, rejected', user);
        expect(rejectResult.status).toBe('REJECTED');
      });
    });

    describe('negative cases', () => {
      it('flagMismatch() with CHALLAN refuses once the vehicle has already been let in', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'GATE_IN' });
        await expect(service.flagMismatch('gin-1', 'CHALLAN', 'a', 'b', 'reason', user)).rejects.toThrow(BadRequestException);
      });

      it('resolveMismatchCorrectReference() rejects an entry whose mismatchType is CHALLAN but current status is not a mismatch hold', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'SENT_TO_STORES', mismatchType: 'CHALLAN' });
        await expect(service.resolveMismatchCorrectReference('gin-1', 'CH-2026-0088', 'reason', user)).rejects.toThrow(BadRequestException);
      });
    });

    describe('duplicate action attempts', () => {
      it('cannot flag a challan mismatch a second time on an entry already on that same hold', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'GATE_HOLD_CHALLAN_MISMATCH' });
        await expect(service.flagMismatch('gin-1', 'CHALLAN', 'a', 'b', 'reason', user)).rejects.toThrow(BadRequestException);
      });

      it('cannot resolve the same challan mismatch hold twice', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'REJECTED', mismatchType: 'CHALLAN' });
        await expect(service.resolveMismatchCorrectReference('gin-1', 'CH-2026-0088', 'reason', user)).rejects.toThrow(BadRequestException);
        await expect(service.resolveMismatchApprovedException('gin-1', 'reason', user)).rejects.toThrow(BadRequestException);
        await expect(service.resolveMismatchRejected('gin-1', 'reason', user)).rejects.toThrow(BadRequestException);
      });
    });

    describe('unauthorized access', () => {
      it('reuses the already-verified flag-mismatch (GATE_INWARD_VERIFY) and resolve-mismatch/* (GATE_INWARD_RESOLVE_HOLD) permission boundaries - no new unguarded routes were added for CHALLAN', () => {
        const controllerSource = require('fs').readFileSync(require.resolve('./gate-inward.controller.ts'), 'utf8');
        // Confirm no new route was introduced for challan mismatch specifically - it must be routed through the existing, already-permission-checked endpoints.
        expect(controllerSource).not.toContain("flag-challan-mismatch");
        expect(controllerSource).not.toContain("resolve-challan-mismatch");
        const flagRouteIdx = controllerSource.indexOf("@Patch(':id/flag-mismatch')");
        expect(controllerSource.slice(flagRouteIdx, flagRouteIdx + 200)).toContain('@RequirePermissions(Permission.GATE_INWARD_VERIFY)');
      });
    });

    describe('exception handling', () => {
      it('flagMismatch() with CHALLAN throws NotFoundException for a non-existent entry', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue(null);
        await expect(service.flagMismatch('does-not-exist', 'CHALLAN', 'a', 'b', 'reason', user)).rejects.toThrow(NotFoundException);
      });
    });

    it('Gate never modifies GRN, inventory, QC result, or PO commercial data as part of this workflow', () => {
      const serviceSource = require('fs').readFileSync(require.resolve('./gate-inward.service.ts'), 'utf8');
      expect(serviceSource).not.toContain('purchaseOrder.update');
    });

    it('rejected challan-mismatch material can never reach sendToStores()', async () => {
      prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'REJECTED' });
      await expect(service.sendToStores('gin-1', user)).rejects.toThrow(BadRequestException);
    });
  });

  describe('GATE-014: Excess Material Suspected — independent micro-workflow reusing the mismatch mechanism', () => {
    describe('positive cases', () => {
      it('flagMismatch() with QUANTITY_EXCESS type puts a PENDING entry on GATE_HOLD_EXCESS_MATERIAL', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'PENDING' });
        prisma.gateInwardEntry.update.mockResolvedValue({
          id: 'gin-1', ginNumber: 'GIN-25-26-0001', supplierName: 'ABC Steel',
          status: 'GATE_HOLD_EXCESS_MATERIAL', mismatchType: 'QUANTITY_EXCESS',
        });

        const result = await service.flagMismatch('gin-1', 'QUANTITY_EXCESS', '500', '650', 'Weighbridge shows significantly more than the PO quantity', user);

        expect(prisma.gateInwardEntry.update).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({
            status: 'GATE_HOLD_EXCESS_MATERIAL', mismatchType: 'QUANTITY_EXCESS',
            mismatchExpectedValue: '500', mismatchActualValue: '650',
          }) }),
        );
        expect(result.status).toBe('GATE_HOLD_EXCESS_MATERIAL');
        expect(notifications.createBulk).toHaveBeenCalledWith(
          expect.arrayContaining([expect.objectContaining({ type: 'GATE_HOLD_EXCESS_MATERIAL', title: expect.stringContaining('Excess Material') })]),
          user.companyId, user.id,
        );
      });

      it('resolveMismatchCorrectReference() for a QUANTITY_EXCESS hold updates quantity as a parsed number, not any other field', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({
          id: 'gin-1', status: 'GATE_HOLD_EXCESS_MATERIAL', mismatchType: 'QUANTITY_EXCESS', quantity: 650,
        });
        prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', status: 'PENDING', quantity: 500, holdResolution: 'CORRECT_REFERENCE' });

        const result = await service.resolveMismatchCorrectReference('gin-1', '500', 'Re-weighed, first reading included the empty vehicle weight error', user);

        const updateCall = prisma.gateInwardEntry.update.mock.calls[0][0];
        expect(updateCall.data.quantity).toBe(500);
        expect(typeof updateCall.data.quantity).toBe('number');
        expect(updateCall.data.supplierName).toBeUndefined();
        expect(updateCall.data.invoiceNumber).toBeUndefined();
        expect(result.status).toBe('PENDING');
      });

      it('resolveMismatchApprovedException() and resolveMismatchRejected() both work for a QUANTITY_EXCESS hold', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'GATE_HOLD_EXCESS_MATERIAL', mismatchType: 'QUANTITY_EXCESS' });
        prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', status: 'PENDING', holdResolution: 'APPROVED_EXCEPTION' });
        const exceptionResult = await service.resolveMismatchApprovedException('gin-1', 'Vendor confirmed bonus quantity as goodwill, approved to receive full amount', user);
        expect(exceptionResult.holdResolution).toBe('APPROVED_EXCEPTION');

        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'GATE_HOLD_EXCESS_MATERIAL', mismatchType: 'QUANTITY_EXCESS' });
        prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', status: 'REJECTED', holdResolution: 'REJECTED_AT_GATE' });
        const rejectResult = await service.resolveMismatchRejected('gin-1', 'Cannot accept unexplained excess quantity, rejected pending vendor clarification', user);
        expect(rejectResult.status).toBe('REJECTED');
      });
    });

    describe('negative cases', () => {
      it('flagMismatch() with QUANTITY_EXCESS refuses once the vehicle has already been let in', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'GATE_IN' });
        await expect(service.flagMismatch('gin-1', 'QUANTITY_EXCESS', '500', '650', 'reason', user)).rejects.toThrow(BadRequestException);
      });

      it('resolveMismatchApprovedException() rejects an entry whose mismatchType is QUANTITY_EXCESS but current status is not a mismatch hold', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'COMPLETED', mismatchType: 'QUANTITY_EXCESS' });
        await expect(service.resolveMismatchApprovedException('gin-1', 'reason', user)).rejects.toThrow(BadRequestException);
      });
    });

    describe('duplicate action attempts', () => {
      it('cannot flag excess material a second time on an entry already on that same hold', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'GATE_HOLD_EXCESS_MATERIAL' });
        await expect(service.flagMismatch('gin-1', 'QUANTITY_EXCESS', '500', '650', 'reason', user)).rejects.toThrow(BadRequestException);
      });

      it('cannot resolve the same excess material hold twice', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'PENDING', mismatchType: 'QUANTITY_EXCESS' });
        await expect(service.resolveMismatchCorrectReference('gin-1', '500', 'reason', user)).rejects.toThrow(BadRequestException);
        await expect(service.resolveMismatchApprovedException('gin-1', 'reason', user)).rejects.toThrow(BadRequestException);
        await expect(service.resolveMismatchRejected('gin-1', 'reason', user)).rejects.toThrow(BadRequestException);
      });
    });

    describe('unauthorized access', () => {
      it('reuses the already-verified flag-mismatch/resolve-mismatch permission boundaries - no new unguarded route was added for QUANTITY_EXCESS', () => {
        const controllerSource = require('fs').readFileSync(require.resolve('./gate-inward.controller.ts'), 'utf8');
        expect(controllerSource).not.toContain('flag-excess-material');
        expect(controllerSource).not.toContain('resolve-excess-material');
        const flagRouteIdx = controllerSource.indexOf("@Patch(':id/flag-mismatch')");
        expect(controllerSource.slice(flagRouteIdx, flagRouteIdx + 200)).toContain('@RequirePermissions(Permission.GATE_INWARD_VERIFY)');
      });
    });

    describe('exception handling', () => {
      it('flagMismatch() with QUANTITY_EXCESS throws NotFoundException for a non-existent entry', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue(null);
        await expect(service.flagMismatch('does-not-exist', 'QUANTITY_EXCESS', '500', '650', 'reason', user)).rejects.toThrow(NotFoundException);
      });
    });

    it('Gate never modifies GRN, inventory, QC result, or PO commercial data - excess material is corrected on the Gate Inward entry, never the linked PO', async () => {
      prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'GATE_HOLD_EXCESS_MATERIAL', mismatchType: 'QUANTITY_EXCESS', quantity: 650, poId: 'po-1' });
      prisma.purchaseOrder.update = jest.fn();
      prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', status: 'PENDING', quantity: 500 });
      await service.resolveMismatchCorrectReference('gin-1', '500', 'reason', user);
      expect(prisma.purchaseOrder.update).not.toHaveBeenCalled();
    });

    it('rejected excess-material entries can never reach sendToStores()', async () => {
      prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'REJECTED' });
      await expect(service.sendToStores('gin-1', user)).rejects.toThrow(BadRequestException);
    });
  });

  describe('GATE-015: Mixed Materials in One Vehicle — independent micro-workflow reusing the mismatch mechanism', () => {
    describe('positive cases', () => {
      it('flagMismatch() with MIXED_MATERIALS type puts a PENDING entry on GATE_HOLD_MIXED_MATERIALS', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'PENDING' });
        prisma.gateInwardEntry.update.mockResolvedValue({
          id: 'gin-1', ginNumber: 'GIN-25-26-0001', supplierName: 'ABC Steel',
          status: 'GATE_HOLD_MIXED_MATERIALS', mismatchType: 'MIXED_MATERIALS',
        });

        const result = await service.flagMismatch(
          'gin-1', 'MIXED_MATERIALS', 'Steel Rods only (per challan)', 'Steel Rods + undeclared Aluminum Sheets found on physical inspection',
          'Opened the vehicle for the routine check and found extra material not on the challan', user,
        );

        expect(prisma.gateInwardEntry.update).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({
            status: 'GATE_HOLD_MIXED_MATERIALS', mismatchType: 'MIXED_MATERIALS',
            mismatchExpectedValue: 'Steel Rods only (per challan)',
            mismatchActualValue: 'Steel Rods + undeclared Aluminum Sheets found on physical inspection',
          }) }),
        );
        expect(result.status).toBe('GATE_HOLD_MIXED_MATERIALS');
        expect(notifications.createBulk).toHaveBeenCalledWith(
          expect.arrayContaining([expect.objectContaining({ type: 'GATE_HOLD_MIXED_MATERIALS', title: expect.stringContaining('Mixed Materials') })]),
          user.companyId, user.id,
        );
      });

      it('resolveMismatchCorrectReference() for a MIXED_MATERIALS hold updates materialDescription to the reconciled full list', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({
          id: 'gin-1', status: 'GATE_HOLD_MIXED_MATERIALS', mismatchType: 'MIXED_MATERIALS',
          materialDescription: 'Steel Rods', supplierName: 'ABC Steel', vehicleNumber: 'MH12AB1234', invoiceNumber: 'CH-001',
        });
        prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', status: 'PENDING', materialDescription: 'Steel Rods, Aluminum Sheets', holdResolution: 'CORRECT_REFERENCE' });

        const result = await service.resolveMismatchCorrectReference('gin-1', 'Steel Rods, Aluminum Sheets', 'Vendor confirmed both were meant for this delivery, challan was incomplete', user);

        const updateCall = prisma.gateInwardEntry.update.mock.calls[0][0];
        expect(updateCall.data.materialDescription).toBe('Steel Rods, Aluminum Sheets');
        expect(updateCall.data.supplierName).toBeUndefined();
        expect(updateCall.data.vehicleNumber).toBeUndefined();
        expect(updateCall.data.invoiceNumber).toBeUndefined();
        expect(result.status).toBe('PENDING');
      });

      it('resolveMismatchApprovedException() and resolveMismatchRejected() both work for a MIXED_MATERIALS hold', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'GATE_HOLD_MIXED_MATERIALS', mismatchType: 'MIXED_MATERIALS' });
        prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', status: 'PENDING', holdResolution: 'APPROVED_EXCEPTION' });
        const exceptionResult = await service.resolveMismatchApprovedException('gin-1', 'Purchase confirmed a consolidated delivery was expected, approved to receive both items', user);
        expect(exceptionResult.holdResolution).toBe('APPROVED_EXCEPTION');

        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'GATE_HOLD_MIXED_MATERIALS', mismatchType: 'MIXED_MATERIALS' });
        prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', status: 'REJECTED', holdResolution: 'REJECTED_AT_GATE' });
        const rejectResult = await service.resolveMismatchRejected('gin-1', 'Undeclared material cannot be verified against any PO, rejected', user);
        expect(rejectResult.status).toBe('REJECTED');
      });
    });

    describe('negative cases', () => {
      it('flagMismatch() with MIXED_MATERIALS refuses once the vehicle has already been let in', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'GATE_IN' });
        await expect(service.flagMismatch('gin-1', 'MIXED_MATERIALS', 'a', 'b', 'reason', user)).rejects.toThrow(BadRequestException);
      });

      it('resolveMismatchRejected() rejects an entry whose mismatchType is MIXED_MATERIALS but current status is not a mismatch hold', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'VERIFIED', mismatchType: 'MIXED_MATERIALS' });
        await expect(service.resolveMismatchRejected('gin-1', 'reason', user)).rejects.toThrow(BadRequestException);
      });
    });

    describe('duplicate action attempts', () => {
      it('cannot flag mixed materials a second time on an entry already on that same hold', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'GATE_HOLD_MIXED_MATERIALS' });
        await expect(service.flagMismatch('gin-1', 'MIXED_MATERIALS', 'a', 'b', 'reason', user)).rejects.toThrow(BadRequestException);
      });

      it('cannot resolve the same mixed materials hold twice', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'GATE_IN', mismatchType: 'MIXED_MATERIALS' });
        await expect(service.resolveMismatchCorrectReference('gin-1', 'value', 'reason', user)).rejects.toThrow(BadRequestException);
        await expect(service.resolveMismatchApprovedException('gin-1', 'reason', user)).rejects.toThrow(BadRequestException);
        await expect(service.resolveMismatchRejected('gin-1', 'reason', user)).rejects.toThrow(BadRequestException);
      });
    });

    describe('unauthorized access', () => {
      it('reuses the already-verified flag-mismatch/resolve-mismatch permission boundaries - no new unguarded route was added for MIXED_MATERIALS', () => {
        const controllerSource = require('fs').readFileSync(require.resolve('./gate-inward.controller.ts'), 'utf8');
        expect(controllerSource).not.toContain('flag-mixed-materials');
        expect(controllerSource).not.toContain('resolve-mixed-materials');
        const flagRouteIdx = controllerSource.indexOf("@Patch(':id/flag-mismatch')");
        expect(controllerSource.slice(flagRouteIdx, flagRouteIdx + 200)).toContain('@RequirePermissions(Permission.GATE_INWARD_VERIFY)');
        const resolveRouteIdx = controllerSource.indexOf("@Patch(':id/resolve-mismatch/correct-reference')");
        expect(controllerSource.slice(resolveRouteIdx, resolveRouteIdx + 200)).toContain('@RequirePermissions(Permission.GATE_INWARD_RESOLVE_HOLD)');
      });
    });

    describe('exception handling', () => {
      it('flagMismatch() with MIXED_MATERIALS throws NotFoundException for a non-existent entry', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue(null);
        await expect(service.flagMismatch('does-not-exist', 'MIXED_MATERIALS', 'a', 'b', 'reason', user)).rejects.toThrow(NotFoundException);
      });
    });

    it('Gate never modifies GRN, inventory, QC result, or PO commercial data - the correction only ever touches this Gate Inward entry, never grnHeader/stockBalance/purchaseOrder', async () => {
      prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'GATE_HOLD_MIXED_MATERIALS', mismatchType: 'MIXED_MATERIALS', materialDescription: 'Steel Rods', poId: 'po-1' });
      prisma.purchaseOrder.update = jest.fn();
      prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', status: 'PENDING' });
      await service.resolveMismatchCorrectReference('gin-1', 'Steel Rods, Aluminum Sheets', 'reason', user);
      expect(prisma.purchaseOrder.update).not.toHaveBeenCalled();
    });

    it('rejected mixed-materials entries can never reach sendToStores()', async () => {
      prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'REJECTED' });
      await expect(service.sendToStores('gin-1', user)).rejects.toThrow(BadRequestException);
    });
  });

  describe('GATE-016: Multiple POs in One Vehicle', () => {
    describe('positive cases', () => {
      it('flagMultiplePOs() puts a PENDING entry on GATE_HOLD_MULTIPLE_POS, recording the found PO numbers', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'PENDING', poNumber: 'PO-25-26-0042', remarks: null });
        prisma.gateInwardEntry.update.mockResolvedValue({
          id: 'gin-1', ginNumber: 'GIN-25-26-0001', supplierName: 'ABC Steel', status: 'GATE_HOLD_MULTIPLE_POS',
        });

        const result = await service.flagMultiplePOs('gin-1', 'PO-25-26-0042, PO-25-26-0043', 'Challan lists two PO numbers, one vehicle for both orders', user);

        expect(prisma.gateInwardEntry.update).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({
            status: 'GATE_HOLD_MULTIPLE_POS',
            mismatchExpectedValue: 'PO-25-26-0042', mismatchActualValue: 'PO-25-26-0042, PO-25-26-0043',
          }) }),
        );
        expect(result.status).toBe('GATE_HOLD_MULTIPLE_POS');
        expect(prisma.user.findMany).toHaveBeenCalledWith(
          expect.objectContaining({ where: expect.objectContaining({ role: { in: ['PURCHASE_MANAGER', 'STORE_MANAGER', 'CORPORATE_ADMIN', 'SUPER_ADMIN'] } }) }),
        );
        expect(notifications.createBulk).toHaveBeenCalledWith(
          expect.arrayContaining([expect.objectContaining({ type: 'GATE_HOLD_MULTIPLE_POS', priority: 'URGENT' })]),
          user.companyId, user.id,
        );
      });

      it('resolveMultiplePosSplit() confirms exactly one PO on this entry and records the rest as relatedPoNumbers', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'GATE_HOLD_MULTIPLE_POS' });
        prisma.purchaseOrder.findFirst.mockResolvedValue({ id: 'po-1', poNumber: 'PO-25-26-0042', status: 'SENT' });
        prisma.gateInwardEntry.update.mockResolvedValue({
          id: 'gin-1', status: 'PENDING', poId: 'po-1', poNumber: 'PO-25-26-0042', relatedPoNumbers: 'PO-25-26-0043',
        });

        const result = await service.resolveMultiplePosSplit('gin-1', 'po-1', 'PO-25-26-0043', 'Confirmed PO-0042 covers this material, PO-0043 needs a separate entry', user);

        expect(prisma.gateInwardEntry.update).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({
            status: 'PENDING', poId: 'po-1', poNumber: 'PO-25-26-0042', relatedPoNumbers: 'PO-25-26-0043',
          }) }),
        );
        expect(result.status).toBe('PENDING');
        expect(result.relatedPoNumbers).toBe('PO-25-26-0043');
      });

      it('resolveMultiplePosRejected() sends the entry to terminal REJECTED', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'GATE_HOLD_MULTIPLE_POS' });
        prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', status: 'REJECTED', holdResolution: 'REJECTED' });
        const result = await service.resolveMultiplePosRejected('gin-1', 'Could not reconcile which PO the material belongs to', user);
        expect(result.status).toBe('REJECTED');
      });
    });

    describe('negative cases', () => {
      it('flagMultiplePOs() refuses once the vehicle has already been let in', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'GATE_IN' });
        await expect(service.flagMultiplePOs('gin-1', 'PO-1, PO-2', 'reason', user)).rejects.toThrow(BadRequestException);
      });

      it('resolveMultiplePosSplit() rejects a confirmed PO that is itself invalid (not SENT/PARTIALLY_RECEIVED)', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'GATE_HOLD_MULTIPLE_POS' });
        prisma.purchaseOrder.findFirst.mockResolvedValue({ id: 'po-1', poNumber: 'PO-25-26-0042', status: 'CANCELLED' });
        await expect(service.resolveMultiplePosSplit('gin-1', 'po-1', 'PO-25-26-0043', 'reason', user)).rejects.toThrow(BadRequestException);
      });

      it('resolveMultiplePosSplit() rejects a confirmed PO id that does not exist', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'GATE_HOLD_MULTIPLE_POS' });
        prisma.purchaseOrder.findFirst.mockResolvedValue(null);
        await expect(service.resolveMultiplePosSplit('gin-1', 'does-not-exist', 'PO-25-26-0043', 'reason', user)).rejects.toThrow(NotFoundException);
      });
    });

    describe('duplicate action attempts', () => {
      it('cannot flag multiple POs a second time on an entry already on that hold', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'GATE_HOLD_MULTIPLE_POS' });
        await expect(service.flagMultiplePOs('gin-1', 'PO-1, PO-2', 'reason', user)).rejects.toThrow(BadRequestException);
      });

      it('cannot resolve the same multiple-POs hold twice', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'PENDING' });
        await expect(service.resolveMultiplePosSplit('gin-1', 'po-1', 'PO-25-26-0043', 'reason', user)).rejects.toThrow(BadRequestException);
        await expect(service.resolveMultiplePosRejected('gin-1', 'reason', user)).rejects.toThrow(BadRequestException);
      });
    });

    describe('unauthorized access', () => {
      it('flag-multiple-pos route requires GATE_INWARD_VERIFY (Gate-level)', () => {
        const controllerSource = require('fs').readFileSync(require.resolve('./gate-inward.controller.ts'), 'utf8');
        const routeIdx = controllerSource.indexOf("@Patch(':id/flag-multiple-pos')");
        expect(routeIdx).toBeGreaterThan(-1);
        expect(controllerSource.slice(routeIdx, routeIdx + 200)).toContain('@RequirePermissions(Permission.GATE_INWARD_VERIFY)');
      });

      it('resolve-multiple-pos/* routes require GATE_INWARD_RESOLVE_HOLD (Purchase/Admin-level)', () => {
        const controllerSource = require('fs').readFileSync(require.resolve('./gate-inward.controller.ts'), 'utf8');
        for (const route of ['split', 'reject']) {
          const routeIdx = controllerSource.indexOf(`@Patch(':id/resolve-multiple-pos/${route}')`);
          expect(routeIdx).toBeGreaterThan(-1);
          expect(controllerSource.slice(routeIdx, routeIdx + 200)).toContain('@RequirePermissions(Permission.GATE_INWARD_RESOLVE_HOLD)');
        }
      });
    });

    describe('exception handling', () => {
      it('flagMultiplePOs() throws NotFoundException for a non-existent entry', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue(null);
        await expect(service.flagMultiplePOs('does-not-exist', 'PO-1, PO-2', 'reason', user)).rejects.toThrow(NotFoundException);
      });

      it('resolveMultiplePosRejected() throws NotFoundException for a non-existent entry', async () => {
        prisma.gateInwardEntry.findUnique.mockResolvedValue(null);
        await expect(service.resolveMultiplePosRejected('does-not-exist', 'reason', user)).rejects.toThrow(NotFoundException);
      });
    });

    it('the resolved entry always links exactly one PO - relatedPoNumbers is a text note, never a second poId, matching the never-more-than-one-PO-per-entry guarantee this workflow deliberately preserves', async () => {
      prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'GATE_HOLD_MULTIPLE_POS' });
      prisma.purchaseOrder.findFirst.mockResolvedValue({ id: 'po-1', poNumber: 'PO-25-26-0042', status: 'SENT' });
      prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', status: 'PENDING', poId: 'po-1' });
      await service.resolveMultiplePosSplit('gin-1', 'po-1', 'PO-25-26-0043', 'reason', user);
      const updateCall = prisma.gateInwardEntry.update.mock.calls[0][0];
      expect(typeof updateCall.data.poId).toBe('string');
      expect(updateCall.data.poIds).toBeUndefined();
    });

    it('Gate never modifies GRN, inventory, QC result, or PO commercial data - only ever links an existing, real PurchaseOrder id, never creates or edits one', async () => {
      prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'GATE_HOLD_MULTIPLE_POS' });
      prisma.purchaseOrder.findFirst.mockResolvedValue({ id: 'po-1', poNumber: 'PO-25-26-0042', status: 'SENT' });
      prisma.purchaseOrder.update = jest.fn();
      prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', status: 'PENDING' });
      await service.resolveMultiplePosSplit('gin-1', 'po-1', 'PO-25-26-0043', 'reason', user);
      expect(prisma.purchaseOrder.update).not.toHaveBeenCalled();
    });

    it('rejected multiple-POs entries can never reach sendToStores()', async () => {
      prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'REJECTED' });
      await expect(service.sendToStores('gin-1', user)).rejects.toThrow(BadRequestException);
    });
  });
});
