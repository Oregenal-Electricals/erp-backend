-- Contractors - the 200 contract manpower span multiple different
-- contractors, so a plain employmentType string isn't enough to know
-- who to bill/reconcile against.
CREATE TABLE "contractors" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "contactPerson" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "address" TEXT,
  "defaultHourlyRate" DOUBLE PRECISION,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isTestData" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  CONSTRAINT "contractors_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "contractors" ADD CONSTRAINT "contractors_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "contractors_companyId_idx" ON "contractors"("companyId");

-- Employee cost basis - independent of employmentType, since a
-- contract worker's rate comes from their contractor, and someone on
-- payroll can still be paid hourly rather than a fixed monthly salary.
ALTER TABLE "employees" ADD COLUMN "costType" TEXT NOT NULL DEFAULT 'FIXED_SALARY';
ALTER TABLE "employees" ADD COLUMN "hourlyRate" DOUBLE PRECISION;
ALTER TABLE "employees" ADD COLUMN "contractorId" TEXT;
ALTER TABLE "employees" ADD CONSTRAINT "employees_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "contractors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 3-day intern trial before a formal hire decision.
ALTER TABLE "employees" ADD COLUMN "isTrial" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "employees" ADD COLUMN "trialStartDate" TIMESTAMP(3);
ALTER TABLE "employees" ADD COLUMN "trialEndDate" TIMESTAMP(3);

-- Hourly production report - the digital version of the shop-floor
-- whiteboard (target vs actual, hour by hour, per stage/Work Order).
CREATE TABLE "hourly_production_reports" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "supervisorId" TEXT NOT NULL,
  "workOrderId" TEXT,
  "stageName" TEXT NOT NULL,
  "hourStart" TIMESTAMP(3) NOT NULL,
  "hourEnd" TIMESTAMP(3) NOT NULL,
  "targetQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "actualQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "gapReason" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isTestData" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  CONSTRAINT "hourly_production_reports_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "hourly_production_reports" ADD CONSTRAINT "hourly_production_reports_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "hourly_production_reports" ADD CONSTRAINT "hourly_production_reports_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "hourly_production_reports" ADD CONSTRAINT "hourly_production_reports_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "hourly_production_reports_companyId_stageName_workOrderId_hourStart_key" ON "hourly_production_reports"("companyId", "stageName", "workOrderId", "hourStart");
CREATE INDEX "hourly_production_reports_companyId_hourStart_idx" ON "hourly_production_reports"("companyId", "hourStart");
CREATE INDEX "hourly_production_reports_companyId_workOrderId_idx" ON "hourly_production_reports"("companyId", "workOrderId");
