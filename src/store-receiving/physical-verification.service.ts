import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { VerifyLineDto, CorrectLineDto } from './dto/physical-verification.dto';
import { StoreShortageService } from './store-shortage.service';

// Whole-number-only UOMs, used as a heuristic since neither Item nor
// UnitOfMeasure carries an explicit decimal-precision flag yet
// (spec section 43 - "respect UOM/item precision" but none exists to
// reuse, so this is a documented assumption, not invented policy).
const WHOLE_NUMBER_UOMS = ['PCS', 'NOS', 'BOX', 'UNIT', 'UNITS'];

@Injectable()
export class PhysicalVerificationService {
  constructor(private prisma: PrismaService, private audit: AuditService, private shortageService: StoreShortageService) {}

  private computeResult(actualQty: number, expectedQty: number, uomMismatch: boolean, materialMismatch: boolean) {
    if (uomMismatch) {
      return { result: 'UOM_MISMATCH', differenceQty: null, shortQty: null, excessQty: null };
    }
    if (materialMismatch) {
      return { result: 'MATERIAL_MISMATCH', differenceQty: null, shortQty: null, excessQty: null };
    }
    const differenceQty = actualQty - expectedQty;
    const shortQty = Math.max(expectedQty - actualQty, 0);
    const excessQty = Math.max(actualQty - expectedQty, 0);
    let result: string;
    if (actualQty === 0) result = 'FULL_SHORT';
    else if (differenceQty === 0) result = 'QUANTITY_VERIFIED';
    else if (differenceQty < 0) result = 'SHORT_QUANTITY';
    else result = 'EXCESS_QUANTITY';
    return { result, differenceQty, shortQty, excessQty };
  }

  // STORE-002 line-level physical quantity verification. Never
  // touches stockBalance/stockLedger/productionQc/grnHeader - those
  // are proven absent at the unit-test level, same pattern as
  // STORE-001.
  async verifyLine(itemId: string, dto: VerifyLineDto, user: any) {
    const line = await this.prisma.storeReceivingItem.findFirst({
      where: { id: itemId, companyId: user.companyId },
      include: { storeReceiving: true },
    });
    if (!line) throw new NotFoundException('Store receiving line not found');

    // Negative quantity is a hard block, not a validation warning
    // (spec section 42).
    if (dto.actualQty < 0) throw new BadRequestException('Actual physical quantity cannot be negative');

    // Decimal-precision heuristic - see WHOLE_NUMBER_UOMS comment.
    const expectedUomUpper = (line.uom || '').toUpperCase();
    if (WHOLE_NUMBER_UOMS.includes(expectedUomUpper) && !Number.isInteger(dto.actualQty)) {
      throw new BadRequestException(`${line.uom} does not permit fractional quantities - enter a whole number`);
    }

    // UOM compatibility is checked by exact match only - no
    // conversion architecture exists yet to reuse (spec section 11,
    // and the plan confirmed with the user up front).
    const uomMismatch = dto.actualUom.toUpperCase() !== expectedUomUpper;

    const { result, differenceQty, shortQty, excessQty } = this.computeResult(
      dto.actualQty, line.expectedQty, uomMismatch, !!dto.materialMismatch,
    );

    // Batch reconciliation only applies when the item master says
    // this material is batch-tracked (Item.isBatchTracked) - never
    // forced on materials that don't need it (spec section 23).
    const item = await this.prisma.item.findFirst({ where: { companyId: user.companyId, itemCode: line.itemCode } });
    if (item?.isBatchTracked && dto.batches && dto.batches.length > 0) {
      const batchTotal = dto.batches.reduce((sum, b) => sum + b.quantity, 0);
      if (Math.abs(batchTotal - dto.actualQty) > 0.0001) {
        throw new BadRequestException(
          `Batch quantities (${batchTotal}) do not reconcile to actual physical quantity (${dto.actualQty}) - unreconciled: ${Math.abs(batchTotal - dto.actualQty)}`,
        );
      }
    }

    const oldValues = { actualVerifiedQty: line.actualVerifiedQty, result: line.result };

    const [updated] = await this.prisma.$transaction([
      this.prisma.storeReceivingItem.update({
        where: { id: itemId },
        data: {
          actualVerifiedQty: dto.actualQty,
          actualUom: dto.actualUom,
          result, differenceQty, shortQty, excessQty,
          damagedQty: dto.damagedQty ?? null,
          materialMismatch: !!dto.materialMismatch,
          remarks: dto.remarks,
          verifiedById: user.id, verifiedAt: new Date(),
          updatedBy: user.id,
        },
        include: { batches: true },
      }),
      // Re-verification replaces the prior batch split rather than
      // appending to it - a single line has one current batch
      // breakdown, not an accumulating history of attempts.
      this.prisma.storeReceivingItemBatch.deleteMany({ where: { storeReceivingItemId: itemId } }),
    ]);

    let withBatches = updated;
    if (dto.batches && dto.batches.length > 0) {
      await this.prisma.storeReceivingItemBatch.createMany({
        data: dto.batches.map(b => ({
          companyId: user.companyId, storeReceivingItemId: itemId,
          batchNumber: b.batchNumber, lotNumber: b.lotNumber,
          mfgDate: b.mfgDate ? new Date(b.mfgDate) : null,
          expiryDate: b.expiryDate ? new Date(b.expiryDate) : null,
          quantity: b.quantity, createdBy: user.id, updatedBy: user.id,
        })),
      });
      // Merge the freshly-created batches onto the already-updated
      // line rather than re-fetching the whole record - avoids a
      // redundant read and (more importantly) avoids silently
      // discarding the update() result we already have in hand.
      const batches = await this.prisma.storeReceivingItemBatch.findMany({ where: { storeReceivingItemId: itemId } });
      withBatches = { ...updated, batches };
    }

    await this.audit.log({
      tableName: 'store_receiving_items', recordId: itemId, action: 'UPDATE',
      oldValues, newValues: { actualVerifiedQty: dto.actualQty, result }, changedBy: user.id,
    });

    await this.shortageService.upsertFromLine(withBatches, user);

    return withBatches;
  }

  // Locks in the header status once every line has a result.
  // Idempotent - calling this again on an already-VERIFIED/
  // VERIFIED_WITH_DISCREPANCY receipt just returns the current state
  // rather than reprocessing (spec section 71).
  async completeVerification(receivingId: string, user: any) {
    const receiving = await this.prisma.storeReceiving.findFirst({
      where: { id: receivingId, companyId: user.companyId },
      include: { items: true },
    });
    if (!receiving) throw new NotFoundException('Store receiving record not found');

    if (['VERIFIED', 'VERIFIED_WITH_DISCREPANCY'].includes(receiving.status)) {
      return receiving;
    }

    const unverified = receiving.items.filter(i => !i.result);
    if (unverified.length > 0) {
      throw new BadRequestException(`${unverified.length} line(s) still pending physical verification`);
    }

    const allMatched = receiving.items.every(i => i.result === 'QUANTITY_VERIFIED');
    const newStatus = allMatched ? 'VERIFIED' : 'VERIFIED_WITH_DISCREPANCY';

    const updated = await this.prisma.storeReceiving.update({
      where: { id: receivingId },
      data: { status: newStatus, updatedBy: user.id },
      include: { items: { include: { batches: true } } },
    });

    await this.audit.log({
      tableName: 'store_receivings', recordId: receivingId, action: 'UPDATE',
      oldValues: { status: receiving.status }, newValues: { status: newStatus }, changedBy: user.id,
    });

    return updated;
  }

  // Authorized correction before any downstream GRN exists - once a
  // GRN references this Gate-In, the verified quantity is protected
  // and must go through discrepancy/reversal architecture instead
  // (spec section 46), not a direct edit here.
  async correctLine(itemId: string, dto: CorrectLineDto, user: any) {
    const line = await this.prisma.storeReceivingItem.findFirst({
      where: { id: itemId, companyId: user.companyId },
      include: { storeReceiving: true },
    });
    if (!line) throw new NotFoundException('Store receiving line not found');
    if (!line.verifiedAt) throw new BadRequestException('This line has not been verified yet - use verify, not correct');

    const downstreamGrn = await this.prisma.grnHeader.findFirst({
      where: { gateInwardEntryId: line.storeReceiving.gateInwardEntryId },
    });
    if (downstreamGrn) {
      throw new BadRequestException('A GRN already exists for this receipt - this quantity is protected and requires discrepancy/reversal handling, not a direct correction');
    }

    const expectedUomUpper = (line.uom || '').toUpperCase();
    const uomMismatch = (line.actualUom || '').toUpperCase() !== expectedUomUpper;
    const { result, differenceQty, shortQty, excessQty } = this.computeResult(
      dto.actualQty, line.expectedQty, uomMismatch, line.materialMismatch,
    );

    const oldValues = { actualVerifiedQty: line.actualVerifiedQty, result: line.result };

    const updated = await this.prisma.storeReceivingItem.update({
      where: { id: itemId },
      data: {
        actualVerifiedQty: dto.actualQty, result, differenceQty, shortQty, excessQty,
        updatedBy: user.id,
      },
      include: { batches: true },
    });

    await this.audit.log({
      tableName: 'store_receiving_items', recordId: itemId, action: 'UPDATE',
      oldValues, newValues: { actualVerifiedQty: dto.actualQty, result, reason: dto.reason },
      changedBy: user.id,
    });

    await this.shortageService.upsertFromLine({ ...updated, storeReceiving: line.storeReceiving }, user);

    return updated;
  }
}
