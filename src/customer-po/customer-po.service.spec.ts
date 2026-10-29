import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CustomerPoService } from './customer-po.service';

describe('CustomerPoService - Price Integrity', () => {
  let service: CustomerPoService;
  let prisma: any;
  let audit: any;
  let salesOrders: any;
  let mrpService: any;
  let creditControl: any;
  let customerItemMapping: any;
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
  let shortageRecords: Record<string, any>;

  function seedShortage(overrides: any = {}) {
    const rec = {
      id: 'shortage-1', companyId: 'company-1', customerPoId: 'cpo-1',
      itemCode: 'RM-01', itemName: 'Raw Material 1', uom: 'PCS',
      requiredQty: 100, availableQty: 40, shortageQty: 60,
      status: 'PENDING_STORE_VERIFICATION', prId: null,
      systemCalculatedQty: null, verifiedQty: null, verificationReason: null,
      verifiedById: null, verifiedAt: null,
      createdBy: 'user-1', updatedBy: 'user-1',
      ...overrides,
    };
    shortageRecords[rec.id] = rec;
    return rec;
  }

  beforeEach(() => {
    cpoRecords = {};
    cpoItems = {};
    shortageRecords = {};
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
      materialShortage: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
        findFirst: jest.fn().mockImplementation(({ where }: any) => {
          const rec = shortageRecords[where.id];
          if (!rec) return Promise.resolve(null);
          if (where.companyId && rec.companyId !== where.companyId) return Promise.resolve(null);
          return Promise.resolve(rec);
        }),
        update: jest.fn().mockImplementation(({ where, data }: any) => {
          const rec = shortageRecords[where.id];
          Object.assign(rec, data);
          return Promise.resolve({ ...rec });
        }),
      },
      product: { findFirst: jest.fn().mockResolvedValue(null) },
      rawMaterial: { findFirst: jest.fn().mockResolvedValue(null) },
      // Mimics real Prisma transaction atomicity: this in-memory fake store
      // has no ACID semantics of its own, so if the callback throws (e.g.
      // createFromCpo() rejecting partway through acknowledge()), undo any
      // mutation it made first - otherwise a status flip to ACKNOWLEDGED
      // would "stick" even though the real acknowledgment is supposed to
      // have rolled back with it.
      $transaction: jest.fn().mockImplementation(async (cb: any) => {
        const recordsSnapshot = structuredClone(cpoRecords);
        const itemsSnapshot = structuredClone(cpoItems);
        try {
          return await cb(prisma);
        } catch (e) {
          for (const k of Object.keys(cpoRecords)) delete cpoRecords[k];
          Object.assign(cpoRecords, recordsSnapshot);
          for (const k of Object.keys(cpoItems)) delete cpoItems[k];
          Object.assign(cpoItems, itemsSnapshot);
          throw e;
        }
      }),
      role: { findMany: jest.fn().mockResolvedValue([]) },
    };

    audit = { log: jest.fn().mockResolvedValue(undefined) };
    creditControl = { checkCredit: jest.fn().mockResolvedValue({ allowed: true, reason: 'Credit check passed', position: {}, holdCreated: false }) };
    salesOrders = {
      createFromCpo: jest.fn().mockImplementation((cpo: any, items: any[]) => Promise.resolve({
        id: 'so-1', soNumber: 'SO-2026-0001', status: 'CONFIRMED',
        items: items.map((it: any, i: number) => ({ id: `so-item-${i}`, itemCode: it.itemCode, unitPrice: it.unitPrice, qty: it.qty })),
      })),
    };
    mrpService = { explodeMultiCpoMaterialNeeds: jest.fn().mockRejectedValue(new Error('shortage check not under test')) };
    customerItemMapping = { resolve: jest.fn().mockResolvedValue(null) };

    service = new CustomerPoService(prisma, audit, salesOrders, mrpService, creditControl, customerItemMapping);
  });

  // create() now auto-acknowledges (see autoAcknowledge() in the
  // service) and, with this suite's default mocks, that succeeds
  // immediately - moving the fixture straight to ACKNOWLEDGED before
  // the tests below ever run. Those tests are specifically about
  // behavior for a CPO that is *still* RECEIVED (the edit window, and
  // exercising acknowledge() directly) - a real case that still occurs
  // whenever auto-conversion itself fails (e.g. an unmapped item code)
  // and the CPO is left for manual handling. Force the fixture back to
  // that state here rather than re-deriving every one of those tests;
  // the new auto-conversion behavior itself is covered by its own
  // dedicated tests further below.
  async function seedReceivedCpo() {
    const cpo = await service.create(createDto(), user);
    cpoRecords[cpo.id].status = 'RECEIVED';
    cpoRecords[cpo.id].acknowledgedDate = null;
    // create() may have already auto-acknowledged (and called
    // createFromCpo) before the status was forced back above - clear
    // that call history so tests built on this helper that inspect
    // createFromCpo's call args (e.g. "prices flow to the Sales Order
    // unchanged") see only the call they are actually testing.
    salesOrders.createFromCpo.mockClear();
    return { ...cpo, status: 'RECEIVED', acknowledgedDate: null };
  }

  describe('create()', () => {
    it('requires the linked quotation to be ACCEPTED', async () => {
      await expect(service.create(createDto({ quotationId: draftQuotation.id }), user)).rejects.toThrow(BadRequestException);
    });

    it('creates a CPO with the submitted line prices, unchanged, then auto-converts it to ACKNOWLEDGED', async () => {
      const cpo = await service.create(createDto({ items: [cpoItem({ unitPrice: 80 })] }), user);
      // Auto-conversion (autoAcknowledge()) fires at the end of create()
      // and succeeds with this suite's default mocks - replacing the old
      // "stays RECEIVED until a human Acknowledges it" behavior.
      expect(cpo.status).toBe('ACKNOWLEDGED');
      expect(cpo.totalAmount).toBeCloseTo(80 * 100 * 1.18, 1);
    });
  });

  describe('automatic acknowledge + Sales Order creation (replaces the manual Acknowledge click)', () => {
    it('auto-converts a freshly created CPO straight to ACKNOWLEDGED with its Sales Order, with no Acknowledge call needed', async () => {
      const cpo = await service.create(createDto(), user);
      expect(cpo.status).toBe('ACKNOWLEDGED');
      expect(cpo.acknowledgedDate).toBeTruthy();
      expect(salesOrders.createFromCpo).toHaveBeenCalledTimes(1);
    });

    it('leaves the CPO RECEIVED and does not fail create(), if auto-conversion itself fails (e.g. an unmapped item)', async () => {
      salesOrders.createFromCpo.mockRejectedValueOnce(
        new BadRequestException('"BULB-9W" has no customer item mapping yet - map it on the Customer PO before acknowledging.'),
      );
      const cpo = await service.create(createDto(), user);
      expect(cpo.status).toBe('RECEIVED');
    });

    it('does not re-acknowledge (or double-create a Sales Order for) a CPO that already auto-converted', async () => {
      const cpo = await service.create(createDto(), user); // auto-acknowledged
      expect(cpo.status).toBe('ACKNOWLEDGED');
      salesOrders.createFromCpo.mockClear();

      // update() only allows editing a RECEIVED CPO - an already
      // ACKNOWLEDGED one (the normal post-auto-conversion state) is
      // rejected, exactly as it would be for a manually-acknowledged one.
      await expect(service.update(cpo.id, createDto() as any, user)).rejects.toThrow(BadRequestException);
      expect(salesOrders.createFromCpo).not.toHaveBeenCalled();

      // And calling the manual endpoint directly is equally guarded.
      await expect(service.acknowledge(cpo.id, user)).rejects.toThrow(BadRequestException);
      expect(salesOrders.createFromCpo).not.toHaveBeenCalled();
    });

    it('auto-converts on update() too, when the CPO is still RECEIVED (e.g. a retry after an earlier mapping fix)', async () => {
      const cpo = await seedReceivedCpo();
      const updated = await service.update(cpo.id, createDto({ items: [cpoItem({ unitPrice: 95 })] }) as any, user);
      expect(updated.status).toBe('ACKNOWLEDGED');
      expect(salesOrders.createFromCpo).toHaveBeenCalled();
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

  describe('Credit control (enforced at PO entry)', () => {
    it('blocks the PO when checkCredit reports it is not allowed and no override is given', async () => {
      creditControl.checkCredit.mockResolvedValue({ allowed: false, reason: 'Credit limit exceeded', position: {}, holdCreated: true, holdId: 'hold-1' });
      await expect(service.create(createDto(), user)).rejects.toThrow(BadRequestException);
    });

    it('requires an override reason when creditOverride is set', async () => {
      creditControl.checkCredit.mockResolvedValue({ allowed: false, reason: 'Credit limit exceeded', position: {}, holdCreated: true });
      await expect(service.create(createDto({ creditOverride: true }), user)).rejects.toThrow(BadRequestException);
    });

    it('blocks the override for a user without CREDIT_CONTROL_OVERRIDE', async () => {
      creditControl.checkCredit.mockResolvedValue({ allowed: false, reason: 'Credit limit exceeded', position: {}, holdCreated: true });
      prisma.role.findMany.mockResolvedValue([]);
      await expect(service.create(createDto({ creditOverride: true, creditOverrideReason: 'Approved by Sales Director' }), user)).rejects.toThrow(ForbiddenException);
    });

    it('allows the override for a user whose role grants CREDIT_CONTROL_OVERRIDE, and logs it', async () => {
      creditControl.checkCredit.mockResolvedValue({ allowed: false, reason: 'Credit limit exceeded', position: {}, holdCreated: true });
      prisma.role.findMany.mockResolvedValue([{ permissions: [{ permission: 'CREDIT_CONTROL_OVERRIDE' }] }]);
      const cpo = await service.create(createDto({ creditOverride: true, creditOverrideReason: 'Approved by Sales Director' }), user);
      // An allowed-via-override CPO is, by definition, clear to proceed -
      // autoAcknowledge() still runs and converts it, same as any other
      // successfully created CPO (see autoAcknowledge()'s credit-holds note).
      expect(cpo.status).toBe('ACKNOWLEDGED');
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ newValues: expect.objectContaining({ creditOverride: true }) }));
    });

    it('SUPER_ADMIN can always override, even with no explicit DB grant', async () => {
      creditControl.checkCredit.mockResolvedValue({ allowed: false, reason: 'Credit limit exceeded', position: {}, holdCreated: true });
      prisma.role.findMany.mockResolvedValue([]);
      const superUser = { ...user, allRoles: ['SUPER_ADMIN'] };
      const cpo = await service.create(createDto({ creditOverride: true, creditOverrideReason: 'Approved' }), superUser);
      expect(cpo.status).toBe('ACKNOWLEDGED');
    });

    it('creates the PO normally when credit is allowed, without touching role lookups', async () => {
      const cpo = await service.create(createDto(), user);
      expect(cpo.status).toBe('ACKNOWLEDGED');
      expect(prisma.role.findMany).not.toHaveBeenCalled();
    });
  });

  describe('verifyShortage() - Store verification gate (task #52)', () => {
    it('404s when the shortage does not belong to this company', async () => {
      seedShortage({ companyId: 'other-company' });
      await expect(service.verifyShortage('shortage-1', { verifiedQty: 60 }, user)).rejects.toThrow(NotFoundException);
    });

    it('404s when the shortage id does not exist', async () => {
      await expect(service.verifyShortage('does-not-exist', { verifiedQty: 60 }, user)).rejects.toThrow(NotFoundException);
    });

    it('rejects verifying a row that is not PENDING_STORE_VERIFICATION', async () => {
      seedShortage({ status: 'OPEN' });
      await expect(service.verifyShortage('shortage-1', { verifiedQty: 60 }, user)).rejects.toThrow(BadRequestException);
    });

    it('confirms the system figure as accurate with no reason required, and opens it for Purchase', async () => {
      seedShortage({ shortageQty: 60 });
      const result = await service.verifyShortage('shortage-1', { verifiedQty: 60 }, user);
      expect(result.status).toBe('OPEN');
      expect(result.shortageQty).toBe(60);
      expect(result.systemCalculatedQty).toBe(60);
      expect(result.verifiedQty).toBe(60);
      expect(result.verificationReason).toBeNull();
      expect(result.verifiedById).toBe(user.id);
      expect(result.verifiedAt).toBeInstanceOf(Date);
    });

    it('rejects an override with no reason', async () => {
      seedShortage({ shortageQty: 60 });
      await expect(service.verifyShortage('shortage-1', { verifiedQty: 45 }, user)).rejects.toThrow(BadRequestException);
    });

    it('rejects an override with a blank/whitespace-only reason', async () => {
      seedShortage({ shortageQty: 60 });
      await expect(service.verifyShortage('shortage-1', { verifiedQty: 45, reason: '   ' }, user)).rejects.toThrow(BadRequestException);
    });

    it('accepts an override with a reason, freezing the original system-calculated qty and updating shortageQty to the corrected figure', async () => {
      seedShortage({ shortageQty: 60 });
      const result = await service.verifyShortage('shortage-1', { verifiedQty: 45, reason: 'Found 15 more units on the mezzanine rack not yet entered in the system' }, user);
      expect(result.status).toBe('OPEN');
      expect(result.shortageQty).toBe(45);
      expect(result.systemCalculatedQty).toBe(60);
      expect(result.verifiedQty).toBe(45);
      expect(result.verificationReason).toBe('Found 15 more units on the mezzanine rack not yet entered in the system');
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({
        tableName: 'material_shortages', recordId: 'shortage-1',
        newValues: expect.objectContaining({ isOverride: true, shortageQty: 45, systemCalculatedQty: 60 }),
      }));
    });

    it('rejects a negative verified quantity', async () => {
      seedShortage({ shortageQty: 60 });
      await expect(service.verifyShortage('shortage-1', { verifiedQty: -5 }, user)).rejects.toThrow(BadRequestException);
    });

    it('applies uniformly regardless of why the row was raised - an IQC-reject-driven shortfall is just another PENDING_STORE_VERIFICATION row with no special-case field', async () => {
      // There is no separate origin/source column on MaterialShortage -
      // every row (plain BOM-vs-stock mismatch or one inflated by an
      // IQC reject reducing usable stock) goes through this same gate.
      seedShortage({ shortageQty: 80, requiredQty: 100, availableQty: 20 });
      const result = await service.verifyShortage('shortage-1', { verifiedQty: 80 }, user);
      expect(result.status).toBe('OPEN');
    });
  });
});
