CREATE TABLE "store_receivings" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "companyId" TEXT NOT NULL,
  "receivingNumber" TEXT NOT NULL,
  "gateInwardEntryId" TEXT NOT NULL,
  "supplierName" TEXT NOT NULL,
  "poId" TEXT,
  "poNumber" TEXT,
  "invoiceNumber" TEXT,
  "receivingWarehouseId" TEXT,
  "receivedById" TEXT NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" TEXT NOT NULL DEFAULT 'PHYSICAL_VERIFICATION_PENDING',
  "remarks" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isTestData" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  CONSTRAINT "store_receivings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "store_receivings_gateInwardEntryId_key" ON "store_receivings"("gateInwardEntryId");
CREATE INDEX "store_receivings_companyId_idx" ON "store_receivings"("companyId");
ALTER TABLE "store_receivings" ADD CONSTRAINT "store_receivings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "store_receivings" ADD CONSTRAINT "store_receivings_gateInwardEntryId_fkey" FOREIGN KEY ("gateInwardEntryId") REFERENCES "gate_inward_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "store_receivings" ADD CONSTRAINT "store_receivings_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "store_receiving_items" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "companyId" TEXT NOT NULL,
  "storeReceivingId" TEXT NOT NULL,
  "gateInwardItemId" TEXT,
  "itemCode" TEXT NOT NULL,
  "itemName" TEXT NOT NULL,
  "uom" TEXT NOT NULL DEFAULT 'NOS',
  "expectedQty" DOUBLE PRECISION NOT NULL,
  "actualVerifiedQty" DOUBLE PRECISION,
  "remarks" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isTestData" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  CONSTRAINT "store_receiving_items_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "store_receiving_items_companyId_storeReceivingId_idx" ON "store_receiving_items"("companyId", "storeReceivingId");
ALTER TABLE "store_receiving_items" ADD CONSTRAINT "store_receiving_items_storeReceivingId_fkey" FOREIGN KEY ("storeReceivingId") REFERENCES "store_receivings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
