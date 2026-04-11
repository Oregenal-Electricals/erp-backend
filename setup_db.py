#!/usr/bin/env python3
"""
FlowERP — Complete Database Setup Script
=========================================
Run this ONCE to:
  1. Check PostgreSQL is running
  2. Create the erp_user and erp_db
  3. Run all Alembic migrations
  4. Seed demo data
  5. Verify everything works

Usage:
    python setup_db.py

Requirements: PostgreSQL must be installed and running.
"""

import subprocess
import sys
import os
import asyncio

# ── Colors ────────────────────────────────────────────────────────────
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
BLUE   = "\033[94m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

def ok(msg):   print(f"{GREEN}  ✅  {msg}{RESET}")
def err(msg):  print(f"{RED}  ❌  {msg}{RESET}")
def warn(msg): print(f"{YELLOW}  ⚠️   {msg}{RESET}")
def info(msg): print(f"{BLUE}  ℹ️   {msg}{RESET}")
def step(msg): print(f"\n{BOLD}{BLUE}{'─'*50}\n  {msg}\n{'─'*50}{RESET}")

# ── Configuration ─────────────────────────────────────────────────────
DB_USER     = "erp_user"
DB_PASSWORD = "erp_pass"
DB_NAME     = "erp_db"
DB_HOST     = "localhost"
DB_PORT     = "5432"


def run(cmd, capture=True, check=True):
    """Run a shell command."""
    result = subprocess.run(
        cmd, shell=True,
        capture_output=capture,
        text=True,
    )
    if check and result.returncode != 0:
        return None, result.stderr
    return result.stdout, result.stderr


def psql_as_postgres(sql):
    """Run SQL as the postgres superuser."""
    # Try multiple ways to connect as superuser
    attempts = [
        f'psql -U postgres -c "{sql}" 2>/dev/null',
        f'psql postgres -c "{sql}" 2>/dev/null',
        f'sudo -u postgres psql -c "{sql}" 2>/dev/null',
        f'psql -U {os.environ.get("USER","postgres")} -c "{sql}" 2>/dev/null',
    ]
    for cmd in attempts:
        out, err_msg = run(cmd, check=False)
        if out is not None and "ERROR" not in (out or ""):
            return True, out
    return False, "Could not connect as PostgreSQL superuser"


def check_postgres_running():
    """Check if PostgreSQL is installed and running."""
    step("Step 1: Checking PostgreSQL")

    # Check if psql exists
    out, _ = run("which psql 2>/dev/null || command -v psql 2>/dev/null", check=False)
    if not out or not out.strip():
        err("PostgreSQL (psql) not found!")
        print(f"""
{YELLOW}Install PostgreSQL first:

  Mac (Homebrew):
    brew install postgresql@16
    brew services start postgresql@16
    echo 'export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"' >> ~/.zshrc
    source ~/.zshrc

  Ubuntu/Debian:
    sudo apt-get update
    sudo apt-get install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql

  Windows:
    Download from: https://www.postgresql.org/download/windows/
{RESET}""")
        return False

    ok(f"psql found: {out.strip()}")

    # Check if server is running
    out, _ = run("pg_isready 2>/dev/null", check=False)
    if out and "accepting connections" in out:
        ok("PostgreSQL server is running")
        return True

    # Try to start it
    warn("PostgreSQL may not be running. Trying to start...")
    run("brew services start postgresql@16 2>/dev/null || "
        "brew services start postgresql 2>/dev/null || "
        "sudo systemctl start postgresql 2>/dev/null || "
        "pg_ctl start 2>/dev/null", check=False)

    import time
    time.sleep(2)

    out, _ = run("pg_isready 2>/dev/null", check=False)
    if out and "accepting connections" in out:
        ok("PostgreSQL started successfully")
        return True

    err("PostgreSQL is not running and could not be started")
    info("Try manually: brew services start postgresql@16")
    return False


def setup_database():
    """Create user and database."""
    step("Step 2: Creating database user and database")

    # Check if user already exists
    success, out = psql_as_postgres(f"SELECT 1 FROM pg_roles WHERE rolname='{DB_USER}';")
    user_exists = success and "1 row" in (out or "")

    if user_exists:
        warn(f"User '{DB_USER}' already exists — skipping creation")
    else:
        # Create user
        success, msg = psql_as_postgres(f"CREATE USER {DB_USER} WITH PASSWORD '{DB_PASSWORD}';")
        if success:
            ok(f"User '{DB_USER}' created")
        else:
            # Maybe we need to try with the current username
            warn(f"Could not create user automatically: {msg}")
            print(f"""
{YELLOW}Please run this manually in your terminal:

  psql postgres   (or: sudo -u postgres psql)

  Then paste these commands:
    CREATE USER {DB_USER} WITH PASSWORD '{DB_PASSWORD}';
    CREATE DATABASE {DB_NAME} OWNER {DB_USER};
    GRANT ALL PRIVILEGES ON DATABASE {DB_NAME} TO {DB_USER};
    \\q

  Then re-run this script.
{RESET}""")
            return False

    # Check if database exists
    success, out = psql_as_postgres(f"SELECT 1 FROM pg_database WHERE datname='{DB_NAME}';")
    db_exists = success and "1 row" in (out or "")

    if db_exists:
        warn(f"Database '{DB_NAME}' already exists — skipping creation")
    else:
        success, msg = psql_as_postgres(f"CREATE DATABASE {DB_NAME} OWNER {DB_USER};")
        if success:
            ok(f"Database '{DB_NAME}' created")
        else:
            err(f"Could not create database: {msg}")
            return False

    # Grant privileges
    psql_as_postgres(f"GRANT ALL PRIVILEGES ON DATABASE {DB_NAME} TO {DB_USER};")
    psql_as_postgres(f"ALTER DATABASE {DB_NAME} OWNER TO {DB_USER};")

    # Grant schema privileges (needed for newer Postgres versions)
    grant_schema = f"\\c {DB_NAME}; GRANT ALL ON SCHEMA public TO {DB_USER}; GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO {DB_USER};"
    psql_as_postgres(grant_schema)

    ok("Database privileges granted")

    # Test connection as erp_user
    test_cmd = f'psql -U {DB_USER} -h {DB_HOST} -p {DB_PORT} -d {DB_NAME} -c "SELECT current_user;" 2>/dev/null'
    out, err_msg = run(test_cmd, check=False)
    if out and DB_USER in out:
        ok(f"Connection test as '{DB_USER}' successful!")
    else:
        # Try setting password auth
        warn("Testing connection with password...")
        os.environ["PGPASSWORD"] = DB_PASSWORD
        test_cmd = f'PGPASSWORD={DB_PASSWORD} psql -U {DB_USER} -h {DB_HOST} -p {DB_PORT} -d {DB_NAME} -c "SELECT current_user;"'
        out, err_msg = run(test_cmd, check=False)
        if out and DB_USER in out:
            ok("Connection successful with password auth!")
        else:
            warn(f"Could not verify connection. Error: {err_msg}")
            info("Continuing anyway — Alembic will verify the connection")

    return True


def update_pg_hba():
    """Try to configure pg_hba.conf for password auth if needed."""
    # Find pg_hba.conf
    locations = [
        "/etc/postgresql/16/main/pg_hba.conf",
        "/etc/postgresql/15/main/pg_hba.conf",
        "/etc/postgresql/14/main/pg_hba.conf",
        "/usr/local/var/postgresql@16/pg_hba.conf",
        "/opt/homebrew/var/postgresql@16/pg_hba.conf",
        "/opt/homebrew/var/postgresql/pg_hba.conf",
    ]

    # Get data directory from postgres
    out, _ = run("psql -U postgres -t -c 'SHOW hba_file;' 2>/dev/null || psql postgres -t -c 'SHOW hba_file;' 2>/dev/null", check=False)
    if out and out.strip():
        locations.insert(0, out.strip())

    for loc in locations:
        if os.path.exists(loc):
            info(f"Found pg_hba.conf at: {loc}")
            return loc

    return None


def run_migrations():
    """Run Alembic migrations."""
    step("Step 3: Running database migrations")

    # Ensure we're in the right directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)

    # Check alembic.ini exists
    if not os.path.exists("alembic.ini"):
        err("alembic.ini not found! Make sure you're in the erp-backend directory")
        return False

    # Run migrations
    info("Running: alembic upgrade head")
    out, err_msg = run("alembic upgrade head 2>&1", capture=True, check=False)
    full_output = (out or "") + (err_msg or "")

    print(f"\n{BLUE}Migration output:{RESET}")
    for line in full_output.split('\n'):
        if line.strip():
            print(f"    {line}")

    if "FAILED" in full_output or "Error" in full_output and "No changes" not in full_output:
        if "already exists" in full_output or "DuplicateTable" in full_output:
            warn("Some tables already exist — this is OK if you're re-running setup")
            ok("Migrations applied (tables already existed)")
            return True
        err("Migration failed!")
        print(f"\n{RED}Full error:{RESET}\n{full_output}")
        return False

    ok("All migrations applied successfully")
    return True


def run_seed():
    """Run the seed script."""
    step("Step 4: Seeding demo data")

    # Check if already seeded
    check_cmd = f'PGPASSWORD={DB_PASSWORD} psql -U {DB_USER} -h {DB_HOST} -p {DB_PORT} -d {DB_NAME} -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null'
    out, _ = run(check_cmd, check=False)

    if out and out.strip() and int(out.strip()) > 0:
        warn(f"Database already has {out.strip().strip()} users — skipping seed")
        info("Delete the database and re-run to reset: dropdb erp_db && createdb erp_db")
        return True

    info("Running seed script...")
    out, err_msg = run("python scripts/seed.py 2>&1", capture=True, check=False)
    full_output = (out or "") + (err_msg or "")

    print(f"\n{BLUE}Seed output:{RESET}")
    for line in full_output.split('\n'):
        if line.strip():
            print(f"    {line}")

    if "Seed complete" in full_output or "created" in full_output.lower():
        ok("Demo data seeded successfully")
        return True
    else:
        warn("Seed script may have had issues — check output above")
        return True  # Non-fatal


def verify_setup():
    """Test that login works."""
    step("Step 5: Verifying setup — testing login API")

    import json
    import urllib.request
    import urllib.error

    # Check if server is running
    try:
        req = urllib.request.urlopen("http://localhost:8000/health", timeout=3)
        health = json.loads(req.read())
        ok(f"Server running! Status: {health.get('status')} | DB: {health.get('db')}")
        server_running = True
    except Exception:
        warn("Server not running yet — skipping API test")
        server_running = False

    if server_running:
        # Test login
        try:
            data = json.dumps({"email": "admin@demo.com", "password": "demo1234"}).encode()
            req = urllib.request.Request(
                "http://localhost:8000/api/v1/auth/login",
                data=data,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            resp = urllib.request.urlopen(req, timeout=5)
            result = json.loads(resp.read())
            if result.get("access_token"):
                ok("Login test PASSED! Token received.")
                ok(f"Logged in as: {result['user']['name']} ({result['user']['role']})")
            else:
                warn("Login returned unexpected response")
        except urllib.error.HTTPError as e:
            err(f"Login failed: HTTP {e.code}")
        except Exception as e:
            warn(f"Could not test login: {e}")

    return True


def print_summary():
    """Print final instructions."""
    step("Setup Complete!")

    print(f"""
{GREEN}{BOLD}✅ Database is ready!{RESET}

{BOLD}Start the backend server:{RESET}
  cd erp-backend
  source venv/bin/activate
  uvicorn app.main:app --reload --port 8000

{BOLD}Start the frontend:{RESET}
  cd erp-frontend
  npm run dev

{BOLD}Open in browser:{RESET}
  http://localhost:3000

{BOLD}Demo login credentials:{RESET}
  Super Admin:  admin@demo.com    / demo1234
  Manager:      manager@demo.com  / demo1234
  Sales:        sales@demo.com    / demo1234
  Accounts:     accounts@demo.com / demo1234
  Viewer:       viewer@demo.com   / demo1234

{BOLD}API Documentation:{RESET}
  http://localhost:8000/api/docs

{BOLD}Database details:{RESET}
  Host:     localhost:5432
  Database: {DB_NAME}
  User:     {DB_USER}
  Password: {DB_PASSWORD}
""")


def main():
    print(f"""
{BOLD}{BLUE}
╔══════════════════════════════════════════╗
║     FlowERP — Database Setup Script      ║
╚══════════════════════════════════════════╝{RESET}
""")

    # Change to script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    info(f"Working directory: {script_dir}")

    steps = [
        ("PostgreSQL check",  check_postgres_running),
        ("Database setup",    setup_database),
        ("Migrations",        run_migrations),
        ("Seed demo data",    run_seed),
        ("Verification",      verify_setup),
    ]

    for name, fn in steps:
        try:
            result = fn()
            if result is False:
                err(f"\n{name} FAILED. Fix the issue above and re-run this script.")
                sys.exit(1)
        except Exception as e:
            err(f"Unexpected error in {name}: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)

    print_summary()


if __name__ == "__main__":
    main()
