"""
Run this script to:
1. Check current gate permissions in the DB
2. Fix them if missing
"""
import asyncio, os, sys

def load_env():
    env_path = '/Users/sidarthakumar/Desktop/websites/erp/erp-backend/.env'
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, _, v = line.partition('=')
                    os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

load_env()

import sqlalchemy as sa
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.environ['DATABASE_URL']

GATE_PERMS = {
    'gate_guard':    '["view","create"]',
    'store_manager': '["view","create","edit","approve"]',
    'iqc_inspector': '["view"]',
    'admin':         '["view","create","edit","delete","approve","export"]',
    'super_admin':   '["view","create","edit","delete","approve","export"]',
}

async def main():
    engine = create_async_engine(DATABASE_URL, echo=False)

    async with engine.begin() as conn:
        # Step 1 — show current state
        print("=== CURRENT GATE PERMISSIONS IN DATABASE ===")
        rows = (await conn.execute(sa.text(
            "SELECT slug, permissions::json->'gate' as gate "
            "FROM roles ORDER BY slug"
        ))).fetchall()

        for slug, gate in rows:
            status = "✅" if gate else "🔴 MISSING"
            print(f"  {status} {slug:20} gate: {gate}")

        # Step 2 — fix missing ones
        print()
        print("=== FIXING MISSING GATE PERMISSIONS ===")
        for slug, perms_json in GATE_PERMS.items():
            result = await conn.execute(sa.text(
                "UPDATE roles SET permissions = "
                "(COALESCE(permissions, '{}')::jsonb || "
                "(:gate_val)::jsonb)::json "
                "WHERE slug = :slug "
                "AND (permissions::jsonb -> 'gate') IS NULL"
            ), {"gate_val": '{"gate":' + perms_json + '}', "slug": slug})
            if result.rowcount > 0:
                print(f"  ✅ Fixed: {slug} → gate: {perms_json}")
            else:
                print(f"  ✓  Already OK: {slug}")

        # Step 3 — verify
        print()
        print("=== AFTER FIX ===")
        rows = (await conn.execute(sa.text(
            "SELECT slug, permissions::json->'gate' as gate "
            "FROM roles ORDER BY slug"
        ))).fetchall()
        for slug, gate in rows:
            status = "✅" if gate else "🔴 STILL MISSING"
            print(f"  {status} {slug:20} gate: {gate}")

    await engine.dispose()
    print()
    print("Done. Now:")
    print("  1. Clear browser localStorage: localStorage.removeItem('erp-auth')")
    print("  2. Login again as gate@oregenal.com / Gate@1234")
    print("  3. The 'Log Visitor' button should now appear")

asyncio.run(main())