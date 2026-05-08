"""017: Gate Guard / Security Module

Creates 5 tables:
  visitor_entries   — visitor register
  vehicle_logs      — all vehicle movements
  gate_entries      — material inward (linked to GRN)
  gate_entry_items  — line items for material inward
  gate_passes       — material outward (returnable + non-returnable)

Also adds 'gate' permissions to gate_guard and store_manager roles.

Revision ID: 017_gate_module
Revises: 016_master_setup
"""
from alembic import op
import sqlalchemy as sa

revision      = "017_gate_module"
down_revision = "016_master_setup"
branch_labels = None
depends_on    = None


def upgrade():
    conn = op.get_bind()

    # ── visitor_entries ───────────────────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS visitor_entries (
            id               UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            is_active        BOOLEAN     NOT NULL DEFAULT true,
            is_test_data     BOOLEAN     NOT NULL DEFAULT false,

            tenant_id        UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            created_by       UUID        REFERENCES users(id) ON DELETE SET NULL,
            updated_by       UUID        REFERENCES users(id) ON DELETE SET NULL,

            entry_number     VARCHAR(30) NOT NULL,
            visitor_name     VARCHAR(200) NOT NULL,
            visitor_phone    VARCHAR(20),
            visitor_company  VARCHAR(200),
            id_proof_type    VARCHAR(30),
            -- aadhar | pan | passport | driving_licence | voter_id | other
            id_proof_number  VARCHAR(50),
            purpose          TEXT,
            meeting_with_name VARCHAR(200),
            meeting_with_dept VARCHAR(100),
            badge_number     VARCHAR(20),
            gate_in          TIMESTAMPTZ,
            gate_out         TIMESTAMPTZ,
            status           VARCHAR(20) NOT NULL DEFAULT 'inside',
            -- inside | exited
            remarks          TEXT,
            created_by_name  VARCHAR(200)
        )
    """))
    conn.execute(sa.text(
        "CREATE INDEX IF NOT EXISTS ix_visitor_entries_tenant "
        "ON visitor_entries(tenant_id)"
    ))
    conn.execute(sa.text(
        "CREATE INDEX IF NOT EXISTS ix_visitor_entries_status "
        "ON visitor_entries(status)"
    ))
    conn.execute(sa.text(
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_visitor_entry_number "
        "ON visitor_entries(tenant_id, entry_number)"
    ))

    # ── vehicle_logs ──────────────────────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS vehicle_logs (
            id               UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            is_active        BOOLEAN     NOT NULL DEFAULT true,
            is_test_data     BOOLEAN     NOT NULL DEFAULT false,

            tenant_id        UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            created_by       UUID        REFERENCES users(id) ON DELETE SET NULL,
            updated_by       UUID        REFERENCES users(id) ON DELETE SET NULL,

            log_number       VARCHAR(30) NOT NULL,
            vehicle_number   VARCHAR(30) NOT NULL,
            vehicle_type     VARCHAR(30) NOT NULL DEFAULT 'truck',
            -- truck | tempo | car | bike | auto | tractor | other
            driver_name      VARCHAR(200),
            driver_phone     VARCHAR(20),
            driver_licence   VARCHAR(50),
            from_location    VARCHAR(200),
            to_location      VARCHAR(200),
            purpose          VARCHAR(100) NOT NULL DEFAULT 'delivery',
            -- delivery | pickup | visit | job_work | scrap | other
            gate_in          TIMESTAMPTZ,
            gate_out         TIMESTAMPTZ,
            status           VARCHAR(20) NOT NULL DEFAULT 'inside',
            -- inside | exited
            linked_entry_type VARCHAR(30),
            -- gate_entry | gate_pass | visitor | none
            linked_entry_id  UUID,
            remarks          TEXT,
            created_by_name  VARCHAR(200)
        )
    """))
    conn.execute(sa.text(
        "CREATE INDEX IF NOT EXISTS ix_vehicle_logs_tenant "
        "ON vehicle_logs(tenant_id)"
    ))
    conn.execute(sa.text(
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_vehicle_log_number "
        "ON vehicle_logs(tenant_id, log_number)"
    ))

    # ── gate_entries (Material Inward) ────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS gate_entries (
            id                    UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
            is_active             BOOLEAN     NOT NULL DEFAULT true,
            is_test_data          BOOLEAN     NOT NULL DEFAULT false,

            tenant_id             UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            created_by            UUID        REFERENCES users(id) ON DELETE SET NULL,
            updated_by            UUID        REFERENCES users(id) ON DELETE SET NULL,

            entry_number          VARCHAR(30) NOT NULL,
            status                VARCHAR(30) NOT NULL DEFAULT 'PENDING',
            -- PENDING | APPROVED | REJECTED | HOLD

            -- Vendor
            vendor_name           VARCHAR(300) NOT NULL,
            vendor_gstin          VARCHAR(20),

            -- Vehicle
            vehicle_number        VARCHAR(30),
            driver_name           VARCHAR(200),
            driver_phone          VARCHAR(20),
            transport_mode        VARCHAR(30) NOT NULL DEFAULT 'road',
            -- road | rail | air | sea | courier | hand_delivery

            -- Vendor invoice
            vendor_invoice_no     VARCHAR(100),
            vendor_invoice_date   DATE,
            vendor_invoice_amount NUMERIC(14,2),

            -- Purchase Order link (soft ref)
            po_id                 UUID,
            po_number             VARCHAR(50),

            -- Gate times
            gate_in               TIMESTAMPTZ,
            gate_out              TIMESTAMPTZ,
            remarks               TEXT,
            attachment_url        VARCHAR(500),

            -- Approval tracking
            approved_by_id        UUID REFERENCES users(id) ON DELETE SET NULL,
            approved_at           TIMESTAMPTZ,
            rejected_by_id        UUID REFERENCES users(id) ON DELETE SET NULL,
            rejected_at           TIMESTAMPTZ,
            rejection_reason      TEXT,
            held_by_id            UUID REFERENCES users(id) ON DELETE SET NULL,
            held_at               TIMESTAMPTZ,
            hold_reason           TEXT,

            -- GRN link (set after Store Manager creates GRN)
            grn_id                UUID,
            grn_number            VARCHAR(50),

            created_by_name       VARCHAR(200)
        )
    """))
    conn.execute(sa.text(
        "CREATE INDEX IF NOT EXISTS ix_gate_entries_tenant "
        "ON gate_entries(tenant_id)"
    ))
    conn.execute(sa.text(
        "CREATE INDEX IF NOT EXISTS ix_gate_entries_status "
        "ON gate_entries(status)"
    ))
    conn.execute(sa.text(
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_gate_entry_number "
        "ON gate_entries(tenant_id, entry_number)"
    ))

    # ── gate_entry_items ──────────────────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS gate_entry_items (
            id             UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
            is_test_data   BOOLEAN     NOT NULL DEFAULT false,

            gate_entry_id  UUID        NOT NULL REFERENCES gate_entries(id) ON DELETE CASCADE,
            tenant_id      UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

            item_name      VARCHAR(300) NOT NULL,
            item_code      VARCHAR(100),
            description    TEXT,
            qty_received   NUMERIC(14,3) NOT NULL DEFAULT 0,
            unit           VARCHAR(30) NOT NULL DEFAULT 'pcs',
            po_qty         NUMERIC(14,3),
            sort_order     INTEGER NOT NULL DEFAULT 0,
            remarks        TEXT
        )
    """))
    conn.execute(sa.text(
        "CREATE INDEX IF NOT EXISTS ix_gate_entry_items_entry "
        "ON gate_entry_items(gate_entry_id)"
    ))

    # ── gate_passes (Material Outward) ────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS gate_passes (
            id                  UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
            is_active           BOOLEAN     NOT NULL DEFAULT true,
            is_test_data        BOOLEAN     NOT NULL DEFAULT false,

            tenant_id           UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            created_by          UUID        REFERENCES users(id) ON DELETE SET NULL,
            updated_by          UUID        REFERENCES users(id) ON DELETE SET NULL,

            pass_number         VARCHAR(30) NOT NULL,
            pass_type           VARCHAR(20) NOT NULL DEFAULT 'returnable',
            -- returnable | non_returnable

            status              VARCHAR(30) NOT NULL DEFAULT 'OPEN',
            -- OPEN | RETURNED | PARTIAL | CLOSED

            -- Party receiving material
            party_name          VARCHAR(300) NOT NULL,
            party_address       TEXT,
            party_phone         VARCHAR(20),

            -- Vehicle / transport
            vehicle_number      VARCHAR(30),
            driver_name         VARCHAR(200),
            driver_phone        VARCHAR(20),

            -- Purpose
            purpose             TEXT,

            -- Reference (what authorised this outward movement)
            reference_type      VARCHAR(30),
            -- sales_order | delivery_challan | job_work | scrap | sample | other
            reference_id        UUID,
            reference_number    VARCHAR(100),

            -- Times
            expected_return_date DATE,
            actual_return_date   DATE,
            gate_out            TIMESTAMPTZ,
            gate_in_return      TIMESTAMPTZ,

            -- Approval
            approved_by_id      UUID REFERENCES users(id) ON DELETE SET NULL,
            approved_at         TIMESTAMPTZ,

            -- Items (JSONB for flexibility — name, qty, unit, qty_returned)
            items               JSONB NOT NULL DEFAULT '[]',

            remarks             TEXT,
            attachment_url      VARCHAR(500),
            created_by_name     VARCHAR(200)
        )
    """))
    conn.execute(sa.text(
        "CREATE INDEX IF NOT EXISTS ix_gate_passes_tenant "
        "ON gate_passes(tenant_id)"
    ))
    conn.execute(sa.text(
        "CREATE INDEX IF NOT EXISTS ix_gate_passes_status "
        "ON gate_passes(status)"
    ))
    conn.execute(sa.text(
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_gate_pass_number "
        "ON gate_passes(tenant_id, pass_number)"
    ))

    # ── Add gate permissions to existing roles ────────────────────────
    # permissions column type is JSON (not JSONB) — created in migration 001.
    # Fix: cast to JSONB, merge with || operator, result auto-casts back to JSON.
    for slug, gate_perms in [
        ("gate_guard",    '["view","create"]'),
        ("store_manager", '["view","create","edit","approve"]'),
        ("iqc_inspector", '["view"]'),
        ("admin",         '["view","create","edit","delete","approve","export"]'),
        ("super_admin",   '["view","create","edit","delete","approve","export"]'),
    ]:
        conn.execute(sa.text(
            "UPDATE roles "
            "SET permissions = "
            "(COALESCE(permissions, '{}')::jsonb || "
            "(:gate_val)::jsonb)::json "
            "WHERE slug = :slug"
        ), {"gate_val": '{"gate":' + gate_perms + '}', "slug": slug})


def downgrade():
    conn = op.get_bind()
    conn.execute(sa.text("DROP TABLE IF EXISTS gate_passes CASCADE"))
    conn.execute(sa.text("DROP TABLE IF EXISTS gate_entry_items CASCADE"))
    conn.execute(sa.text("DROP TABLE IF EXISTS gate_entries CASCADE"))
    conn.execute(sa.text("DROP TABLE IF EXISTS vehicle_logs CASCADE"))
    conn.execute(sa.text("DROP TABLE IF EXISTS visitor_entries CASCADE"))