import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DebitNotesService } from './debit-notes.service';

describe('DebitNotesService', () => {
  let service: DebitNotesService;
  let prisma: any;
  let audit: any;

  const user = { id: 'user-1', companyId: 'company-1' };

  const baseItem = {
    id: 'iqc-item-1', iqcId: 'iqc-1', grnItemId: 'grn-item-1',
    itemCode: 'RM-001', itemName: 'Copper Wire', uom: 'KG',
    rejectionReason: 'Diameter out of spec',
  };
  const baseIqc = { id: 'iqc-1', iqcNumber: 'IQC-2026-0001', grnId: 'grn-1' };
  const baseGrnItem = { id: 'grn-item-1', unitPrice: 100, landedCostPerUnit: 110 };
  const baseGrn = { id: 'grn-1', poId: 'po-1', gateInwardEntryId: 'gin-1' };
  const basePo = { id: 'po-1', vendorId: 'vendor-1' };

  const makeTx = (overrides: any = {}) => ({
    iqcItem: { findFirst: jest.fn().mockResolvedValue(baseItem) },
    iqcInspection: { findFirst: jest.fn().mockResolvedValue(baseIqc) },
    grnItem: { findFirst: jest.fn().mockResolvedValue(baseGrnItem) },
    grnHeader: { findFirst: jest.fn().mockResolvedValue(baseGrn) },
    purchaseOrder: { findFirst: jest.fn().mockResolvedValue(basePo) },
    debitNote: {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'dn-1', ...data })),
    },
    ...overrides,
  });

  beforeEach(() => {
    prisma = {
      debitNote: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findFirst: jest.fn(),
        update: jest.fn(),
        aggregate: jest.fn().mockResolvedValue({ _sum: { totalAmount: 0 } }),
      },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    service = new DebitNotesService(prisma, audit);
  });

  describe('createFromIqcRejection', () => {
    it('creates a debit note from the item/GRN/PO chain, using the landed cost as unit rate', async () => {
      const tx = makeTx();
      const result = await service.createFromIqcRejection(
        { iqcItemId: 'iqc-item-1', rejectedQty: 5, rejectionReason: 'Diameter out of spec' },
        user,
        tx,
      );

      expect(result).not.toBeNull();
      expect(tx.debitNote.create).toHaveBeenCalledTimes(1);
      const created = tx.debitNote.create.mock.calls[0][0].data;
      expect(created.vendorId).toBe('vendor-1');
      expect(created.poId).toBe('po-1');
      expect(created.grnId).toBe('grn-1');
      expect(created.gateInwardEntryId).toBe('gin-1');
      expect(created.iqcId).toBe('iqc-1');
      expect(created.iqcItemId).toBe('iqc-item-1');
      expect(created.rejectedQty).toBe(5);
      expect(created.unitRate).toBe(110); // landedCostPerUnit preferred over unitPrice
      expect(created.totalAmount).toBe(550);
      expect(created.status).toBe('ISSUED');
      expect(created.debitNoteNumber).toMatch(/^DN-\d{4}-0001$/);
    });

    it('falls back to unitPrice when landedCostPerUnit is not set', async () => {
      const tx = makeTx({ grnItem: { findFirst: jest.fn().mockResolvedValue({ id: 'grn-item-1', unitPrice: 80, landedCostPerUnit: null }) } });
      const result: any = await service.createFromIqcRejection(
        { iqcItemId: 'iqc-item-1', rejectedQty: 2 },
        user,
        tx,
      );
      expect(result.unitRate).toBe(80);
      expect(result.totalAmount).toBe(160);
    });

    it('returns null and creates nothing when rejectedQty is 0', async () => {
      const tx = makeTx();
      const result = await service.createFromIqcRejection({ iqcItemId: 'iqc-item-1', rejectedQty: 0 }, user, tx);
      expect(result).toBeNull();
      expect(tx.debitNote.create).not.toHaveBeenCalled();
    });

    it('returns null when the IQC item cannot be found', async () => {
      const tx = makeTx({ iqcItem: { findFirst: jest.fn().mockResolvedValue(null) } });
      const result = await service.createFromIqcRejection({ iqcItemId: 'missing', rejectedQty: 5 }, user, tx);
      expect(result).toBeNull();
      expect(tx.debitNote.create).not.toHaveBeenCalled();
    });

    it('returns null without creating a debit note when the GRN has no PO chain', async () => {
      const tx = makeTx({ grnHeader: { findFirst: jest.fn().mockResolvedValue({ id: 'grn-1', poId: null }) } });
      const result = await service.createFromIqcRejection({ iqcItemId: 'iqc-item-1', rejectedQty: 5 }, user, tx);
      expect(result).toBeNull();
      expect(tx.debitNote.create).not.toHaveBeenCalled();
    });

    it('falls back to this.prisma when no tx client is passed', async () => {
      prisma.iqcItem = { findFirst: jest.fn().mockResolvedValue(baseItem) };
      prisma.iqcInspection = { findFirst: jest.fn().mockResolvedValue(baseIqc) };
      prisma.grnItem = { findFirst: jest.fn().mockResolvedValue(baseGrnItem) };
      prisma.grnHeader = { findFirst: jest.fn().mockResolvedValue(baseGrn) };
      prisma.purchaseOrder = { findFirst: jest.fn().mockResolvedValue(basePo) };
      prisma.debitNote.count = jest.fn().mockResolvedValue(0);
      prisma.debitNote.create = jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'dn-standalone', ...data }));

      const result: any = await service.createFromIqcRejection({ iqcItemId: 'iqc-item-1', rejectedQty: 3 }, user);
      expect(result.id).toBe('dn-standalone');
      expect(prisma.debitNote.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll / findOne', () => {
    it('scopes findAll to the caller company and supports vendor/status filters', async () => {
      await service.findAll(user, { vendorId: 'vendor-1', status: 'ISSUED' });
      const where = prisma.debitNote.findMany.mock.calls[0][0].where;
      expect(where.companyId).toBe('company-1');
      expect(where.vendorId).toBe('vendor-1');
      expect(where.status).toBe('ISSUED');
    });

    it('throws NotFoundException when the debit note does not exist', async () => {
      prisma.debitNote.findFirst.mockResolvedValue(null);
      await expect(service.findOne('missing', user)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('rejects transitions once a debit note is already SETTLED or CANCELLED', async () => {
      prisma.debitNote.findFirst.mockResolvedValue({ id: 'dn-1', status: 'SETTLED' });
      await expect(service.updateStatus('dn-1', { status: 'CANCELLED' }, user)).rejects.toThrow(BadRequestException);
    });

    it('updates status and writes an audit log', async () => {
      prisma.debitNote.findFirst.mockResolvedValue({ id: 'dn-1', status: 'ISSUED', remarks: 'old' });
      prisma.debitNote.update.mockResolvedValue({ id: 'dn-1', status: 'SETTLED' });

      const result = await service.updateStatus('dn-1', { status: 'SETTLED' }, user);
      expect(result.status).toBe('SETTLED');
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ tableName: 'debit_notes', recordId: 'dn-1', action: 'UPDATE' }));
    });
  });
});
