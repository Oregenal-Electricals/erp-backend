import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { MaterialReservationService } from '../work-orders/material-reservation.service';
import { RoutingService } from '../routing/routing.service';
import { isTestSessionActive } from '../common/context/test-session.context';

@Injectable()
export class MrpService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private materialReservation: MaterialReservationService,
    private routingService: RoutingService,
  ) {}

  /**
   * Looks up the approved BOM that actually produces a given product -
   * either its own standalone MASTER BOM (Type 1: the fully-packaged
   * item), or, if none exists, the STAGE-type BOM hanging off whichever
   * RoutingStage produces it directly (Type 2/3: an intermediate item
   * like an SMT board or an MI assembly, ordered on its own). Returns
   * null if the item isn't producible at all (a true raw material, or a
   * product with no BOM yet).
   */
  private async findProducingBom(companyId: string, productId: string) {
    const master = await this.prisma.bom.findFirst({
      where: { companyId, productId, status: 'APPROVED', bomType: 'MASTER' },
      include: { items: { where: { isActive: true } } },
    });
    if (master) return master;
    const matchedStage = await this.prisma.routingStage.findFirst({
      where: { companyId, isActive: true, bom: { productId, status: 'APPROVED' } },
      include: { bom: { include: { items: { where: { isActive: true } } } }, routing: true },
    });
    if (matchedStage && matchedStage.routing.isActive) return matchedStage.bom;
    return null;
  }

  /**
   * Discovers the full BOM/routing tree structure below a set of root
   * item codes - which items are producible (have their own BOM,
   * possibly via a routing stage) and which are true leaves (raw
   * materials, or anything with no approved BOM at all) - along with
   * each item's "low-level code": the DEEPEST level at which it appears
   * anywhere in the combined tree. Processing items in low-level-code
   * order later guarantees that an item used both directly and via a
   * deeper sub-assembly has ALL of its demand aggregated before it's
   * ever netted against stock, instead of being checked prematurely with
   * only part of its true total demand.
   *
   * Structure-only, no stock involved - safe to compute once and reuse
   * across many CPOs/orders that share the same product tree.
   */
  private async discoverBomTree(companyId: string, rootItemCodes: string[]) {
    const lowLevelCode = new Map<string, number>();
    const bomOf = new Map<string, { itemCode: string; itemName: string; uom: string; qtyPerUnit: number }[] | null>();
    const itemMeta = new Map<string, { itemName: string; uom: string }>();

    const discover = async (itemCode: string, depth: number, ancestors: Set<string>): Promise<void> => {
      lowLevelCode.set(itemCode, Math.max(lowLevelCode.get(itemCode) ?? -1, depth));
      if (ancestors.has(itemCode)) return; // cycle guard - a BOM should never reference itself, but never trust that blindly
      let children = bomOf.get(itemCode);
      if (children === undefined) {
        const product = await this.prisma.product.findFirst({ where: { companyId, code: itemCode } });
        if (!product) { bomOf.set(itemCode, null); return; }
        itemMeta.set(itemCode, { itemName: product.name, uom: 'PCS' });
        const bom = await this.findProducingBom(companyId, product.id);
        if (!bom) { bomOf.set(itemCode, null); return; }
        children = bom.items.map(bi => ({
          itemCode: bi.itemCode, itemName: bi.itemName, uom: bi.uom,
          // Wastage is expressed as a percentage on top of the pure BOM
          // ratio, so it has to be folded in here - at every level, not
          // just the top one - or a wasteful sub-assembly's true
          // material cost would be understated the deeper it sits.
          qtyPerUnit: bi.effectiveQty * (1 + (bi.wastagePercent || 0) / 100),
        }));
        bomOf.set(itemCode, children);
      }
      if (!children) return;
      const nextAncestors = new Set(ancestors); nextAncestors.add(itemCode);
      for (const c of children) {
        if (!itemMeta.has(c.itemCode)) itemMeta.set(c.itemCode, { itemName: c.itemName, uom: c.uom });
        await discover(c.itemCode, depth + 1, nextAncestors);
      }
    };

    for (const code of rootItemCodes) await discover(code, 0, new Set());

    // For each root, which true-leaf item codes does its own tree
    // ultimately touch - used to attribute shared-pool leaf shortages
    // back to the specific top-level item that pulled them in.
    const leavesOf = new Map<string, Set<string>>();
    const collectLeaves = (itemCode: string, seen: Set<string>): Set<string> => {
      if (seen.has(itemCode)) return new Set();
      seen.add(itemCode);
      const children = bomOf.get(itemCode);
      if (!children) return new Set([itemCode]);
      const out = new Set<string>();
      for (const c of children) for (const l of collectLeaves(c.itemCode, seen)) out.add(l);
      return out;
    };
    for (const code of rootItemCodes) leavesOf.set(code, collectLeaves(code, new Set()));

    return { lowLevelCode, bomOf, itemMeta, leavesOf };
  }

  /**
   * The one shared engine behind every material-shortage/requirement
   * calculation in the system - the Production Planning board, Run
   * Allocation, and the Customer PO shortage check all call this instead
   * of each doing their own single-level BOM lookup.
   *
   * `buckets` is one demand entry per (bucketKey, item code) - bucketKey
   * is normally a CPO id (for the multi-CPO shortage check, where many
   * orders compete for the same limited stock) or a single synthetic key
   * (for a one-off calculation like Run Allocation). `bucketOrder` fixes
   * the priority order buckets are allocated stock in when supply is
   * short - oldest order first, matching how the business actually
   * fulfils orders.
   *
   * Every item, at every level, is netted against ONE shared stock pool
   * before its shortfall (if any) is passed down to its own BOM's
   * components. An intermediate item (an SMT board, an MI assembly, or
   * any other routing-stage output) that already has enough finished
   * stock never has its own raw materials pulled in at all - only the
   * genuine gap gets exploded further. This is why an order for an
   * intermediate item shows either its own available stock, or a real
   * raw-material shortage - never a false "no BOM" error and never an
   * opaque "intermediate item unavailable" without saying why.
   *
   * A true raw material (or any item with no approved BOM at all, at any
   * level) also has purchase-order-in-transit quantity counted as
   * available supply, on top of on-hand stock - re-running a shortage
   * check while a PO is already in flight for the same shortfall
   * shouldn't manufacture a duplicate shortage. This on-order allowance
   * only applies at true leaves; an intermediate item is made in-house,
   * never bought from a vendor, so it has no "on order" concept of its
   * own.
   *
   * warehouseId, if given, scopes the stock check to one warehouse
   * (Run Allocation, the Planning board). Omitted, it checks company-wide
   * stock (the CPO shortage check, matching its existing behaviour).
   */
  async explodeMultiCpoMaterialNeeds(
    companyId: string,
    buckets: { bucketKey: string; itemCode: string; itemName: string; uom: string; qty: number }[],
    bucketOrder: string[],
    warehouseId?: string,
  ) {
    const rootItemCodes = Array.from(new Set(buckets.map(b => b.itemCode)));
    const { lowLevelCode, bomOf, itemMeta: discoveredMeta, leavesOf } = await this.discoverBomTree(companyId, rootItemCodes);
    const itemMeta = discoveredMeta;
    for (const b of buckets) itemMeta.set(b.itemCode, { itemName: b.itemName, uom: b.uom });

    let currentQueue = new Map<string, Map<string, number>>(); // itemCode -> bucketKey -> qty
    for (const b of buckets) {
      if (!currentQueue.has(b.itemCode)) currentQueue.set(b.itemCode, new Map());
      const m = currentQueue.get(b.itemCode)!;
      m.set(b.bucketKey, (m.get(b.bucketKey) || 0) + b.qty);
    }

    const levelZero = new Map<string, Map<string, { requiredQty: number; availableQty: number; allocatedQty: number; netQty: number; hasBom: boolean }>>();
    const leafShortages = new Map<string, { itemCode: string; itemName: string; uom: string; netRequired: number; availableQty: number; shortage: number; rawMaterialId: string | null }[]>();

    const maxLevel = Math.max(0, ...Array.from(lowLevelCode.values()));
    for (let level = 0; level <= maxLevel; level++) {
      const nextQueue = new Map<string, Map<string, number>>();
      const itemsAtLevel = Array.from(lowLevelCode.entries()).filter(([, lvl]) => lvl === level).map(([code]) => code);

      for (const itemCode of itemsAtLevel) {
        const bucketQtyMap = currentQueue.get(itemCode);
        if (!bucketQtyMap || bucketQtyMap.size === 0) continue;

        const children = bomOf.get(itemCode);
        const meta = itemMeta.get(itemCode) || { itemName: itemCode, uom: 'PCS' };

        const balance = warehouseId
          ? await this.prisma.stockBalance.findUnique({ where: { companyId_itemCode_warehouseId: { companyId, itemCode, warehouseId } } })
          : await this.prisma.stockBalance.findFirst({ where: { companyId, itemCode } });
        let onOrderQty = 0;
        if (!children) {
          const testFlag = isTestSessionActive();
          const onOrderItems = await this.prisma.purchaseOrderItem.findMany({
            where: { companyId, itemCode, isTestData: testFlag, po: { status: { in: ['SENT', 'APPROVED', 'PARTIALLY_RECEIVED'] }, isTestData: testFlag } },
            select: { pendingQty: true },
          });
          onOrderQty = onOrderItems.reduce((sum, i) => sum + (i.pendingQty || 0), 0);
        }
        let runningStock = (balance?.availableQty || 0) + onOrderQty;
        const totalStock = runningStock;

        for (const bucketKey of bucketOrder) {
          const required = bucketQtyMap.get(bucketKey);
          if (!required || required <= 0.0001) continue;
          const allocated = Math.min(required, Math.max(0, runningStock));
          runningStock -= allocated;
          const net = Math.max(0, required - allocated);

          if (level === 0) {
            if (!levelZero.has(bucketKey)) levelZero.set(bucketKey, new Map());
            levelZero.get(bucketKey)!.set(itemCode, {
              requiredQty: required, availableQty: totalStock, allocatedQty: allocated,
              netQty: net, hasBom: !!children,
            });
          }

          if (net <= 0.0001) continue;

          if (!children) {
            const rawMaterial = await this.prisma.rawMaterial.findFirst({ where: { companyId, code: itemCode } });
            if (!leafShortages.has(bucketKey)) leafShortages.set(bucketKey, []);
            leafShortages.get(bucketKey)!.push({
              itemCode, itemName: meta.itemName, uom: meta.uom,
              netRequired: Math.round(required * 1000) / 1000,
              availableQty: totalStock,
              shortage: Math.round(net * 1000) / 1000,
              rawMaterialId: rawMaterial?.id || null,
            });
            continue;
          }

          for (const c of children) {
            if (!nextQueue.has(c.itemCode)) nextQueue.set(c.itemCode, new Map());
            const nm = nextQueue.get(c.itemCode)!;
            nm.set(bucketKey, (nm.get(bucketKey) || 0) + c.qtyPerUnit * net);
          }
        }
      }
      currentQueue = nextQueue;
    }

    return { levelZero, leafShortages, leavesOf };
  }

  /**
   * Single-order convenience wrapper around the shared engine, for
   * callers (Run Allocation, the Planning board) that just want one flat
   * list of true material shortages for one demand set against one
   * warehouse, with no multi-order FIFO sharing involved.
   */
  private async explodeMaterialNeeds(
    companyId: string,
    warehouseId: string,
    rootDemands: { itemCode: string; itemName: string; uom: string; qty: number }[],
  ) {
    const SINGLE = 'SINGLE';
    const buckets = rootDemands.map(d => ({ bucketKey: SINGLE, itemCode: d.itemCode, itemName: d.itemName, uom: d.uom, qty: d.qty }));
    const { leafShortages } = await this.explodeMultiCpoMaterialNeeds(companyId, buckets, [SINGLE], warehouseId);
    return leafShortages.get(SINGLE) || [];
  }

  async calculateMrp(woId: string, user: any) {
    const companyId = user.companyId;

    const wo = await this.prisma.workOrder.findFirst({
      where: { id: woId, companyId },
      include: { warehouse: { select: { name: true } } },
    });
    if (!wo) throw new NotFoundException('Work order not found');
    if (!wo.bomId) throw new BadRequestException('Work order has no BOM linked');
    if (['COMPLETED', 'CANCELLED'].includes(wo.status)) {
      throw new BadRequestException('Cannot run MRP for completed/cancelled work order');
    }

    const bom = await this.prisma.bom.findFirst({
      where: { id: wo.bomId, companyId },
      include: { items: { where: { isActive: true }, orderBy: { sequence: 'asc' } } },
    });
    if (!bom) throw new NotFoundException('BOM not found');

    const requirements = [];
    let hasShortage = false;

    for (const item of bom.items) {
      const grossQty = item.effectiveQty * wo.plannedQty;
      const wasteQty = (item.wastagePercent || 0) / 100 * grossQty;
      const netRequired = grossQty + wasteQty;

      const balance = await this.prisma.stockBalance.findFirst({
        where: { companyId, itemCode: item.itemCode },
      });
      const availableQty = balance?.availableQty || 0;

      const batches = await this.prisma.stockBatch.findMany({
        where: { companyId, itemCode: item.itemCode, status: 'ACTIVE', availableQty: { gt: 0 } },
        orderBy: { receivedDate: 'asc' },
        select: { batchNumber: true, availableQty: true, expiryDate: true, receivedDate: true },
      });

      const shortage = Math.max(0, netRequired - availableQty);
      if (shortage > 0) hasShortage = true;

      requirements.push({
        sequence: item.sequence,
        itemCode: item.itemCode,
        itemName: item.itemName,
        uom: item.uom,
        itemType: item.itemType,
        qtyPer: item.quantity,
        wastagePercent: item.wastagePercent || 0,
        grossRequired: grossQty,
        netRequired: Math.round(netRequired * 1000) / 1000,
        availableQty,
        shortage: Math.round(shortage * 1000) / 1000,
        status: shortage > 0 ? 'SHORTAGE' : availableQty === 0 ? 'NO_STOCK' : 'AVAILABLE',
        batches: batches.slice(0, 5),
      });
    }

    return {
      workOrder: {
        id: wo.id, woNumber: wo.woNumber, productCode: wo.productCode,
        productName: wo.productName, plannedQty: wo.plannedQty,
        status: wo.status, warehouse: wo.warehouse?.name,
      },
      bom: { bomNumber: bom.bomNumber, version: bom.version },
      requirements,
      summary: {
        totalComponents: requirements.length,
        availableComponents: requirements.filter(r => r.status === 'AVAILABLE').length,
        shortageComponents: requirements.filter(r => r.status === 'SHORTAGE').length,
        noStockComponents: requirements.filter(r => r.status === 'NO_STOCK').length,
        hasShortage,
        canProduce: !hasShortage,
      },
    };
  }

  async getShortageReport(user: any) {
    const companyId = user.companyId;
    const activeWOs = await this.prisma.workOrder.findMany({
      where: { companyId, status: { in: ['RELEASED', 'IN_PROGRESS'] }, bomId: { not: null } },
      include: { warehouse: { select: { name: true } } },
    });

    const report = [];
    for (const wo of activeWOs) {
      try {
        const mrp = await this.calculateMrp(wo.id, user);
        if (mrp.summary.hasShortage) {
          report.push({
            woNumber: wo.woNumber, productCode: wo.productCode,
            productName: wo.productName, plannedQty: wo.plannedQty,
            status: wo.status, warehouse: wo.warehouse?.name,
            shortageItems: mrp.requirements.filter(r => r.shortage > 0).map(r => ({
              itemCode: r.itemCode, itemName: r.itemName, uom: r.uom,
              required: r.netRequired, available: r.availableQty, shortage: r.shortage,
            })),
          });
        }
      } catch (e) { /* skip WOs with BOM issues */ }
    }

    return { data: report, totalWOs: activeWOs.length, wosWithShortage: report.length };
  }

  async getMaterialPlan(user: any, query: any) {
    const companyId = user.companyId;
    const { status = 'RELEASED' } = query;

    const wos = await this.prisma.workOrder.findMany({
      where: { companyId, status: { in: status.split(',') }, bomId: { not: null } },
    });

    const aggregate: Record<string, any> = {};

    for (const wo of wos) {
      try {
        const mrp = await this.calculateMrp(wo.id, user);
        for (const req of mrp.requirements) {
          const key = req.itemCode;
          if (!aggregate[key]) {
            aggregate[key] = {
              itemCode: req.itemCode, itemName: req.itemName, uom: req.uom,
              totalRequired: 0, totalAvailable: req.availableQty,
              totalShortage: 0, woCount: 0,
            };
          }
          aggregate[key].totalRequired += req.netRequired;
          aggregate[key].totalShortage = Math.max(0, aggregate[key].totalRequired - aggregate[key].totalAvailable);
          aggregate[key].woCount += 1;
        }
      } catch (e) { /* skip */ }
    }

    const data = Object.values(aggregate).sort((a: any, b: any) => b.totalShortage - a.totalShortage);
    return { data, totalWOs: wos.length, totalItems: data.length };
  }

  async getPlanningBoard(user: any, warehouseId: string) {
    const companyId = user.companyId;
    if (!warehouseId) throw new BadRequestException('warehouseId is required');
    const testFlag = isTestSessionActive();

    const sos = await this.prisma.salesOrder.findMany({
      where: { companyId, status: { in: ['CONFIRMED', 'IN_PRODUCTION'] }, isTestData: testFlag },
      include: { items: { where: { isActive: true, pendingQty: { gt: 0 }, isTestData: testFlag } } },
      orderBy: { deliveryDate: 'asc' },
    });

    const board = [];
    for (const so of sos) {
      if (so.items.length === 0) continue;
      const itemsOut = [];
      for (const item of so.items) {
        const product = await this.prisma.product.findFirst({ where: { companyId, code: item.itemCode } });
        const bom = product ? await this.findProducingBom(companyId, product.id) : null;

        const alreadyPlanned = await this.prisma.workOrder.aggregate({
          where: { companyId, salesOrderId: so.id, productCode: item.itemCode, status: { not: 'CANCELLED' }, isTestData: testFlag },
          _sum: { plannedQty: true },
        });
        const remainingToPlan = Math.max(0, item.pendingQty - (alreadyPlanned._sum.plannedQty || 0));

        // Fully-exploded, true-leaf material shortages for the remaining
        // unplanned quantity - an intermediate item like an SMT board or
        // MI assembly is invisible here entirely if its own stock already
        // covers what's needed; only genuine raw-material gaps show up.
        const rawRmRequirements = bom && remainingToPlan > 0
          ? await this.explodeMaterialNeeds(companyId, warehouseId, [
              { itemCode: item.itemCode, itemName: item.itemName, uom: item.uom, qty: remainingToPlan },
            ])
          : [];
        const rmRequirements = rawRmRequirements.map(s => ({
          itemCode: s.itemCode, itemName: s.itemName, uom: s.uom,
          totalNeeded: s.netRequired, available: s.availableQty, shortfall: s.shortage,
        }));

        itemsOut.push({
          soItemId: item.id, itemCode: item.itemCode, itemName: item.itemName,
          pendingQty: item.pendingQty, alreadyPlannedQty: alreadyPlanned._sum.plannedQty || 0,
          remainingToPlan, hasBom: !!bom, bomId: bom?.id || null, rmRequirements,
        });
      }
      if (itemsOut.some(i => i.remainingToPlan > 0)) {
        board.push({
          soId: so.id, soNumber: so.soNumber, customerName: so.customerName,
          deliveryDate: so.deliveryDate, items: itemsOut,
        });
      }
    }
    return board;
  }

  async runAllocation(dto: { warehouseId: string; allocations: { soItemId: string; buildQty: number }[] }, user: any) {
    const companyId = user.companyId;
    const active = (dto.allocations || []).filter(a => a.buildQty > 0);
    if (active.length === 0) throw new BadRequestException('No build quantities entered');
    if (!dto.warehouseId) throw new BadRequestException('warehouseId is required');

    const resolved: any[] = [];
    for (const a of active) {
      const soItem = await this.prisma.salesOrderItem.findFirst({
        where: { id: a.soItemId, salesOrder: { companyId } },
        include: { salesOrder: true },
      });
      if (!soItem) throw new NotFoundException(`Sales order item ${a.soItemId} not found`);
      const product = await this.prisma.product.findFirst({ where: { companyId, code: soItem.itemCode } });
      if (!product) throw new BadRequestException(`No product master found for item code ${soItem.itemCode}`);

      // A customer may order the fully-packaged product (Type 1, backed by
      // its own MASTER BOM), or an intermediate routing stage's own output
      // directly (Type 2/3, e.g. SMT boards or an MI assembly) - those are
      // only backed by a STAGE-type BOM hanging off a RoutingStage, never a
      // standalone MASTER BOM on the product itself.
      const bom = await this.findProducingBom(companyId, product.id);
      if (!bom) throw new BadRequestException(`No approved BOM found for ${soItem.itemCode}`);

      // Defense in depth: the planning board only shows the remaining
      // unplanned quantity, but never trust client-submitted qty blindly -
      // recompute it here and reject anything beyond what's actually left.
      const alreadyPlanned = await this.prisma.workOrder.aggregate({
        where: { companyId, salesOrderId: soItem.salesOrder.id, productCode: soItem.itemCode, status: { not: 'CANCELLED' } },
        _sum: { plannedQty: true },
      });
      const remainingToPlan = Math.max(0, soItem.pendingQty - (alreadyPlanned._sum.plannedQty || 0));
      if (a.buildQty > remainingToPlan + 0.0001) {
        throw new BadRequestException(`Build qty for ${soItem.itemCode} (${a.buildQty}) exceeds the remaining unplanned quantity (${remainingToPlan}) for ${soItem.salesOrder.soNumber}`);
      }

      resolved.push({ soItem, product, bom, buildQty: a.buildQty });
    }

    // Fully-exploded, true-leaf-level shortages across everything being
    // allocated in this call - an intermediate item (SMT board, MI
    // assembly, etc.) that already has enough of its own stock never
    // forces its raw materials to be checked at all; only a genuine gap
    // recurses down to what would actually need to be purchased.
    const rawShortages = await this.explodeMaterialNeeds(
      companyId, dto.warehouseId,
      resolved.map(r => ({ itemCode: r.soItem.itemCode, itemName: r.soItem.itemName, uom: r.soItem.uom, qty: r.buildQty })),
    );
    const shortages = rawShortages.map(s => ({
      itemCode: s.itemCode, itemName: s.itemName, uom: s.uom,
      totalNeeded: s.netRequired, available: s.availableQty, shortfall: s.shortage,
    }));

    if (shortages.length > 0) {
      return { feasible: false, shortages, createdWorkOrders: [] };
    }

    const createdWorkOrders = [];
    for (const r of resolved) {
      // If this product has a defined production routing (SMT -> MI ->
      // Assembly -> Packaging etc.), create the full stage chain directly
      // instead of also creating a separate top-level Work Order. Creating
      // both used to reserve the same material twice - once against a
      // "parent" WO that never got produced against, and again against
      // each routing stage - leaving the parent's reservation stuck
      // forever since nothing ever completed or cancelled it.
      // A customer may order the fully-packaged product (Type 1, full
      // chain), or an intermediate stage's own output directly - SMT
      // boards (Type 2) or an MI-stage assembly (Type 3). Either way, we
      // find whichever routing stage actually produces the ordered item
      // and only run the chain up through that stage.
      let routing = await this.prisma.productRouting.findFirst({
        where: { companyId, finalProductId: r.product.id, isActive: true },
      });
      let stopAtSequence: number | undefined = undefined;

      if (!routing) {
        const matchedStage = await this.prisma.routingStage.findFirst({
          where: { companyId, isActive: true, bom: { productId: r.product.id } },
          include: { routing: true },
        });
        if (matchedStage && matchedStage.routing.isActive) {
          routing = matchedStage.routing;
          stopAtSequence = matchedStage.sequence;
        }
      }

      if (routing) {
        const chain = await this.routingService.startProduction(
          { routingId: routing.id, plannedQty: r.buildQty, warehouseId: dto.warehouseId, stopAtSequence },
          user,
        );
        // Only the final stage produces the same item the Sales Order is
        // waiting on, so that's the one MRP's remaining-qty tracking needs
        // to see.
        const finalStage = chain.stages[chain.stages.length - 1];
        await this.prisma.workOrder.update({
          where: { id: finalStage.woId },
          data: { salesOrderId: r.soItem.salesOrder.id },
        });
        await this.prisma.salesOrder.updateMany({
          where: { id: r.soItem.salesOrder.id, status: 'CONFIRMED' },
          data: { status: 'IN_PRODUCTION', updatedBy: user.id },
        });
        createdWorkOrders.push({
          woId: finalStage.woId, woNumber: finalStage.woNumber,
          soNumber: r.soItem.salesOrder.soNumber,
          productCode: r.product.code, buildQty: r.buildQty,
          routingGroupId: chain.routingGroupId, stages: chain.stages,
        });
        continue;
      }

      const woNumber = await this.generateWoNumber(companyId);
      const wo = await this.prisma.workOrder.create({
        data: {
          woNumber, productCode: r.product.code, productName: r.product.name,
          uom: r.soItem.uom || 'PCS', bomId: r.bom.id, warehouseId: dto.warehouseId,
          plannedQty: r.buildQty,
          plannedStartDate: new Date(),
          plannedEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          priority: 'MEDIUM', salesOrderId: r.soItem.salesOrder.id,
          remarks: `Auto-planned from ${r.soItem.salesOrder.soNumber}`,
          companyId, createdBy: user.id, updatedBy: user.id,
        },
      });
      await this.audit.log({ tableName: 'work_orders', recordId: wo.id, action: 'CREATE', newValues: wo, changedBy: user.id });
      const reservations = await this.materialReservation.reserveForWorkOrder(wo.id, user);
      await this.prisma.workOrder.update({ where: { id: wo.id }, data: { status: 'RELEASED' } });
      await this.prisma.salesOrder.updateMany({
        where: { id: r.soItem.salesOrder.id, status: 'CONFIRMED' },
        data: { status: 'IN_PRODUCTION', updatedBy: user.id },
      });
      createdWorkOrders.push({
        woId: wo.id, woNumber, soNumber: r.soItem.salesOrder.soNumber,
        productCode: r.product.code, buildQty: r.buildQty, reservations,
      });
    }

    return { feasible: true, shortages: [], createdWorkOrders };
  }

  private async generateWoNumber(companyId: string): Promise<string> {
    const count = await this.prisma.workOrder.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `WO-${year}-${String(count + 1).padStart(4, '0')}`;
  }
}
