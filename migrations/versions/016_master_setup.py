"""016: Master Setup — Company, Branches, Financial Years,
Numbering Series, Approval Rules, Change Request Settings,
Universal Audit Log, is_test_data + created_by + updated_by columns.

Revision ID: 016_master_setup
Revises: 015_audit_log_updated_at
"""
from alembic import op
import sqlalchemy as sa

revision      = "016_master_setup"
down_revision = "015_audit_log_updated_at"
branch_labels = None
depends_on    = None


def upgrade():
    conn = op.get_bind()

    # ── 1. Add universal columns to Base tables ─────────────────────
    # These are ADD COLUMN IF NOT EXISTS — completely safe, non-breaking.

    for table in ["tenants", "roles", "users", "field_definitions"]:
        conn.execute(sa.text(f"""
            ALTER TABLE {table}
            ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN NOT NULL DEFAULT false
        """))

    for table in ["roles", "users"]:
        conn.execute(sa.text(f"""
            ALTER TABLE {table}
            ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        """))

    # ── 2. companies ────────────────────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS companies (
            id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            created_by      UUID        REFERENCES users(id) ON DELETE SET NULL,
            updated_by      UUID        REFERENCES users(id) ON DELETE SET NULL,
            is_active       BOOLEAN     NOT NULL DEFAULT true,
            is_test_data    BOOLEAN     NOT NULL DEFAULT false,

            tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

            -- Legal identity
            name            VARCHAR(200) NOT NULL,
            legal_name      VARCHAR(200),
            gstin           VARCHAR(20),
            pan             VARCHAR(20),
            cin             VARCHAR(25),
            tan             VARCHAR(15),

            -- Address
            address_line1   VARCHAR(300),
            address_line2   VARCHAR(300),
            city            VARCHAR(100),
            state           VARCHAR(100),
            pincode         VARCHAR(10),
            country         VARCHAR(100) NOT NULL DEFAULT 'India',

            -- Contact
            phone           VARCHAR(30),
            email           VARCHAR(254),
            website         VARCHAR(300),

            -- Branding
            logo_url        VARCHAR(500),
            stamp_url       VARCHAR(500),
            signature_url   VARCHAR(500),
            primary_color   VARCHAR(20) DEFAULT '#4F46E5',

            -- Locale
            currency        VARCHAR(10) NOT NULL DEFAULT 'INR',
            timezone        VARCHAR(60) NOT NULL DEFAULT 'Asia/Kolkata',
            date_format     VARCHAR(30) NOT NULL DEFAULT 'DD/MM/YYYY',
            fiscal_year_start_month INTEGER NOT NULL DEFAULT 4
        )
    """))

    conn.execute(sa.text(
        "CREATE INDEX IF NOT EXISTS ix_companies_tenant ON companies(tenant_id)"
    ))

    # ── 3. branches ─────────────────────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS branches (
            id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            created_by      UUID        REFERENCES users(id) ON DELETE SET NULL,
            updated_by      UUID        REFERENCES users(id) ON DELETE SET NULL,
            is_active       BOOLEAN     NOT NULL DEFAULT true,
            is_test_data    BOOLEAN     NOT NULL DEFAULT false,

            tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            company_id      UUID        REFERENCES companies(id) ON DELETE CASCADE,

            name            VARCHAR(200) NOT NULL,
            code            VARCHAR(20),
            branch_type     VARCHAR(30) NOT NULL DEFAULT 'factory',
            -- factory | warehouse | office | showroom

            address_line1   VARCHAR(300),
            address_line2   VARCHAR(300),
            city            VARCHAR(100),
            state           VARCHAR(100),
            pincode         VARCHAR(10),

            gstin           VARCHAR(20),
            phone           VARCHAR(30),
            email           VARCHAR(254),
            is_head_office  BOOLEAN NOT NULL DEFAULT false
        )
    """))

    conn.execute(sa.text(
        "CREATE INDEX IF NOT EXISTS ix_branches_tenant ON branches(tenant_id)"
    ))

    # ── 4. financial_years ─────────────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS financial_years (
            id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            created_by      UUID        REFERENCES users(id) ON DELETE SET NULL,
            updated_by      UUID        REFERENCES users(id) ON DELETE SET NULL,
            is_active       BOOLEAN     NOT NULL DEFAULT false,
            is_test_data    BOOLEAN     NOT NULL DEFAULT false,

            tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

            name            VARCHAR(30) NOT NULL,
            -- e.g. "FY 2024-25"
            start_date      DATE        NOT NULL,
            end_date        DATE        NOT NULL,

            is_closed       BOOLEAN     NOT NULL DEFAULT false,
            closed_by       UUID        REFERENCES users(id) ON DELETE SET NULL,
            closed_at       TIMESTAMPTZ
        )
    """))

    conn.execute(sa.text(
        "CREATE INDEX IF NOT EXISTS ix_financial_years_tenant ON financial_years(tenant_id)"
    ))
    conn.execute(sa.text("""
        CREATE UNIQUE INDEX IF NOT EXISTS uq_financial_year_name
        ON financial_years(tenant_id, name)
    """))

    # ── 5. number_series ───────────────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS number_series (
            id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            created_by      UUID        REFERENCES users(id) ON DELETE SET NULL,
            updated_by      UUID        REFERENCES users(id) ON DELETE SET NULL,
            is_active       BOOLEAN     NOT NULL DEFAULT true,
            is_test_data    BOOLEAN     NOT NULL DEFAULT false,

            tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

            document_type   VARCHAR(60) NOT NULL,
            -- purchase_order | sales_order | gate_entry | delivery_challan
            -- qc_inspection | work_order | invoice | payment | journal

            prefix          VARCHAR(20) NOT NULL DEFAULT '',
            include_year    BOOLEAN     NOT NULL DEFAULT true,
            year_format     VARCHAR(10) NOT NULL DEFAULT 'YY-YY',
            -- YY-YY → 24-25 | YYYY → 2024 | YY → 24

            separator       VARCHAR(5)  NOT NULL DEFAULT '-',
            padding_digits  INTEGER     NOT NULL DEFAULT 4,
            current_number  INTEGER     NOT NULL DEFAULT 0,
            suffix          VARCHAR(20) DEFAULT ''
        )
    """))

    conn.execute(sa.text("""
        CREATE UNIQUE INDEX IF NOT EXISTS uq_number_series_type
        ON number_series(tenant_id, document_type)
    """))

    # ── 6. approval_rules ──────────────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS approval_rules (
            id                      UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
            created_by              UUID        REFERENCES users(id) ON DELETE SET NULL,
            updated_by              UUID        REFERENCES users(id) ON DELETE SET NULL,
            is_active               BOOLEAN     NOT NULL DEFAULT true,
            is_test_data            BOOLEAN     NOT NULL DEFAULT false,

            tenant_id               UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

            document_type           VARCHAR(60) NOT NULL,
            is_approval_required    BOOLEAN     NOT NULL DEFAULT false,
            auto_approve_below_amt  NUMERIC(14,2),
            approver_role           VARCHAR(60),
            -- role slug: admin | store_manager | etc.
            escalation_hours        INTEGER     NOT NULL DEFAULT 24,
            notify_on_submit        BOOLEAN     NOT NULL DEFAULT true,
            notify_on_approve       BOOLEAN     NOT NULL DEFAULT true,
            notify_on_reject        BOOLEAN     NOT NULL DEFAULT true
        )
    """))

    conn.execute(sa.text("""
        CREATE UNIQUE INDEX IF NOT EXISTS uq_approval_rule_type
        ON approval_rules(tenant_id, document_type)
    """))

    # ── 7. change_request_settings ─────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS change_request_settings (
            id                  UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
            created_by          UUID        REFERENCES users(id) ON DELETE SET NULL,
            updated_by          UUID        REFERENCES users(id) ON DELETE SET NULL,
            is_active           BOOLEAN     NOT NULL DEFAULT true,
            is_test_data        BOOLEAN     NOT NULL DEFAULT false,

            tenant_id           UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

            document_type       VARCHAR(60) NOT NULL,
            allow_change_request BOOLEAN    NOT NULL DEFAULT false,
            who_can_raise       VARCHAR(60),
            -- role slug
            who_can_approve     VARCHAR(60),
            requires_reason     BOOLEAN     NOT NULL DEFAULT true
        )
    """))

    conn.execute(sa.text("""
        CREATE UNIQUE INDEX IF NOT EXISTS uq_change_request_type
        ON change_request_settings(tenant_id, document_type)
    """))

    # ── 8. audit_log ───────────────────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS audit_log (
            id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            is_test_data    BOOLEAN     NOT NULL DEFAULT false,

            tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            user_id         UUID        REFERENCES users(id) ON DELETE SET NULL,
            user_name       VARCHAR(200),
            user_role       VARCHAR(60),

            action          VARCHAR(30) NOT NULL,
            -- create | update | delete | approve | reject | login | logout
            module          VARCHAR(60) NOT NULL,
            document_type   VARCHAR(60),
            document_id     UUID,
            document_number VARCHAR(100),

            old_value       JSONB,
            new_value       JSONB,
            ip_address      VARCHAR(45),
            user_agent      VARCHAR(500),
            notes           TEXT
        )
    """))

    conn.execute(sa.text(
        "CREATE INDEX IF NOT EXISTS ix_audit_log_tenant    ON audit_log(tenant_id)"
    ))
    conn.execute(sa.text(
        "CREATE INDEX IF NOT EXISTS ix_audit_log_user      ON audit_log(user_id)"
    ))
    conn.execute(sa.text(
        "CREATE INDEX IF NOT EXISTS ix_audit_log_created   ON audit_log(created_at DESC)"
    ))
    conn.execute(sa.text(
        "CREATE INDEX IF NOT EXISTS ix_audit_log_doc       ON audit_log(document_id)"
    ))


def downgrade():
    conn = op.get_bind()
    for t in [
        "audit_log",
        "change_request_settings",
        "approval_rules",
        "number_series",
        "financial_years",
        "branches",
        "companies",
    ]:
        conn.execute(sa.text(f"DROP TABLE IF EXISTS {t} CASCADE"))

    for table in ["tenants", "roles", "users", "field_definitions"]:
        conn.execute(sa.text(
            f"ALTER TABLE {table} DROP COLUMN IF EXISTS is_test_data"
        ))
    for table in ["roles", "users"]:
        conn.execute(sa.text(
            f"ALTER TABLE {table} "
            f"DROP COLUMN IF EXISTS created_by, "
            f"DROP COLUMN IF EXISTS updated_by"
        ))
