"""
Oregenal ERP — Masters Module Seed Script
==========================================
Creates realistic dummy data for:
  - 5 vendors (LED/electrical suppliers)
  - 6 customers (B2B electrical distributors)
  - 10 items (mix of finished goods, raw materials, services)
  - 8 HSN codes (LED industry specific)
  - 2 price lists (Standard Sales + Standard Purchase)
  - Price history entries for items

All rows marked is_test_data=True.

Run AFTER seed_rbac.py and seed_master.py:
  cd erp-backend
  source venv/bin/activate
  python scripts/seed_masters.py
"""
import asyncio, os, sys, uuid
from datetime import date, datetime, timezone

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
        # ── Get tenant + admin user ────────────────────────────────────
        tenant = (await conn.execute(text(
            "SELECT id FROM tenants WHERE slug = 'oregenal' LIMIT 1"
        ))).fetchone()
        if not tenant:
            print("❌ Tenant not found. Run seed_rbac.py first.")
            return
        tid = str(tenant[0])

        admin = (await conn.execute(text(
            "SELECT id, name FROM users WHERE tenant_id = :tid AND role = 'admin' LIMIT 1"
        ), {"tid": tid})).fetchone()
        admin_id   = str(admin[0]) if admin else None
        admin_name = admin[1] if admin else "Admin"

        print(f"  Tenant:  {tid}")
        print(f"  Admin:   {admin_id} ({admin_name})")
        print()

        # ── Check existing test data ───────────────────────────────────
        existing = (await conn.execute(text(
            "SELECT COUNT(*) FROM vendors WHERE tenant_id = :tid AND is_test_data = true"
        ), {"tid": tid})).scalar_one()
        if existing > 0:
            print(f"  ✓ Test vendors already exist ({existing} rows) — skipping vendors")
            rows = (await conn.execute(text(
                "SELECT id FROM vendors WHERE tenant_id = :tid AND is_test_data = true LIMIT 5"
            ), {"tid": tid})).fetchall()
            vendor_ids = [str(r[0]) for r in rows]
        else:
            vendor_ids = await seed_vendors(conn, tid, admin_id)

        existing_cust = (await conn.execute(text(
            "SELECT COUNT(*) FROM customers WHERE tenant_id = :tid AND is_test_data = true"
        ), {"tid": tid})).scalar_one()
        if existing_cust > 0:
            print(f"  ✓ Test customers already exist ({existing_cust} rows) — skipping")
            customer_ids = []
        else:
            customer_ids = await seed_customers(conn, tid, admin_id)

        # Check what columns customers table actually has
        existing_items = (await conn.execute(text(
            "SELECT COUNT(*) FROM inventory_products "
            "WHERE tenant_id = :tid AND is_test_data = true"
        ), {"tid": tid})).scalar_one()
        if existing_items > 0:
            print(f"  ✓ Test items already exist ({existing_items} rows) — skipping items")
            item_rows = (await conn.execute(text(
                "SELECT id, name FROM inventory_products "
                "WHERE tenant_id = :tid AND is_test_data = true LIMIT 10"
            ), {"tid": tid})).fetchall()
            item_ids = [(str(r[0]), r[1]) for r in item_rows]
        else:
            hsn_ids = await seed_hsn(conn, tid, admin_id)
            item_ids = await seed_items(conn, tid, admin_id, vendor_ids, hsn_ids)

        existing_pl = (await conn.execute(text(
            "SELECT COUNT(*) FROM price_lists WHERE tenant_id = :tid AND is_test_data = true"
        ), {"tid": tid})).scalar_one()
        if existing_pl > 0:
            print(f"  ✓ Test price lists already exist ({existing_pl} rows) — skipping")
        else:
            await seed_price_lists(conn, tid, admin_id, admin_name, item_ids)

    await engine.dispose()
    print()
    print("=" * 55)
    print("✅  Masters seed complete — Oregenal Electrical India")
    print("=" * 55)


async def seed_vendors(conn, tid: str, admin_id: str) -> list:
    vendors = [
        {
            "vendor_code": "VEN-TEST-001", "name": "Osram India Pvt Ltd",
            "legal_name": "Osram India Private Limited",
            "vendor_type": "material", "status": "APPROVED",
            "gstin": "07AABCO9603R1ZX", "pan": "AABCO9603R",
            "address_line1": "Plot 12, Udyog Vihar Phase 1",
            "city": "Gurugram", "state": "Haryana", "pincode": "122016",
            "contact_person": "Rajesh Mehta", "phone": "+91-11-4567-8901",
            "email": "sales@osram.in", "payment_terms_days": 30,
            "credit_limit": 500000, "rating": 5,
            "bank_name": "HDFC Bank", "bank_ifsc": "HDFC0001234",
        },
        {
            "vendor_code": "VEN-TEST-002", "name": "Tata Steel Limited",
            "legal_name": "Tata Steel Limited",
            "vendor_type": "material", "status": "APPROVED",
            "gstin": "27AAACT1332L1ZV", "pan": "AAACT1332L",
            "address_line1": "Bombay House, 24 Homi Mody Street",
            "city": "Mumbai", "state": "Maharashtra", "pincode": "400001",
            "contact_person": "Priya Singh", "phone": "+91-22-6665-8282",
            "email": "b2b@tatasteel.com", "payment_terms_days": 45,
            "credit_limit": 2000000, "rating": 5,
            "bank_name": "SBI", "bank_ifsc": "SBIN0001234",
        },
        {
            "vendor_code": "VEN-TEST-003", "name": "Meanwell Power Supplies",
            "legal_name": "Mean Well Enterprises Co Ltd",
            "vendor_type": "material", "status": "APPROVED",
            "gstin": "29AABCM9603R1ZX", "pan": "AABCM9603R",
            "address_line1": "Electronics City Phase 2",
            "city": "Bengaluru", "state": "Karnataka", "pincode": "560100",
            "contact_person": "David Chen", "phone": "+91-80-4567-8901",
            "email": "india@meanwell.com", "payment_terms_days": 30,
            "credit_limit": 750000, "rating": 4,
            "bank_name": "ICICI Bank", "bank_ifsc": "ICIC0001234",
        },
        {
            "vendor_code": "VEN-TEST-004", "name": "Reliance Poly Products",
            "legal_name": "Reliance Poly Products Pvt Ltd",
            "vendor_type": "material", "status": "PENDING",
            "gstin": "24AAECR0047M1ZC", "pan": "AAECR0047M",
            "address_line1": "GIDC Estate, Naroda",
            "city": "Ahmedabad", "state": "Gujarat", "pincode": "382330",
            "contact_person": "Sunil Patel", "phone": "+91-79-4567-8901",
            "email": "sales@rpp.in", "payment_terms_days": 30,
            "credit_limit": 300000, "rating": 3,
            "bank_name": "Axis Bank", "bank_ifsc": "UTIB0001234",
        },
        {
            "vendor_code": "VEN-TEST-005", "name": "PCB Assembly Services",
            "legal_name": "PCB Assembly Services Pvt Ltd",
            "vendor_type": "service", "status": "APPROVED",
            "gstin": "27AABCP9603R1ZX", "pan": "AABCP9603R",
            "address_line1": "Unit 5, Turbhe MIDC",
            "city": "Navi Mumbai", "state": "Maharashtra", "pincode": "400705",
            "contact_person": "Anil Sharma", "phone": "+91-22-2764-5678",
            "email": "jobs@pcbassembly.in", "payment_terms_days": 15,
            "credit_limit": 100000, "rating": 4,
            "bank_name": "Kotak Bank", "bank_ifsc": "KKBK0001234",
        },
    ]
    ids = []
    for v in vendors:
        vid = str(uuid.uuid4())
        ids.append(vid)
        await conn.execute(text("""
            INSERT INTO vendors (
                id, tenant_id, vendor_code, name, legal_name, vendor_type, status,
                gstin, pan, address_line1, city, state, pincode, country,
                contact_person, phone, email, payment_terms_days, credit_limit, rating,
                bank_name, bank_ifsc, is_active, is_test_data,
                approved_by, approved_at, created_by, created_at, updated_at
            ) VALUES (
                :id, :tid, :code, :name, :legal, :vtype, :status,
                :gstin, :pan, :addr, :city, :state, :pincode, 'India',
                :contact, :phone, :email, :terms, :limit, :rating,
                :bank_name, :bank_ifsc, true, true,
                :approved_by, :approved_at,
                :created_by, now(), now()
            )
        """), {
            "id":          vid,
            "tid":         tid,
            "code":        v["vendor_code"],
            "name":        v["name"],
            "legal":       v.get("legal_name"),
            "vtype":       v["vendor_type"],
            "status":      v["status"],
            "gstin":       v.get("gstin"),
            "pan":         v.get("pan"),
            "addr":        v.get("address_line1"),
            "city":        v.get("city"),
            "state":       v.get("state"),
            "pincode":     v.get("pincode"),
            "contact":     v.get("contact_person"),
            "phone":       v.get("phone"),
            "email":       v.get("email"),
            "terms":       v.get("payment_terms_days", 30),
            "limit":       v.get("credit_limit", 0),
            "rating":      v.get("rating", 0),
            "bank_name":   v.get("bank_name"),
            "bank_ifsc":   v.get("bank_ifsc"),
            "approved_by": admin_id if v["status"] == "APPROVED" else None,
            "approved_at": datetime.now(timezone.utc) if v["status"] == "APPROVED" else None,
            "created_by":  admin_id,
        })
    print(f"  ✅ {len(vendors)} vendors created")
    return ids


async def seed_customers(conn, tid: str, admin_id: str) -> list:
    """
    FIX: Removed city, state, pincode from INSERT.
    These columns are added by migration 018 (ALTER TABLE ADD COLUMN IF NOT EXISTS).
    The seed script runs before the server confirms all columns exist,
    so we only insert columns that are guaranteed to be in the original table
    from migration 005. The address string already contains city/state info.
    """
    customers = [
        {
            "name":             "Bright Electricals Pvt Ltd",
            "email":            "orders@bright.com",
            "phone":            "+91-22-4567-8901",
            "gstin":            "27AABCB9603R1ZX",
            "pan":              "AABCB9603R",
            "address":          "Shop 12, Bhuleshwar Market, Mumbai, Maharashtra 400002",
            "credit_limit":     500000,
            "status":           "APPROVED",
            "customer_group":   "Wholesale",
            "payment_terms_days": 30,
            "customer_code":    "CUST-TEST-001",
        },
        {
            "name":             "SunPower Solutions",
            "email":            "purchase@sunpower.in",
            "phone":            "+91-80-4567-8901",
            "gstin":            "29AABCS9603R1ZX",
            "pan":              "AABCS9603R",
            "address":          "45, Residency Road, Bengaluru, Karnataka 560025",
            "credit_limit":     750000,
            "status":           "APPROVED",
            "customer_group":   "Distributor",
            "payment_terms_days": 45,
            "customer_code":    "CUST-TEST-002",
        },
        {
            "name":             "Gujarat Solar Corp",
            "email":            "buy@gjsolar.com",
            "phone":            "+91-79-4567-8901",
            "gstin":            "24AABCG9603R1ZX",
            "pan":              "AABCG9603R",
            "address":          "Naroda Industrial Estate, Ahmedabad, Gujarat 382330",
            "credit_limit":     1000000,
            "status":           "APPROVED",
            "customer_group":   "Distributor",
            "payment_terms_days": 30,
            "customer_code":    "CUST-TEST-003",
        },
        {
            "name":             "LED World India",
            "email":            "ledworld@gmail.com",
            "phone":            "+91-79-4576-8901",
            "gstin":            "24AABCL9603R1ZX",
            "pan":              "AABCL9603R",
            "address":          "Shop 7, Juhapura Commercial Complex, Surat, Gujarat 394101",
            "credit_limit":     200000,
            "status":           "APPROVED",
            "customer_group":   "Retail",
            "payment_terms_days": 15,
            "customer_code":    "CUST-TEST-004",
        },
        {
            "name":             "Sharma Electricals Delhi",
            "email":            "vijay@sharmaelec.com",
            "phone":            "+91-11-4567-8901",
            "gstin":            "07AABCS9603R1ZX",
            "pan":              "AABCS9603R",
            "address":          "Lajpat Rai Market, New Delhi 110006",
            "credit_limit":     150000,
            "status":           "APPROVED",
            "customer_group":   "Retail",
            "payment_terms_days": 15,
            "customer_code":    "CUST-TEST-005",
        },
        {
            "name":             "New Prospect Enterprises",
            "email":            "info@npenterp.com",
            "phone":            "+91-33-4567-8901",
            "gstin":            "19AABCN9603R1ZX",
            "pan":              "AABCN9603R",
            "address":          "15, Bentinck Street, Kolkata, West Bengal 700001",
            "credit_limit":     100000,
            "status":           "PENDING",
            "customer_group":   "Wholesale",
            "payment_terms_days": 30,
            "customer_code":    "CUST-TEST-006",
        },
    ]
    ids = []
    for cust in customers:
        cid = str(uuid.uuid4())
        ids.append(cid)
        approved_by = admin_id if cust["status"] == "APPROVED" else None
        approved_at = datetime.now(timezone.utc) if cust["status"] == "APPROVED" else None

        # Only insert columns guaranteed to exist in the original customers table
        # (from migration 005). city/state/pincode are added by migration 018
        # and will be populated automatically when records are edited via UI.
        await conn.execute(text("""
            INSERT INTO customers (
                id, tenant_id, name, email, phone, gstin, pan, address,
                credit_limit, is_active, custom_data, created_at, updated_at,
                customer_code, status, payment_terms_days, customer_group,
                shipping_address, is_test_data, created_by, approved_by, approved_at
            ) VALUES (
                :id, :tid, :name, :email, :phone, :gstin, :pan, :address,
                :credit_limit, true, '{}', now(), now(),
                :code, :status, :terms, :group,
                :shipping, true, :created_by, :approved_by, :approved_at
            )
        """), {
            "id":           cid,
            "tid":          tid,
            "name":         cust["name"],
            "email":        cust["email"],
            "phone":        cust["phone"],
            "gstin":        cust.get("gstin"),
            "pan":          cust.get("pan"),
            "address":      cust.get("address"),
            "credit_limit": cust["credit_limit"],
            "code":         cust["customer_code"],
            "status":       cust["status"],
            "terms":        cust.get("payment_terms_days", 30),
            "group":        cust.get("customer_group"),
            "shipping":     cust.get("address"),   # copy billing as shipping
            "created_by":   admin_id,
            "approved_by":  approved_by,
            "approved_at":  approved_at,
        })
    print(f"  ✅ {len(customers)} customers created")
    return ids


async def seed_hsn(conn, tid: str, admin_id: str) -> dict:
    hsn_data = [
        ("85392200", "LED Lamps for voltages not exceeding 50V", 12),
        ("85392900", "LED Lamps for other voltages",              12),
        ("85044090", "LED Drivers / Power Supplies",              18),
        ("85340000", "Printed Circuit Boards (PCB)",              18),
        ("74122000", "Copper fittings and components",            18),
        ("39269099", "Plastic housing for LED fittings",          18),
        ("70200090", "Glass parts for lamps",                      5),
        ("998314",   "PCB Assembly and Soldering Service",        18),
    ]
    code_to_id = {}
    for code, desc, igst in hsn_data:
        hid = str(uuid.uuid4())
        code_type = "sac" if len(code) == 6 else "hsn"
        await conn.execute(text("""
            INSERT INTO hsn_codes (
                id, tenant_id, code, description, code_type,
                igst_rate, cgst_rate, sgst_rate, cess_rate,
                is_active, is_test_data, created_by, created_at, updated_at
            ) VALUES (
                :id, :tid, :code, :desc, :ctype,
                :igst, :cgst, :sgst, 0,
                true, true, :admin, now(), now()
            )
            ON CONFLICT DO NOTHING
        """), {
            "id":    hid,
            "tid":   tid,
            "code":  code,
            "desc":  desc,
            "ctype": code_type,
            "igst":  igst,
            "cgst":  igst / 2,
            "sgst":  igst / 2,
            "admin": admin_id,
        })
        code_to_id[code] = hid
    print(f"  ✅ {len(hsn_data)} HSN/SAC codes created")
    return code_to_id


async def seed_items(conn, tid: str, admin_id: str, vendor_ids: list, hsn_ids: dict) -> list:
    ven1 = vendor_ids[0] if len(vendor_ids) > 0 else None
    ven3 = vendor_ids[2] if len(vendor_ids) > 2 else None
    items = [
        # Finished goods
        {
            "code": "ITM-TEST-001", "name": "9W LED Bulb B22",
            "sku": "LED-9W-B22", "type": "finished_good",
            "group": "LED Bulbs", "unit": "Pcs",
            "hsn": "85392200", "gst": 12,
            "cost_price": 45.0, "selling_price": 85.0, "purchase_price": 38.0,
            "reorder": 500, "vendor": ven1,
        },
        {
            "code": "ITM-TEST-002", "name": "18W LED Tube Light T8",
            "sku": "LED-18W-T8", "type": "finished_good",
            "group": "Tube Lights", "unit": "Pcs",
            "hsn": "85392900", "gst": 12,
            "cost_price": 95.0, "selling_price": 180.0, "purchase_price": 80.0,
            "reorder": 200, "vendor": ven1,
        },
        {
            "code": "ITM-TEST-003", "name": "LED Street Light 70W",
            "sku": "LED-STL-70W", "type": "finished_good",
            "group": "Street Lights", "unit": "Pcs",
            "hsn": "85392900", "gst": 12,
            "cost_price": 1800.0, "selling_price": 3200.0, "purchase_price": 1500.0,
            "reorder": 50, "vendor": ven1,
        },
        # Raw materials
        {
            "code": "ITM-TEST-004", "name": "LED Chip 1W SMD 5630",
            "sku": "RM-LED-CHIP-5630", "type": "raw_material",
            "group": "LED Components", "unit": "Pcs",
            "hsn": "85392200", "gst": 12,
            "cost_price": 2.5, "selling_price": 0, "purchase_price": 2.5,
            "reorder": 10000, "vendor": ven1,
        },
        {
            "code": "ITM-TEST-005", "name": "LED Driver 9W Constant Current",
            "sku": "RM-DRV-9W-CC", "type": "raw_material",
            "group": "Drivers", "unit": "Pcs",
            "hsn": "85044090", "gst": 18,
            "cost_price": 18.0, "selling_price": 0, "purchase_price": 18.0,
            "reorder": 1000, "vendor": ven3,
        },
        {
            "code": "ITM-TEST-006", "name": "Aluminium Heat Sink 100mm",
            "sku": "RM-HSINK-100", "type": "raw_material",
            "group": "Hardware", "unit": "Pcs",
            "hsn": "74122000", "gst": 18,
            "cost_price": 12.0, "selling_price": 0, "purchase_price": 12.0,
            "reorder": 2000, "vendor": None,
        },
        {
            "code": "ITM-TEST-007", "name": "PC Diffuser Lens 65mm",
            "sku": "RM-LENS-65", "type": "raw_material",
            "group": "Optics", "unit": "Pcs",
            "hsn": "39269099", "gst": 18,
            "cost_price": 4.5, "selling_price": 0, "purchase_price": 4.5,
            "reorder": 5000, "vendor": None,
        },
        # Semi-finished
        {
            "code": "ITM-TEST-008", "name": "LED PCB Assembly 9W",
            "sku": "SF-PCB-9W", "type": "semi_finished",
            "group": "PCB", "unit": "Pcs",
            "hsn": "85340000", "gst": 18,
            "cost_price": 28.0, "selling_price": 0, "purchase_price": 25.0,
            "reorder": 500, "vendor": None,
        },
        # Service
        {
            "code": "ITM-TEST-009", "name": "PCB Assembly Service (per board)",
            "sku": "SVC-PCB-ASM", "type": "service",
            "group": "Services", "unit": "Pcs",
            "hsn": "998314", "gst": 18,
            "cost_price": 0, "selling_price": 15.0, "purchase_price": 12.0,
            "reorder": 0, "vendor": vendor_ids[4] if len(vendor_ids) > 4 else None,
        },
        # Consumable
        {
            "code": "ITM-TEST-010", "name": "Solder Wire 60/40 500g",
            "sku": "CONS-SOLDER-500", "type": "consumable",
            "group": "Consumables", "unit": "Roll",
            "hsn": "85340000", "gst": 18,
            "cost_price": 320.0, "selling_price": 0, "purchase_price": 280.0,
            "reorder": 20, "vendor": None,
        },
    ]
    item_ids = []
    for item in items:
        iid = str(uuid.uuid4())
        item_ids.append((iid, item["name"]))
        await conn.execute(text("""
            INSERT INTO inventory_products (
                id, tenant_id, name, sku, category, unit, description,
                cost_price, selling_price, stock, reorder_point, status, custom_data,
                created_at, updated_at,
                product_code, product_type, product_group,
                hsn_code, gst_rate, purchase_price, preferred_vendor_id,
                is_test_data, created_by
            ) VALUES (
                :id, :tid, :name, :sku, :category, :unit, NULL,
                :cost, :sell, 0, :reorder, 'active', '{}',
                now(), now(),
                :code, :ptype, :group,
                :hsn_code, :gst, :purchase, :vendor,
                true, :admin
            )
        """), {
            "id":       iid,
            "tid":      tid,
            "name":     item["name"],
            "sku":      item["sku"],
            "category": item["group"],
            "unit":     item["unit"],
            "cost":     item["cost_price"],
            "sell":     item["selling_price"],
            "reorder":  item["reorder"],
            "code":     item["code"],
            "ptype":    item["type"],
            "group":    item["group"],
            "hsn_code": item.get("hsn"),
            "gst":      item["gst"],
            "purchase": item["purchase_price"],
            "vendor":   item.get("vendor"),
            "admin":    admin_id,
        })
    print(f"  ✅ {len(items)} items created")
    return item_ids


async def seed_price_lists(conn, tid: str, admin_id: str, admin_name: str, item_ids: list):
    pl_sales_id    = str(uuid.uuid4())
    pl_purchase_id = str(uuid.uuid4())
    fy_from = date(2025, 4, 1)
    fy_to   = date(2026, 3, 31)

    # Sales price list
    await conn.execute(text("""
        INSERT INTO price_lists (
            id, tenant_id, name, list_type, currency, applicable_to,
            description, effective_from, effective_to, is_default,
            is_active, is_test_data, created_by, created_at, updated_at
        ) VALUES (
            :id, :tid, :name, 'sales', 'INR', 'all',
            'Standard selling price list for FY 2025-26',
            :from, :to, true,
            true, true, :admin, now(), now()
        )
    """), {
        "id":    pl_sales_id,
        "tid":   tid,
        "name":  "Standard Sales FY 2025-26",
        "from":  fy_from,
        "to":    fy_to,
        "admin": admin_id,
    })

    # Purchase price list
    await conn.execute(text("""
        INSERT INTO price_lists (
            id, tenant_id, name, list_type, currency, applicable_to,
            description, effective_from, effective_to, is_default,
            is_active, is_test_data, created_by, created_at, updated_at
        ) VALUES (
            :id, :tid, :name, 'purchase', 'INR', 'all',
            'Standard purchase price list for FY 2025-26',
            :from, :to, true,
            true, true, :admin, now(), now()
        )
    """), {
        "id":    pl_purchase_id,
        "tid":   tid,
        "name":  "Standard Purchase FY 2025-26",
        "from":  fy_from,
        "to":    fy_to,
        "admin": admin_id,
    })

    # Add items to price lists (first 4 finished goods + service)
    sales_prices = [
        (85.0,   item_ids[0]),   # 9W Bulb
        (180.0,  item_ids[1]),   # 18W Tube
        (3200.0, item_ids[2]),   # Street Light
        (15.0,   item_ids[8]),   # PCB Assembly Service
    ]
    purchase_prices = [
        (38.0,  item_ids[0]),    # 9W Bulb
        (2.5,   item_ids[3]),    # LED Chip
        (18.0,  item_ids[4]),    # LED Driver
        (12.0,  item_ids[5]),    # Heat Sink
        (12.0,  item_ids[8]),    # PCB Assembly Service
    ]

    ph_count = 0
    for price, (iid, iname) in sales_prices:
        await conn.execute(text("""
            INSERT INTO price_list_items (
                id, price_list_id, tenant_id, product_id, product_name,
                unit_price, min_qty, discount_pct,
                is_test_data, created_at, updated_at
            ) VALUES (
                gen_random_uuid(), :plid, :tid, :product_id, :pname,
                :price, 1, 0,
                true, now(), now()
            )
        """), {
            "plid":       pl_sales_id,
            "tid":        tid,
            "product_id": iid,
            "pname":      iname,
            "price":      price,
        })
        await conn.execute(text("""
            INSERT INTO price_history (
                id, tenant_id, product_id, product_name,
                price_list_id, price_list_name, price_type,
                old_price, new_price, changed_by, changed_by_name,
                effective_from, is_test_data, created_at
            ) VALUES (
                gen_random_uuid(), :tid, :pid, :pname,
                :plid, :plname, 'sales',
                NULL, :price, :admin, :aname,
                :from, true, now()
            )
        """), {
            "tid":   tid,
            "pid":   iid,
            "pname": iname,
            "plid":  pl_sales_id,
            "plname":"Standard Sales FY 2025-26",
            "price": price,
            "admin": admin_id,
            "aname": admin_name,
            "from":  fy_from,
        })
        ph_count += 1

    for price, (iid, iname) in purchase_prices:
        await conn.execute(text("""
            INSERT INTO price_list_items (
                id, price_list_id, tenant_id, product_id, product_name,
                unit_price, min_qty, discount_pct,
                is_test_data, created_at, updated_at
            ) VALUES (
                gen_random_uuid(), :plid, :tid, :product_id, :pname,
                :price, 1, 0,
                true, now(), now()
            )
        """), {
            "plid":       pl_purchase_id,
            "tid":        tid,
            "product_id": iid,
            "pname":      iname,
            "price":      price,
        })
        await conn.execute(text("""
            INSERT INTO price_history (
                id, tenant_id, product_id, product_name,
                price_list_id, price_list_name, price_type,
                old_price, new_price, changed_by, changed_by_name,
                effective_from, is_test_data, created_at
            ) VALUES (
                gen_random_uuid(), :tid, :pid, :pname,
                :plid, :plname, 'purchase',
                NULL, :price, :admin, :aname,
                :from, true, now()
            )
        """), {
            "tid":   tid,
            "pid":   iid,
            "pname": iname,
            "plid":  pl_purchase_id,
            "plname":"Standard Purchase FY 2025-26",
            "price": price,
            "admin": admin_id,
            "aname": admin_name,
            "from":  fy_from,
        })
        ph_count += 1

    print(f"  ✅ 2 price lists created (sales + purchase)")
    print(f"  ✅ {len(sales_prices) + len(purchase_prices)} price list items added")
    print(f"  ✅ {ph_count} price history entries written")


if __name__ == "__main__":
    asyncio.run(seed())