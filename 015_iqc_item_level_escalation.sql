-- Rework: the checklist/escalation belongs on each GRN item, not on
-- the whole GRN inspection - a single GRN often has many items, and
-- each one needs its own independent template, S1-S5 results, and
-- pass/fail escalation. No real inspections have used the fields
-- being moved here yet (added earlier today), so this is a clean
-- move, not a destructive change to real data.

ALTER TABLE iqc_inspections DROP COLUMN "templateId";
ALTER TABLE iqc_inspections DROP COLUMN "lotQuantity";
ALTER TABLE iqc_inspections DROP COLUMN "sampleSize";
ALTER TABLE iqc_inspections DROP COLUMN "mrirNo";
ALTER TABLE iqc_inspections DROP COLUMN "supplierName";
ALTER TABLE iqc_inspections DROP COLUMN "currentStage";
ALTER TABLE iqc_inspections DROP COLUMN "finalOutcome";

ALTER TABLE iqc_items ADD COLUMN "templateId" TEXT REFERENCES iqc_check_templates(id);
ALTER TABLE iqc_items ADD COLUMN "sampleSize" INTEGER;
ALTER TABLE iqc_items ADD COLUMN "currentStage" TEXT NOT NULL DEFAULT 'IQC';
ALTER TABLE iqc_items ADD COLUMN "finalOutcome" TEXT NOT NULL DEFAULT 'PENDING';

-- Stage results now belong to an item, not the whole inspection.
ALTER TABLE iqc_stage_results ADD COLUMN "iqcItemId" TEXT REFERENCES iqc_items(id);
ALTER TABLE iqc_stage_results ALTER COLUMN "iqcId" DROP NOT NULL;
CREATE INDEX idx_iqc_stage_results_item ON iqc_stage_results("iqcItemId");
