"""018: Masters Module — Vendor, HSN, Price List, Price History + extend Customer & Product

Revision ID: 018_masters_module
Revises: 017_gate_module
Create Date: 2025-05-06

What this migration does:
  NEW TABLES:
    vendors              — full vendor master (replaces bare vendor_name string)
    hsn_codes            — HSN/SAC code library with GST rates
    price_lists          — price list header (sales / purchase)
    price_list_items     — line items per price list
    price_history        — immutable audit trail of price changes

  ALTER TABLES (ADD COLUMN IF NOT EXISTS — safe, no data loss):
    customers            — add customer_code, status, payment_terms_days,
                           credit_limit, credit_used, shipping_address,
                           customer_group, approved_by, approved_at,
                           is_test_data, created_by, updated_by
    inventory_products   — add product_code, product_type, product_group,
                           hsn_id, hsn_code, gst_rate, purchase_price,
                           preferred_vendor_id, is_test_data, created_by, updated_by

  NUMBER SERIES: adds vendor, customer, item document types
  SEED: updates existing customers to status=APPROVED
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB

revision      = "018_masters_module"
down_revision = "017_gate_module"
branch_labels = None
depends_on    = None


def upgrade() -> None:
    conn = op.get_bind()

    # ── 1. vendors ────────────────────────────────────────────────────
    op.create_table(
        "vendors",
        sa.Column("id",              PG_UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True, nullable=False),
        sa.Column("created_at",      sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at",      sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("tenant_id",       PG_UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_by",      PG_UUID(as_uuid=True), nullable=True),
        sa.Column("updated_by",      PG_UUID(as_uuid=True), nullable=True),
        sa.Column("is_active",       sa.Boolean, server_default="true",  nullable=False),
        sa.Column("is_test_data",    sa.Boolean, server_default="false", nullable=False),

        sa.Column("vendor_code",     sa.String(30),  nullable=False),
        sa.Column("name",            sa.String(300), nullable=False),
        sa.Column("legal_name",      sa.String(300), nullable=True),
        sa.Column("vendor_type",     sa.String(30),  server_default="material", nullable=False),
        sa.Column("status",          sa.String(30),  server_default="PENDING",  nullable=False),

        sa.Column("gstin",           sa.String(20),  nullable=True),
        sa.Column("pan",             sa.String(20),  nullable=True),
        sa.Column("msme_number",     sa.String(30),  nullable=True),

        sa.Column("address_line1",   sa.String(300), nullable=True),
        sa.Column("address_line2",   sa.String(300), nullable=True),
        sa.Column("city",            sa.String(100), nullable=True),
        sa.Column("state",           sa.String(100), nullable=True),
        sa.Column("pincode",         sa.String(10),  nullable=True),
        sa.Column("country",         sa.String(100), server_default="India", nullable=False),

        sa.Column("contact_person",  sa.String(200), nullable=True),
        sa.Column("phone",           sa.String(30),  nullable=True),
        sa.Column("email",           sa.String(254), nullable=True),
        sa.Column("website",         sa.String(300), nullable=True),

        sa.Column("payment_terms_days", sa.Integer,       server_default="30", nullable=False),
        sa.Column("credit_limit",       sa.Numeric(14,2), server_default="0",  nullable=False),
        sa.Column("rating",             sa.Integer,       server_default="0",  nullable=False),

        sa.Column("bank_account",    sa.String(30),  nullable=True),
        sa.Column("bank_ifsc",       sa.String(15),  nullable=True),
        sa.Column("bank_name",       sa.String(200), nullable=True),
        sa.Column("bank_branch",     sa.String(200), nullable=True),

        sa.Column("notes",           sa.Text, nullable=True),
        sa.Column("approved_by",     PG_UUID(as_uuid=True), nullable=True),
        sa.Column("approved_at",     sa.DateTime(timezone=True), nullable=True),
        sa.Column("rejected_by",     PG_UUID(as_uuid=True), nullable=True),
        sa.Column("rejected_at",     sa.DateTime(timezone=True), nullable=True),
        sa.Column("rejection_reason",sa.Text, nullable=True),
    )
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_vendors_tenant  ON vendors (tenant_id)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_vendors_status  ON vendors (status)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_vendors_code    ON vendors (vendor_code)"))

    # ── 2. hsn_codes ──────────────────────────────────────────────────
    op.create_table(
        "hsn_codes",
        sa.Column("id",            PG_UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True, nullable=False),
        sa.Column("created_at",    sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at",    sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("tenant_id",     PG_UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_by",    PG_UUID(as_uuid=True), nullable=True),
        sa.Column("updated_by",    PG_UUID(as_uuid=True), nullable=True),
        sa.Column("is_active",     sa.Boolean, server_default="true",  nullable=False),
        sa.Column("is_test_data",  sa.Boolean, server_default="false", nullable=False),

        sa.Column("code",          sa.String(10),  nullable=False),
        sa.Column("description",   sa.String(500), nullable=False),
        sa.Column("code_type",     sa.String(10),  server_default="hsn", nullable=False),
        sa.Column("igst_rate",     sa.Numeric(5,2), server_default="18", nullable=False),
        sa.Column("cgst_rate",     sa.Numeric(5,2), server_default="9",  nullable=False),
        sa.Column("sgst_rate",     sa.Numeric(5,2), server_default="9",  nullable=False),
        sa.Column("cess_rate",     sa.Numeric(5,2), server_default="0",  nullable=False),
        sa.Column("effective_from",sa.Date, nullable=True),
        sa.Column("effective_to",  sa.Date, nullable=True),
    )
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_hsn_codes_tenant ON hsn_codes (tenant_id)"))
    conn.execute(sa.text("CREATE UNIQUE INDEX IF NOT EXISTS ix_hsn_codes_unique ON hsn_codes (tenant_id, code)"))

    # ── 3. price_lists ────────────────────────────────────────────────
    op.create_table(
        "price_lists",
        sa.Column("id",            PG_UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True, nullable=False),
        sa.Column("created_at",    sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at",    sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("tenant_id",     PG_UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_by",    PG_UUID(as_uuid=True), nullable=True),
        sa.Column("updated_by",    PG_UUID(as_uuid=True), nullable=True),
        sa.Column("is_active",     sa.Boolean, server_default="true",  nullable=False),
        sa.Column("is_test_data",  sa.Boolean, server_default="false", nullable=False),

        sa.Column("name",          sa.String(200), nullable=False),
        sa.Column("list_type",     sa.String(20),  nullable=False),
        sa.Column("currency",      sa.String(10),  server_default="INR", nullable=False),
        sa.Column("applicable_to", sa.String(30),  server_default="all", nullable=False),
        sa.Column("description",   sa.Text, nullable=True),
        sa.Column("effective_from",sa.Date, nullable=False),
        sa.Column("effective_to",  sa.Date, nullable=True),
        sa.Column("is_default",    sa.Boolean, server_default="false", nullable=False),
        sa.Column("party_id",      PG_UUID(as_uuid=True), nullable=True),
        sa.Column("party_name",    sa.String(300), nullable=True),
    )
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_price_lists_tenant    ON price_lists (tenant_id)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_price_lists_type      ON price_lists (list_type)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_price_lists_effective ON price_lists (effective_from, effective_to)"))

    # ── 4. price_list_items ───────────────────────────────────────────
    op.create_table(
        "price_list_items",
        sa.Column("id",            PG_UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True, nullable=False),
        sa.Column("created_at",    sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at",    sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("price_list_id", PG_UUID(as_uuid=True), sa.ForeignKey("price_lists.id", ondelete="CASCADE"), nullable=False),
        sa.Column("tenant_id",     PG_UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("is_test_data",  sa.Boolean, server_default="false", nullable=False),

        sa.Column("product_id",    PG_UUID(as_uuid=True), nullable=True),
        sa.Column("product_code",  sa.String(100), nullable=True),
        sa.Column("product_name",  sa.String(300), nullable=False),
        sa.Column("unit",          sa.String(30),  server_default="Pcs", nullable=False),

        sa.Column("unit_price",    sa.Numeric(14,4), nullable=False),
        sa.Column("min_qty",       sa.Numeric(14,3), server_default="1", nullable=False),
        sa.Column("max_qty",       sa.Numeric(14,3), nullable=True),
        sa.Column("discount_pct",  sa.Numeric(5,2),  server_default="0", nullable=False),

        sa.Column("effective_from",sa.Date, nullable=True),
        sa.Column("effective_to",  sa.Date, nullable=True),
        sa.Column("notes",         sa.Text, nullable=True),
    )
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_price_list_items_list    ON price_list_items (price_list_id)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_price_list_items_product ON price_list_items (product_id)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_price_list_items_tenant  ON price_list_items (tenant_id)"))

    # ── 5. price_history (append-only) ────────────────────────────────
    op.create_table(
        "price_history",
        sa.Column("id",              PG_UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True, nullable=False),
        sa.Column("created_at",      sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("tenant_id",       PG_UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("is_test_data",    sa.Boolean, server_default="false", nullable=False),

        sa.Column("product_id",      PG_UUID(as_uuid=True), nullable=True),
        sa.Column("product_code",    sa.String(100), nullable=True),
        sa.Column("product_name",    sa.String(300), nullable=True),
        sa.Column("price_list_id",   PG_UUID(as_uuid=True), nullable=True),
        sa.Column("price_list_name", sa.String(200), nullable=True),
        sa.Column("price_type",      sa.String(20),  nullable=False),
        sa.Column("old_price",       sa.Numeric(14,4), nullable=True),
        sa.Column("new_price",       sa.Numeric(14,4), nullable=False),
        sa.Column("changed_by",      PG_UUID(as_uuid=True), nullable=True),
        sa.Column("changed_by_name", sa.String(200), nullable=True),
        sa.Column("change_reason",   sa.Text, nullable=True),
        sa.Column("effective_from",  sa.Date, nullable=True),
    )
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_price_history_tenant  ON price_history (tenant_id)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_price_history_product ON price_history (product_id)"))

    # ── 6. ALTER customers — add missing columns ─────────────────────
    for col_sql in [
        "ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_code     VARCHAR(30)  DEFAULT NULL",
        "ALTER TABLE customers ADD COLUMN IF NOT EXISTS status            VARCHAR(30)  DEFAULT 'APPROVED' NOT NULL",
        "ALTER TABLE customers ADD COLUMN IF NOT EXISTS payment_terms_days INTEGER     DEFAULT 30 NOT NULL",
        "ALTER TABLE customers ADD COLUMN IF NOT EXISTS credit_used        NUMERIC(14,2) DEFAULT 0 NOT NULL",
        "ALTER TABLE customers ADD COLUMN IF NOT EXISTS shipping_address   TEXT        DEFAULT NULL",
        "ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_group     VARCHAR(100) DEFAULT NULL",
        "ALTER TABLE customers ADD COLUMN IF NOT EXISTS approved_by        UUID        DEFAULT NULL",
        "ALTER TABLE customers ADD COLUMN IF NOT EXISTS approved_at        TIMESTAMPTZ DEFAULT NULL",
        "ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_test_data       BOOLEAN     DEFAULT false NOT NULL",
        "ALTER TABLE customers ADD COLUMN IF NOT EXISTS created_by         UUID        DEFAULT NULL",
        "ALTER TABLE customers ADD COLUMN IF NOT EXISTS updated_by         UUID        DEFAULT NULL",
    ]:
        conn.execute(sa.text(col_sql))

    # Existing customers default to APPROVED (they were created before approval workflow)
    conn.execute(sa.text(
        "UPDATE customers SET status = 'APPROVED' WHERE status IS NULL OR status = 'APPROVED'"
    ))

    # ── 7. ALTER inventory_products — add missing columns ─────────────
    for col_sql in [
        "ALTER TABLE inventory_products ADD COLUMN IF NOT EXISTS product_code         VARCHAR(30)   DEFAULT NULL",
        "ALTER TABLE inventory_products ADD COLUMN IF NOT EXISTS product_type         VARCHAR(30)   DEFAULT 'finished_good' NOT NULL",
        "ALTER TABLE inventory_products ADD COLUMN IF NOT EXISTS product_group        VARCHAR(100)  DEFAULT NULL",
        "ALTER TABLE inventory_products ADD COLUMN IF NOT EXISTS hsn_id               UUID          DEFAULT NULL",
        "ALTER TABLE inventory_products ADD COLUMN IF NOT EXISTS hsn_code             VARCHAR(10)   DEFAULT NULL",
        "ALTER TABLE inventory_products ADD COLUMN IF NOT EXISTS gst_rate             NUMERIC(5,2)  DEFAULT 18 NOT NULL",
        "ALTER TABLE inventory_products ADD COLUMN IF NOT EXISTS purchase_price       NUMERIC(14,4) DEFAULT 0 NOT NULL",
        "ALTER TABLE inventory_products ADD COLUMN IF NOT EXISTS preferred_vendor_id  UUID          DEFAULT NULL",
        "ALTER TABLE inventory_products ADD COLUMN IF NOT EXISTS is_test_data         BOOLEAN       DEFAULT false NOT NULL",
        "ALTER TABLE inventory_products ADD COLUMN IF NOT EXISTS created_by           UUID          DEFAULT NULL",
        "ALTER TABLE inventory_products ADD COLUMN IF NOT EXISTS updated_by           UUID          DEFAULT NULL",
    ]:
        conn.execute(sa.text(col_sql))

    # ── 8. Number series for new document types ───────────────────────
    # Add vendor, customer, item to number_series if tenant has master setup
    conn.execute(sa.text("""
        INSERT INTO number_series (
            id, tenant_id, document_type, prefix, include_year, year_format,
            separator, padding_digits, current_number, suffix, is_active, is_test_data,
            created_at, updated_at
        )
        SELECT
            gen_random_uuid(), t.id, dt.doc_type, dt.prefix, true, 'YY-YY',
            '-', 4, 0, '', true, false, now(), now()
        FROM tenants t
        CROSS JOIN (VALUES
            ('vendor',   'VEN'),
            ('customer', 'CUST'),
            ('item',     'ITM')
        ) AS dt(doc_type, prefix)
        WHERE NOT EXISTS (
            SELECT 1 FROM number_series ns
            WHERE ns.tenant_id = t.id AND ns.document_type = dt.doc_type
        )
    """))

    # ── 9. Approval rules for new document types ──────────────────────
    conn.execute(sa.text("""
        INSERT INTO approval_rules (
            id, tenant_id, document_type, is_approval_required,
            approver_role, escalation_hours, notify_on_submit,
            notify_on_approve, notify_on_reject, is_active, is_test_data,
            created_at, updated_at
        )
        SELECT
            gen_random_uuid(), t.id, dt.doc_type, true,
            'admin', 24, true, true, true, true, false, now(), now()
        FROM tenants t
        CROSS JOIN (VALUES ('vendor'), ('customer')) AS dt(doc_type)
        WHERE NOT EXISTS (
            SELECT 1 FROM approval_rules ar
            WHERE ar.tenant_id = t.id AND ar.document_type = dt.doc_type
        )
    """))


def downgrade() -> None:
    conn = op.get_bind()
    # Drop new tables in FK-safe order
    conn.execute(sa.text("DROP TABLE IF EXISTS price_history CASCADE"))
    conn.execute(sa.text("DROP TABLE IF EXISTS price_list_items CASCADE"))
    conn.execute(sa.text("DROP TABLE IF EXISTS price_lists CASCADE"))
    conn.execute(sa.text("DROP TABLE IF EXISTS hsn_codes CASCADE"))
    conn.execute(sa.text("DROP TABLE IF EXISTS vendors CASCADE"))
    # Note: We do NOT drop the added columns from customers/inventory_products
    # in downgrade — that would risk data loss.
