import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GateInwardService } from './gate-inward.service';

describe('GateInwardService — GATE-001 Normal Vendor Material Arrival', () => {
  let service: GateInwardService;
  let prisma: any;
  let audit: any;
  let settings: any;

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
      purchaseOrder: { findFirst: jest.fn() },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    settings = { getNextNumber: jest.fn().mockResolvedValue('GIN-25-26-0001') };
    service = new GateInwardService(prisma, audit, settings);
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
    it('verify() moves PENDING to VERIFIED', async () => {
      prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'PENDING', remarks: null });
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

    it('gateIn() moves VERIFIED to GATE_IN', async () => {
      prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'VERIFIED', remarks: null });
      prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', status: 'GATE_IN' });

      const result = await service.gateIn('gin-1', {}, user);

      expect(prisma.gateInwardEntry.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'GATE_IN', gateInById: user.id }) }),
      );
      expect(result.status).toBe('GATE_IN');
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
      prisma.gateInwardEntry.findUnique.mockResolvedValue({ id: 'gin-1', status: 'PENDING', remarks: null });
      prisma.gateInwardEntry.update.mockResolvedValue({ id: 'gin-1', status: 'VERIFIED' });
      await service.verify('gin-1', {}, user);
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({
        tableName: 'gate_inward_entries', action: 'UPDATE', changedBy: user.id,
      }));
    });
  });
});
