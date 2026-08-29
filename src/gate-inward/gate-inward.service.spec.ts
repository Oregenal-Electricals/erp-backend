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
      prisma.purchaseOrder.findFirst.mockResolvedValue({ id: 'po-1', poNumber: 'PO-001', status: 'SENT' });
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
});
