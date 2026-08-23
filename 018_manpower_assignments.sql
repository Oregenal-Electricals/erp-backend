-- Employee-level layer beneath ManpowerAllocation: one row per person
-- per assignment period, so every allocated count is traceable down
-- to actual employees, and current status (endTime null = active
-- right now) powers live reconciliation and gap detection.
CREATE TABLE "manpower_assignments" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "allocationId" TEXT,
  "workOrderId" TEXT,
  "stageName" TEXT,
  "activityType" TEXT NOT NULL DEFAULT 'PRODUCTION',
  "startTime" TIMESTAMP(3) NOT NULL,
  "endTime" TIMESTAMP(3),
  "assignedByUserId" TEXT NOT NULL,
  "remarks" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isTestData" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  CONSTRAINT "manpower_assignments_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "manpower_assignments" ADD CONSTRAINT "manpower_assignments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "manpower_assignments" ADD CONSTRAINT "manpower_assignments_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "manpower_assignments" ADD CONSTRAINT "manpower_assignments_allocationId_fkey" FOREIGN KEY ("allocationId") REFERENCES "manpower_allocations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "manpower_assignments" ADD CONSTRAINT "manpower_assignments_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "manpower_assignments" ADD CONSTRAINT "manpower_assignments_assignedByUserId_fkey" FOREIGN KEY ("assignedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "manpower_assignments_companyId_employeeId_endTime_idx" ON "manpower_assignments"("companyId", "employeeId", "endTime");
CREATE INDEX "manpower_assignments_companyId_workOrderId_idx" ON "manpower_assignments"("companyId", "workOrderId");
CREATE INDEX "manpower_assignments_companyId_allocationId_idx" ON "manpower_assignments"("companyId", "allocationId");
CREATE INDEX "manpower_assignments_companyId_startTime_idx" ON "manpower_assignments"("companyId", "startTime");

-- Optional field on WorkOrder to support shortage/excess comparison
-- against assigned manpower (section 24 of the spec).
ALTER TABLE "work_orders" ADD COLUMN "requiredManpower" INTEGER;

-- Grace period (minutes) before a finished assignment with no
-- successor becomes an "unallocated" exception, matching the existing
-- SystemSetting key-value pattern rather than hardcoding the value.
INSERT INTO "system_settings" ("id", "key", "value", "description", "category", "updatedAt")
VALUES (gen_random_uuid()::text, 'MANPOWER_GRACE_PERIOD_MINUTES', '15', 'Minutes after an assignment ends before the employee is flagged as unallocated', 'MANPOWER', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
