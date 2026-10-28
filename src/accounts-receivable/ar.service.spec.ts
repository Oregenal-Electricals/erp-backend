import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ArService } from './ar.service';

describe('ArService', () => {
  let service: ArService;
  let prisma: any;
  let audit: any;
  let customerItemMapping: any;
  const user = { id: 'user-1', companyId: 'company-1' };

  const product = { id: 'prod-1', code: 'BULB-9W-WW', name: '9W LED Bulb Warm White' };
  const rawMaterial = { id: 'rm-1', code: 'RM-COPPER-WIRE', name: 'Copper Wire 1mm' };

  const dispatchItemFg = {
    id: 'di-1', soItemId: 'soi-1', itemCode: product.code, itemName: product.name,
    dispatchedQty: 10, uom: 'PCS', unitPrice: 100, gstRate: 18, gstAmount: 180, totalAmount: 1180,
    soItem: { saleType: 'FG' },
  };
  const dispatchItemRm = {
    id: 'di-2', soItemId: 'soi-2', itemCode: rawMaterial.code, itemName: rawMaterial.name,
    dispatchedQty: 5, uom: 'KG', unitPrice: 50, gstRate: 18, gstAmount: 45, totalAmount: 295,
    soItem: { saleType: 'RM' },
  };

  const dispatch = {
    id: 'dispatch-1', companyId: 'company-1', soId: 'so-1', status: 'DELIVERED',
    customerName: 'Havells India', deliveryAddress: 'Gurugram, HR',
    items: [dispatchItemFg, dispatchItemRm],
    salesOrder: { customerId: 'cust-1', cpo: { customerId: 'cust-1' } },
  };

  function makePrisma() {
    let invoiceSeq = 0;
    const invoices: Record<string, any> = {};

    return {
      arInvoice: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockImplementation(({ data }: any) => {
          const id = `inv-${++invoiceSeq}`;
          const items = (data.items?.create || []).map((it: any, idx: number) => ({ id: `item-${idx}`, invoiceId: id, ...it }));
          const rec = { id, ...data, items };
          delete rec.items.create;
          invoices[id] = rec;
          return Promise.resolve(rec);
        }),
        findFirst: jest.fn().mockImplementation(({ where }: any) => {
          if (where?.id) return Promise.resolve(invoices[where.id] || null);
          return Promise.resolve(null);
        }),
        update: jest.fn().mockImplementation(({ where, data }: any) => {
          Object.assign(invoices[where.id], data);
          return Promise.resolve(invoices[where.id]);
        }),
      },
      arPayment: { count: jest.fn().mockResolvedValue(0), create: jest.fn() },
      dispatch: { findFirst: jest.fn().mockResolvedValue(dispatch) },
      salesOrder: { findFirst: jest.fn().mockResolvedValue({ customerId: 'cust-1', cpo: { customerId: 'cust-1' } }) },
      rawMaterial: { findFirst: jest.fn().mockImplementation(({ where }: any) => Promise.resolve(where.code === rawMaterial.code ? rawMaterial : null)) },
      product: { findFirst: jest.fn().mockImplementation(({ where }: any) => Promise.resolve(where.code === product.code ? product : null)) },
      account: { findFirst: jest.fn().mockResolvedValue(null), update: jest.fn() },
      voucher: { count: jest.fn().mockResolvedValue(0), create: jest.fn() },
    };
  }

  beforeEach(() => {
    prisma = makePrisma();
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    customerItemMapping = { resolveByInternalItem: jest.fn().mockResolvedValue(null) };
    service = new ArService(prisma, audit, customerItemMapping);
  });

  describe('createFromDispatch()', () => {
    it('creates one ArInvoiceItem per dispatch item, resolving the customer wording via CustomerItemMapping', async () => {
      customerItemMapping.resolveByInternalItem.mockImplementation((customerId: string, target: any) => {
        if (target.productId === product.id) {
          return Promise.resolve({ customerItemCode: 'HAV-BULB-9W', customerItemName: 'LED Bulb 9 Watt (Warm)' });
        }
        return Promise.resolve(null); // no mapping for the raw material line
      });

      const invoice = await service.createFromDispatch('dispatch-1', user);

      expect(invoice.items).toHaveLength(2);

      const fgLine = invoice.items.find((i: any) => i.itemCode === product.code);
      expect(fgLine.productId).toBe(product.id);
      expect(fgLine.rawMaterialId).toBeNull();
      expect(fgLine.customerItemWording).toBe('LED Bulb 9 Watt (Warm)');
      expect(fgLine.customerItemCode).toBe('HAV-BULB-9W');

      // No mapping exists for the raw material line - falls back to our
      // own itemName, and must NOT block invoice creation.
      const rmLine = invoice.items.find((i: any) => i.itemCode === rawMaterial.code);
      expect(rmLine.rawMaterialId).toBe(rawMaterial.id);
      expect(rmLine.productId).toBeNull();
      expect(rmLine.customerItemWording).toBe(rawMaterial.name);
      expect(rmLine.customerItemCode).toBeNull();
    });

    it('resolves the internal item by saleType - RM lines look up RawMaterial, not Product', async () => {
      await service.createFromDispatch('dispatch-1', user);
      expect(prisma.rawMaterial.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ code: rawMaterial.code }) }));
      expect(prisma.product.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ code: product.code }) }));
    });

    it('still creates the invoice when the dispatch is not linked to any Customer master record', async () => {
      prisma.dispatch.findFirst.mockResolvedValueOnce({ ...dispatch, salesOrder: { customerId: null, cpo: null } });
      const invoice = await service.createFromDispatch('dispatch-1', user);
      expect(invoice.items).toHaveLength(2);
      expect(customerItemMapping.resolveByInternalItem).not.toHaveBeenCalled();
      expect(invoice.items[0].customerItemWording).toBe(product.name);
    });

    it('throws when the dispatch is not DELIVERED', async () => {
      prisma.dispatch.findFirst.mockResolvedValueOnce({ ...dispatch, status: 'DISPATCHED' });
      await expect(service.createFromDispatch('dispatch-1', user)).rejects.toThrow(BadRequestException);
    });

    it('throws when the dispatch does not exist', async () => {
      prisma.dispatch.findFirst.mockResolvedValueOnce(null);
      await expect(service.createFromDispatch('missing', user)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create() - manual invoice with explicit line items', () => {
    it('resolves customer wording for each supplied item via the Sales Order customer', async () => {
      customerItemMapping.resolveByInternalItem.mockResolvedValue({ customerItemCode: 'HAV-WIRE-1MM', customerItemName: 'Copper Wire 1 MM' });

      const invoice = await service.create({
        soId: 'so-1', customerName: 'Havells India', subtotal: 50, totalGst: 9, totalAmount: 59,
        items: [{ itemCode: rawMaterial.code, itemName: rawMaterial.name, rawMaterialId: rawMaterial.id, qty: 1, unitPrice: 50, gstAmount: 9, totalAmount: 59 }],
      } as any, user);

      expect(invoice.items).toHaveLength(1);
      expect(invoice.items[0].customerItemWording).toBe('Copper Wire 1 MM');
      expect(customerItemMapping.resolveByInternalItem).toHaveBeenCalledWith('cust-1', { productId: null, rawMaterialId: rawMaterial.id }, user);
    });

    it('creates no items when the DTO does not provide any - preserves the old lump-sum behaviour', async () => {
      const invoice = await service.create({ customerName: 'Walk-in Customer', subtotal: 100, totalGst: 18, totalAmount: 118 } as any, user);
      expect(invoice.items).toEqual([]);
      expect(customerItemMapping.resolveByInternalItem).not.toHaveBeenCalled();
    });
  });

  describe('findOne()', () => {
    it('surfaces the invoice items (with customer wording) for the print/getById view', async () => {
      customerItemMapping.resolveByInternalItem.mockResolvedValue(null);
      const created = await service.createFromDispatch('dispatch-1', user);
      const found = await service.findOne(created.id, user);
      expect(found.items).toHaveLength(2);
      expect(found.items.every((i: any) => typeof i.customerItemWording === 'string' && i.customerItemWording.length > 0)).toBe(true);
    });

    it('throws when the invoice does not exist for this company', async () => {
      await expect(service.findOne('missing', user)).rejects.toThrow(NotFoundException);
    });
  });
});
