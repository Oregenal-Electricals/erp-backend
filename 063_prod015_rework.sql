CREATE TABLE "reworks" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "companyId" TEXT NOT NULL,
  "reworkNumber" TEXT NOT NULL,
  "workOrderId" TEXT NOT NULL,
  "originalQcInspectionId" TEXT NOT NULL,
  "defectDescription" TEXT,
  "quantity" INTEGER NOT NULL,
  "remainingQuantity" INTEGER NOT NULL,
  "reworkStage" TEXT,
  "cycleNumber" INTEGER NOT NULL DEFAULT 1,
  "status" TEXT NOT NULL DEFAULT 'REWORK_PENDING',
  "successfullyReworkedQty" INTEGER,
  "stillDefectiveQty" INTEGER,
  "manpowerQty" INTEGER,
  "actualStartAt" TIMESTAMP(3),
  "actualEndAt" TIMESTAMP(3),
  "additionalMaterialCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "additionalLabourCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "additionalOtherCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalAdditionalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "remarks" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isTestData" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  CONSTRAINT "reworks_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "reworks_companyId_workOrderId_idx" ON "reworks"("companyId", "workOrderId");
ALTER TABLE "reworks" ADD CONSTRAINT "reworks_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reworks" ADD CONSTRAINT "reworks_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reworks" ADD CONSTRAINT "reworks_originalQcInspectionId_fkey" FOREIGN KEY ("originalQcInspectionId") REFERENCES "production_qc"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
