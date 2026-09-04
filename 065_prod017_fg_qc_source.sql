ALTER TABLE "fg_receipts" ADD COLUMN "sourceProductionQcId" TEXT;
ALTER TABLE "fg_receipts" ADD CONSTRAINT "fg_receipts_sourceProductionQcId_fkey" FOREIGN KEY ("sourceProductionQcId") REFERENCES "production_qc"("id") ON DELETE SET NULL ON UPDATE CASCADE;
