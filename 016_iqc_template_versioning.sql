-- Templates become versioned and immutable: editing creates a new
-- row rather than mutating the existing one, so a past inspection's
-- reference to a specific template version never silently changes.
ALTER TABLE iqc_check_templates ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE iqc_check_templates ADD COLUMN "isCurrent" BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX idx_iqc_check_templates_current ON iqc_check_templates("companyId", "name", "isCurrent");
