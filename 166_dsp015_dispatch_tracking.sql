-- 166_dsp015_dispatch_tracking.sql
-- DSP-015: post-Gate-Out transit/delivery tracking timeline.
BEGIN;

CREATE TABLE "dispatch_tracking_updates" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "gateOutId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_TRANSIT',
    "location" TEXT,
    "notes" TEXT,
    "eventAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "enteredBy" TEXT,
    "carrierReference" TEXT,
    "rawPayload" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isTestData" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "dispatch_tracking_updates_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "dispatch_tracking_updates" ADD CONSTRAINT "dtu_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "dispatch_tracking_updates" ADD CONSTRAINT "dtu_gateOutId_fkey" FOREIGN KEY ("gateOutId") REFERENCES "dispatch_gate_outs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "dtu_gateOutId_idx" ON "dispatch_tracking_updates"("gateOutId");
CREATE INDEX "dtu_companyId_status_idx" ON "dispatch_tracking_updates"("companyId", "status");

COMMIT;
