-- Bulk-imported templates start "unreviewed" - the name stays
-- changeable until the person's first save on it, which is what
-- actually locks the name in. Manually-created templates default
-- true since creating one already is that first review.
ALTER TABLE iqc_check_templates ADD COLUMN "reviewed" BOOLEAN NOT NULL DEFAULT true;
