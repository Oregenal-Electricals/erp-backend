CREATE TABLE "downtimes" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "companyId" TEXT NOT NULL,
  "workOrderId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'OTHER',
  "startTime" TIMESTAMP(3) NOT NULL,
  "endTime" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "startedByUserId" TEXT NOT NULL,
  "resumedByUserId" TEXT,
  "remarks" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isTestData" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  CONSTRAINT "downtimes_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "downtimes_companyId_workOrderId_idx" ON "downtimes"("companyId", "workOrderId");
ALTER TABLE "downtimes" ADD CONSTRAINT "downtimes_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "downtimes" ADD CONSTRAINT "downtimes_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "downtimes" ADD CONSTRAINT "downtimes_startedByUserId_fkey" FOREIGN KEY ("startedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "downtimes" ADD CONSTRAINT "downtimes_resumedByUserId_fkey" FOREIGN KEY ("resumedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
