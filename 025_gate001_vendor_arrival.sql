-- GATE-001: Normal Vendor Material Arrival
-- New GATE_IN status, positioned between VERIFIED and SENT_TO_STORES.
-- ALTER TYPE ... ADD VALUE cannot run inside the same transaction as
-- its first use, so this must be its own statement/connection.
ALTER TYPE "GateInwardStatus" ADD VALUE IF NOT EXISTS 'GATE_IN' AFTER 'VERIFIED';
