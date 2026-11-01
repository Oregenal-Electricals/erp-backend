-- 181_overtime_requests.sql
--
-- Production Recording point 1: removes the old purely-client-side
-- per-line "Overtime" field from the Shift Board (frontend-only change,
-- no DB impact) and replaces it with a proper pre-authorization
-- workflow - Supervisor requests OT (men/line/product/hours) -> Plant
-- Manager review -> Management (Admin) approval - using the same
-- generic WorkflowDefinition/WorkflowStep/ApprovalRequest engine
-- already used for BOM/Product/PurchaseOrder/etc. approvals (see
-- workflows.service.ts).
--
-- This is a new, deliberately standalone OvertimeRequest document -
-- NOT an extension of the existing PROD-004/005 ManpowerAllocation
-- Stage Head -> Plant Head chain, even though the shapes look similar.
-- Same precedent as AdditionalMaterialRequest vs. MaterialIssueOverride:
-- identical-looking quantity-tracking shape, different question
-- (authorizing extra manpower-hours for a date, not allocating normal
-- manpower to a stage), kept apart rather than merged.
--
-- Once an OvertimeRequest is APPROVED, production-entry.service.ts's
-- create() uses its approvedMenCount/approvedHours as the ceiling any
-- manpowerQty above manpowerAllotted may legitimately reach, and splits
-- that entry's actualLabourCost into a normal-rate portion and an
-- otLabourCost portion (at otMultiplierSnapshot) - so next-day
-- actual-vs-target review can show whether the overtime paid for
-- itself (standing instruction: OT affects Production Costing, so this
-- standalone feature's data must still flow into costing).
BEGIN;

-- 1. New table: overtime_requests
CREATE TABLE "overtime_requests" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "shiftDate" TIMESTAMP(3) NOT NULL,
    "requestedMenCount" INTEGER NOT NULL,
    "requestedHours" DOUBLE PRECISION NOT NULL,
    "approvedMenCount" INTEGER,
    "approvedHours" DOUBLE PRECISION,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "requestedById" TEXT NOT NULL,
    "adjustedById" TEXT,
    "adjustedAt" TIMESTAMP(3),
    "labourRateSnapshot" DOUBLE PRECISION,
    "otMultiplierSnapshot" DOUBLE PRECISION,
    "estimatedOtCost" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isTestData" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "overtime_requests_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "overtime_requests" ADD CONSTRAINT "ot_req_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "overtime_requests" ADD CONSTRAINT "ot_req_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "overtime_requests" ADD CONSTRAINT "ot_req_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "overtime_requests" ADD CONSTRAINT "ot_req_adjustedById_fkey" FOREIGN KEY ("adjustedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "ot_req_companyId_requestNumber_key" ON "overtime_requests"("companyId", "requestNumber");
CREATE INDEX "ot_req_companyId_idx" ON "overtime_requests"("companyId");
CREATE INDEX "ot_req_workOrderId_idx" ON "overtime_requests"("workOrderId");

-- 2. New production_entries columns (OT slice of an hourly entry)
ALTER TABLE "production_entries" ADD COLUMN IF NOT EXISTS "otMenCount" INTEGER DEFAULT 0;
ALTER TABLE "production_entries" ADD COLUMN IF NOT EXISTS "otLabourCost" DOUBLE PRECISION;
ALTER TABLE "production_entries" ADD COLUMN IF NOT EXISTS "overtimeRequestId" TEXT;

ALTER TABLE "production_entries" ADD CONSTRAINT "pe_overtimeRequestId_fkey" FOREIGN KEY ("overtimeRequestId") REFERENCES "overtime_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 3. Workflow definition + its 2 steps (Plant Manager Review, then
-- Management Approval) - mirrors exactly what WorkflowsService's
-- DEFAULT_WORKFLOWS/seedDefaults() would create for documentType
-- OVERTIME_REQUEST, written by hand here so it's live immediately
-- rather than depending on someone calling the seed-defaults endpoint
-- after deploy. Idempotent: skipped if this company already has an
-- OVERTIME_REQUEST definition (e.g. seedDefaults() was already run).
DO $$
DECLARE
  v_company_id TEXT := '83eda866-ba63-472c-902f-561f05b6b1c1';
  v_system_user TEXT := '19b228a1-c479-4b25-bf69-a5d3e091f682';
  v_workflow_id TEXT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM workflow_definitions WHERE "companyId" = v_company_id AND "documentType" = 'OVERTIME_REQUEST'
  ) THEN
    v_workflow_id := gen_random_uuid()::text;
    INSERT INTO workflow_definitions (
      "id", "companyId", "name", "documentType", "triggerCondition", "levels", "description",
      "isActive", "isTestData", "createdAt", "updatedAt", "createdBy", "updatedBy"
    ) VALUES (
      v_workflow_id, v_company_id, 'Overtime Request Approval', 'OVERTIME_REQUEST', 'ALWAYS', 2,
      'A Supervisor''s overtime request needs Plant Manager review, then Admin/Management approval, before any production entry may use it',
      true, false, now(), now(), v_system_user, v_system_user
    );

    INSERT INTO workflow_steps (
      "id", "companyId", "workflowId", "level", "stepName", "timeoutHours",
      "isActive", "isTestData", "createdAt", "updatedAt", "createdBy", "updatedBy"
    ) VALUES
      (gen_random_uuid()::text, v_company_id, v_workflow_id, 1, 'Plant Manager Review', 24, true, false, now(), now(), v_system_user, v_system_user),
      (gen_random_uuid()::text, v_company_id, v_workflow_id, 2, 'Management Approval', 24, true, false, now(), now(), v_system_user, v_system_user);
  END IF;
END $$;

-- 4. STANDARD_OT_MULTIPLIER setting (SettingsService convention, same
-- as STANDARD_LABOUR_RATE_PER_SHIFT/STANDARD_SHIFT_HOURS) - default
-- 1.5x, matching the existing Shift.otMultiplier default used on the
-- HR/Attendance/Payroll side, for conceptual consistency between the
-- two separate OT systems.
INSERT INTO system_settings (id, key, value, description, category, "createdBy", "updatedBy", "updatedAt")
VALUES (
  gen_random_uuid()::text, 'STANDARD_OT_MULTIPLIER', '1.5',
  'Overtime pay multiplier applied to the standard labour rate when costing the approved-overtime portion of a production entry (Shift Board overtime-request workflow). Snapshotted onto each OvertimeRequest at request time so a later change never retroactively alters an already-approved request''s costing.',
  'PRODUCTION', 'system', 'system', now()
)
ON CONFLICT (key) DO NOTHING;

-- 5. Permission grants.
-- OVERTIME_REQUEST_CREATE: whoever can assign manpower on a line today
-- (Stage Supervisor) - anchored on MANPOWER_ASSIGN, the existing
-- permission already scoped to exactly that role.
INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), rp."companyId", rp."roleId", 'OVERTIME_REQUEST_CREATE', true, now()
FROM role_permissions rp
WHERE rp.permission = 'MANPOWER_ASSIGN' AND rp."isActive" = true
ON CONFLICT DO NOTHING;

-- OVERTIME_REQUEST_ADJUST: the two approval levels - Plant Manager and
-- Admin/Management - anchored on WORK_ORDER_APPROVE, which both (and
-- only both) already hold. The service layer, not this permission
-- alone, restricts the actual adjust() effect to whichever level is
-- currently pending.
INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), rp."companyId", rp."roleId", 'OVERTIME_REQUEST_ADJUST', true, now()
FROM role_permissions rp
WHERE rp.permission = 'WORK_ORDER_APPROVE' AND rp."isActive" = true
ON CONFLICT DO NOTHING;

-- OVERTIME_REQUEST_VIEW: everyone above, plus Accounts (overtime cost
-- feeds Accounts' hourly costing sheets to Management) - anchored on
-- MANPOWER_ASSIGN, WORK_ORDER_APPROVE, and FINANCE_APPROVE (held by
-- Admin and Accounts) respectively.
INSERT INTO role_permissions (id, "companyId", "roleId", permission, "isActive", "updatedAt")
SELECT gen_random_uuid(), rp."companyId", rp."roleId", 'OVERTIME_REQUEST_VIEW', true, now()
FROM role_permissions rp
WHERE rp.permission IN ('MANPOWER_ASSIGN', 'WORK_ORDER_APPROVE', 'FINANCE_APPROVE') AND rp."isActive" = true
ON CONFLICT DO NOTHING;

COMMIT;
