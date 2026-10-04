import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CustomerPoService } from './customer-po.service';

describe('CustomerPoService - Price Integrity', () => {
  let service: CustomerPoService;
  let prisma: any;
  let audit: any;
  let salesOrders: any;
  let mrpService: any;
  const user = { id: 'user-1', companyId: 'company-1' };

  const acceptedQuotation = { id: 'qt-1', companyId: 'company-1', status: 'ACCEPTED' };
  const draftQuotation = { id: 'qt-2', companyId: 'company-1', status: 'DRAFT' };
  const customer = { id: 'cust-1', companyId: 'company-1', code: 'CUST-01', name: 'Havells' };

  function cpoItem(overrides: any = {}) {
    return { itemCode: 'BULB-9W', itemName: '9W LED Bulb', qty: 100, uom: 'PCS', unitPrice: 80, discount: 0, gstRate: 18, ...overrides };
  }

  function createDto(overrides: any = {}) {
    return {
      poType: 'WRITTEN', customerPoNumber: 'PO-001', customerId: customer.id, customerName: 'Havells',
      poDate: '2026-01-01', deliveryDate: '2026-02-01', currency: 'INR',
      items: [cpoItem()],
      ...overrides,
    } as any;
  }

  let cpoRecords: Record<string, any>;
  let cpoItems: Record<string, any[]>;

  beforeEach(() => {
    cpoRecords = {};
    cpoItems = {};
    let idCounter = 0;

    prisma = {
      customerPo: {
        findFirst: jest.fn().mockImplementation(({ where }: any) => {
          const rec = cpoRecords[where.id];
          if (!rec) return Promise.resolve(null);
          if (where.companyId && rec.companyId !== where.companyId) return Promise.resolve(null);
          return Promise.resolve({ ...rec, items: cpoItems[rec.id] || [] });
        }),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockImplementation(({ data }: any) => {
          const id = `cpo-${++idCounter}`;
          const items = (data.items?.create || []).map((it: any, i: number) => ({ id: `item-${id}-${i}`, cpoId: id, ...it }));
          const { items: _drop, ...rest } = data;
          cpoRecords[id] = { id, status: 'RECEIVED', ...rest };
          cpoItems[id] = items;
          return Promise.resolve({ ...cpoRecords[id], items });
        }),
        update: jest.fn().mockImplementation(({ where, data }: any) => {
          const rec = cpoRecords[where.id];
          const { items: itemsOp, ...rest } = data;
          Object.assign(rec, rest);
          if (itemsOp?.create) {
            cpoItems[where.id] = itemsOp.create.map((it: any, i: number) => ({ id: `item-${where.id}-${Date.now()}-${i}`, cpoId: where.id, ...it }));
          }
          return Promise.resolve({ ...rec, items: cpoItems[where.id] || [] });
        }),
      },
      customerPoItem: {
        deleteMany: jest.fn().mockImplementation(({ where }: any) => {
          cpoItems[where.cpoId] = [];
          return Promise.resolve({ count: 0 });
        }),
      },
      quotation: {
        findFirst: jest.fn().mockImplementation(({ where }: any) => {
          if (where.id === acceptedQuotation.id) return Promise.resolve(acceptedQuotation);
          if (where.id === draftQuotation.id) return Promise.resolve(draftQuotation);
          return Promise.resolve(null);
        }),
      },
      customer: {
        findFirst: jest.fn().mockImplementation(({ where }: any) => Promise.resolve(where.id === customer.id ? customer : null)),
      },
      task: { count: jest.fn().mockResolvedValue(0) },
      materialShortage: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }), createMany: jest.fn().mockResolvedValue({ count: 0 }) },
      product: { findFirst: jest.fn().mockResolvedValue(null) },
      rawMaterial: { findFirst: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn().mockImplementation((cb: any) => cb(prisma)),
    };

    audit = { log: jest.fn().mockResolvedValue(undefined) };
    salesOrders = {
      createFromCpo: jest.fn().mockImplementation((cpo: any, items: any[]) => Promise.resolve({
        id: 'so-1', soNumber: 'SO-2026-0001', status: 'CONFIRMED',
        items: items.map((it: any, i: number) => ({ id: `so-item-${i}`, itemCode: it.itemCode, unitPrice: it.unitPrice, qty: it.qty })),
      })),
    };
    mrpService = { explodeMultiCpoMaterialNeeds: jest.fn().mockRejectedValue(new Error('shortage check not under test')) };

    service = new CustomerPoService(prisma, audit, salesOrders, mrpService);
  });

  async function seedReceivedCpo() {
    return service.create(createDto(), user);
  }

  describe('create()', () => {
    it('requires the linked quotation to be ACCEPTED', async () => {
      await expect(service.create(createDto({ quotationId: draftQuotation.id }), user)).rejects.toThrow(BadRequestException);
    });

    it('creates a RECEIVED CPO with the submitted line prices, unchanged', async () => {
      const cpo = await service.create(createDto({ items: [cpoItem({ unitPrice: 80 })] }), user);
      expect(cpo.status).toBe('RECEIVED');
      expect(cpo.totalAmount).toBeCloseTo(80 * 100 * 1.18, 1);
    });
  });

  describe('update() - RECEIVED-only edit window', () => {
    it('blocks editing once the CPO is no longer RECEIVED', async () => {
      const cpo = await seedReceivedCpo();
      await prisma.customerPo.update({ where: { id: cpo.id }, data: { status: 'ACKNOWLEDGED' } });
      await expect(service.update(cpo.id, createDto() as any, user)).rejects.toThrow(BadRequestException);
    });

    it('rejects a quotationId that does not belong to this company or is not ACCEPTED', async () => {
      const cpo = await seedReceivedCpo();
      await expect(service.update(cpo.id, createDto({ quotationId: draftQuotation.id }) as any, user)).rejects.toThrow(BadRequestException);
      await expect(service.update(cpo.id, createDto({ quotationId: 'missing-qt' }) as any, user)).rejects.toThrow(NotFoundException);
    });

    it('rejects a customerId that does not belong to this company', async () => {
      const cpo = await seedReceivedCpo();
      await expect(service.update(cpo.id, createDto({ customerId: 'someone-elses-customer' }) as any, user)).rejects.toThrow(NotFoundException);
    });

    it('accepts a valid customerId and quotationId', async () => {
      const cpo = await seedReceivedCpo();
      const updated = await service.update(cpo.id, createDto({ customerId: customer.id, quotationId: acceptedQuotation.id }) as any, user);
      expect(updated.customerId).toBe(customer.id);
      expect(updated.quotationId).toBe(acceptedQuotation.id);
    });

    it('replaces items with the resubmitted prices inside a single transaction', async () => {
      const cpo = await seedReceivedCpo();
      const updated = await service.update(cpo.id, createDto({ items: [cpoItem({ unitPrice: 95 })] }) as any, user);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(updated.totalAmount).toBeCloseTo(95 * 100 * 1.18, 1);
    });

    it('re-checks status inside the transaction, so a concurrent Acknowledge blocks the edit', async () => {
      const cpo = await seedReceivedCpo();
      let insideTx = false;
      prisma.$transaction.mockImplementation(async (cb: any) => {
        insideTx = true;
        try {
          return await cb(prisma);
        } finally {
          insideTx = false;
        }
      });
      const originalFindFirst = prisma.customerPo.findFirst;
      prisma.customerPo.findFirst = jest.fn().mockImplementation((args: any) => {
        if (insideTx) return Promise.resolve({ ...cpoRecords[cpo.id], status: 'ACKNOWLEDGED', items: cpoItems[cpo.id] || [] });
        return originalFindFirst(args);
      });
      await expect(service.update(cpo.id, createDto() as any, user)).rejects.toThrow(BadRequestException);
    });
  });

  describe('acknowledge() - prices flow to the Sales Order unchanged', () => {
    it("creates the Sales Order via createFromCpo using the CPO's own item prices", async () => {
      const cpo = await seedReceivedCpo();
      await service.acknowledge(cpo.id, user);
      expect(salesOrders.createFromCpo).toHaveBeenCalled();
      const [, itemsArg] = salesOrders.createFromCpo.mock.calls[0];
      expect(itemsArg[0].unitPrice).toBe(80);
    });

    it('only acknowledges a RECEIVED CPO', async () => {
      const cpo = await seedReceivedCpo();
      await prisma.customerPo.update({ where: { id: cpo.id }, data: { status: 'ACKNOWLEDGED' } });
      await expect(service.acknowledge(cpo.id, user)).rejects.toThrow(BadRequestException);
    });
  });

  describe("createQuantityIncrease() - original PO's price data is never touched", () => {
    it('blocks increasing quantity on a still-RECEIVED PO (Edit should be used instead)', async () => {
      const cpo = await seedReceivedCpo();
      await expect(service.createQuantityIncrease(cpo.id, { poType: 'WRITTEN', customerPoNumber: 'PO-001-A', deliveryDate: '2026-03-01', items: [cpoItem()] } as any, user)).rejects.toThrow(BadRequestException);
    });

    it('blocks increasing quantity on a CANCELLED PO', async () => {
      const cpo = await seedReceivedCpo();
      await prisma.customerPo.update({ where: { id: cpo.id }, data: { status: 'CANCELLED' } });
      await expect(service.createQuantityIncrease(cpo.id, { poType: 'WRITTEN', customerPoNumber: 'PO-001-A', deliveryDate: '2026-03-01', items: [cpoItem()] } as any, user)).rejects.toThrow(BadRequestException);
    });

    it("creates a brand-new linked PO rather than mutating the original's prices", async () => {
      const cpo = await seedReceivedCpo();
      await prisma.customerPo.update({ where: { id: cpo.id }, data: { status: 'ACKNOWLEDGED' } });
      const newCpo = await service.createQuantityIncrease(cpo.id, { poType: 'WRITTEN', customerPoNumber: 'PO-001-A', deliveryDate: '2026-03-01', items: [cpoItem({ unitPrice: 120 })] } as any, user);
      expect(newCpo.id).not.toBe(cpo.id);
      expect(newCpo.amendmentOfId).toBe(cpo.id);
      const originalAfter = await prisma.customerPo.findFirst({ where: { id: cpo.id, companyId: user.companyId } });
      expect(originalAfter.totalAmount).toBeCloseTo(80 * 100 * 1.18, 1);
    });
  });
});
