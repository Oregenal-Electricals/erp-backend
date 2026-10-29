-- 159_debit_note.sql
-- IQC-055: when IQC's final escalation stage (Admin/Super Admin/
-- Management - the FINAL_AUTHORITY stage) declines to grant a
-- deviation and confirms a lot as finally FAILed, the rejected
-- material goes back to the vendor and a Debit Note must be cut
-- automatically, reducing what the company owes that vendor. No
-- DebitNote concept existed anywhere before this (Voucher.voucherType
-- only ever listed 'DEBIT_NOTE' as an unused string value in a
-- comment) - this is a new, standalone record, since most of these
-- GRNs will never have had an ApBill raised against the rejected
-- portion in the first place (ApService only ever bills acceptedQty).
--
-- returnedToVendor on iqc_items is a new, minimal flag set together
-- with the Debit Note at the same final-fail point - no "material
-- returned to vendor" flag existed directly on the GRN/IQC chain
-- before this (RejectedStockItem.disposition='RTV' is set later, in
-- bulk, once the whole inspection closes, not per item at the moment
-- of final rejection).
BEGIN;

ALTER TABLE "iqc_items" ADD COLUMN "returnedToVendor" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "debit_notes" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "debitNoteNumber" TEXT NOT NULL,
  "vendorId" TEXT NOT NULL,
  "poId" TEXT,
  "grnId" TEXT,
  "gateInwardEntryId" TEXT,
  "iqcId" TEXT,
  "iqcItemId" TEXT,
  "rejectedStockId" TEXT,
  "rejectedStockItemId" TEXT,
  "itemCode" TEXT NOT NULL,
  "itemName" TEXT NOT NULL,
  "uom" TEXT NOT NULL,
  "rejectedQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "unitRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "reason" TEXT,
  "remarks" TEXT,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "issuedAt" TIMESTAMP(3),
  "voucherId" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isTestData" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  CONSTRAINT "debit_notes_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "debit_notes" ADD CONSTRAINT "debit_notes_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "debit_notes" ADD CONSTRAINT "debit_notes_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "debit_notes_companyId_debitNoteNumber_key" ON "debit_notes"("companyId", "debitNoteNumber");
CREATE INDEX "debit_notes_companyId_vendorId_idx" ON "debit_notes"("companyId", "vendorId");
CREATE INDEX "debit_notes_companyId_status_idx" ON "debit_notes"("companyId", "status");

COMMIT;
