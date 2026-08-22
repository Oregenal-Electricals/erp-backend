-- ============================================================
-- IQC Checklist Templates + Multi-Stage Escalation (remainder)
-- ============================================================
CREATE TABLE iqc_check_templates (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "companyId"     TEXT NOT NULL REFERENCES companies(id),
  "rawMaterialId" TEXT REFERENCES raw_materials(id),
  name            TEXT NOT NULL,
  "docCode"       TEXT,
  revision        TEXT,
  "isActive"      BOOLEAN NOT NULL DEFAULT true,
  "isTestData"    BOOLEAN NOT NULL DEFAULT false,
  "createdAt"     TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt"     TIMESTAMP NOT NULL DEFAULT now(),
  "createdBy"     TEXT,
  "updatedBy"     TEXT
);
CREATE INDEX idx_iqc_check_templates_company ON iqc_check_templates("companyId");
CREATE INDEX idx_iqc_check_templates_rm ON iqc_check_templates("rawMaterialId");

CREATE TABLE iqc_check_parameters (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "companyId"     TEXT NOT NULL REFERENCES companies(id),
  "templateId"    TEXT NOT NULL REFERENCES iqc_check_templates(id),
  "sNo"           INTEGER NOT NULL,
  category        TEXT NOT NULL,
  "parameterName" TEXT NOT NULL,
  specification   TEXT NOT NULL,
  "sortOrder"     INTEGER NOT NULL DEFAULT 0,
  "isActive"      BOOLEAN NOT NULL DEFAULT true,
  "isTestData"    BOOLEAN NOT NULL DEFAULT false,
  "createdAt"     TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt"     TIMESTAMP NOT NULL DEFAULT now(),
  "createdBy"     TEXT,
  "updatedBy"     TEXT
);
CREATE INDEX idx_iqc_check_parameters_template ON iqc_check_parameters("templateId");

ALTER TABLE iqc_inspections ADD COLUMN "templateId" TEXT REFERENCES iqc_check_templates(id);

CREATE TABLE iqc_stage_results (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "companyId"     TEXT NOT NULL REFERENCES companies(id),
  "iqcId"         TEXT NOT NULL REFERENCES iqc_inspections(id),
  stage           TEXT NOT NULL,
  outcome         TEXT NOT NULL,
  remarks         TEXT NOT NULL,
  "reviewedBy"    TEXT NOT NULL,
  "reviewedAt"    TIMESTAMP NOT NULL DEFAULT now(),
  "isActive"      BOOLEAN NOT NULL DEFAULT true,
  "isTestData"    BOOLEAN NOT NULL DEFAULT false,
  "createdAt"     TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt"     TIMESTAMP NOT NULL DEFAULT now(),
  "createdBy"     TEXT,
  "updatedBy"     TEXT
);
CREATE INDEX idx_iqc_stage_results_iqc ON iqc_stage_results("iqcId");

CREATE TABLE iqc_stage_parameter_results (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "companyId"     TEXT NOT NULL REFERENCES companies(id),
  "stageResultId" TEXT NOT NULL REFERENCES iqc_stage_results(id),
  "parameterId"   TEXT NOT NULL REFERENCES iqc_check_parameters(id),
  s1              TEXT,
  s2              TEXT,
  s3              TEXT,
  s4              TEXT,
  s5              TEXT,
  remark          TEXT,
  "isActive"      BOOLEAN NOT NULL DEFAULT true,
  "isTestData"    BOOLEAN NOT NULL DEFAULT false,
  "createdAt"     TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt"     TIMESTAMP NOT NULL DEFAULT now(),
  "createdBy"     TEXT,
  "updatedBy"     TEXT
);
CREATE INDEX idx_iqc_stage_param_results_stage ON iqc_stage_parameter_results("stageResultId");
