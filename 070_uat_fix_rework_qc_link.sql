ALTER TABLE "production_qc" ADD COLUMN "sourceReworkId" TEXT;
ALTER TABLE "production_qc" ADD CONSTRAINT "production_qc_sourceReworkId_fkey" FOREIGN KEY ("sourceReworkId") REFERENCES "reworks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
