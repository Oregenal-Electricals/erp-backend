import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CustomerItemMappingService } from './customer-item-mapping.service';

describe('CustomerItemMappingService', () => {
  let service: CustomerItemMappingService;
  let prisma: any;
  let audit: any;
  let workflows: any;
  const user = { id: 'user-1', companyId: 'company-1' };

  const customer = { id: 'cust-1', companyId: 'company-1', code: 'HAV01', name: 'Havells' };
  const product = { id: 'prod-1', companyId: 'company-1', code: 'BULB-9W-WW', name: '9W LED Bulb Warm White' };
  const otherProduct = { id: 'prod-2', companyId: 'company-1', code: 'BULB-9W-CW', name: '9W LED Bulb Cool White' };

  let records: Record<string, any>;

  beforeEach(() => {
    records = {};
    let idCounter = 0;

    prisma = {
      customer: { findFirst: jest.fn().mockImplementation(({ where }: any) => Promise.resolve(where.id === customer.id ? customer : null)) },
      product: { findFirst: jest.fn().mockImplementation(({ where }: any) => {
        if (where.id === product.id) return Promise.resolve(product);
        if (where.id === otherProduct.id) return Promise.resolve(otherProduct);
        return Promise.resolve(null);
      }) },
      customerItemMapping: {
        findFirst: jest.fn().mockImplementation(({ where }: any) => {
          if (where.id) {
            const rec = records[where.id];
            if (!rec) return Promise.resolve(null);
            if (where.companyId && rec.companyId !== where.companyId) return Promise.resolve(null);
            return Promise.resolve({ ...rec, product: rec.productId === product.id ? product : otherProduct, customer });
          }
          const found = Object.values(records).find((r: any) =>
            r.companyId === where.companyId && r.customerId === where.customerId && r.customerItemCode === where.customerItemCode
            && (where.isActive === undefined || r.isActive === where.isActive),
          );
          if (!found) return Promise.resolve(null);
          return Promise.resolve({ ...(found as any), product: (found as any).productId === product.id ? product : otherProduct, customer });
        }),
        create: jest.fn().mockImplementation(({ data }: any) => {
          const id = `map-${++idCounter}`;
          records[id] = { id, isActive: true, ...data };
          return Promise.resolve({ ...records[id], product, customer });
        }),
        update: jest.fn().mockImplementation(({ where, data }: any) => {
          const rec = records[where.id];
          Object.assign(rec, data);
          return Promise.resolve({ ...rec, product: rec.productId === product.id ? product : otherProduct, customer });
        }),
      },
    };

    audit = { log: jest.fn().mockResolvedValue(undefined) };
    workflows = { submit: jest.fn().mockResolvedValue({ requiresApproval: true, request: { id: 'req-1' } }) };

    service = new CustomerItemMappingService(prisma, audit, workflows);
  });

  describe('resolve()', () => {
    it('returns null when no mapping exists for this customer + item code', async () => {
      const result = await service.resolve(customer.id, 'UNKNOWN-CODE', user);
      expect(result).toBeNull();
    });

    it('finds an existing mapping for this customer + item code', async () => {
      const created = await service.createIfMissing({ customerId: customer.id, customerItemCode: 'HAV-BULB-WW-9', productId: product.id } as any, user);
      const found = await service.resolve(customer.id, 'HAV-BULB-WW-9', user);
      expect(found?.id).toBe(created?.id);
      expect(found?.product.code).toBe(product.code);
    });
  });

  describe('createIfMissing() - first-time mapping needs no approval', () => {
    it('creates a new ACTIVE mapping when none exists', async () => {
      const mapping = await service.createIfMissing({ customerId: customer.id, customerItemCode: 'HAV-BULB-WW-9', customerItemName: 'Bulb Warm White 9W', productId: product.id } as any, user);
      expect(mapping?.status).toBe('ACTIVE');
      expect(mapping?.product.code).toBe(product.code);
      expect(workflows.submit).not.toHaveBeenCalled();
    });

    it('returns the existing mapping unchanged rather than creating a duplicate', async () => {
      const first = await service.createIfMissing({ customerId: customer.id, customerItemCode: 'HAV-BULB-WW-9', productId: product.id } as any, user);
      const second = await service.createIfMissing({ customerId: customer.id, customerItemCode: 'HAV-BULB-WW-9', productId: otherProduct.id } as any, user);
      expect(second?.id).toBe(first?.id);
      expect(second?.product.code).toBe(product.code); // still the original mapping, not otherProduct
    });

    it('requires productId to create a new mapping', async () => {
      await expect(service.createIfMissing({ customerId: customer.id, customerItemCode: 'HAV-NEW' } as any, user)).rejects.toThrow(BadRequestException);
    });

    it('requires the customer to belong to this company', async () => {
      await expect(service.createIfMissing({ customerId: 'someone-elses-customer', customerItemCode: 'X', productId: product.id } as any, user)).rejects.toThrow(NotFoundException);
    });
  });

  describe('requestChange() - editing an existing mapping requires approval', () => {
    it('stages the new product and submits into the generic workflow engine', async () => {
      const mapping = await service.createIfMissing({ customerId: customer.id, customerItemCode: 'HAV-BULB-WW-9', productId: product.id } as any, user);
      const updated = await service.requestChange(mapping!.id, { productId: otherProduct.id } as any, user);

      expect(updated.status).toBe('PENDING_CHANGE');
      expect(updated.pendingProductId).toBe(otherProduct.id);
      // the LIVE product is untouched while the change is pending
      expect(updated.productId).toBe(product.id);
      expect(workflows.submit).toHaveBeenCalledWith(
        expect.objectContaining({ documentType: 'CUSTOMER_ITEM_MAPPING', documentId: mapping!.id }),
        user,
      );
    });

    it('blocks requesting a second change while one is already pending', async () => {
      const mapping = await service.createIfMissing({ customerId: customer.id, customerItemCode: 'HAV-BULB-WW-9', productId: product.id } as any, user);
      await service.requestChange(mapping!.id, { productId: otherProduct.id } as any, user);
      await expect(service.requestChange(mapping!.id, { productId: otherProduct.id } as any, user)).rejects.toThrow(BadRequestException);
    });
  });

  describe('onWorkflowApproved() / onWorkflowRejected()', () => {
    it('promotes the pending product to live on approval', async () => {
      const mapping = await service.createIfMissing({ customerId: customer.id, customerItemCode: 'HAV-BULB-WW-9', productId: product.id } as any, user);
      await service.requestChange(mapping!.id, { productId: otherProduct.id } as any, user);

      await service.onWorkflowApproved(mapping!.id, user);
      const after = await service.findOne(mapping!.id, user);
      expect(after.status).toBe('ACTIVE');
      expect(after.productId).toBe(otherProduct.id);
      expect(after.pendingProductId).toBeNull();
    });

    it('discards the pending product on rejection, keeping the original live', async () => {
      const mapping = await service.createIfMissing({ customerId: customer.id, customerItemCode: 'HAV-BULB-WW-9', productId: product.id } as any, user);
      await service.requestChange(mapping!.id, { productId: otherProduct.id } as any, user);

      await service.onWorkflowRejected(mapping!.id, user);
      const after = await service.findOne(mapping!.id, user);
      expect(after.status).toBe('ACTIVE');
      expect(after.productId).toBe(product.id);
      expect(after.pendingProductId).toBeNull();
    });
  });
});
