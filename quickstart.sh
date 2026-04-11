#!/bin/bash
# ╔══════════════════════════════════════════════════════════════╗
# ║         FlowERP — Quick Start Script (Mac/Linux)             ║
# ║  Run from the erp-backend directory:  bash quickstart.sh     ║
# ╚══════════════════════════════════════════════════════════════╝

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

ok()   { echo -e "${GREEN}  ✅  $1${NC}"; }
err()  { echo -e "${RED}  ❌  $1${NC}"; }
warn() { echo -e "${YELLOW}  ⚠️   $1${NC}"; }
info() { echo -e "${BLUE}  ℹ️   $1${NC}"; }
step() { echo -e "\n${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n  $1\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }

echo -e "${BOLD}${BLUE}"
echo "╔══════════════════════════════════════════╗"
echo "║     FlowERP — Quick Start               ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# ── Ensure we're in the right directory ──────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
info "Working directory: $SCRIPT_DIR"

# ── Step 1: Check Python venv ─────────────────────────────────────────
step "Step 1: Python virtual environment"
if [ -d "venv" ]; then
  ok "venv found"
  source venv/bin/activate
else
  warn "No venv found — creating one"
  python3 -m venv venv
  source venv/bin/activate
  ok "venv created and activated"
fi

# Install/upgrade dependencies quietly
info "Installing dependencies..."
pip install -r requirements.txt -q --upgrade 2>/dev/null || pip install -r requirements.txt -q
ok "Dependencies installed"

# ── Step 2: Check PostgreSQL ──────────────────────────────────────────
step "Step 2: PostgreSQL check"

if ! command -v psql &> /dev/null; then
  err "PostgreSQL not installed!"
  echo ""
  echo -e "${YELLOW}Install it:${NC}"
  echo "  Mac:    brew install postgresql@16 && brew services start postgresql@16"
  echo "  Linux:  sudo apt-get install postgresql && sudo service postgresql start"
  exit 1
fi
ok "psql found: $(which psql)"

# Check if running
if pg_isready -q 2>/dev/null; then
  ok "PostgreSQL is running"
else
  warn "PostgreSQL not running — trying to start..."
  brew services start postgresql@16 2>/dev/null || \
  brew services start postgresql 2>/dev/null || \
  sudo systemctl start postgresql 2>/dev/null || \
  pg_ctl start 2>/dev/null || true
  sleep 2
  if pg_isready -q 2>/dev/null; then
    ok "PostgreSQL started"
  else
    err "PostgreSQL could not be started. Start it manually and re-run."
    exit 1
  fi
fi

# ── Step 3: Create database user and DB ───────────────────────────────
step "Step 3: Database setup"

DB_USER="erp_user"
DB_PASS="erp_pass"
DB_NAME="erp_db"

create_db() {
  # Try different superuser connection methods
  for PG_CMD in "psql -U postgres" "psql postgres" "sudo -u postgres psql"; do
    if $PG_CMD -c "SELECT 1;" &>/dev/null 2>&1; then
      echo "$PG_CMD"
      return 0
    fi
  done
  return 1
}

PG_SUPER=$(create_db 2>/dev/null) || PG_SUPER=""

if [ -n "$PG_SUPER" ]; then
  # Create user if not exists
  USER_EXISTS=$($PG_SUPER -t -c "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER';" 2>/dev/null | tr -d ' \n')
  if [ "$USER_EXISTS" = "1" ]; then
    warn "User '$DB_USER' already exists"
  else
    $PG_SUPER -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null && ok "User '$DB_USER' created"
  fi

  # Create DB if not exists
  DB_EXISTS=$($PG_SUPER -t -c "SELECT 1 FROM pg_database WHERE datname='$DB_NAME';" 2>/dev/null | tr -d ' \n')
  if [ "$DB_EXISTS" = "1" ]; then
    warn "Database '$DB_NAME' already exists"
  else
    $PG_SUPER -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null && ok "Database '$DB_NAME' created"
  fi

  # Grant privileges
  $PG_SUPER -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null
  $PG_SUPER -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;" 2>/dev/null || true
  ok "Privileges granted"
else
  warn "Could not connect as PostgreSQL superuser automatically."
  echo ""
  echo -e "${YELLOW}Run these commands manually in your terminal:${NC}"
  echo ""
  echo "  psql postgres"
  echo "  # Then paste:"
  echo "  CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"
  echo "  CREATE DATABASE $DB_NAME OWNER $DB_USER;"
  echo "  GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
  echo "  \\q"
  echo ""
  read -p "Press ENTER after running the commands above to continue..."
fi

# Test connection
if PGPASSWORD=$DB_PASS psql -U $DB_USER -h localhost -d $DB_NAME -c "SELECT 1;" &>/dev/null 2>&1; then
  ok "Database connection test PASSED"
else
  warn "Connection test inconclusive — continuing (Alembic will confirm)"
fi

# ── Step 4: Alembic migrations ────────────────────────────────────────
step "Step 4: Running migrations"

info "Running: alembic upgrade head"
if alembic upgrade head 2>&1; then
  ok "All migrations applied"
else
  warn "Migration had issues — checking if tables already exist..."
  # Try checking if the key table exists
  if PGPASSWORD=$DB_PASS psql -U $DB_USER -h localhost -d $DB_NAME -c "\dt tenants" 2>/dev/null | grep -q "tenants"; then
    ok "Tables already exist — migration state is fine"
  else
    err "Migration failed and tables don't exist. Check the error above."
    exit 1
  fi
fi

# ── Step 5: Seed data ─────────────────────────────────────────────────
step "Step 5: Seeding demo data"

# Check if already seeded
USER_COUNT=$(PGPASSWORD=$DB_PASS psql -U $DB_USER -h localhost -d $DB_NAME -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' \n' || echo "0")

if [ "$USER_COUNT" -gt "0" ] 2>/dev/null; then
  warn "Already seeded ($USER_COUNT users found) — skipping"
else
  info "Running seed script..."
  python scripts/seed.py
fi

# ── Step 6: Start server ──────────────────────────────────────────────
step "Step 6: Starting backend server"

# Kill any existing server on port 8000
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
sleep 1

ok "Starting uvicorn on http://localhost:8000"
info "Press Ctrl+C to stop"
echo ""
echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}${BOLD}  Backend: http://localhost:8000${NC}"
echo -e "${GREEN}${BOLD}  API Docs: http://localhost:8000/api/docs${NC}"
echo -e "${GREEN}${BOLD}  Login: admin@demo.com / demo1234${NC}"
echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
