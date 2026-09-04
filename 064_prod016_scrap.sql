CREATE TABLE "scraps" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "companyId" TEXT NOT NULL,
  "rejectionNumber" TEXT NOT NULL,
  "workOrderId" TEXT NOT NULL,
  "sourceQcInspectionId" TEXT NOT NULL,
  "sourceReworkId" TEXT,
  "defectDescription" TEXT,
  "quantity" INTEGER NOT NULL,
  "scrapQty" INTEGER NOT NULL DEFAULT 0,
  "recoveryQty" INTEGER NOT NULL DEFAULT 0,
  "otherDispositionQty" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'PENDING_DISPOSITION',
  "estimatedScrapValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "recognizedScrapRecovery" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "recoveredComponents" TEXT,
  "remarks" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isTestData" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  CONSTRAINT "scraps_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "scraps_companyId_workOrderId_idx" ON "scraps"("companyId", "workOrderId");
ALTER TABLE "scraps" ADD CONSTRAINT "scraps_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "scraps" ADD CONSTRAINT "scraps_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "scraps" ADD CONSTRAINT "scraps_sourceQcInspectionId_fkey" FOREIGN KEY ("sourceQcInspectionId") REFERENCES "production_qc"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "scraps" ADD CONSTRAINT "scraps_sourceReworkId_fkey" FOREIGN KEY ("sourceReworkId") REFERENCES "reworks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
