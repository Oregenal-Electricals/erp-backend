"""020: Purchase Module — PR, RFQ, Quotation, GRN, Returns, Messages, Amendments
+ ALTER purchase_orders (21 new columns)
+ ALTER purchase_order_items (5 new columns)
+ Number series for PR / RFQ / GRN / purchase_return

Revision ID: 020_purchase_module
Revises: 019_module1_fixes
Create Date: 2025-05-15
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB

revision      = "020_purchase_module"
down_revision = "019_module1_fixes"
branch_labels = None
depends_on    = None


def upgrade() -> None:
    conn = op.get_bind()

    # ── 1. ALTER purchase_orders — add 21 missing columns ─────────────
    for sql in [
        # Vendor FK
        "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS vendor_id          UUID REFERENCES vendors(id) ON DELETE RESTRICT",
        "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS vendor_email        VARCHAR(254)",
        "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS vendor_gstin        VARCHAR(20)",
        # Dedicated PO number (number series generated)
        "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS po_number           VARCHAR(50)",
        # Provenance
        "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS pr_id              UUID",
        "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS rfq_id             UUID",
        "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS quotation_id       UUID",
        # Dates
        "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS order_date         DATE",
        "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS delivery_date      DATE",
        # Commercial
        "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS payment_terms_days INTEGER NOT NULL DEFAULT 30",
        "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS currency           VARCHAR(10) NOT NULL DEFAULT 'INR'",
        "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS exchange_rate      NUMERIC(10,4) NOT NULL DEFAULT 1",
        # Amount breakdown
        "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS subtotal           NUMERIC(15,2) NOT NULL DEFAULT 0",
        "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS discount_amount    NUMERIC(15,2) NOT NULL DEFAULT 0",
        "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS tax_amount         NUMERIC(15,2) NOT NULL DEFAULT 0",
        # Workflow
        "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS submitted_by       UUID",
        "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS submitted_at       TIMESTAMPTZ",
        "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS approved_by        UUID",
        "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS approved_by_name   VARCHAR(200)",
        "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS approved_at        TIMESTAMPTZ",
        "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS rejected_by        UUID",
        "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS rejected_at        TIMESTAMPTZ",
        "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS rejection_reason   TEXT",
        "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS sent_to_vendor_at  TIMESTAMPTZ",
        # Locking
        "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS is_locked          BOOLEAN NOT NULL DEFAULT false",
        "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS amendment_count    INTEGER NOT NULL DEFAULT 0",
        # Audit
        "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS is_test_data       BOOLEAN NOT NULL DEFAULT false",
        "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS created_by         UUID",
        "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS updated_by         UUID",
        # Extra
        "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS terms_and_conditions TEXT",
    ]:
        conn.execute(sa.text(sql))

    # Back-fill po_number from order_number for existing rows
    conn.execute(sa.text(
        "UPDATE purchase_orders SET po_number = order_number "
        "WHERE po_number IS NULL AND order_number IS NOT NULL"
    ))
    conn.execute(sa.text(
        "UPDATE purchase_orders SET po_number = 'PO-LEGACY-' || SUBSTRING(id::text, 1, 8) "
        "WHERE po_number IS NULL"
    ))

    # Indexes for new columns
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_po_vendor_id   ON purchase_orders (vendor_id)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_po_po_number   ON purchase_orders (po_number)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_po_status_date ON purchase_orders (status, created_at DESC)"))

    # ── 2. ALTER purchase_order_items — add 5 missing columns ─────────
    for sql in [
        "ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS rfq_item_id   UUID",
        "ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS product_code   VARCHAR(100)",
        "ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS quoted_price   NUMERIC(15,4)",
        "ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS returned_qty   NUMERIC(12,3) NOT NULL DEFAULT 0",
        "ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS is_test_data   BOOLEAN NOT NULL DEFAULT false",
        "ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS created_by     UUID",
        "ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS updated_by     UUID",
        # Compute subtotal and tax_amount from existing line_total data
        "ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS subtotal       NUMERIC(15,2) NOT NULL DEFAULT 0",
        "ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS tax_amount     NUMERIC(15,2) NOT NULL DEFAULT 0",
    ]:
        conn.execute(sa.text(sql))

    # Back-fill subtotal / tax_amount for existing items
    conn.execute(sa.text("""
        UPDATE purchase_order_items SET
            subtotal   = ROUND(quantity * unit_price * (1 - discount_pct / 100.0), 2),
            tax_amount = ROUND(quantity * unit_price * (1 - discount_pct / 100.0) * tax_pct / 100.0, 2)
        WHERE subtotal = 0 AND unit_price > 0
    """))

    # ── 3. purchase_requisitions ───────────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS purchase_requisitions (
            id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            tenant_id       UUID        NOT NULL REFERENCES tenants(id)  ON DELETE CASCADE,
            created_by      UUID,
            updated_by      UUID,
            is_active       BOOLEAN     NOT NULL DEFAULT true,
            is_test_data    BOOLEAN     NOT NULL DEFAULT false,

            pr_number       VARCHAR(50)  NOT NULL,
            title           VARCHAR(300) NOT NULL,
            status          VARCHAR(30)  NOT NULL DEFAULT 'DRAFT'
                            CHECK (status IN ('DRAFT','SUBMITTED','APPROVED','REJECTED','CONVERTED')),

            requested_by        UUID,
            requested_by_name   VARCHAR(200),
            department          VARCHAR(150),
            required_by_date    DATE,
            priority            VARCHAR(20) NOT NULL DEFAULT 'normal'
                                CHECK (priority IN ('normal','urgent','critical')),

            submitted_at        TIMESTAMPTZ,
            approved_by         UUID,
            approved_by_name    VARCHAR(200),
            approved_at         TIMESTAMPTZ,
            rejected_by         UUID,
            rejected_at         TIMESTAMPTZ,
            rejection_reason    TEXT,

            converted_to_rfq_id UUID,
            converted_to_po_id  UUID,

            notes               TEXT,
            total_amount        NUMERIC(15,2) NOT NULL DEFAULT 0
        )
    """))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_pr_tenant  ON purchase_requisitions (tenant_id)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_pr_status  ON purchase_requisitions (status)"))

    # ── 4. purchase_requisition_items ─────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS purchase_requisition_items (
            id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            tenant_id       UUID        NOT NULL REFERENCES tenants(id)                  ON DELETE CASCADE,
            pr_id           UUID        NOT NULL REFERENCES purchase_requisitions(id)    ON DELETE CASCADE,
            created_by      UUID,
            updated_by      UUID,
            is_active       BOOLEAN     NOT NULL DEFAULT true,
            is_test_data    BOOLEAN     NOT NULL DEFAULT false,

            product_id      UUID,
            product_name    VARCHAR(300) NOT NULL,
            product_code    VARCHAR(100),
            hsn_code        VARCHAR(20),
            unit            VARCHAR(30)  NOT NULL DEFAULT 'Pcs',

            quantity                NUMERIC(12,3) NOT NULL,
            estimated_unit_price    NUMERIC(15,2) NOT NULL DEFAULT 0,
            estimated_total         NUMERIC(15,2) NOT NULL DEFAULT 0,
            gst_rate                NUMERIC(5,2)  NOT NULL DEFAULT 18,

            specifications  TEXT,
            notes           TEXT
        )
    """))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_pr_items_pr ON purchase_requisition_items (pr_id)"))

    # ── 5. rfq_headers ────────────────────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS rfq_headers (
            id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            tenant_id       UUID        NOT NULL REFERENCES tenants(id)              ON DELETE CASCADE,
            created_by      UUID,
            updated_by      UUID,
            is_active       BOOLEAN     NOT NULL DEFAULT true,
            is_test_data    BOOLEAN     NOT NULL DEFAULT false,

            rfq_number      VARCHAR(50) NOT NULL,
            title           VARCHAR(300) NOT NULL,
            status          VARCHAR(30)  NOT NULL DEFAULT 'DRAFT'
                            CHECK (status IN ('DRAFT','SENT','PARTIALLY_RECEIVED','CLOSED','CONVERTED','CANCELLED')),

            pr_id           UUID REFERENCES purchase_requisitions(id) ON DELETE SET NULL,

            sent_at         TIMESTAMPTZ,
            close_date      DATE,
            required_by     DATE,

            converted_to_po_id  UUID,

            terms_and_conditions TEXT,
            notes                TEXT,

            vendor_count    INTEGER NOT NULL DEFAULT 0,
            quotation_count INTEGER NOT NULL DEFAULT 0
        )
    """))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_rfq_tenant ON rfq_headers (tenant_id)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_rfq_status ON rfq_headers (status)"))

    # ── 6. rfq_items ──────────────────────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS rfq_items (
            id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            tenant_id       UUID        NOT NULL REFERENCES tenants(id)   ON DELETE CASCADE,
            rfq_id          UUID        NOT NULL REFERENCES rfq_headers(id) ON DELETE CASCADE,
            pr_item_id      UUID        REFERENCES purchase_requisition_items(id) ON DELETE SET NULL,
            created_by      UUID,
            updated_by      UUID,
            is_active       BOOLEAN     NOT NULL DEFAULT true,
            is_test_data    BOOLEAN     NOT NULL DEFAULT false,

            product_id      UUID,
            product_name    VARCHAR(300) NOT NULL,
            product_code    VARCHAR(100),
            hsn_code        VARCHAR(20),
            unit            VARCHAR(30) NOT NULL DEFAULT 'Pcs',
            quantity        NUMERIC(12,3) NOT NULL,
            target_price    NUMERIC(15,2),
            gst_rate        NUMERIC(5,2)  NOT NULL DEFAULT 18,
            specifications  TEXT,
            notes           TEXT
        )
    """))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_rfq_items_rfq ON rfq_items (rfq_id)"))

    # ── 7. rfq_vendors ────────────────────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS rfq_vendors (
            id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            tenant_id       UUID        NOT NULL REFERENCES tenants(id)   ON DELETE CASCADE,
            rfq_id          UUID        NOT NULL REFERENCES rfq_headers(id) ON DELETE CASCADE,
            vendor_id       UUID        NOT NULL REFERENCES vendors(id)   ON DELETE CASCADE,
            created_by      UUID,
            updated_by      UUID,
            is_active       BOOLEAN     NOT NULL DEFAULT true,
            is_test_data    BOOLEAN     NOT NULL DEFAULT false,

            vendor_name     VARCHAR(300) NOT NULL,
            vendor_email    VARCHAR(254),
            sent_at         TIMESTAMPTZ,
            email_sent      BOOLEAN NOT NULL DEFAULT false,
            has_responded   BOOLEAN NOT NULL DEFAULT false
        )
    """))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_rfq_vendors_rfq    ON rfq_vendors (rfq_id)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_rfq_vendors_vendor  ON rfq_vendors (vendor_id)"))
    conn.execute(sa.text("CREATE UNIQUE INDEX IF NOT EXISTS ix_rfq_vendors_unique ON rfq_vendors (rfq_id, vendor_id)"))

    # ── 8. vendor_quotations ──────────────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS vendor_quotations (
            id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            tenant_id       UUID        NOT NULL REFERENCES tenants(id)   ON DELETE CASCADE,
            created_by      UUID,
            updated_by      UUID,
            is_active       BOOLEAN     NOT NULL DEFAULT true,
            is_test_data    BOOLEAN     NOT NULL DEFAULT false,

            rfq_id          UUID        NOT NULL REFERENCES rfq_headers(id) ON DELETE CASCADE,
            vendor_id       UUID        NOT NULL REFERENCES vendors(id)    ON DELETE RESTRICT,

            quotation_number VARCHAR(50)  NOT NULL,
            vendor_ref       VARCHAR(100),
            status           VARCHAR(30)  NOT NULL DEFAULT 'RECEIVED'
                             CHECK (status IN ('RECEIVED','SHORTLISTED','ACCEPTED','REJECTED')),

            vendor_name     VARCHAR(300) NOT NULL,
            vendor_email    VARCHAR(254),
            vendor_gstin    VARCHAR(20),

            received_date   DATE,
            validity_date   DATE,
            delivery_days   INTEGER,

            subtotal        NUMERIC(15,2) NOT NULL DEFAULT 0,
            tax_amount      NUMERIC(15,2) NOT NULL DEFAULT 0,
            total_amount    NUMERIC(15,2) NOT NULL DEFAULT 0,

            payment_terms   VARCHAR(100),
            notes           TEXT,

            accepted_by     UUID,
            accepted_at     TIMESTAMPTZ,
            rejected_by     UUID,
            rejected_at     TIMESTAMPTZ,
            rejection_reason TEXT,

            po_id           UUID
        )
    """))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_vq_rfq_id   ON vendor_quotations (rfq_id)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_vq_vendor_id ON vendor_quotations (vendor_id)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_vq_status    ON vendor_quotations (status)"))

    # ── 9. vendor_quotation_items ─────────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS vendor_quotation_items (
            id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            tenant_id       UUID        NOT NULL REFERENCES tenants(id)          ON DELETE CASCADE,
            quotation_id    UUID        NOT NULL REFERENCES vendor_quotations(id) ON DELETE CASCADE,
            rfq_item_id     UUID             REFERENCES rfq_items(id)            ON DELETE SET NULL,
            created_by      UUID,
            updated_by      UUID,
            is_active       BOOLEAN     NOT NULL DEFAULT true,
            is_test_data    BOOLEAN     NOT NULL DEFAULT false,

            product_id      UUID,
            product_name    VARCHAR(300) NOT NULL,
            product_code    VARCHAR(100),
            hsn_code        VARCHAR(20),
            unit            VARCHAR(30) NOT NULL DEFAULT 'Pcs',

            quantity        NUMERIC(12,3) NOT NULL,
            unit_price      NUMERIC(15,4) NOT NULL,
            discount_pct    NUMERIC(5,2)  NOT NULL DEFAULT 0,
            gst_rate        NUMERIC(5,2)  NOT NULL DEFAULT 18,
            subtotal        NUMERIC(15,2) NOT NULL DEFAULT 0,
            tax_amount      NUMERIC(15,2) NOT NULL DEFAULT 0,
            line_total      NUMERIC(15,2) NOT NULL DEFAULT 0,

            delivery_days   INTEGER,
            brand           VARCHAR(150),
            notes           TEXT
        )
    """))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_vqi_quotation ON vendor_quotation_items (quotation_id)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_vqi_rfq_item  ON vendor_quotation_items (rfq_item_id)"))

    # ── 10. grn_headers ───────────────────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS grn_headers (
            id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            tenant_id       UUID        NOT NULL REFERENCES tenants(id)      ON DELETE CASCADE,
            po_id           UUID        NOT NULL REFERENCES purchase_orders(id) ON DELETE RESTRICT,
            vendor_id       UUID             REFERENCES vendors(id)           ON DELETE RESTRICT,
            created_by      UUID,
            updated_by      UUID,
            is_active       BOOLEAN     NOT NULL DEFAULT true,
            is_test_data    BOOLEAN     NOT NULL DEFAULT false,

            grn_number      VARCHAR(50)  NOT NULL,
            status          VARCHAR(20)  NOT NULL DEFAULT 'DRAFT'
                            CHECK (status IN ('DRAFT','POSTED','CANCELLED')),

            received_date   DATE,
            vehicle_number  VARCHAR(50),
            dc_number       VARCHAR(100),
            invoice_number  VARCHAR(100),

            vendor_name     VARCHAR(300),
            po_number       VARCHAR(50),

            total_received_value NUMERIC(15,2) NOT NULL DEFAULT 0,

            posted_by       UUID,
            posted_at       TIMESTAMPTZ,

            notes           TEXT
        )
    """))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_grn_tenant ON grn_headers (tenant_id)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_grn_po_id  ON grn_headers (po_id)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_grn_status ON grn_headers (status)"))

    # ── 11. grn_items ─────────────────────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS grn_items (
            id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            tenant_id       UUID        NOT NULL REFERENCES tenants(id)            ON DELETE CASCADE,
            grn_id          UUID        NOT NULL REFERENCES grn_headers(id)         ON DELETE CASCADE,
            po_item_id      UUID        NOT NULL REFERENCES purchase_order_items(id) ON DELETE RESTRICT,
            created_by      UUID,
            updated_by      UUID,
            is_active       BOOLEAN     NOT NULL DEFAULT true,
            is_test_data    BOOLEAN     NOT NULL DEFAULT false,

            product_id      UUID,
            product_name    VARCHAR(300) NOT NULL,
            product_sku     VARCHAR(100),
            unit            VARCHAR(30)  NOT NULL DEFAULT 'Pcs',
            hsn_code        VARCHAR(20),

            ordered_qty     NUMERIC(12,3) NOT NULL,
            received_qty    NUMERIC(12,3) NOT NULL,
            accepted_qty    NUMERIC(12,3) NOT NULL,
            rejected_qty    NUMERIC(12,3) NOT NULL DEFAULT 0,

            unit_cost       NUMERIC(15,4) NOT NULL,
            total_cost      NUMERIC(15,2) NOT NULL DEFAULT 0,

            batch_number    VARCHAR(100),
            expiry_date     DATE,

            ledger_entry_id UUID,
            rejection_reason TEXT,
            notes           TEXT
        )
    """))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_grn_items_grn      ON grn_items (grn_id)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_grn_items_po_item  ON grn_items (po_item_id)"))

    # ── 12. purchase_returns ──────────────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS purchase_returns (
            id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            tenant_id       UUID        NOT NULL REFERENCES tenants(id)       ON DELETE CASCADE,
            po_id           UUID        NOT NULL REFERENCES purchase_orders(id) ON DELETE RESTRICT,
            grn_id          UUID             REFERENCES grn_headers(id)        ON DELETE RESTRICT,
            vendor_id       UUID             REFERENCES vendors(id)            ON DELETE RESTRICT,
            created_by      UUID,
            updated_by      UUID,
            is_active       BOOLEAN     NOT NULL DEFAULT true,
            is_test_data    BOOLEAN     NOT NULL DEFAULT false,

            return_number   VARCHAR(50)  NOT NULL,
            status          VARCHAR(20)  NOT NULL DEFAULT 'DRAFT'
                            CHECK (status IN ('DRAFT','APPROVED','DISPATCHED','REJECTED')),

            vendor_name     VARCHAR(300),
            po_number       VARCHAR(50),
            grn_number      VARCHAR(50),

            return_reason   VARCHAR(200) NOT NULL,
            notes           TEXT,
            total_amount    NUMERIC(15,2) NOT NULL DEFAULT 0,

            approved_by     UUID,
            approved_at     TIMESTAMPTZ,
            rejected_by     UUID,
            rejected_at     TIMESTAMPTZ,
            rejection_reason TEXT,

            dispatched_by   UUID,
            dispatched_at   TIMESTAMPTZ
        )
    """))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_pr_return_tenant ON purchase_returns (tenant_id)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_pr_return_po_id  ON purchase_returns (po_id)"))

    # ── 13. purchase_return_items ─────────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS purchase_return_items (
            id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            tenant_id       UUID        NOT NULL REFERENCES tenants(id)          ON DELETE CASCADE,
            return_id       UUID        NOT NULL REFERENCES purchase_returns(id)  ON DELETE CASCADE,
            grn_item_id     UUID             REFERENCES grn_items(id)            ON DELETE RESTRICT,
            po_item_id      UUID             REFERENCES purchase_order_items(id) ON DELETE RESTRICT,
            created_by      UUID,
            updated_by      UUID,
            is_active       BOOLEAN     NOT NULL DEFAULT true,
            is_test_data    BOOLEAN     NOT NULL DEFAULT false,

            product_id      UUID,
            product_name    VARCHAR(300) NOT NULL,
            product_sku     VARCHAR(100),
            unit            VARCHAR(30)  NOT NULL DEFAULT 'Pcs',

            return_qty      NUMERIC(12,3) NOT NULL,
            unit_cost       NUMERIC(15,4) NOT NULL,
            total_cost      NUMERIC(15,2) NOT NULL DEFAULT 0,

            return_reason   TEXT,
            notes           TEXT,
            ledger_entry_id UUID
        )
    """))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_pri_return ON purchase_return_items (return_id)"))

    # ── 14. po_messages ───────────────────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS po_messages (
            id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            tenant_id       UUID        NOT NULL REFERENCES tenants(id)       ON DELETE CASCADE,
            po_id           UUID        NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
            created_by      UUID,
            updated_by      UUID,
            is_active       BOOLEAN     NOT NULL DEFAULT true,
            is_test_data    BOOLEAN     NOT NULL DEFAULT false,

            message_type    VARCHAR(30)  NOT NULL
                            CHECK (message_type IN (
                                'internal_note','vendor_sent','vendor_reply',
                                'approval_comment','amendment_note','system'
                            )),
            sender_name     VARCHAR(200),
            sender_type     VARCHAR(20)  NOT NULL DEFAULT 'user'
                            CHECK (sender_type IN ('user','vendor','system')),
            body            TEXT         NOT NULL,
            is_private      BOOLEAN      NOT NULL DEFAULT false,
            email_sent      BOOLEAN      NOT NULL DEFAULT false
        )
    """))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_pom_po_id ON po_messages (po_id)"))

    # ── 15. po_amendments ─────────────────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS po_amendments (
            id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            tenant_id       UUID        NOT NULL REFERENCES tenants(id)       ON DELETE CASCADE,
            po_id           UUID        NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
            created_by      UUID,
            is_test_data    BOOLEAN     NOT NULL DEFAULT false,

            version         INTEGER      NOT NULL,
            amended_by_name VARCHAR(200),
            reason          TEXT         NOT NULL,
            diff            JSONB,
            status          VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
                            CHECK (status IN ('PENDING','APPROVED','REJECTED')),
            approved_by     UUID,
            approved_at     TIMESTAMPTZ
        )
    """))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_poa_po_id ON po_amendments (po_id)"))

    # ── 16. Number series for new document types ──────────────────────
    conn.execute(sa.text("""
        INSERT INTO number_series (
            id, tenant_id, document_type, prefix, include_year, year_format,
            separator, padding_digits, current_number, suffix,
            is_active, is_test_data, created_at, updated_at
        )
        SELECT
            gen_random_uuid(), t.id, dt.doc_type, dt.prefix, true, 'YY-YY',
            '-', 4, 0, '', true, false, now(), now()
        FROM tenants t
        CROSS JOIN (VALUES
            ('purchase_requisition', 'PR'),
            ('rfq',                  'RFQ'),
            ('vendor_quotation',     'VQ'),
            ('grn',                  'GRN'),
            ('purchase_return',      'PRN')
        ) AS dt(doc_type, prefix)
        WHERE NOT EXISTS (
            SELECT 1 FROM number_series ns
            WHERE ns.tenant_id = t.id AND ns.document_type = dt.doc_type
        )
    """))

    # Ensure purchase_order number series exists too
    conn.execute(sa.text("""
        INSERT INTO number_series (
            id, tenant_id, document_type, prefix, include_year, year_format,
            separator, padding_digits, current_number, suffix,
            is_active, is_test_data, created_at, updated_at
        )
        SELECT
            gen_random_uuid(), t.id, 'purchase_order', 'PO', true, 'YY-YY',
            '-', 4, 0, '', true, false, now(), now()
        FROM tenants t
        WHERE NOT EXISTS (
            SELECT 1 FROM number_series ns
            WHERE ns.tenant_id = t.id AND ns.document_type = 'purchase_order'
        )
    """))


def downgrade() -> None:
    conn = op.get_bind()
    # Drop in reverse FK-safe order
    for tbl in [
        "po_amendments",
        "po_messages",
        "purchase_return_items",
        "purchase_returns",
        "grn_items",
        "grn_headers",
        "vendor_quotation_items",
        "vendor_quotations",
        "rfq_vendors",
        "rfq_items",
        "rfq_headers",
        "purchase_requisition_items",
        "purchase_requisitions",
    ]:
        conn.execute(sa.text(f"DROP TABLE IF EXISTS {tbl} CASCADE"))

    # Remove added columns from purchase_orders
    for col in [
        "vendor_id", "vendor_email", "vendor_gstin", "po_number",
        "pr_id", "rfq_id", "quotation_id", "order_date", "delivery_date",
        "payment_terms_days", "currency", "exchange_rate",
        "subtotal", "discount_amount", "tax_amount",
        "submitted_by", "submitted_at", "approved_by", "approved_by_name", "approved_at",
        "rejected_by", "rejected_at", "rejection_reason", "sent_to_vendor_at",
        "is_locked", "amendment_count", "is_test_data", "created_by", "updated_by",
        "terms_and_conditions",
    ]:
        conn.execute(sa.text(f"ALTER TABLE purchase_orders DROP COLUMN IF EXISTS {col}"))

    for col in [
        "rfq_item_id", "product_code", "quoted_price", "returned_qty",
        "subtotal", "tax_amount", "is_test_data", "created_by", "updated_by",
    ]:
        conn.execute(sa.text(f"ALTER TABLE purchase_order_items DROP COLUMN IF EXISTS {col}"))
