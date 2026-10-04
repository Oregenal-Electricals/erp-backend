import { BadRequestException, NotFoundException } from '@nestjs/common';
import { QuotationsService } from './quotations.service';

describe('QuotationsService - Price Integrity', () => {
  let service: QuotationsService;
  let prisma: any;
  let audit: any;
  const user = { id: 'user-1', companyId: 'company-1' };

  function item(overrides: any = {}) {
    return { itemCode: 'BULB-9W', itemName: '9W LED Bulb', qty: 1000, uom: 'PCS', unitPrice: 80, discount: 0, gstRate: 18, ...overrides };
  }

  const customer = { id: 'cust-1', companyId: 'company-1', code: 'HAV01', name: 'Havells' };

  function dto(overrides: any = {}) {
    const future = new Date();
    future.setDate(future.getDate() + 30);
    return {
      customerId: customer.id, customerName: 'Havells', validUntil: future.toISOString(),
      items: [item()],
      ...overrides,
    } as any;
  }

  let records: Record<string, any>;

  beforeEach(() => {
    records = {};
    let idCounter = 0;

    prisma = {
      quotation: {
        findFirst: jest.fn().mockImplementation(({ where }: any) => {
          const rec = records[where.id];
          if (!rec) return Promise.resolve(null);
          if (where.companyId && rec.companyId !== where.companyId) return Promise.resolve(null);
          return Promise.resolve(rec);
        }),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockImplementation(({ data }: any) => {
          const id = `qt-${++idCounter}`;
          const rec = { id, companyId: user.companyId, status: 'DRAFT', ...data };
          delete rec.items;
          records[id] = rec;
          return Promise.resolve({ ...rec });
        }),
        update: jest.fn().mockImplementation(({ where, data }: any) => {
          const rec = records[where.id];
          Object.assign(rec, data);
          return Promise.resolve({ ...rec });
        }),
      },
      lead: { update: jest.fn().mockResolvedValue({}) },
      customer: { findFirst: jest.fn().mockImplementation(({ where }: any) => Promise.resolve(where.id === customer.id ? customer : null)) },
      $transaction: jest.fn().mockImplementation((cb: any) => cb(prisma)),
    };

    audit = { log: jest.fn().mockResolvedValue(undefined) };
    service = new QuotationsService(prisma, audit);
  });

  async function seedDraft(overrides: any = {}) {
    return service.create(dto(overrides), user);
  }

  async function seedSent(overrides: any = {}) {
    const qt = await seedDraft(overrides);
    return service.send(qt.id, user);
  }

  describe('create()', () => {
    it('starts at revision 0 with the submitted line prices', async () => {
      const qt = await service.create(dto({ items: [item({ unitPrice: 80 })] }), user);
      expect(qt.revision).toBe(0);
      expect(qt.totalAmount).toBeCloseTo(80 * 1000 * 1.18, 1);
      expect(qt.customerId).toBe(customer.id);
    });

    it('requires customerId to resolve to a real Customer in this company', async () => {
      await expect(service.create(dto({ customerId: 'someone-elses-customer' }), user)).rejects.toThrow(NotFoundException);
    });
  });

  describe('send() / accept() / reject() status guards', () => {
    it('only sends a DRAFT quotation', async () => {
      const qt = await seedSent();
      await expect(service.send(qt.id, user)).rejects.toThrow(BadRequestException);
    });

    it('only accepts a SENT quotation', async () => {
      const qt = await seedDraft();
      await expect(service.accept(qt.id, user)).rejects.toThrow(BadRequestException);
    });

    it('blocks accepting a quotation whose validUntil date has passed', async () => {
      const past = new Date();
      past.setDate(past.getDate() - 5);
      const qt = await seedSent({ validUntil: past.toISOString() });
      await expect(service.accept(qt.id, user)).rejects.toThrow(BadRequestException);
    });

    it('accepts a SENT quotation that is still within its validity window', async () => {
      const qt = await seedSent();
      const accepted = await service.accept(qt.id, user);
      expect(accepted.status).toBe('ACCEPTED');
    });

    it('only rejects a SENT quotation', async () => {
      const qt = await seedDraft();
      await expect(service.reject(qt.id, { rejectedReason: 'too expensive' } as any, user)).rejects.toThrow(BadRequestException);
    });
  });

  describe('revise() - old revision can never again be accepted at its old price', () => {
    it('blocks revising a DRAFT quotation', async () => {
      const qt = await seedDraft();
      await expect(service.revise(qt.id, dto(), user)).rejects.toThrow(BadRequestException);
    });

    it('marks a SENT original as SUPERSEDED, which accept() then refuses', async () => {
      const qt = await seedSent({ items: [item({ unitPrice: 80 })] });
      const revised = await service.revise(qt.id, dto({ items: [item({ unitPrice: 75 })] }), user);

      expect(revised.revision).toBe(1);
      expect(revised.quotationNumber).toBe(qt.quotationNumber);
      expect(revised.totalAmount).toBeCloseTo(75 * 1000 * 1.18, 1);

      const original = await prisma.quotation.findFirst({ where: { id: qt.id, companyId: user.companyId } });
      expect(original.status).toBe('SUPERSEDED');
      // original's own price data is untouched - only its status changed
      expect(original.totalAmount).toBeCloseTo(80 * 1000 * 1.18, 1);

      await expect(service.accept(qt.id, user)).rejects.toThrow(BadRequestException);
    });

    it('leaves a REJECTED original as REJECTED, not SUPERSEDED', async () => {
      const qt = await seedSent();
      const rejected = await service.reject(qt.id, { rejectedReason: 'budget cut' } as any, user);
      const revised = await service.revise(rejected.id, dto(), user);

      expect(revised.revision).toBe(1);
      const original = await prisma.quotation.findFirst({ where: { id: rejected.id, companyId: user.companyId } });
      expect(original.status).toBe('REJECTED');
    });

    it('can only revise the latest live revision - the new revision is itself acceptable', async () => {
      const qt = await seedSent({ items: [item({ unitPrice: 80 })] });
      const revised = await service.revise(qt.id, dto({ items: [item({ unitPrice: 75 })] }), user);
      await service.send(revised.id, user);
      const accepted = await service.accept(revised.id, user);
      expect(accepted.status).toBe('ACCEPTED');
      expect(accepted.totalAmount).toBeCloseTo(75 * 1000 * 1.18, 1);
    });
  });
});
