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
  /**
   * Every DRAFT-status Work Order stage has a certain, upcoming claim on
   * raw material that release() will reserve the moment it happens - it
   * just hasn't yet. Treating today's free stock as if that claim doesn't
   * exist risks exactly the double-booking this was built to catch: a
   * still-open Sales Order's shortage check assumes stock is free that a
   * DIFFERENT order's already-in-production Work Order will come back for
   * the instant its next stage releases. RELEASED/IN_PROGRESS stages are
   * excluded here on purpose - their material is already reflected in
   * StockBalance.reservedQty (see MaterialReservationService), so counting
   * them again here would double-subtract.
   */
  private async getPendingWoMaterialNeeds(companyId: string, warehouseId?: string): Promise<Map<string, number>> {
    const draftWOs = await this.prisma.workOrder.findMany({
      where: { companyId, status: 'DRAFT', isActive: true, ...(warehouseId ? { warehouseId } : {}) },
      select: { id: true, bomId: true, plannedQty: true },
    });
    const needs = new Map<string, number>();
    for (const wo of draftWOs) {
      if (!wo.bomId || !wo.plannedQty) continue;
      const bomItems = await this.prisma.bomItem.findMany({ where: { bomId: wo.bomId, isActive: true } });
      for (const item of bomItems) {
        const grossQty = item.effectiveQty * wo.plannedQty;
        const wasteQty = (item.wastagePercent || 0) / 100 * grossQty;
        needs.set(item.itemCode, (needs.get(item.itemCode) || 0) + grossQty + wasteQty);
      }
    }
    return needs;
  }

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

    const pendingWoNeeds = await this.getPendingWoMaterialNeeds(companyId, warehouseId);

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
        let runningStock = Math.max(0, (balance?.availableQty || 0) - (pendingWoNeeds.get(itemCode) || 0)) + onOrderQty;
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

  /**
   * Flat, one-row-per-(SalesOrder, line item) view of everything still
   * open to plan - the shared data source behind both the per-SO Planning
   * Board and the per-Family consolidated view below. Deliberately does
   * NOT explode material needs here: that has to happen differently for
   * the two callers (one item at a time for the per-SO board, vs. as a
   * shared priority-ordered pool for the family view) - computing it here
   * would force one or the other into the wrong shape.
   */
  private async getOpenSoLineItems(user: any, warehouseId: string) {
    const companyId = user.companyId;
    const testFlag = isTestSessionActive();

    const sos = await this.prisma.salesOrder.findMany({
      where: { companyId, status: { in: ['CONFIRMED', 'IN_PRODUCTION'] }, isTestData: testFlag },
      include: { items: { where: { isActive: true, pendingQty: { gt: 0 }, isTestData: testFlag } } },
      orderBy: { deliveryDate: 'asc' },
    });

    const flat: any[] = [];
    for (const so of sos) {
      for (const item of so.items) {
        const product = await this.prisma.product.findFirst({ where: { companyId, code: item.itemCode } });
        const bom = product ? await this.findProducingBom(companyId, product.id) : null;

        const alreadyPlanned = await this.prisma.workOrder.aggregate({
          where: { companyId, salesOrderId: so.id, productCode: item.itemCode, status: { not: 'CANCELLED' }, isTestData: testFlag },
          _sum: { plannedQty: true },
        });
        const remainingToPlan = Math.max(0, item.pendingQty - (alreadyPlanned._sum.plannedQty || 0));

        flat.push({
          soId: so.id, soNumber: so.soNumber, customerName: so.customerName, deliveryDate: so.deliveryDate,
          soItemId: item.id, itemCode: item.itemCode, itemName: item.itemName, uom: item.uom,
          pendingQty: item.pendingQty, alreadyPlannedQty: alreadyPlanned._sum.plannedQty || 0, remainingToPlan,
          productId: product?.id || null,
          hasBom: !!bom, bomId: bom?.id || null,
        });
      }
    }
    return flat;
  }

  /**
   * Groups distinct products by BOM similarity (same Jaccard-on-itemCodes
   * math as the BOM upload suggestion, same 0.5 threshold - see
   * bom-import.service.ts) computed fresh every call. There is no
   * persisted "family" to name or manage; a product's clustermates can
   * shift as BOMs change, which is exactly the point - nothing to keep
   * in sync by hand.
   */
  private async clusterProductsBySimilarity(companyId: string, bomIds: string[]): Promise<Map<string, number>> {
    const isPackagingSection = (name: string) => /packag/i.test(name || '');
    const uniqueBomIds = [...new Set(bomIds)];
    if (uniqueBomIds.length === 0) return new Map();

    const boms = await this.prisma.bom.findMany({
      where: { id: { in: uniqueBomIds }, companyId },
      include: { items: { where: { isActive: true }, select: { itemCode: true, section: true } } },
    });

    const codeSets = new Map<string, Set<string>>();
    for (const bom of boms) {
      codeSets.set(
        bom.id,
        new Set(bom.items.filter((i) => !isPackagingSection(i.section || '')).map((i) => i.itemCode)),
      );
    }

    const THRESHOLD = 0.5;
    const clusterOf = new Map<string, number>();
    let nextCluster = 0;

    for (const bomId of uniqueBomIds) {
      if (clusterOf.has(bomId)) continue;
      const mySet = codeSets.get(bomId);
      const clusterId = nextCluster++;
      clusterOf.set(bomId, clusterId);
      if (!mySet || mySet.size === 0) continue;

      for (const otherBomId of uniqueBomIds) {
        if (clusterOf.has(otherBomId)) continue;
        const otherSet = codeSets.get(otherBomId);
        if (!otherSet || otherSet.size === 0) continue;

        let intersection = 0;
        for (const code of mySet) if (otherSet.has(code)) intersection++;
        const union = mySet.size + otherSet.size - intersection;
        const similarity = union > 0 ? intersection / union : 0;
        if (similarity >= THRESHOLD) clusterOf.set(otherBomId, clusterId);
      }
    }

    return clusterOf;
  }

  async getPlanningBoard(user: any, warehouseId: string) {
    if (!warehouseId) throw new BadRequestException('warehouseId is required');
    const companyId = user.companyId;
    const flatItems = await this.getOpenSoLineItems(user, warehouseId);

    const bySo = new Map<string, any>();
    for (const item of flatItems) {
      if (!bySo.has(item.soId)) {
        bySo.set(item.soId, {
          soId: item.soId, soNumber: item.soNumber, customerName: item.customerName,
          deliveryDate: item.deliveryDate, items: [],
        });
      }

      // Fully-exploded, true-leaf material shortages for the remaining
      // unplanned quantity - an intermediate item like an SMT board or
      // MI assembly is invisible here entirely if its own stock already
      // covers what's needed; only genuine raw-material gaps show up.
      const rawRmRequirements = item.hasBom && item.remainingToPlan > 0
        ? await this.explodeMaterialNeeds(companyId, warehouseId, [
            { itemCode: item.itemCode, itemName: item.itemName, uom: item.uom, qty: item.remainingToPlan },
          ])
        : [];
      const rmRequirements = rawRmRequirements.map(s => ({
        itemCode: s.itemCode, itemName: s.itemName, uom: s.uom,
        totalNeeded: s.netRequired, available: s.availableQty, shortfall: s.shortage,
      }));

      bySo.get(item.soId).items.push({
        soItemId: item.soItemId, itemCode: item.itemCode, itemName: item.itemName,
        pendingQty: item.pendingQty, alreadyPlannedQty: item.alreadyPlannedQty,
        remainingToPlan: item.remainingToPlan, hasBom: item.hasBom, bomId: item.bomId, rmRequirements,
      });
    }

    return Array.from(bySo.values()).filter((so: any) => so.items.some((i: any) => i.remainingToPlan > 0));
  }

  /**
   * Consolidated multi-customer view: groups the same open-to-plan line
   * items by BOM similarity instead of by Sales Order, so demand for
   * physically-identical (or near-identical) builds ordered by different
   * customers shows up as ONE shared pool instead of N independent
   * guesses. Grouping is computed fresh on every call from the BOMs
   * themselves (see clusterProductsBySimilarity) - there is no persisted
   * "family" record to create, name, or keep in sync by hand.
   *
   * Reuses explodeMultiCpoMaterialNeeds - the same priority-ordered,
   * shared-stock-pool engine already proven for the multi-CPO shortage
   * check - passing one bucket per member's Sales Order line, in
   * delivery-date order (oldest first, matching this system's existing
   * FIFO convention everywhere else). This is NOT a sum of independently
   * computed per-item shortages, which would double-count shared stock;
   * it's the true remaining shortfall after each higher-priority member
   * has already taken its share, exactly like Run Allocation does for a
   * single order today - just extended across the whole cluster at once.
   *
   * runAllocation() itself needs no changes: it already accepts a flat
   * {soItemId, buildQty}[] regardless of how the frontend grouped things
   * for display, so this view's "Confirm" action submits to the exact
   * same endpoint the per-SO board already uses.
   *
   * Any group ending up with only a single order in it (whether that's
   * because nothing else matches, or because it's the only open order for
   * that product right now) is shown under "ungrouped" instead - pooling
   * only matters once there's actually more than one order to share
   * across. Items with no approved BOM yet are omitted entirely (nothing
   * to explode or compare) - they still show up on the regular per-SO
   * Planning Board.
   */
  async getPlanningBoardByFamily(user: any, warehouseId: string) {
    if (!warehouseId) throw new BadRequestException('warehouseId is required');
    const companyId = user.companyId;
    const flatItems = (await this.getOpenSoLineItems(user, warehouseId))
      .filter(i => i.remainingToPlan > 0 && i.hasBom);

    const clusterOf = await this.clusterProductsBySimilarity(companyId, flatItems.map(i => i.bomId));

    const byCluster = new Map<number, any[]>();
    for (const item of flatItems) {
      const clusterId = clusterOf.get(item.bomId);
      if (clusterId === undefined) continue;
      if (!byCluster.has(clusterId)) byCluster.set(clusterId, []);
      byCluster.get(clusterId)!.push(item);
    }

    const families: any[] = [];
    const ungroupedSingles: any[] = [];
    for (const [, items] of byCluster) {
      if (items.length < 2) { ungroupedSingles.push(...items); continue; }

      const sortedItems = [...items].sort(
        (a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime(),
      );
      const bucketOrder = sortedItems.map(i => i.soItemId);
      const buckets = sortedItems.map(i => ({
        bucketKey: i.soItemId, itemCode: i.itemCode, itemName: i.itemName, uom: i.uom, qty: i.remainingToPlan,
      }));

      const { leafShortages } = await this.explodeMultiCpoMaterialNeeds(companyId, buckets, bucketOrder, warehouseId);

      const members = sortedItems.map(i => ({
        soId: i.soId, soNumber: i.soNumber, customerName: i.customerName, deliveryDate: i.deliveryDate,
        soItemId: i.soItemId, itemCode: i.itemCode, itemName: i.itemName,
        pendingQty: i.pendingQty, alreadyPlannedQty: i.alreadyPlannedQty, remainingToPlan: i.remainingToPlan,
        bomId: i.bomId,
        rmRequirements: (leafShortages.get(i.soItemId) || []).map(s => ({
          itemCode: s.itemCode, itemName: s.itemName, uom: s.uom,
          totalNeeded: s.netRequired, available: s.availableQty, shortfall: s.shortage,
        })),
      }));

      // Group-level totals: summed ACROSS the priority-ordered buckets
      // above, not recomputed independently - see method doc.
      const sharedShortageMap = new Map<string, { itemCode: string; itemName: string; uom: string; totalNeeded: number; available: number; shortfall: number }>();
      for (const i of sortedItems) {
        for (const s of leafShortages.get(i.soItemId) || []) {
          const existing = sharedShortageMap.get(s.itemCode);
          if (existing) {
            existing.totalNeeded += s.netRequired;
            existing.shortfall += s.shortage;
          } else {
            sharedShortageMap.set(s.itemCode, {
              itemCode: s.itemCode, itemName: s.itemName, uom: s.uom,
              totalNeeded: s.netRequired, available: s.availableQty, shortfall: s.shortage,
            });
          }
        }
      }

      const distinctItemCodes = [...new Set(sortedItems.map(i => i.itemCode))];
      const distinctItemNames = [...new Set(sortedItems.map(i => i.itemName))];

      families.push({
        groupLabel: distinctItemNames.length === 1 ? distinctItemNames[0] : `${distinctItemNames[0]} + ${distinctItemNames.length - 1} similar`,
        productCodes: distinctItemCodes,
        totalRemainingToPlan: sortedItems.reduce((s, i) => s + i.remainingToPlan, 0),
        memberCount: sortedItems.length,
        sharedRmRequirements: Array.from(sharedShortageMap.values()),
        members,
      });
    }
    families.sort((a, b) => b.memberCount - a.memberCount);

    const ungroupedOut = [];
    for (const i of ungroupedSingles) {
      const rawRmRequirements = await this.explodeMaterialNeeds(
        companyId, warehouseId,
        [{ itemCode: i.itemCode, itemName: i.itemName, uom: i.uom, qty: i.remainingToPlan }],
      );
      ungroupedOut.push({
        soId: i.soId, soNumber: i.soNumber, customerName: i.customerName, deliveryDate: i.deliveryDate,
        soItemId: i.soItemId, itemCode: i.itemCode, itemName: i.itemName,
        pendingQty: i.pendingQty, alreadyPlannedQty: i.alreadyPlannedQty, remainingToPlan: i.remainingToPlan,
        bomId: i.bomId,
        rmRequirements: rawRmRequirements.map(s => ({
          itemCode: s.itemCode, itemName: s.itemName, uom: s.uom,
          totalNeeded: s.netRequired, available: s.availableQty, shortfall: s.shortage,
        })),
      });
    }

    return { families, ungrouped: ungroupedOut };
  }

  /**
   * Priority-ordered, partial-fulfillment allocation. Sales Order items are
   * processed in the exact order the caller submits them (the Production
   * Planning screen submits them in the user's ranked ↑↓ priority order) -
   * each item gets first claim on whatever material is still available
   * after every higher-priority item ahead of it has already taken its
   * share. An item with only partial raw-material coverage gets a Work
   * Order for the maximum quantity actually producible right now, not an
   * all-or-nothing rejection; the shortfall simply stays as pendingQty for
   * a future allocation run once more stock arrives - no separate "pending"
   * record needed, since remainingToPlan is already computed dynamically
   * everywhere else in this file.
   *
   * "Virtual consumption" tracking: since nothing is actually reserved in
   * the database until a Work Order is created, a higher-priority item's
   * claim on a shared raw material has to be tracked in memory (consumedSoFar)
   * and subtracted from what the next item sees as available - otherwise
   * every item in the batch would see the same starting stock levels and
   * over-allocate the same scarce material to more than one order.
   */
  async runAllocation(dto: { warehouseId: string; allocations: { soItemId: string; buildQty: number }[]}, user: any) {
    const companyId = user.companyId;
    const active = (dto.allocations || []).filter(a=> a.buildQty > 0);
    if (active.length === 0) throw new BadRequestException('No build quantities entered');
    if (!dto.warehouseId) throw new BadRequestException('warehouseId is required');

    const resolved: any[] = [];
    // A true raw material (sold as-is, never manufactured) has no Product
    // master and no BOM to speak of - that's not an error, it's just not
    // the kind of item this Work-Order-building flow applies to. Such
    // items are skipped here rather than blocking the whole batch; they
    // belong to a direct-from-stock fulfillment path, not production
    // planning.
    const skipped: any[] = [];
    for (const a of active) {
      const soItem = await this.prisma.salesOrderItem.findFirst({
        where: { id: a.soItemId, salesOrder: { companyId } },
        include: { salesOrder: true },
      });
      if (!soItem) throw new NotFoundException(`Sales order item ${a.soItemId} not found`);
      const product = await this.prisma.product.findFirst({ where: { companyId, code: soItem.itemCode } });
      if (!product) {
        skipped.push({
          soItemId: soItem.id, itemCode: soItem.itemCode, itemName: soItem.itemName,
          soNumber: soItem.salesOrder.soNumber, requestedQty: a.buildQty,
          reason: 'Not a manufactured product - likely a raw material sold directly, fulfill from stock instead of building a Work Order',
        });
        continue;
      }

      const bom = await this.findProducingBom(companyId, product.id);
      if (!bom) {
        skipped.push({
          soItemId: soItem.id, itemCode: soItem.itemCode, itemName: soItem.itemName,
          soNumber: soItem.salesOrder.soNumber, requestedQty: a.buildQty,
          reason: 'No approved BOM for this product yet',
        });
        continue;
      }

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

    const consumedSoFar = new Map<string, number>();
    const createdWorkOrders = [];
    const partiallyFulfilled = [];

    for (const r of resolved) {
      const rawNeed = await this.explodeMaterialNeeds(
        companyId, dto.warehouseId,
        [{ itemCode: r.soItem.itemCode, itemName: r.soItem.itemName, uom: r.soItem.uom, qty: r.buildQty }],
      );

      let minRatio = 1;
      for (const need of rawNeed) {
        const alreadyTaken = consumedSoFar.get(need.itemCode) || 0;
        const effectiveAvailable = Math.max(0, need.availableQty - alreadyTaken);
        const ratio = need.netRequired > 0 ? effectiveAvailable / need.netRequired : 1;
        minRatio = Math.min(minRatio, ratio);
      }
      minRatio = Math.max(0, Math.min(1, minRatio));
      const actualQty = Math.floor(r.buildQty * minRatio);

      if (actualQty <= 0) {
        skipped.push({
          soItemId: r.soItem.id, itemCode: r.soItem.itemCode, itemName: r.soItem.itemName,
          soNumber: r.soItem.salesOrder.soNumber, requestedQty: r.buildQty,
          reason: 'No material currently available for this item',
        });
        continue;
      }

      // Record this item's ACTUAL consumption (at whatever qty is really
      // being built) so the next, lower-priority item in this same run sees
      // correctly reduced availability - before anything else, this happens
      // regardless of routing vs. plain-WO path below.
      for (const need of rawNeed) {
        const perUnit = r.buildQty > 0 ? need.netRequired / r.buildQty : 0;
        consumedSoFar.set(need.itemCode, (consumedSoFar.get(need.itemCode) || 0) + perUnit * actualQty);
      }

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

      let createdEntry: any;

      if (routing) {
        const chain = await this.routingService.startProduction(
          { routingId: routing.id, plannedQty: actualQty, warehouseId: dto.warehouseId, stopAtSequence},
          user,
        );
        const finalStage = chain.stages[chain.stages.length - 1];
        await this.prisma.workOrder.update({
          where: { id: finalStage.woId },
          data: { salesOrderId: r.soItem.salesOrder.id },
        });
        await this.prisma.salesOrder.updateMany({
          where: { id: r.soItem.salesOrder.id, status: 'CONFIRMED' },
          data: { status: 'IN_PRODUCTION', updatedBy: user.id },
        });
        createdEntry = {
          woId: finalStage.woId, woNumber: finalStage.woNumber,
          soNumber: r.soItem.salesOrder.soNumber,
          productCode: r.product.code, buildQty: actualQty,
          routingGroupId: chain.routingGroupId, stages: chain.stages,
        };
      } else {
        const woNumber = await this.generateWoNumber(companyId);
        const wo = await this.prisma.workOrder.create({
          data: {
            woNumber, productCode: r.product.code, productName: r.product.name,
            uom: r.soItem.uom || 'PCS', bomId: r.bom.id, warehouseId: dto.warehouseId,
            plannedQty: actualQty,
            plannedStartDate: new Date(),
            plannedEndDate: new Date(Date.now() + 7 *24 * 60 * 60 * 1000),
            priority: 'MEDIUM', salesOrderId: r.soItem.salesOrder.id,
            remarks: `Auto-planned from ${r.soItem.salesOrder.soNumber}`,
            companyId, createdBy: user.id, updatedBy:user.id,
          },
        });
        await this.audit.log({ tableName: 'work_orders', recordId: wo.id, action: 'CREATE', newValues: wo, changedBy: user.id });
        const reservations = await this.materialReservation.reserveForWorkOrder(wo.id, user);
        await this.prisma.workOrder.update({ where: {id: wo.id }, data: { status: 'RELEASED' } });
        await this.prisma.salesOrder.updateMany({
          where: { id: r.soItem.salesOrder.id, status: 'CONFIRMED' },
          data: { status: 'IN_PRODUCTION', updatedBy:user.id },
        });
        createdEntry = {
          woId: wo.id, woNumber, soNumber: r.soItem.salesOrder.soNumber,
          productCode: r.product.code, buildQty: actualQty, reservations,
        };
      }

      if (actualQty < r.buildQty) {
        createdEntry.partial = true;
        createdEntry.requestedQty = r.buildQty;
        createdEntry.remainingPending = r.buildQty - actualQty;
        partiallyFulfilled.push({
          itemCode: r.soItem.itemCode, soNumber: r.soItem.salesOrder.soNumber,
          requestedQty: r.buildQty, builtQty: actualQty, remainingPending: r.buildQty - actualQty,
        });
      }

      createdWorkOrders.push(createdEntry);
    }

    return {
      feasible: createdWorkOrders.length > 0,
      createdWorkOrders,
      partiallyFulfilled,
      skipped,
      note: skipped.length > 0 || partiallyFulfilled.length > 0
        ? 'Some items were partially fulfilled or skipped due to material availability - the shortfall remains pending for a future allocation run.'
        : undefined,
    };
  }
  private async generateWoNumber(companyId: string): Promise<string> {
    const count = await this.prisma.workOrder.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `WO-${year}-${String(count + 1).padStart(4, '0')}`;
  }
}
