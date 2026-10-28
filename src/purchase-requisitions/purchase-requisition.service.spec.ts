import { BadRequestException } from '@nestjs/common';
import { PurchaseRequisitionService } from './purchase-requisition.service';

describe('PurchaseRequisitionService - createFromShortages', () => {
  let service: PurchaseRequisitionService;
  let prisma: any;
  let audit: any;
  const user = { id: 'user-1', companyId: 'company-1' };

  let shortages: any[];
  let prRecords: Record<string, any>;
  let prItems: Record<string, any[]>;

  function shortageRow(overrides: any = {}) {
    return {
      id: `shortage-${Math.random().toString(36).slice(2)}`,
      companyId: 'company-1',
      customerPoId: 'cpo-1',
      rawMaterialId: 'rm-1',
      itemCode: 'RM-COPPER',
      itemName: 'Copper Wire',
      requiredQty: 500, // full BOM/demand requirement - must NOT end up as the PR qty
      availableQty: 420,
      shortageQty: 80, // the true shortfall - this IS what the PR qty must equal
      uom: 'KG',
      status: 'OPEN',
      createdAt: new Date('2026-01-01'),
      ...overrides,
    };
  }

  beforeEach(() => {
    shortages = [shortageRow()];
    prRecords = {};
    prItems = {};
    let idCounter = 0;

    prisma = {
      materialShortage: {
        findMany: jest.fn().mockImplementation(({ where }: any) => {
          const codes: string[] = where.itemCode.in;
          return Promise.resolve(
            shortages.filter(
              s => s.companyId === where.companyId && s.status === where.status && codes.includes(s.itemCode),
            ),
          );
        }),
        updateMany: jest.fn().mockImplementation(({ where, data }: any) => {
          let count = 0;
          for (const s of shortages) {
            if (where.id.in.includes(s.id)) { Object.assign(s, data); count++; }
          }
          return Promise.resolve({ count });
        }),
      },
      purchaseRequisition: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockImplementation(({ data }: any) => {
          const id = `pr-${++idCounter}`;
          const items = (data.items?.create || []).map((it: any, i: number) => ({ id: `pr-item-${id}-${i}`, prId: id, ...it }));
          const { items: _drop, ...rest } = data;
          prRecords[id] = { id, status: 'DRAFT', ...rest };
          prItems[id] = items;
          return Promise.resolve({ ...prRecords[id], items });
        }),
        update: jest.fn().mockImplementation(({ where, data }: any) => {
          Object.assign(prRecords[where.id], data);
          return Promise.resolve({ ...prRecords[where.id], items: prItems[where.id] || [] });
        }),
      },
    };

    audit = { log: jest.fn().mockResolvedValue(undefined) };
    service = new PurchaseRequisitionService(prisma, audit);
  });

  function dto(overrides: any = {}) {
    return {
      title: 'Auto PR from shortage', requiredDate: '2026-02-01', itemCodes: ['RM-COPPER'],
      ...overrides,
    };
  }

  it('sets the PR line quantity to the shortfall (shortageQty), never the full BOM requirement', async () => {
    const pr = await service.createFromShortages(dto(), user);
    expect(pr.items).toHaveLength(1);
    expect(pr.items[0].requiredQty).toBe(80);
    expect(pr.items[0].requiredQty).not.toBe(500);
    expect(pr.items[0].itemCode).toBe('RM-COPPER');
  });

  it('sums multiple OPEN shortage rows for the same item into a single PR line', async () => {
    shortages = [
      shortageRow({ id: 's-1', shortageQty: 80 }),
      shortageRow({ id: 's-2', shortageQty: 45, customerPoId: 'cpo-2' }),
    ];
    const pr = await service.createFromShortages(dto(), user);
    expect(pr.items).toHaveLength(1);
    expect(pr.items[0].requiredQty).toBe(125);
  });

  it('creates the PR in DRAFT status (no auto-submit / auto-approval)', async () => {
    const pr = await service.createFromShortages(dto(), user);
    expect(pr.status).toBe('DRAFT');
  });

  it('tags the source MaterialShortage rows as PR_RAISED and links them to the new PR', async () => {
    const pr = await service.createFromShortages(dto(), user);
    expect(shortages[0].status).toBe('PR_RAISED');
    expect(shortages[0].prId).toBe(pr.id);
  });

  it('rejects when there are no OPEN shortages for the requested item codes', async () => {
    shortages = [];
    await expect(service.createFromShortages(dto(), user)).rejects.toThrow(BadRequestException);
  });

  it('ignores shortages for item codes that were not requested', async () => {
    shortages = [shortageRow(), shortageRow({ id: 's-other', itemCode: 'RM-ALUMINIUM', shortageQty: 999 })];
    const pr = await service.createFromShortages(dto({ itemCodes: ['RM-COPPER'] }), user);
    expect(pr.items).toHaveLength(1);
    expect(pr.items[0].itemCode).toBe('RM-COPPER');
  });
});
