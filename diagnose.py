#!/usr/bin/env python3
"""
FlowERP — Connection Diagnostics
==================================
Run this to see EXACTLY what's wrong:
    python diagnose.py
"""
import subprocess, sys, os, socket

G = "\033[92m"; R = "\033[91m"; Y = "\033[93m"; B = "\033[94m"; BOLD="\033[1m"; E = "\033[0m"
ok  = lambda m: print(f"{G}  ✅  {m}{E}")
err = lambda m: print(f"{R}  ❌  {m}{E}")
warn= lambda m: print(f"{Y}  ⚠️   {m}{E}")
info= lambda m: print(f"{B}  ℹ️   {m}{E}")

print(f"\n{BOLD}{B}FlowERP — Database Diagnostics{E}\n")

# ── 1. Python version ─────────────────────────────────────────────────
info(f"Python: {sys.version.split()[0]} at {sys.executable}")

# ── 2. psql installed? ────────────────────────────────────────────────
r = subprocess.run("which psql", shell=True, capture_output=True, text=True)
if r.returncode == 0:
    ok(f"psql found: {r.stdout.strip()}")
    r2 = subprocess.run("psql --version", shell=True, capture_output=True, text=True)
    info(f"  Version: {r2.stdout.strip()}")
else:
    err("psql NOT found — PostgreSQL is not installed")
    print(f"\n{Y}  Install it:\n  Mac:   brew install postgresql@16 && brew services start postgresql@16\n  Linux: sudo apt install postgresql && sudo service postgresql start{E}\n")
    sys.exit(1)

# ── 3. PostgreSQL running? ────────────────────────────────────────────
r = subprocess.run("pg_isready", shell=True, capture_output=True, text=True)
if "accepting connections" in r.stdout:
    ok("PostgreSQL is running")
    info(f"  {r.stdout.strip()}")
else:
    err("PostgreSQL is NOT running")
    print(f"\n{Y}  Start it:\n  Mac:   brew services start postgresql@16\n  Linux: sudo service postgresql start{E}\n")

# ── 4. Port 5432 open? ────────────────────────────────────────────────
try:
    s = socket.create_connection(("localhost", 5432), timeout=2)
    s.close()
    ok("Port 5432 is open")
except Exception as e:
    err(f"Port 5432 is NOT reachable: {e}")

# ── 5. Can we connect as postgres? ───────────────────────────────────
attempts = [
    ("psql -U postgres", 'psql -U postgres -c "SELECT current_user;" 2>&1'),
    ("psql postgres",    'psql postgres -c "SELECT current_user;" 2>&1'),
    ("sudo -u postgres", 'sudo -u postgres psql -c "SELECT current_user;" 2>&1'),
]

pg_super = None
for label, cmd in attempts:
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    combined = r.stdout + r.stderr
    if "postgres" in combined.lower() and "error" not in combined.lower():
        ok(f"Superuser connection works via: {label}")
        pg_super = label
        break
    else:
        warn(f"  {label}: {combined.strip()[:80]}")

if not pg_super:
    err("Cannot connect as PostgreSQL superuser")
    print(f"""
{Y}  This is the most common issue. Try:

  1. Find your PostgreSQL user:
       ls /etc/postgresql/   (Linux)
       brew info postgresql@16 | grep "superuser"   (Mac)

  2. Connect manually:
       sudo -u postgres psql   (Linux)
       psql postgres            (Mac)

  3. Then create the user:
       CREATE USER erp_user WITH PASSWORD 'erp_pass';
       CREATE DATABASE erp_db OWNER erp_user;
       GRANT ALL PRIVILEGES ON DATABASE erp_db TO erp_user;
       \\q
{E}""")

# ── 6. Does erp_user exist? ───────────────────────────────────────────
if pg_super:
    cmd_prefix = pg_super.replace("psql -U postgres", "psql -U postgres").replace("psql postgres", "psql postgres")
    r = subprocess.run(
        f"{pg_super} -t -c \"SELECT 1 FROM pg_roles WHERE rolname='erp_user';\" 2>&1",
        shell=True, capture_output=True, text=True
    )
    if "1" in r.stdout:
        ok("User 'erp_user' EXISTS")
    else:
        err("User 'erp_user' does NOT exist")
        print(f"{Y}  Run: CREATE USER erp_user WITH PASSWORD 'erp_pass';{E}")

# ── 7. Does erp_db exist? ─────────────────────────────────────────────
if pg_super:
    r = subprocess.run(
        f"{pg_super} -t -c \"SELECT 1 FROM pg_database WHERE datname='erp_db';\" 2>&1",
        shell=True, capture_output=True, text=True
    )
    if "1" in r.stdout:
        ok("Database 'erp_db' EXISTS")
    else:
        err("Database 'erp_db' does NOT exist")
        print(f"{Y}  Run: CREATE DATABASE erp_db OWNER erp_user;{E}")

# ── 8. Can erp_user connect? ──────────────────────────────────────────
r = subprocess.run(
    "PGPASSWORD=erp_pass psql -U erp_user -h localhost -d erp_db -c \"SELECT current_user;\" 2>&1",
    shell=True, capture_output=True, text=True
)
combined = r.stdout + r.stderr
if "erp_user" in combined:
    ok("erp_user can connect to erp_db! ✨")
elif "authentication failed" in combined:
    err("erp_user authentication failed — wrong password in pg_hba.conf")
    print(f"{Y}  Fix pg_hba.conf to allow md5/scram auth, or run:\n  ALTER USER erp_user WITH PASSWORD 'erp_pass';{E}")
elif "does not exist" in combined:
    err("erp_user or erp_db doesn't exist")
else:
    warn(f"Connection result: {combined.strip()[:120]}")

# ── 9. Tables exist? ─────────────────────────────────────────────────
r = subprocess.run(
    "PGPASSWORD=erp_pass psql -U erp_user -h localhost -d erp_db -t -c \"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';\" 2>&1",
    shell=True, capture_output=True, text=True
)
combined = r.stdout + r.stderr
try:
    count = int(combined.strip())
    if count > 0:
        ok(f"Database has {count} tables — migrations have been run")
    else:
        warn("Database is empty — need to run migrations")
        print(f"{Y}  Run: alembic upgrade head{E}")
except:
    warn(f"Could not check tables: {combined.strip()[:80]}")

# ── 10. Python packages ───────────────────────────────────────────────
print(f"\n{BOLD}Python packages:{E}")
packages = ["fastapi", "sqlalchemy", "asyncpg", "alembic", "passlib", "jose", "pydantic"]
for pkg in packages:
    try:
        __import__(pkg.replace("-","_"))
        ok(f"  {pkg}")
    except ImportError:
        err(f"  {pkg} — NOT INSTALLED")
        print(f"    Run: pip install {pkg}")

# ── 11. .env file ─────────────────────────────────────────────────────
print(f"\n{BOLD}.env file:{E}")
env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_path):
    ok(f".env found at: {env_path}")
    with open(env_path) as f:
        for line in f:
            if "DATABASE_URL" in line and not line.startswith("#"):
                info(f"  {line.strip()}")
else:
    err(".env NOT found!")
    print(f"{Y}  Create it: cp .env.example .env (or create manually){E}")

print(f"\n{BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{E}")
print(f"{BOLD}Next steps:{E}")
print("  1. Fix any ❌ issues above")
print("  2. Run: python setup_db.py")
print("  3. Run: alembic upgrade head")
print("  4. Run: python scripts/seed.py")
print("  5. Run: uvicorn app.main:app --reload")
print(f"{BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{E}\n")
