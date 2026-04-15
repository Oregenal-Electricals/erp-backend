"""Phase 9: dispatch, maintenance, payroll, costing tables

Revision ID: 008_phase9_plant_ops
Revises: 007_phase8
"""
from alembic import op
import sqlalchemy as sa

revision      = "008_phase9_plant_ops"
down_revision = "007_phase8"
branch_labels = None
depends_on    = None


def upgrade():
    conn = op.get_bind()

    # ── delivery_challans ─────────────────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS delivery_challans (
            id               UUID        NOT NULL DEFAULT gen_random_uuid(),
            created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            tenant_id        UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            challan_number   VARCHAR(50) NOT NULL,
            order_id         UUID,
            order_number     VARCHAR(50),
            customer_name    VARCHAR(300) NOT NULL,
            customer_address TEXT,
            customer_gstin   VARCHAR(20),
            status           VARCHAR(30) NOT NULL DEFAULT 'draft',
            dispatch_date    VARCHAR(20),
            delivery_date    VARCHAR(20),
            expected_delivery VARCHAR(20),
            transport_mode   VARCHAR(30) NOT NULL DEFAULT 'road',
            transporter      VARCHAR(200),
            vehicle_number   VARCHAR(30),
            lr_number        VARCHAR(100),
            eway_bill        VARCHAR(50),
            courier_tracking VARCHAR(100),
            items            JSON NOT NULL DEFAULT '[]',
            total_quantity   INTEGER NOT NULL DEFAULT 0,
            total_weight_kg  NUMERIC(10,2),
            no_of_boxes      INTEGER NOT NULL DEFAULT 1,
            notes            TEXT,
            prepared_by      VARCHAR(200),
            deleted_at       TIMESTAMPTZ,
            PRIMARY KEY (id)
        )
    """))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_delivery_challans_tenant ON delivery_challans (tenant_id)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_delivery_challans_status ON delivery_challans (status)"))

    # ── machines ──────────────────────────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS machines (
            id               UUID        NOT NULL DEFAULT gen_random_uuid(),
            created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            tenant_id        UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            machine_code     VARCHAR(50) NOT NULL,
            name             VARCHAR(300) NOT NULL,
            category         VARCHAR(100),
            manufacturer     VARCHAR(200),
            model_number     VARCHAR(100),
            serial_number    VARCHAR(100),
            location         VARCHAR(200),
            purchase_date    VARCHAR(20),
            warranty_until   VARCHAR(20),
            status           VARCHAR(30) NOT NULL DEFAULT 'active',
            last_service_date VARCHAR(20),
            next_service_date VARCHAR(20),
            notes            TEXT,
            deleted_at       TIMESTAMPTZ,
            PRIMARY KEY (id)
        )
    """))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_machines_tenant ON machines (tenant_id)"))

    # ── pm_schedules ──────────────────────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS pm_schedules (
            id               UUID        NOT NULL DEFAULT gen_random_uuid(),
            created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            tenant_id        UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            machine_id       UUID        NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
            machine_name     VARCHAR(300) NOT NULL,
            task_name        VARCHAR(300) NOT NULL,
            frequency        VARCHAR(30) NOT NULL,
            last_done        VARCHAR(20),
            next_due         VARCHAR(20),
            assigned_to      VARCHAR(200),
            estimated_hrs    NUMERIC(5,1) NOT NULL DEFAULT 1,
            instructions     TEXT,
            status           VARCHAR(20) NOT NULL DEFAULT 'active',
            deleted_at       TIMESTAMPTZ,
            PRIMARY KEY (id)
        )
    """))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_pm_schedules_machine ON pm_schedules (machine_id)"))

    # ── breakdown_logs ────────────────────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS breakdown_logs (
            id               UUID        NOT NULL DEFAULT gen_random_uuid(),
            created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            tenant_id        UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            machine_id       UUID        NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
            machine_name     VARCHAR(300) NOT NULL,
            breakdown_date   VARCHAR(20) NOT NULL,
            breakdown_time   VARCHAR(10),
            reported_by      VARCHAR(200),
            description      TEXT NOT NULL,
            cause            TEXT,
            action_taken     TEXT,
            status           VARCHAR(20) NOT NULL DEFAULT 'open',
            resolved_by      VARCHAR(200),
            resolved_date    VARCHAR(20),
            downtime_hrs     NUMERIC(6,2),
            repair_cost      NUMERIC(12,2),
            spare_parts      JSON NOT NULL DEFAULT '[]',
            PRIMARY KEY (id)
        )
    """))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_breakdown_logs_machine ON breakdown_logs (machine_id)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_breakdown_logs_status  ON breakdown_logs (status)"))

    # ── salary_structures ─────────────────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS salary_structures (
            id                  UUID          NOT NULL DEFAULT gen_random_uuid(),
            created_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
            updated_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
            tenant_id           UUID          NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            employee_id         UUID          NOT NULL,
            employee_name       VARCHAR(300)  NOT NULL,
            effective_from      VARCHAR(20)   NOT NULL,
            basic               NUMERIC(12,2) NOT NULL DEFAULT 0,
            hra                 NUMERIC(12,2) NOT NULL DEFAULT 0,
            special_allowance   NUMERIC(12,2) NOT NULL DEFAULT 0,
            conveyance          NUMERIC(12,2) NOT NULL DEFAULT 0,
            pf_employee         NUMERIC(12,2) NOT NULL DEFAULT 0,
            pf_employer         NUMERIC(12,2) NOT NULL DEFAULT 0,
            esi_employee        NUMERIC(12,2) NOT NULL DEFAULT 0,
            esi_employer        NUMERIC(12,2) NOT NULL DEFAULT 0,
            pt                  NUMERIC(12,2) NOT NULL DEFAULT 200,
            gross_salary        NUMERIC(12,2) NOT NULL DEFAULT 0,
            net_salary          NUMERIC(12,2) NOT NULL DEFAULT 0,
            is_active           BOOLEAN       NOT NULL DEFAULT true,
            PRIMARY KEY (id)
        )
    """))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_salary_structures_emp ON salary_structures (employee_id)"))

    # ── payroll_runs ──────────────────────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS payroll_runs (
            id               UUID          NOT NULL DEFAULT gen_random_uuid(),
            created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
            updated_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
            tenant_id        UUID          NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            month            INTEGER       NOT NULL,
            year             INTEGER       NOT NULL,
            status           VARCHAR(20)   NOT NULL DEFAULT 'draft',
            total_employees  INTEGER       NOT NULL DEFAULT 0,
            total_gross      NUMERIC(14,2) NOT NULL DEFAULT 0,
            total_net        NUMERIC(14,2) NOT NULL DEFAULT 0,
            total_pf         NUMERIC(14,2) NOT NULL DEFAULT 0,
            total_esi        NUMERIC(14,2) NOT NULL DEFAULT 0,
            approved_by      VARCHAR(200),
            disbursed_date   VARCHAR(20),
            notes            TEXT,
            PRIMARY KEY (id)
        )
    """))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_payroll_runs_tenant ON payroll_runs (tenant_id)"))

    # ── payslips ──────────────────────────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS payslips (
            id               UUID          NOT NULL DEFAULT gen_random_uuid(),
            created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
            updated_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
            tenant_id        UUID          NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            run_id           UUID          NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
            employee_id      UUID          NOT NULL,
            employee_name    VARCHAR(300)  NOT NULL,
            month            INTEGER       NOT NULL,
            year             INTEGER       NOT NULL,
            working_days     INTEGER       NOT NULL DEFAULT 26,
            present_days     INTEGER       NOT NULL DEFAULT 26,
            lop_days         INTEGER       NOT NULL DEFAULT 0,
            basic            NUMERIC(12,2) NOT NULL DEFAULT 0,
            hra              NUMERIC(12,2) NOT NULL DEFAULT 0,
            special_allowance NUMERIC(12,2) NOT NULL DEFAULT 0,
            conveyance       NUMERIC(12,2) NOT NULL DEFAULT 0,
            overtime         NUMERIC(12,2) NOT NULL DEFAULT 0,
            bonus            NUMERIC(12,2) NOT NULL DEFAULT 0,
            gross_earned     NUMERIC(12,2) NOT NULL DEFAULT 0,
            pf_deduction     NUMERIC(12,2) NOT NULL DEFAULT 0,
            esi_deduction    NUMERIC(12,2) NOT NULL DEFAULT 0,
            pt_deduction     NUMERIC(12,2) NOT NULL DEFAULT 0,
            tds              NUMERIC(12,2) NOT NULL DEFAULT 0,
            other_deduction  NUMERIC(12,2) NOT NULL DEFAULT 0,
            total_deductions NUMERIC(12,2) NOT NULL DEFAULT 0,
            net_pay          NUMERIC(12,2) NOT NULL DEFAULT 0,
            bank_account     VARCHAR(50),
            status           VARCHAR(20)   NOT NULL DEFAULT 'pending',
            PRIMARY KEY (id)
        )
    """))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_payslips_run    ON payslips (run_id)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_payslips_emp    ON payslips (employee_id)"))

    # ── job_labour ────────────────────────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS job_labour (
            id               UUID          NOT NULL DEFAULT gen_random_uuid(),
            created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
            updated_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
            tenant_id        UUID          NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            work_order_id    UUID          NOT NULL,
            employee_name    VARCHAR(200)  NOT NULL,
            date             VARCHAR(20)   NOT NULL,
            hours            NUMERIC(6,2)  NOT NULL,
            rate_per_hr      NUMERIC(10,2) NOT NULL,
            amount           NUMERIC(12,2) NOT NULL,
            notes            TEXT,
            PRIMARY KEY (id)
        )
    """))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_job_labour_wo ON job_labour (work_order_id)"))

    # ── job_overhead ──────────────────────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS job_overhead (
            id               UUID          NOT NULL DEFAULT gen_random_uuid(),
            created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
            updated_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
            tenant_id        UUID          NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            work_order_id    UUID          NOT NULL,
            category         VARCHAR(100)  NOT NULL,
            description      VARCHAR(300),
            amount           NUMERIC(12,2) NOT NULL,
            date             VARCHAR(20)   NOT NULL,
            PRIMARY KEY (id)
        )
    """))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_job_overhead_wo ON job_overhead (work_order_id)"))


def downgrade():
    conn = op.get_bind()
    for t in ["job_overhead","job_labour","payslips","payroll_runs","salary_structures",
              "breakdown_logs","pm_schedules","machines","delivery_challans"]:
        conn.execute(sa.text(f"DROP TABLE IF EXISTS {t} CASCADE"))
