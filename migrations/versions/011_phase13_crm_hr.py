"""Phase 13: CRM activities, tasks; HR attendance, performance notes

Revision ID: 011_phase13_crm_hr
Revises: 010_phase12_finance
"""
from alembic import op
import sqlalchemy as sa

revision      = "011_phase13_crm_hr"
down_revision = "010_phase12_finance"
branch_labels = None
depends_on    = None


def upgrade():
    conn = op.get_bind()

    # ── HR Employees (create if not exists) ───────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS hr_employees (
            id            UUID        NOT NULL DEFAULT gen_random_uuid(),
            created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
            tenant_id     UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            name          VARCHAR(300) NOT NULL,
            email         VARCHAR(254),
            phone         VARCHAR(30),
            department    VARCHAR(100),
            designation   VARCHAR(200),
            role          VARCHAR(100),
            join_date     VARCHAR(20),
            status        VARCHAR(20) NOT NULL DEFAULT 'active',
            notes         TEXT,
            custom_data   JSON DEFAULT '{}',
            deleted_at    TIMESTAMPTZ,
            PRIMARY KEY (id)
        )
    """))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_hr_employees_tenant ON hr_employees (tenant_id)"))

    # ── Add extra HR employee columns if missing ──────────────────────
    for col in [
        "ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS employee_code VARCHAR(30)",
        "ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS date_of_birth VARCHAR(20)",
        "ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS gender VARCHAR(20)",
        "ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS address TEXT",
        "ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(200)",
        "ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS blood_group VARCHAR(10)",
        "ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS pan_number VARCHAR(20)",
        "ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS aadhaar VARCHAR(20)",
        "ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS bank_account VARCHAR(30)",
        "ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS bank_ifsc VARCHAR(15)",
        "ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100)",
        "ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS basic_salary NUMERIC(12,2) DEFAULT 0",
        "ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS reports_to UUID",
        "ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS joining_date VARCHAR(20)",
    ]:
        conn.execute(sa.text(col))

    # ── Leave Requests (create if not exists) ─────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS leave_requests (
            id               UUID        NOT NULL DEFAULT gen_random_uuid(),
            created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            tenant_id        UUID        NOT NULL REFERENCES tenants(id)      ON DELETE CASCADE,
            employee_id      UUID        NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
            employee_name    VARCHAR(300) NOT NULL,
            leave_type       VARCHAR(50)  NOT NULL,
            from_date        VARCHAR(20)  NOT NULL,
            to_date          VARCHAR(20)  NOT NULL,
            days             INTEGER NOT NULL DEFAULT 1,
            reason           TEXT,
            status           VARCHAR(20) NOT NULL DEFAULT 'pending',
            approved_by      VARCHAR(200),
            approved_at      TIMESTAMPTZ,
            rejection_reason TEXT,
            PRIMARY KEY (id)
        )
    """))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_leave_requests_tenant   ON leave_requests (tenant_id)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_leave_requests_employee ON leave_requests (employee_id)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_leave_requests_status   ON leave_requests (status)"))

    # ── CRM Activities ────────────────────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS crm_activities (
            id            UUID        NOT NULL DEFAULT gen_random_uuid(),
            created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
            tenant_id     UUID        NOT NULL REFERENCES tenants(id)   ON DELETE CASCADE,
            lead_id       UUID        NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
            type          VARCHAR(30)  NOT NULL,
            subject       VARCHAR(300) NOT NULL,
            description   TEXT,
            outcome       VARCHAR(100),
            activity_date VARCHAR(20),
            duration_min  INTEGER,
            created_by    VARCHAR(200),
            next_action   VARCHAR(300),
            next_date     VARCHAR(20),
            PRIMARY KEY (id)
        )
    """))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_crm_activities_lead ON crm_activities (lead_id)"))

    # ── CRM Tasks ─────────────────────────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS crm_tasks (
            id          UUID        NOT NULL DEFAULT gen_random_uuid(),
            created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
            tenant_id   UUID        NOT NULL REFERENCES tenants(id)   ON DELETE CASCADE,
            lead_id     UUID        NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
            title       VARCHAR(300) NOT NULL,
            due_date    VARCHAR(20),
            priority    VARCHAR(20) NOT NULL DEFAULT 'normal',
            status      VARCHAR(20) NOT NULL DEFAULT 'open',
            assigned_to VARCHAR(200),
            notes       TEXT,
            PRIMARY KEY (id)
        )
    """))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_crm_tasks_lead ON crm_tasks (lead_id)"))

    # ── Enrich crm_leads ──────────────────────────────────────────────
    for col in [
        "ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS designation VARCHAR(200)",
        "ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS website VARCHAR(300)",
        "ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS source VARCHAR(50)",
        "ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS probability INTEGER DEFAULT 20",
        "ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS expected_close VARCHAR(20)",
        "ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(200)",
        "ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS lost_reason VARCHAR(300)",
        "ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS converted_so_id UUID",
        "ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS custom_data JSON DEFAULT '{}'",
    ]:
        conn.execute(sa.text(col))

    # ── HR Attendance ─────────────────────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS attendance_records (
            id            UUID        NOT NULL DEFAULT gen_random_uuid(),
            created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
            tenant_id     UUID        NOT NULL REFERENCES tenants(id)         ON DELETE CASCADE,
            employee_id   UUID        NOT NULL REFERENCES hr_employees(id)    ON DELETE CASCADE,
            employee_name VARCHAR(300) NOT NULL,
            date          VARCHAR(20) NOT NULL,
            check_in      VARCHAR(10),
            check_out     VARCHAR(10),
            status        VARCHAR(20) NOT NULL DEFAULT 'present',
            hours_worked  NUMERIC(4,2),
            notes         TEXT,
            PRIMARY KEY (id)
        )
    """))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_attendance_emp  ON attendance_records (employee_id)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_attendance_date ON attendance_records (date)"))

    # ── HR Performance Notes ──────────────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS performance_notes (
            id          UUID        NOT NULL DEFAULT gen_random_uuid(),
            created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
            tenant_id   UUID        NOT NULL REFERENCES tenants(id)      ON DELETE CASCADE,
            employee_id UUID        NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
            note_date   VARCHAR(20) NOT NULL,
            category    VARCHAR(50) NOT NULL,
            title       VARCHAR(300) NOT NULL,
            description TEXT,
            recorded_by VARCHAR(200),
            rating      INTEGER,
            PRIMARY KEY (id)
        )
    """))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_perf_notes_emp ON performance_notes (employee_id)"))

    # ── Payment Records ───────────────────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS payment_records (
            id             UUID        NOT NULL DEFAULT gen_random_uuid(),
            created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
            tenant_id      UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            sales_order_id VARCHAR(100),
            customer_name  VARCHAR(300),
            invoice_ref    VARCHAR(100),
            amount         NUMERIC(15,2) NOT NULL DEFAULT 0,
            method         VARCHAR(50)   NOT NULL DEFAULT 'bank_transfer',
            reference      VARCHAR(200),
            payment_date   VARCHAR(20),
            notes          TEXT,
            status         VARCHAR(20) NOT NULL DEFAULT 'confirmed',
            PRIMARY KEY (id)
        )
    """))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_payment_records_tenant ON payment_records (tenant_id)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_payment_records_so     ON payment_records (sales_order_id)"))

    # ── paid_amount on sales_orders ───────────────────────────────────
    conn.execute(sa.text("ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(15,2) DEFAULT 0"))


def downgrade():
    conn = op.get_bind()
    for t in ["performance_notes", "attendance_records", "crm_tasks", "crm_activities",
              "leave_requests", "payment_records"]:
        conn.execute(sa.text(f"DROP TABLE IF EXISTS {t}"))