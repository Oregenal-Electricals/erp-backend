import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { StockLocationBalanceService } from '../stock-location-balance/stock-location-balance.service';
import { TransferLocationDto } from './dto/stock-location-transfer.dto';

@Injectable()
export class StockLocationTransferService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private locationBalance: StockLocationBalanceService,
  ) {}

  private async generateNumber(companyId: string): Promise<string> {
    const count = await this.prisma.stockTransfer.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `LOCXFER-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  // STORE-015: rack/bin-to-rack/bin movement within the same warehouse.
  // Note on reservations (spec sections 21-27): this system's
  // MaterialReservation is warehouse-level, not bin-level - a bin
  // transfer within the same warehouse never touches reservedQty at
  // all, so there is no reservation to silently break here. That
  // protection concern is real for a bin-scoped reservation model; it
  // doesn't apply to this one.
  async transfer(dto: TransferLocationDto, user: any) {
    const status = dto.status || 'AVAILABLE';
    const batchId = dto.batchId ?? null;

    if (dto.fromBinId === dto.toBinId) {
      throw new BadRequestException('Source and destination bin cannot be the same.');
    }

    const [fromBin, toBin] = await Promise.all([
      this.prisma.warehouseBin.findFirst({ where: { id: dto.fromBinId, companyId: user.companyId } }),
      this.prisma.warehouseBin.findFirst({ where: { id: dto.toBinId, companyId: user.companyId } }),
    ]);
    if (!fromBin) throw new NotFoundException('Source bin not found');
    if (!toBin) throw new NotFoundException('Destination bin not found');

    // STORE-015 sections 31-33: same-warehouse only - a simple rack/bin
    // transfer must never silently double as an inter-warehouse or
    // inter-plant movement.
    if (fromBin.warehouseId !== toBin.warehouseId) {
      throw new BadRequestException('Source and destination bins are in different warehouses - use the inter-warehouse transfer process, not a simple location transfer.');
    }

    if (!toBin.isActive || toBin.status === 'BLOCKED') {
      throw new BadRequestException(`Destination bin ${toBin.code} is blocked or inactive and cannot receive a transfer.`);
    }

    const sourceBalance = await this.locationBalance.getBalance(user.companyId, dto.itemCode, dto.fromBinId, batchId, status);
    if (!sourceBalance || sourceBalance.qty < dto.qty - 0.0001) {
      throw new BadRequestException(`Transfer qty (${dto.qty}) exceeds what is actually available in the source bin (${sourceBalance?.qty || 0}) for ${dto.itemCode}.`);
    }

    // STORE-015 section 28: same capacity check STORE-009's put-away
    // already enforces - reused here rather than a second engine.
    const alreadyInDest = toBin.currentQty;
    const newDestQty = alreadyInDest + dto.qty;
    if (toBin.maxQty && newDestQty > toBin.maxQty) {
      throw new BadRequestException(`Bin ${toBin.code} can only hold ${toBin.maxQty} but this transfer would bring it to ${newDestQty} (already has ${alreadyInDest}, adding ${dto.qty}). Choose a bin with more capacity or reduce the transfer qty.`);
    }

    // Debit source, credit destination - both legs go through the same
    // atomic adjustQty(), so the total physical qty across both bins
    // never changes even under concurrent transfers.
    await this.locationBalance.adjustQty({
      companyId: user.companyId, itemCode: dto.itemCode, itemName: dto.itemName,
      warehouseId: fromBin.warehouseId, binId: dto.fromBinId, batchId, status,
      deltaQty: -dto.qty, userId: user.id,
    });
    await this.locationBalance.adjustQty({
      companyId: user.companyId, itemCode: dto.itemCode, itemName: dto.itemName,
      warehouseId: toBin.warehouseId, binId: dto.toBinId, batchId, status,
      deltaQty: dto.qty, userId: user.id,
    });

    // Keep WarehouseBin.currentQty/status (STORE-009's own capacity/
    // fullness tracking) in sync on both ends of the move.
    const newFromQty = Math.max(0, fromBin.currentQty - dto.qty);
    await this.prisma.warehouseBin.update({
      where: { id: dto.fromBinId },
      data: { currentQty: newFromQty, status: newFromQty <= 0 ? 'EMPTY' : (fromBin.maxQty && newFromQty >= fromBin.maxQty ? 'FULL' : 'PARTIAL'), updatedBy: user.id },
    });
    await this.prisma.warehouseBin.update({
      where: { id: dto.toBinId },
      data: { currentQty: newDestQty, itemCode: dto.itemCode, status: toBin.maxQty && newDestQty >= toBin.maxQty ? 'FULL' : 'PARTIAL', updatedBy: user.id },
    });

    // STORE-015 section 37, 47: reuse the existing StockTransfer/
    // StockTransferItem model for the movement record rather than
    // building a parallel one - it already has an INTRA_WAREHOUSE
    // type and fromBinId/toBinId, just had no service behind it yet.
    const transferNumber = await this.generateNumber(user.companyId);
    const transfer = await this.prisma.stockTransfer.create({
      data: {
        companyId: user.companyId, transferNumber, transferType: 'INTRA_WAREHOUSE',
        fromWarehouseId: fromBin.warehouseId, toWarehouseId: toBin.warehouseId,
        fromBinId: dto.fromBinId, toBinId: dto.toBinId, status: 'CONFIRMED',
        remarks: dto.remarks ? `${dto.reason || 'OTHER'}: ${dto.remarks}` : dto.reason,
        createdBy: user.id, updatedBy: user.id,
        items: {
          create: [{
            companyId: user.companyId, batchId: batchId || undefined,
            itemCode: dto.itemCode, itemName: dto.itemName, uom: dto.uom, qty: dto.qty,
            createdBy: user.id, updatedBy: user.id,
          }],
        },
      },
      include: { items: true },
    });

    await this.audit.log({
      tableName: 'stock_transfers', recordId: transfer.id, action: 'CREATE',
      newValues: transfer, changedBy: user.id,
    });

    return transfer;
  }

  // STORE-015 section 50: open a bin, see what's in it right now.
  async getBinContents(binId: string, user: any) {
    return this.locationBalance.getByBin(user.companyId, binId);
  }

  // STORE-015 section 49: search a material, see all its current bins.
  async getItemLocations(itemCode: string, user: any) {
    return this.locationBalance.getByItem(user.companyId, itemCode);
  }

  async findHistory(user: any, itemCode?: string) {
    return this.prisma.stockTransfer.findMany({
      where: { companyId: user.companyId, transferType: 'INTRA_WAREHOUSE', ...(itemCode ? { items: { some: { itemCode } } } : {}) },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
