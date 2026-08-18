CREATE TABLE IF NOT EXISTS delete_requests (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "companyId"         TEXT NOT NULL REFERENCES companies(id),
  "tableName"         TEXT NOT NULL,
  "recordId"          TEXT NOT NULL,
  "recordLabel"       TEXT NOT NULL,
  reason              TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'PENDING',
  "approvalRequestId" TEXT,
  "requestedBy"       TEXT NOT NULL,
  "decidedBy"         TEXT,
  "decidedAt"         TIMESTAMPTZ,
  "isActive"          BOOLEAN NOT NULL DEFAULT true,
  "isTestData"        BOOLEAN NOT NULL DEFAULT false,
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT now(),
  "createdBy"         TEXT,
  "updatedBy"         TEXT
);

CREATE INDEX IF NOT EXISTS idx_delete_requests_company_status ON delete_requests("companyId", status);
