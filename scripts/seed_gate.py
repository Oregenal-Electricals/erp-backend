"""
Oregenal ERP — Gate Module Seed Script
========================================
Creates realistic dummy data for the Gate Guard module:
  - 5 visitor entries (mix of inside/exited)
  - 5 vehicle logs (mix of inside/exited)
  - 5 gate entries (PENDING/APPROVED/REJECTED)
  - gate_entry_items for each
  - 4 gate passes (2 returnable, 2 non-returnable)

All rows marked is_test_data=True.

Run AFTER seed_rbac.py and seed_master.py:
  cd erp-backend
  source venv/bin/activate
  python scripts/seed_gate.py
"""
import asyncio, os, sys, uuid
from datetime import datetime, timezone, timedelta, date

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


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


async def seed():
    engine  = create_async_engine(DATABASE_URL, echo=False)
    factory = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with engine.begin() as conn:
        # ── Get tenant + users ─────────────────────────────────────────
        tenant = (await conn.execute(text(
            "SELECT id FROM tenants WHERE slug = 'oregenal' LIMIT 1"
        ))).fetchone()
        if not tenant:
            print("❌ Tenant not found. Run seed_rbac.py first.")
            return
        tid = str(tenant[0])

        gate_guard = (await conn.execute(text(
            f"SELECT id, name FROM users WHERE tenant_id = '{tid}' "
            f"AND role = 'gate_guard' LIMIT 1"
        ))).fetchone()
        store_mgr = (await conn.execute(text(
            f"SELECT id, name FROM users WHERE tenant_id = '{tid}' "
            f"AND role = 'store_manager' LIMIT 1"
        ))).fetchone()

        gg_id   = str(gate_guard[0])  if gate_guard  else "00000000-0000-0000-0000-000000000001"
        gg_name = gate_guard[1]        if gate_guard  else "Gate Guard"
        sm_id   = str(store_mgr[0])   if store_mgr   else "00000000-0000-0000-0000-000000000002"
        sm_name = store_mgr[1]         if store_mgr   else "Store Manager"

        now = datetime.now(timezone.utc)
        today = now.date()

        # ── visitor_entries ────────────────────────────────────────────
        existing_v = (await conn.execute(text(
            f"SELECT COUNT(*) FROM visitor_entries "
            f"WHERE tenant_id = '{tid}' AND is_test_data = true"
        ))).scalar()

        if existing_v == 0:
            visitors = [
                ("VIS-0001", "Rajesh Kumar Sharma",    "+91-9876543210", "Tata Steel Ltd",     "aadhar", "1234 5678 9012", "Purchase meeting",        "Vikram Nair",    "Purchase",  "inside",  now - timedelta(hours=2), None),
                ("VIS-0002", "Priya Agarwal",          "+91-9765432109", "L&T Construction",   "pan",    "ABCDE1234F",    "Site inspection",          "Rahul Gupta",    "Production","exited",  now - timedelta(hours=5), now - timedelta(hours=3)),
                ("VIS-0003", "Mohammed Irfan",         "+91-9654321098", "HDFC Bank",          "passport","P1234567",     "Account verification",     "Priya Singh",    "Finance",   "exited",  now - timedelta(days=1),  now - timedelta(days=1, hours=-4)),
                ("VIS-0004", "Sunita Mehta",           "+91-9543210987", "ABB India",          "aadhar", "9876 5432 1098","Technical discussion",    "Anand Kumar",    "Quality",   "inside",  now - timedelta(minutes=45), None),
                ("VIS-0005", "Arvind Pathak",          "+91-9432109876", "Individual",         "voter_id","DL-ABC-1234",  "Job application",          "HR Department",  "HR",        "exited",  now - timedelta(hours=6), now - timedelta(hours=5)),
            ]
            for v in visitors:
                vid = str(uuid.uuid4())
                # Tuple layout: [0]entry_num [1]name [2]phone [3]company
                #   [4]id_type [5]id_num [6]purpose [7]meeting_name [8]dept
                #   [9]status  [10]gate_in(datetime) [11]gate_out(datetime|None)
                gate_in_val  = v[10].isoformat() if v[10] else None
                gate_out_val = f"'{v[11].isoformat()}'" if v[11] else "NULL"
                if not gate_in_val:
                    continue   # skip rows without gate_in
                await conn.execute(text(f"""
                    INSERT INTO visitor_entries (
                        id, tenant_id, created_by, updated_by,
                        entry_number, visitor_name, visitor_phone,
                        visitor_company, id_proof_type, id_proof_number,
                        purpose, meeting_with_name, meeting_with_dept,
                        gate_in, gate_out, status,
                        created_by_name, is_test_data
                    ) VALUES (
                        '{vid}', '{tid}', '{gg_id}', '{gg_id}',
                        '{v[0]}', '{v[1]}', '{v[2]}',
                        '{v[3]}', '{v[4]}', '{v[5]}',
                        '{v[6]}', '{v[7]}', '{v[8]}',
                        '{gate_in_val}', {gate_out_val}, '{v[9]}',
                        '{gg_name}', true
                    ) ON CONFLICT DO NOTHING
                """))
            print("  ✅ 5 visitor entries created")
        else:
            print(f"  ✅ Visitor entries already exist ({existing_v}) — skipped")

        # ── vehicle_logs ───────────────────────────────────────────────
        existing_vl = (await conn.execute(text(
            f"SELECT COUNT(*) FROM vehicle_logs "
            f"WHERE tenant_id = '{tid}' AND is_test_data = true"
        ))).scalar()

        if existing_vl == 0:
            vehicles = [
                ("VEH-0001", "MH04AB1234", "truck",  "Ramu Yadav",    "+91-9111222333", "Tata Steel Yard",     "Factory Gate",    "delivery", "inside",  now - timedelta(hours=2),    None),
                ("VEH-0002", "GJ05CD5678", "tempo",  "Suresh Patil",  "+91-9222333444", "Pune Depot",          "Factory Gate",    "pickup",   "exited",  now - timedelta(hours=6),    now - timedelta(hours=4)),
                ("VEH-0003", "MH12EF9012", "car",    "Anand Joshi",   "+91-9333444555", "Head Office Mumbai",  "Factory",         "visit",    "exited",  now - timedelta(days=1),     now - timedelta(hours=22)),
                ("VEH-0004", "DL01GH3456", "truck",  "Vikram Singh",  "+91-9444555666", "Delhi Supplier",      "Factory Gate",    "delivery", "inside",  now - timedelta(minutes=30), None),
                ("VEH-0005", "MH14IJ7890", "tempo",  "Ganesh Kadam",  "+91-9555666777", "Scrap Yard",          "Factory",         "scrap",    "exited",  now - timedelta(days=2),     now - timedelta(days=1, hours=-6)),
            ]
            for v in vehicles:
                vid = str(uuid.uuid4())
                # Tuple: [0]log_num [1]veh_num [2]type [3]driver [4]phone
                #         [5]from [6]to [7]purpose [8]STATUS [9]gate_in [10]gate_out
                gate_in_val  = v[9].isoformat() if v[9] else None
                gate_out_val = f"'{v[10].isoformat()}'" if v[10] else "NULL"
                if not gate_in_val:
                    continue
                await conn.execute(text(f"""
                    INSERT INTO vehicle_logs (
                        id, tenant_id, created_by, updated_by,
                        log_number, vehicle_number, vehicle_type,
                        driver_name, driver_phone,
                        from_location, to_location, purpose,
                        gate_in, gate_out, status,
                        created_by_name, is_test_data
                    ) VALUES (
                        '{vid}', '{tid}', '{gg_id}', '{gg_id}',
                        '{v[0]}', '{v[1]}', '{v[2]}',
                        '{v[3]}', '{v[4]}',
                        '{v[5]}', '{v[6]}', '{v[7]}',
                        '{gate_in_val}', {gate_out_val}, '{v[8]}',
                        '{gg_name}', true
                    ) ON CONFLICT DO NOTHING
                """))
            print("  ✅ 5 vehicle logs created")
        else:
            print(f"  ✅ Vehicle logs already exist ({existing_vl}) — skipped")

        # ── gate_entries + items ───────────────────────────────────────
        existing_ge = (await conn.execute(text(
            f"SELECT COUNT(*) FROM gate_entries "
            f"WHERE tenant_id = '{tid}' AND is_test_data = true"
        ))).scalar()

        if existing_ge == 0:
            entries = [
                {
                    "num": "GE-0001", "vendor": "Tata Steel Ltd", "gstin": "27AAACT2727Q1ZW",
                    "vehicle": "MH04AB1234", "driver": "Ramu Yadav", "phone": "+91-9111222333",
                    "mode": "road", "inv_no": "TSL/24-25/4521", "inv_amt": 125000.00,
                    "po_no": "PO-2425-0001", "status": "PENDING",
                    "gate_in": now - timedelta(hours=2),
                    "items": [
                        {"name": "Cold Rolled Steel Sheet 2mm", "code": "CRSS-002", "qty": 500, "unit": "kg", "po_qty": 500},
                        {"name": "MS Angle 50x50x5mm",          "code": "MSA-005",  "qty": 200, "unit": "kg", "po_qty": 200},
                    ],
                },
                {
                    "num": "GE-0002", "vendor": "Havells India Ltd", "gstin": "27AAACH4702Q1Z5",
                    "vehicle": "GJ05CD5678", "driver": "Suresh Patil", "phone": "+91-9222333444",
                    "mode": "road", "inv_no": "HAV/INV/241023", "inv_amt": 48500.00,
                    "po_no": "PO-2425-0002", "status": "APPROVED",
                    "gate_in": now - timedelta(hours=6),
                    "approved_by": sm_id, "approved_at": now - timedelta(hours=5),
                    "items": [
                        {"name": "LED Driver 20W",    "code": "LED-DR-020", "qty": 500, "unit": "pcs", "po_qty": 500},
                        {"name": "Capacitor 470uF",   "code": "CAP-470",   "qty": 1000, "unit": "pcs", "po_qty": 1000},
                    ],
                },
                {
                    "num": "GE-0003", "vendor": "Ashoka Packing Co", "gstin": "27AAACA3827Q1ZX",
                    "vehicle": "MH12EF9012", "driver": "Babu Khan", "phone": "+91-9666777888",
                    "mode": "road", "inv_no": "APC/2024/889", "inv_amt": 15200.00,
                    "po_no": "PO-2425-0003", "status": "REJECTED",
                    "gate_in": now - timedelta(days=1),
                    "rejected_by": sm_id, "rejected_at": now - timedelta(hours=20),
                    "rejection_reason": "Wrong specification — ordered 200gsm, received 150gsm",
                    "items": [
                        {"name": "Corrugated Box 12x8x6 inch", "code": "BOX-001", "qty": 2000, "unit": "pcs", "po_qty": 2000},
                    ],
                },
                {
                    "num": "GE-0004", "vendor": "Schneider Electric", "gstin": "27AAACS5432Q1ZY",
                    "vehicle": "DL01GH3456", "driver": "Vikram Singh", "phone": "+91-9444555666",
                    "mode": "road", "inv_no": "SE/MH/24/7731", "inv_amt": 235000.00,
                    "po_no": "PO-2425-0004", "status": "HOLD",
                    "gate_in": now - timedelta(minutes=30),
                    "held_by": sm_id, "held_at": now - timedelta(minutes=15),
                    "hold_reason": "PO quantity mismatch — PO says 100, invoice says 120. Checking with purchase team.",
                    "items": [
                        {"name": "MCCB 100A 3P",  "code": "MCCB-100A", "qty": 120, "unit": "pcs", "po_qty": 100},
                        {"name": "MCB 16A Single", "code": "MCB-016",   "qty": 500, "unit": "pcs", "po_qty": 500},
                    ],
                },
                {
                    "num": "GE-0005", "vendor": "Finolex Cables Ltd", "gstin": "27AAACF8923Q1ZZ",
                    "vehicle": "MH14KL2345", "driver": "Prakash More", "phone": "+91-9777888999",
                    "mode": "road", "inv_no": "FCL/2024/10234", "inv_amt": 67800.00,
                    "po_no": "PO-2425-0005", "status": "PENDING",
                    "gate_in": now - timedelta(hours=1),
                    "items": [
                        {"name": "PVC Cable 1.5sqmm Red",   "code": "CAB-R015", "qty": 500, "unit": "mtr", "po_qty": 500},
                        {"name": "PVC Cable 1.5sqmm Black", "code": "CAB-B015", "qty": 500, "unit": "mtr", "po_qty": 500},
                        {"name": "PVC Cable 2.5sqmm Yellow","code": "CAB-Y025", "qty": 300, "unit": "mtr", "po_qty": 300},
                    ],
                },
            ]

            for e in entries:
                geid = str(uuid.uuid4())
                approved_by = f"'{e.get('approved_by')}'" if e.get("approved_by") else "NULL"
                approved_at = f"'{e.get('approved_at').isoformat()}'" if e.get("approved_at") else "NULL"
                rejected_by = f"'{e.get('rejected_by')}'" if e.get("rejected_by") else "NULL"
                rejected_at = f"'{e.get('rejected_at').isoformat()}'" if e.get("rejected_at") else "NULL"
                rejection_reason = e.get("rejection_reason", "").replace("'", "''") if e.get("rejection_reason") else ""
                held_by    = f"'{e.get('held_by')}'" if e.get("held_by") else "NULL"
                held_at    = f"'{e.get('held_at').isoformat()}'" if e.get("held_at") else "NULL"
                hold_reason = e.get("hold_reason", "").replace("'", "''") if e.get("hold_reason") else ""

                await conn.execute(text(f"""
                    INSERT INTO gate_entries (
                        id, tenant_id, created_by, updated_by,
                        entry_number, status,
                        vendor_name, vendor_gstin,
                        vehicle_number, driver_name, driver_phone, transport_mode,
                        vendor_invoice_no, vendor_invoice_amount,
                        po_number, gate_in,
                        approved_by_id, approved_at,
                        rejected_by_id, rejected_at, rejection_reason,
                        held_by_id, held_at, hold_reason,
                        created_by_name, is_test_data
                    ) VALUES (
                        '{geid}', '{tid}', '{gg_id}', '{gg_id}',
                        '{e["num"]}', '{e["status"]}',
                        '{e["vendor"]}', '{e["gstin"]}',
                        '{e["vehicle"]}', '{e["driver"]}', '{e["phone"]}', '{e["mode"]}',
                        '{e["inv_no"]}', {e["inv_amt"]},
                        '{e["po_no"]}', '{e["gate_in"].isoformat()}',
                        {approved_by}, {approved_at},
                        {rejected_by}, {rejected_at}, '{rejection_reason}',
                        {held_by}, {held_at}, '{hold_reason}',
                        '{gg_name}', true
                    ) ON CONFLICT DO NOTHING
                """))

                # Items
                for idx, item in enumerate(e["items"]):
                    await conn.execute(text(f"""
                        INSERT INTO gate_entry_items (
                            id, gate_entry_id, tenant_id,
                            item_name, item_code, qty_received, unit, po_qty,
                            sort_order, is_test_data
                        ) VALUES (
                            '{str(uuid.uuid4())}', '{geid}', '{tid}',
                            '{item["name"]}', '{item["code"]}',
                            {item["qty"]}, '{item["unit"]}', {item["po_qty"]},
                            {idx}, true
                        ) ON CONFLICT DO NOTHING
                    """))

            print("  ✅ 5 gate entries + items created")
        else:
            print(f"  ✅ Gate entries already exist ({existing_ge}) — skipped")

        # ── gate_passes ────────────────────────────────────────────────
        existing_gp = (await conn.execute(text(
            f"SELECT COUNT(*) FROM gate_passes "
            f"WHERE tenant_id = '{tid}' AND is_test_data = true"
        ))).scalar()

        if existing_gp == 0:
            tomorrow = (today + timedelta(days=7)).isoformat()
            yesterday = (today - timedelta(days=2)).isoformat()

            passes = [
                {
                    "num": "RGP-0001", "type": "returnable", "status": "OPEN",
                    "party": "Mehta Tool Works", "phone": "+91-9123456789",
                    "vehicle": "MH04MN3456", "driver": "Ramesh Tiwari", "dphone": "+91-9234567890",
                    "purpose": "CNC grinding tool sent for re-grinding",
                    "ref_type": "job_work", "ref_no": "JW-2425-001",
                    "exp_return": tomorrow,
                    "gate_out": now - timedelta(hours=3),
                    "items": [{"item_name":"CNC Grinding Tool 50mm","item_code":"TOOL-CNC-050","qty":5,"unit":"pcs","qty_returned":0}],
                },
                {
                    "num": "RGP-0002", "type": "returnable", "status": "PARTIAL",
                    "party": "Precision Engineers", "phone": "+91-9345678901",
                    "vehicle": "MH08OP7890", "driver": "Dinesh Pawar", "dphone": "+91-9456789012",
                    "purpose": "Moulds sent for repair",
                    "ref_type": "job_work", "ref_no": "JW-2425-002",
                    "exp_return": yesterday,
                    "gate_out": now - timedelta(days=3),
                    "items": [
                        {"item_name":"Injection Mould A","item_code":"MOLD-001","qty":3,"unit":"pcs","qty_returned":2},
                        {"item_name":"Injection Mould B","item_code":"MOLD-002","qty":2,"unit":"pcs","qty_returned":0},
                    ],
                },
                {
                    "num": "NRGP-0001", "type": "non_returnable", "status": "CLOSED",
                    "party": "Shree Scrap Dealers", "phone": "+91-9567890123",
                    "vehicle": "MH15QR1234", "driver": "Santosh Mane", "dphone": "+91-9678901234",
                    "purpose": "Scrap metal disposal — MS offcuts",
                    "ref_type": "scrap", "ref_no": "SCR-001",
                    "exp_return": None,
                    "gate_out": now - timedelta(days=5),
                    "items": [{"item_name":"MS Scrap Offcuts","item_code":"SCRAP-MS","qty":500,"unit":"kg","qty_returned":0}],
                },
                {
                    "num": "NRGP-0002", "type": "non_returnable", "status": "OPEN",
                    "party": "Quality Test Labs", "phone": "+91-9789012345",
                    "vehicle": "MH02ST5678", "driver": "Pravin Shinde", "dphone": "+91-9890123456",
                    "purpose": "Product samples for testing certification",
                    "ref_type": "sample", "ref_no": "SMPL-2025-001",
                    "exp_return": None,
                    "gate_out": now - timedelta(hours=1),
                    "items": [{"item_name":"LED Bulb 9W Sample","item_code":"LED-9W-SAMP","qty":10,"unit":"pcs","qty_returned":0}],
                },
            ]

            for p in passes:
                pid = str(uuid.uuid4())
                import json
                items_json = json.dumps(p["items"]).replace("'", "''")
                exp_return = f"'{p['exp_return']}'" if p["exp_return"] else "NULL"
                gate_out_ts = f"'{p['gate_out'].isoformat()}'" if p["gate_out"] else "NULL"

                await conn.execute(text(f"""
                    INSERT INTO gate_passes (
                        id, tenant_id, created_by, updated_by,
                        pass_number, pass_type, status,
                        party_name, party_phone,
                        vehicle_number, driver_name, driver_phone,
                        purpose, reference_type, reference_number,
                        expected_return_date, gate_out,
                        approved_by_id, approved_at,
                        items, created_by_name, is_test_data
                    ) VALUES (
                        '{pid}', '{tid}', '{sm_id}', '{sm_id}',
                        '{p["num"]}', '{p["type"]}', '{p["status"]}',
                        '{p["party"]}', '{p["phone"]}',
                        '{p["vehicle"]}', '{p["driver"]}', '{p["dphone"]}',
                        '{p["purpose"]}', '{p["ref_type"]}', '{p["ref_no"]}',
                        {exp_return}, {gate_out_ts},
                        '{sm_id}', '{now.isoformat()}',
                        '{items_json}'::jsonb, '{sm_name}', true
                    ) ON CONFLICT DO NOTHING
                """))

            print("  ✅ 4 gate passes created (2 returnable, 2 non-returnable)")
        else:
            print(f"  ✅ Gate passes already exist ({existing_gp}) — skipped")

    print()
    print("=" * 55)
    print("✅  Gate module seed complete — Oregenal Electrical India")
    print("=" * 55)
    print()
    print("  Verify at: http://localhost:8000/api/docs")
    print("  GET /api/v1/gate/visitors")
    print("  GET /api/v1/gate/entries")
    print("  GET /api/v1/gate/passes")
    print("  GET /api/v1/gate/reports/stats")


if __name__ == "__main__":
    asyncio.run(seed())