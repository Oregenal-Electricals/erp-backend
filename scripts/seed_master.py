"""
Oregenal ERP — Master Setup Seed Script
=========================================
Creates:
  - Company profile for Oregenal Electrical India Pvt Ltd
  - 3 branches (Taloja Factory, Pune Warehouse, Mumbai Sales Office)
  - 3 financial years (FY 2023-24 closed, FY 2024-25 active, FY 2025-26)
  - Number series for all 10 document types
  - Approval rules (default: no approval required, admin approves)
  - Change request settings (default: no change request allowed)

All rows are marked is_test_data=false (live seed data).

Run AFTER seed_rbac.py:
  cd erp-backend
  source venv/bin/activate
  python scripts/seed_master.py
"""
import asyncio, os, sys
from datetime import date
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ── Load .env ──────────────────────────────────────────────────────────
def _load_env():
    env_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"
    )
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, _, v = line.partition("=")
                    os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

_load_env()

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

DATABASE_URL = os.environ["DATABASE_URL"]


DOCUMENT_TYPES = [
    "purchase_order", "sales_order", "gate_entry", "delivery_challan",
    "qc_inspection", "work_order", "invoice", "payment",
    "journal_entry", "goods_receipt_note",
]

PREFIX_MAP = {
    "purchase_order":    "PO",
    "sales_order":       "SO",
    "gate_entry":        "GE",
    "delivery_challan":  "DC",
    "qc_inspection":     "QC",
    "work_order":        "WO",
    "invoice":           "INV",
    "payment":           "PAY",
    "journal_entry":     "JE",
    "goods_receipt_note":"GRN",
}

DOCUMENT_LABELS = {
    "purchase_order":    "Purchase Order",
    "sales_order":       "Sales Order",
    "gate_entry":        "Gate Entry",
    "delivery_challan":  "Delivery Challan",
    "qc_inspection":     "QC Inspection",
    "work_order":        "Work Order",
    "invoice":           "Invoice",
    "payment":           "Payment",
    "journal_entry":     "Journal Entry",
    "goods_receipt_note":"Goods Receipt Note (GRN)",
}


async def seed():
    engine = create_async_engine(DATABASE_URL, echo=False)
    factory = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with engine.begin() as conn:

        # ── Get tenant and super admin ─────────────────────────────────
        tenant = (await conn.execute(text(
            "SELECT id FROM tenants WHERE slug = 'oregenal' LIMIT 1"
        ))).fetchone()

        if not tenant:
            print("❌ Tenant 'oregenal' not found. Run seed_rbac.py first.")
            return

        tid = str(tenant[0])

        admin = (await conn.execute(text(
            f"SELECT id FROM users WHERE tenant_id = '{tid}' "
            f"AND role = 'super_admin' LIMIT 1"
        ))).fetchone()

        uid = str(admin[0]) if admin else "'00000000-0000-0000-0000-000000000000'"

        print(f"  Tenant:     {tid}")
        print(f"  Super Admin: {uid}")

        # ── Company ────────────────────────────────────────────────────
        existing_co = (await conn.execute(text(
            f"SELECT id FROM companies WHERE tenant_id = '{tid}' LIMIT 1"
        ))).fetchone()

        if not existing_co:
            await conn.execute(text(f"""
                INSERT INTO companies (
                    tenant_id, created_by, updated_by,
                    name, legal_name, gstin, pan,
                    address_line1, address_line2, city, state, pincode, country,
                    phone, email, website,
                    currency, timezone, date_format, fiscal_year_start_month,
                    is_active, is_test_data
                ) VALUES (
                    '{tid}', '{uid}', '{uid}',
                    'Oregenal Electrical India Private Limited',
                    'Oregenal Electrical India Private Limited',
                    '27AABCO1234F1ZQ', 'AABCO1234F',
                    'Plot No. 42, Phase II, MIDC',
                    'Taloja Industrial Area',
                    'Navi Mumbai', 'Maharashtra', '410208', 'India',
                    '+91-22-27415678', 'info@oregenal.com', 'https://www.oregenal.com',
                    'INR', 'Asia/Kolkata', 'DD/MM/YYYY', 4,
                    true, false
                ) ON CONFLICT DO NOTHING
            """))
            print("  ✅ Company created")
        else:
            print("  ✅ Company already exists — skipped")

        # Get company id
        co_id = (await conn.execute(text(
            f"SELECT id FROM companies WHERE tenant_id = '{tid}' LIMIT 1"
        ))).fetchone()[0]

        # ── Branches ───────────────────────────────────────────────────
        existing_br = (await conn.execute(text(
            f"SELECT COUNT(*) FROM branches WHERE tenant_id = '{tid}'"
        ))).scalar()

        if existing_br == 0:
            branches = [
                ("Taloja Factory",      "TF",  "factory",   True,
                 "Plot 42, MIDC Taloja", "",   "Navi Mumbai",  "Maharashtra", "410208", "27AABCO1234F1ZQ"),
                ("Pune Warehouse",      "PW",  "warehouse",  False,
                 "Gat No 15, Chakan",   "",   "Pune",         "Maharashtra", "410501", ""),
                ("Mumbai Sales Office", "MSO", "office",    False,
                 "Unit 5, BKC",         "",   "Mumbai",       "Maharashtra", "400051", ""),
            ]
            for name, code, btype, is_ho, addr1, addr2, city, state, pin, gstin in branches:
                await conn.execute(text(f"""
                    INSERT INTO branches (
                        tenant_id, company_id, created_by, updated_by,
                        name, code, branch_type, is_head_office,
                        address_line1, city, state, pincode, gstin,
                        is_active, is_test_data
                    ) VALUES (
                        '{tid}', '{co_id}', '{uid}', '{uid}',
                        '{name}', '{code}', '{btype}', {str(is_ho).lower()},
                        '{addr1}', '{city}', '{state}', '{pin}', '{gstin}',
                        true, false
                    ) ON CONFLICT DO NOTHING
                """))
            print("  ✅ 3 branches created")
        else:
            print(f"  ✅ Branches already exist ({existing_br}) — skipped")

        # ── Financial Years ────────────────────────────────────────────
        existing_fy = (await conn.execute(text(
            f"SELECT COUNT(*) FROM financial_years WHERE tenant_id = '{tid}'"
        ))).scalar()

        if existing_fy == 0:
            fy_rows = [
                ("FY 2023-24", "2023-04-01", "2024-03-31", False, True),
                ("FY 2024-25", "2024-04-01", "2025-03-31", True,  False),
                ("FY 2025-26", "2025-04-01", "2026-03-31", False, False),
            ]
            for name, start, end, is_active, is_closed in fy_rows:
                await conn.execute(text(f"""
                    INSERT INTO financial_years (
                        tenant_id, created_by, updated_by,
                        name, start_date, end_date,
                        is_active, is_closed, is_test_data
                    ) VALUES (
                        '{tid}', '{uid}', '{uid}',
                        '{name}', '{start}', '{end}',
                        {str(is_active).lower()}, {str(is_closed).lower()}, false
                    ) ON CONFLICT (tenant_id, name) DO NOTHING
                """))
            print("  ✅ 3 financial years created (FY 2024-25 active)")
        else:
            print(f"  ✅ Financial years already exist ({existing_fy}) — skipped")

        # ── Number Series ──────────────────────────────────────────────
        existing_ns = (await conn.execute(text(
            f"SELECT COUNT(*) FROM number_series WHERE tenant_id = '{tid}'"
        ))).scalar()

        if existing_ns == 0:
            for doc_type, prefix in PREFIX_MAP.items():
                await conn.execute(text(f"""
                    INSERT INTO number_series (
                        tenant_id, created_by, updated_by,
                        document_type, prefix,
                        include_year, year_format, separator,
                        padding_digits, current_number, suffix,
                        is_active, is_test_data
                    ) VALUES (
                        '{tid}', '{uid}', '{uid}',
                        '{doc_type}', '{prefix}',
                        true, 'YY-YY', '-',
                        4, 0, '',
                        true, false
                    ) ON CONFLICT DO NOTHING
                """))
            print(f"  ✅ Number series for {len(PREFIX_MAP)} document types")
        else:
            print(f"  ✅ Number series already exist ({existing_ns}) — skipped")

        # ── Approval Rules ─────────────────────────────────────────────
        existing_ar = (await conn.execute(text(
            f"SELECT COUNT(*) FROM approval_rules WHERE tenant_id = '{tid}'"
        ))).scalar()

        if existing_ar == 0:
            for doc_type in DOCUMENT_TYPES:
                await conn.execute(text(f"""
                    INSERT INTO approval_rules (
                        tenant_id, created_by, updated_by,
                        document_type, is_approval_required,
                        approver_role, escalation_hours,
                        notify_on_submit, notify_on_approve, notify_on_reject,
                        is_active, is_test_data
                    ) VALUES (
                        '{tid}', '{uid}', '{uid}',
                        '{doc_type}', false,
                        'admin', 24,
                        true, true, true,
                        true, false
                    ) ON CONFLICT DO NOTHING
                """))
            print(f"  ✅ Approval rules for {len(DOCUMENT_TYPES)} document types")
        else:
            print(f"  ✅ Approval rules already exist ({existing_ar}) — skipped")

        # ── Change Request Settings ────────────────────────────────────
        existing_cr = (await conn.execute(text(
            f"SELECT COUNT(*) FROM change_request_settings WHERE tenant_id = '{tid}'"
        ))).scalar()

        if existing_cr == 0:
            for doc_type in DOCUMENT_TYPES:
                await conn.execute(text(f"""
                    INSERT INTO change_request_settings (
                        tenant_id, created_by, updated_by,
                        document_type, allow_change_request,
                        who_can_raise, who_can_approve, requires_reason,
                        is_active, is_test_data
                    ) VALUES (
                        '{tid}', '{uid}', '{uid}',
                        '{doc_type}', false,
                        'admin', 'super_admin', true,
                        true, false
                    ) ON CONFLICT DO NOTHING
                """))
            print(f"  ✅ Change request settings for {len(DOCUMENT_TYPES)} document types")
        else:
            print(f"  ✅ Change request settings already exist ({existing_cr}) — skipped")

    print()
    print("="*55)
    print("✅  Master seed complete — Oregenal Electrical India")
    print("="*55)
    print()
    print("  Verify at: http://localhost:8000/api/docs")
    print("  GET /api/v1/master/company")
    print("  GET /api/v1/master/branches")
    print("  GET /api/v1/master/financial-years")
    print("  GET /api/v1/master/number-series")


if __name__ == "__main__":
    asyncio.run(seed())
