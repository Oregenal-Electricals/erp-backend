"""
Oregenal ERP — Purchase Module Seed Script
===========================================
Creates realistic test data for the full procurement cycle:

  3 Purchase Requisitions (DRAFT / SUBMITTED / APPROVED)
  2 RFQs  (one with vendors, one SENT)
  3 Vendor Quotations (for RFQ-2)
  3 Purchase Orders   (DRAFT / APPROVED / RECEIVED)
  1 GRN   (POSTED — stock already updated)

Run AFTER seed_rbac.py + seed_master.py + seed_masters.py:
  cd erp-backend
  source venv/bin/activate
  python scripts/seed_purchase.py

All rows marked is_test_data=True.
Idempotent — detects and skips if test POs already exist.
"""
import asyncio, os, sys, uuid
from datetime import date, datetime, timezone, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def _load_env():
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
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
        # ── Context ─────────────────────────────────────────────
        tenant = (await conn.execute(text(
            "SELECT id FROM tenants WHERE slug='oregenal' LIMIT 1"
        ))).fetchone()
        if not tenant:
            print("❌ Tenant 'oregenal' not found. Run seed_rbac.py first.")
            return
        tid = str(tenant[0])

        admin = (await conn.execute(text(
            "SELECT id, name FROM users WHERE tenant_id=:tid AND role='admin' LIMIT 1"
        ), {"tid": tid})).fetchone()
        admin_id   = str(admin[0]) if admin else None
        admin_name = admin[1] if admin else "Admin"

        store = (await conn.execute(text(
            "SELECT id FROM users WHERE tenant_id=:tid AND role='store_manager' LIMIT 1"
        ), {"tid": tid})).fetchone()
        store_id = str(store[0]) if store else admin_id

        print(f"  Tenant : {tid}")
        print(f"  Admin  : {admin_id} ({admin_name})")
        print(f"  Store  : {store_id}")

        # ── Idempotency check ────────────────────────────────────
        existing = (await conn.execute(text(
            "SELECT COUNT(*) FROM purchase_orders "
            "WHERE tenant_id=:tid AND is_test_data=true"
        ), {"tid": tid})).scalar_one()
        if existing > 0:
            print(f"\n  ✓ Purchase test data already exists ({existing} POs) — skipping.")
            return

        # ── Get APPROVED vendors ─────────────────────────────────
        vendors = (await conn.execute(text(
            "SELECT id, name, email, gstin, payment_terms_days "
            "FROM vendors WHERE tenant_id=:tid AND status='APPROVED' "
            "ORDER BY vendor_code LIMIT 4"
        ), {"tid": tid})).fetchall()
        if len(vendors) < 2:
            print("❌ Need at least 2 APPROVED vendors. Run seed_masters.py first.")
            return

        v1_id, v1_name, v1_email, v1_gstin, v1_terms = (
            str(vendors[0][0]), vendors[0][1], vendors[0][2], vendors[0][3], vendors[0][4])
        v2_id, v2_name, v2_email, v2_gstin, v2_terms = (
            str(vendors[1][0]), vendors[1][1], vendors[1][2], vendors[1][3], vendors[1][4])

        # ── Get items ────────────────────────────────────────────
        items = (await conn.execute(text(
            "SELECT id, name, sku, hsn_code, gst_rate, purchase_price "
            "FROM inventory_products WHERE tenant_id=:tid AND is_test_data=true "
            "ORDER BY product_code LIMIT 5"
        ), {"tid": tid})).fetchall()
        if len(items) < 3:
            print("❌ Need at least 3 test items. Run seed_masters.py first.")
            return

        i1 = (str(items[0][0]), items[0][1], items[0][2], items[0][3], float(items[0][4] or 18), float(items[0][5] or 0))
        i2 = (str(items[1][0]), items[1][1], items[1][2], items[1][3], float(items[1][4] or 18), float(items[1][5] or 0))
        i3 = (str(items[2][0]), items[2][1], items[2][2], items[2][3], float(items[2][4] or 18), float(items[2][5] or 0))

        print()
        today  = date.today()
        now    = datetime.now(timezone.utc)

        # ═══════════════════════════════════════════════════════════
        # PURCHASE REQUISITIONS
        # ═══════════════════════════════════════════════════════════
        print("  Creating Purchase Requisitions...")

        pr1_id = str(uuid.uuid4())
        pr2_id = str(uuid.uuid4())
        pr3_id = str(uuid.uuid4())

        for pr_id, pr_num, title, status, submitted_at, approved_by, approved_at in [
            (pr1_id, "PR-TEST-0001", "Q1 LED Chip Procurement", "DRAFT",       None,  None,     None),
            (pr2_id, "PR-TEST-0002", "Driver Module Replenishment", "SUBMITTED", now,  None,     None),
            (pr3_id, "PR-TEST-0003", "Heat Sink Bulk Order", "APPROVED",        now,  admin_id, now),
        ]:
            await conn.execute(text("""
                INSERT INTO purchase_requisitions (
                    id, tenant_id, created_by, updated_by, is_active, is_test_data,
                    pr_number, title, status, requested_by, requested_by_name,
                    department, required_by_date, priority,
                    submitted_at, approved_by, approved_by_name, approved_at,
                    total_amount, created_at, updated_at
                ) VALUES (
                    :id, :tid, :admin, :admin, true, true,
                    :num, :title, :status, :store, :sname,
                    'Production', :req_by, 'normal',
                    :sub_at, :appr_by, :appr_name, :appr_at,
                    0, now(), now()
                )
            """), {
                "id": pr_id, "tid": tid, "admin": store_id, "num": pr_num,
                "title": title, "status": status,
                "store": store_id, "sname": "Store Manager",
                "req_by": today + timedelta(days=30),
                "sub_at": submitted_at, "appr_by": approved_by,
                "appr_name": admin_name if approved_by else None,
                "appr_at": approved_at,
            })

        # PR items
        for pr_id, item_id, item_name, item_sku, hsn, gst, qty, price in [
            (pr1_id, i1[0], i1[1], i1[2], i1[3], i1[4], 5000,  i1[5]),
            (pr1_id, i2[0], i2[1], i2[2], i2[3], i2[4], 2000,  i2[5]),
            (pr2_id, i2[0], i2[1], i2[2], i2[3], i2[4], 1000,  i2[5]),
            (pr3_id, i3[0], i3[1], i3[2], i3[3], i3[4], 3000,  i3[5]),
        ]:
            await conn.execute(text("""
                INSERT INTO purchase_requisition_items (
                    id, tenant_id, pr_id, created_by, updated_by,
                    is_active, is_test_data,
                    product_id, product_name, product_code, hsn_code,
                    unit, quantity, estimated_unit_price, estimated_total, gst_rate,
                    created_at, updated_at
                ) VALUES (
                    gen_random_uuid(), :tid, :pr_id, :admin, :admin,
                    true, true,
                    :pid, :pname, :pcode, :hsn,
                    'Pcs', :qty, :price, :total, :gst,
                    now(), now()
                )
            """), {
                "tid": tid, "pr_id": pr_id, "admin": store_id,
                "pid": item_id, "pname": item_name, "pcode": item_sku,
                "hsn": hsn, "qty": qty, "price": price,
                "total": round(qty * price, 2), "gst": gst,
            })
            # Update PR total
            await conn.execute(text(
                "UPDATE purchase_requisitions SET total_amount = "
                "(SELECT COALESCE(SUM(estimated_total),0) FROM purchase_requisition_items WHERE pr_id=:pid) "
                "WHERE id=:pid"
            ), {"pid": pr_id})

        print("  ✅ 3 PRs created (DRAFT / SUBMITTED / APPROVED)")

        # ═══════════════════════════════════════════════════════════
        # RFQs
        # ═══════════════════════════════════════════════════════════
        print("  Creating RFQs...")

        rfq1_id = str(uuid.uuid4())
        rfq2_id = str(uuid.uuid4())

        for rfq_id, rfq_num, title, status, pr_id, sent_at, vendor_count in [
            (rfq1_id, "RFQ-TEST-0001", "RFQ for LED Chip Q1", "DRAFT", pr3_id, None, 0),
            (rfq2_id, "RFQ-TEST-0002", "RFQ for Heat Sinks Bulk", "PARTIALLY_RECEIVED", pr3_id, now, 2),
        ]:
            await conn.execute(text("""
                INSERT INTO rfq_headers (
                    id, tenant_id, created_by, updated_by, is_active, is_test_data,
                    rfq_number, title, status, pr_id,
                    close_date, required_by, sent_at,
                    vendor_count, quotation_count, created_at, updated_at
                ) VALUES (
                    :id, :tid, :admin, :admin, true, true,
                    :num, :title, :status, :pr_id,
                    :close, :req_by, :sent_at,
                    :vc, 0, now(), now()
                )
            """), {
                "id": rfq_id, "tid": tid, "admin": store_id,
                "num": rfq_num, "title": title, "status": status,
                "pr_id": pr_id,
                "close": today + timedelta(days=7),
                "req_by": today + timedelta(days=21),
                "sent_at": sent_at, "vc": vendor_count,
            })

        # RFQ items for rfq2
        for item_id, item_name, item_sku, hsn, gst, qty in [
            (i3[0], i3[1], i3[2], i3[3], i3[4], 3000),
        ]:
            await conn.execute(text("""
                INSERT INTO rfq_items (
                    id, tenant_id, rfq_id, created_by, updated_by,
                    is_active, is_test_data,
                    product_id, product_name, product_code, hsn_code,
                    unit, quantity, gst_rate, created_at, updated_at
                ) VALUES (
                    gen_random_uuid(), :tid, :rfq_id, :admin, :admin,
                    true, true,
                    :pid, :pname, :pcode, :hsn,
                    'Pcs', :qty, :gst, now(), now()
                )
            """), {
                "tid": tid, "rfq_id": rfq2_id, "admin": store_id,
                "pid": item_id, "pname": item_name, "pcode": item_sku,
                "hsn": hsn, "qty": qty, "gst": gst,
            })

        # RFQ vendors for rfq2
        for vendor_id, vendor_name, vendor_email in [
            (v1_id, v1_name, v1_email),
            (v2_id, v2_name, v2_email),
        ]:
            await conn.execute(text("""
                INSERT INTO rfq_vendors (
                    id, tenant_id, rfq_id, vendor_id,
                    created_by, updated_by, is_active, is_test_data,
                    vendor_name, vendor_email, sent_at, email_sent, has_responded,
                    created_at, updated_at
                ) VALUES (
                    gen_random_uuid(), :tid, :rfq_id, :vid,
                    :admin, :admin, true, true,
                    :vname, :vemail, :sent_at, true, true,
                    now(), now()
                )
            """), {
                "tid": tid, "rfq_id": rfq2_id, "vid": vendor_id,
                "admin": store_id, "vname": vendor_name,
                "vemail": vendor_email, "sent_at": now,
            })

        print("  ✅ 2 RFQs created (DRAFT / PARTIALLY_RECEIVED)")

        # ═══════════════════════════════════════════════════════════
        # VENDOR QUOTATIONS
        # ═══════════════════════════════════════════════════════════
        print("  Creating Vendor Quotations...")

        # Get rfq2 item id
        rfq2_item = (await conn.execute(text(
            "SELECT id FROM rfq_items WHERE rfq_id=:rid LIMIT 1"
        ), {"rid": rfq2_id})).fetchone()
        rfq2_item_id = str(rfq2_item[0]) if rfq2_item else None

        vq1_id = str(uuid.uuid4())
        vq2_id = str(uuid.uuid4())

        for vq_id, vq_num, vendor_id, vendor_name, vendor_email, vendor_gstin, price_per, status in [
            (vq1_id, "VQ-TEST-0001", v1_id, v1_name, v1_email, v1_gstin, 11.50, "SHORTLISTED"),
            (vq2_id, "VQ-TEST-0002", v2_id, v2_name, v2_email, v2_gstin, 12.20, "RECEIVED"),
        ]:
            qty = 3000
            disc = 0
            gst  = float(i3[4])
            sub  = qty * price_per * (1 - disc/100)
            tax  = sub * gst / 100
            total = sub + tax
            await conn.execute(text("""
                INSERT INTO vendor_quotations (
                    id, tenant_id, created_by, updated_by, is_active, is_test_data,
                    rfq_id, vendor_id, quotation_number, status,
                    vendor_name, vendor_email, vendor_gstin,
                    received_date, validity_date, delivery_days,
                    subtotal, tax_amount, total_amount, payment_terms,
                    created_at, updated_at
                ) VALUES (
                    :id, :tid, :admin, :admin, true, true,
                    :rfq_id, :vid, :num, :status,
                    :vname, :vemail, :vgstin,
                    :recv, :valid, 14,
                    :sub, :tax, :total, '30 days',
                    now(), now()
                )
            """), {
                "id": vq_id, "tid": tid, "admin": store_id,
                "rfq_id": rfq2_id, "vid": vendor_id, "num": vq_num, "status": status,
                "vname": vendor_name, "vemail": vendor_email, "vgstin": vendor_gstin,
                "recv": today, "valid": today + timedelta(days=30),
                "sub": round(sub,2), "tax": round(tax,2), "total": round(total,2),
            })
            if rfq2_item_id:
                await conn.execute(text("""
                    INSERT INTO vendor_quotation_items (
                        id, tenant_id, quotation_id, rfq_item_id,
                        created_by, updated_by, is_active, is_test_data,
                        product_id, product_name, unit, quantity,
                        unit_price, discount_pct, gst_rate,
                        subtotal, tax_amount, line_total, delivery_days,
                        created_at, updated_at
                    ) VALUES (
                        gen_random_uuid(), :tid, :qid, :riid,
                        :admin, :admin, true, true,
                        :pid, :pname, 'Pcs', :qty,
                        :price, 0, :gst,
                        :sub, :tax, :total, 14,
                        now(), now()
                    )
                """), {
                    "tid": tid, "qid": vq_id, "riid": rfq2_item_id, "admin": store_id,
                    "pid": i3[0], "pname": i3[1], "qty": qty, "price": price_per, "gst": gst,
                    "sub": round(sub,2), "tax": round(tax,2), "total": round(total,2),
                })
        # Update rfq2 quotation count
        await conn.execute(text(
            "UPDATE rfq_headers SET quotation_count=2 WHERE id=:rid"
        ), {"rid": rfq2_id})

        print("  ✅ 2 Vendor Quotations created (SHORTLISTED / RECEIVED)")

        # ═══════════════════════════════════════════════════════════
        # PURCHASE ORDERS
        # ═══════════════════════════════════════════════════════════
        print("  Creating Purchase Orders...")

        po1_id = str(uuid.uuid4())
        po2_id = str(uuid.uuid4())
        po3_id = str(uuid.uuid4())

        for po_id, po_num, vendor_id, vendor_name, vendor_email, vendor_gstin, status, is_locked, approved_by, approved_by_name, approved_at in [
            (po1_id, "PO-TEST-0001", v1_id, v1_name, v1_email, v1_gstin, "DRAFT",    False, None,     None,       None),
            (po2_id, "PO-TEST-0002", v1_id, v1_name, v1_email, v1_gstin, "APPROVED", False, admin_id, admin_name, now),
            (po3_id, "PO-TEST-0003", v2_id, v2_name, v2_email, v2_gstin, "RECEIVED", True,  admin_id, admin_name, now - timedelta(days=5)),
        ]:
            await conn.execute(text("""
                INSERT INTO purchase_orders (
                    id, tenant_id, created_by, updated_by, is_active, is_test_data,
                    po_number, order_number, vendor_id, vendor_name, vendor_email, vendor_gstin,
                    status, payment_status, order_date, delivery_date,
                    payment_terms_days, currency, exchange_rate,
                    subtotal, discount_amount, tax_amount, total_amount, items_count,
                    submitted_by, submitted_at,
                    approved_by, approved_by_name, approved_at,
                    is_locked, amendment_count,
                    notes, created_at, updated_at
                ) VALUES (
                    :id, :tid, :admin, :admin, true, true,
                    :num, :num, :vid, :vname, :vemail, :vgstin,
                    :status, 'PENDING', :odate, :ddate,
                    30, 'INR', 1,
                    0, 0, 0, 0, 0,
                    :admin, now(),
                    :appr_by, :appr_name, :appr_at,
                    :locked, 0,
                    :notes, now(), now()
                )
            """), {
                "id": po_id, "tid": tid, "admin": store_id,
                "num": po_num, "vid": vendor_id, "vname": vendor_name,
                "vemail": vendor_email, "vgstin": vendor_gstin,
                "status": status, "odate": today, "ddate": today + timedelta(days=14),
                "appr_by": approved_by, "appr_name": approved_by_name, "appr_at": approved_at,
                "locked": is_locked,
                "notes": f"Test PO {po_num} — created by seed script",
            })

        # PO items
        po_items_data = [
            # (po_id, product_id, product_name, product_sku, hsn, gst_rate, qty, unit_price, received_qty)
            (po1_id, i1[0], i1[1], i1[2], i1[3], i1[4], 5000, i1[5] or 2.5,   0),
            (po1_id, i2[0], i2[1], i2[2], i2[3], i2[4], 2000, i2[5] or 18.0,  0),
            (po2_id, i1[0], i1[1], i1[2], i1[3], i1[4], 3000, i1[5] or 2.5,   0),
            (po2_id, i3[0], i3[1], i3[2], i3[3], i3[4], 1000, i3[5] or 12.0,  0),
            (po3_id, i2[0], i2[1], i2[2], i2[3], i2[4], 500,  i2[5] or 18.0, 500),
            (po3_id, i3[0], i3[1], i3[2], i3[3], i3[4], 200,  i3[5] or 12.0, 200),
        ]
        for po_id, pid, pname, psku, hsn, gst, qty, price, recv_qty in po_items_data:
            disc = Decimal("0")
            qty_d  = Decimal(str(qty))
            price_d = Decimal(str(price))
            gst_d  = Decimal(str(gst))
            sub    = qty_d * price_d * (1 - disc/100)
            tax    = sub * gst_d / 100
            await conn.execute(text("""
                INSERT INTO purchase_order_items (
                    id, tenant_id, po_id, created_by, updated_by,
                    is_active, is_test_data,
                    product_id, product_name, product_sku, unit,
                    quantity, unit_price, discount_pct, gst_rate,
                    subtotal, tax_amount, line_total,
                    received_qty, returned_qty,
                    created_at, updated_at
                ) VALUES (
                    gen_random_uuid(), :tid, :po_id, :admin, :admin,
                    true, true,
                    :pid, :pname, :psku, 'Pcs',
                    :qty, :price, 0, :gst,
                    :sub, :tax, :total,
                    :recv, 0,
                    now(), now()
                )
            """), {
                "tid": tid, "po_id": po_id, "admin": store_id,
                "pid": pid, "pname": pname, "psku": psku, "qty": qty,
                "price": price, "gst": gst,
                "sub": round(float(sub),2), "tax": round(float(tax),2),
                "total": round(float(sub+tax),2), "recv": recv_qty,
            })

        # Recalc PO totals
        for po_id in (po1_id, po2_id, po3_id):
            await conn.execute(text("""
                UPDATE purchase_orders SET
                    items_count  = (SELECT COUNT(*)                     FROM purchase_order_items WHERE po_id=:pid),
                    subtotal     = (SELECT COALESCE(SUM(subtotal),0)    FROM purchase_order_items WHERE po_id=:pid),
                    tax_amount   = (SELECT COALESCE(SUM(tax_amount),0)  FROM purchase_order_items WHERE po_id=:pid),
                    total_amount = (SELECT COALESCE(SUM(line_total),0)  FROM purchase_order_items WHERE po_id=:pid)
                WHERE id=:pid
            """), {"pid": po_id})

        print("  ✅ 3 POs created (DRAFT / APPROVED / RECEIVED)")

        # ═══════════════════════════════════════════════════════════
        # GRN  (POSTED — for the RECEIVED PO)
        # ═══════════════════════════════════════════════════════════
        print("  Creating GRN...")

        grn1_id = str(uuid.uuid4())
        await conn.execute(text("""
            INSERT INTO grn_headers (
                id, tenant_id, po_id, vendor_id,
                created_by, updated_by, is_active, is_test_data,
                grn_number, status,
                received_date, dc_number, invoice_number,
                vendor_name, po_number,
                total_received_value,
                posted_by, posted_at,
                notes, created_at, updated_at
            ) VALUES (
                :id, :tid, :po_id, :vid,
                :admin, :admin, true, true,
                'GRN-TEST-0001', 'POSTED',
                :recv_date, 'DC-2025-001', 'INV-V2-001',
                :vname, 'PO-TEST-0003',
                :total_val,
                :admin, :posted_at,
                'Test GRN — posted by seed', now(), now()
            )
        """), {
            "id": grn1_id, "tid": tid, "po_id": po3_id, "vid": v2_id,
            "admin": store_id, "recv_date": today - timedelta(days=3),
            "vname": v2_name, "total_val": 0.0,
            "posted_at": now - timedelta(days=3),
        })

        # GRN items — match po3 items
        po3_items = (await conn.execute(text(
            "SELECT id, product_id, product_name, product_sku, unit, "
            "quantity, unit_price FROM purchase_order_items WHERE po_id=:pid"
        ), {"pid": po3_id})).fetchall()

        total_grn_val = Decimal("0")
        for poi in po3_items:
            poi_id, prod_id, prod_name, prod_sku, unit, qty, unit_cost = (
                str(poi[0]), str(poi[1]) if poi[1] else None,
                poi[2], poi[3], poi[4], float(poi[5]), float(poi[6]))
            cost = Decimal(str(unit_cost)) * Decimal(str(qty))
            total_grn_val += cost
            await conn.execute(text("""
                INSERT INTO grn_items (
                    id, tenant_id, grn_id, po_item_id,
                    created_by, updated_by, is_active, is_test_data,
                    product_id, product_name, product_sku, unit,
                    ordered_qty, received_qty, accepted_qty, rejected_qty,
                    unit_cost, total_cost,
                    created_at, updated_at
                ) VALUES (
                    gen_random_uuid(), :tid, :grn_id, :poi_id,
                    :admin, :admin, true, true,
                    :pid, :pname, :psku, :unit,
                    :qty, :qty, :qty, 0,
                    :ucost, :tcost,
                    now(), now()
                )
            """), {
                "tid": tid, "grn_id": grn1_id, "poi_id": poi_id,
                "admin": store_id, "pid": prod_id, "pname": prod_name,
                "psku": prod_sku, "unit": unit, "qty": qty,
                "ucost": unit_cost, "tcost": round(float(cost),2),
            })

        await conn.execute(text(
            "UPDATE grn_headers SET total_received_value=:val WHERE id=:id"
        ), {"val": float(total_grn_val), "id": grn1_id})

        print("  ✅ 1 GRN created (POSTED)")

        # Number series advancement
        for doc_type, count in [
            ("purchase_requisition", 3), ("rfq", 2), ("vendor_quotation", 2),
            ("purchase_order", 3), ("grn", 1),
        ]:
            await conn.execute(text("""
                UPDATE number_series
                SET current_number = GREATEST(current_number, :n), updated_at = now()
                WHERE tenant_id = :tid AND document_type = :dt
            """), {"tid": tid, "n": count, "dt": doc_type})

    await engine.dispose()
    print()
    print("=" * 55)
    print("✅  Purchase seed complete — Oregenal Electrical India")
    print("=" * 55)
    print()
    print("  Test credentials:")
    print("  admin: rahul@oregenal.com / Admin@1234")
    print("  store: store@oregenal.com / Store@1234")


from decimal import Decimal
if __name__ == "__main__":
    asyncio.run(seed())
