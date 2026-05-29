# FlowERP Backend

Modular, configurable ERP platform built with **FastAPI + PostgreSQL + Celery**.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Web Framework | FastAPI 0.111 |
| Database | PostgreSQL 16 + SQLAlchemy 2.0 (async) |
| Migrations | Alembic |
| Auth | JWT (python-jose) + bcrypt |
| Background Jobs | Celery + Redis |
| PDF Generation | WeasyPrint + Jinja2 |
| File Storage | AWS S3 |
| Email | AWS SES |

---

## Quick Start (Local — No Docker)

### 1. Prerequisites
- Python 3.11+
- PostgreSQL 16 running locally
- Redis running locally

### 2. Install dependencies
```bash
cd erp-backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configure environment
```bash
cp .env .env.local
# Edit .env — set DATABASE_URL, SECRET_KEY
```

### 4. Create database
```bash
psql -U postgres
CREATE USER erp_user WITH PASSWORD 'erp_pass';
CREATE DATABASE erp_db OWNER erp_user;
GRANT ALL PRIVILEGES ON DATABASE erp_db TO erp_user;
\q
```

### 5. Run migrations
```bash
make migrate
```

### 6. Seed demo data
```bash
make seed
```

### 7. Start the server
```bash
make dev
```

API is live at: **http://localhost:8000**
Swagger docs:   **http://localhost:8000/api/docs**

---

## Quick Start (Docker — Full Stack)

```bash
cd erp-backend
make docker-up
make migrate
make seed
```

Everything runs in containers — API, DB, Redis, Celery workers, Beat scheduler.

---

## Project Structure

```
erp-backend/
├── app/
│   ├── core/
│   │   ├── config.py         # Pydantic settings (reads .env)
│   │   ├── database.py       # Async SQLAlchemy engine + session
│   │   ├── security.py       # JWT + password hashing
│   │   ├── dependencies.py   # FastAPI dependencies (auth, pagination)
│   │   └── exceptions.py     # Custom exceptions + handlers
│   ├── engines/
│   │   └── workflow.py       # Workflow rule evaluator
│   ├── models/
│   │   ├── tenant.py         # Tenant model
│   │   ├── user.py           # User, Role, Department
│   │   ├── customization.py  # FieldDefinition, FormConfig, StatusConfig
│   │   └── engines.py        # WorkflowRule, ApprovalChain, AuditLog
│   ├── modules/
│   │   ├── auth/router.py    # Login, refresh, users CRUD
│   │   └── config/router.py  # Custom fields, statuses CRUD
│   ├── schemas/
│   │   ├── auth.py           # Request/response Pydantic schemas
│   │   └── common.py         # Shared schemas (pagination, responses)
│   └── main.py               # App factory
├── migrations/
│   ├── env.py                # Alembic async environment
│   └── versions/
│       └── 001_initial_schema.py
├── workers/
│   └── tasks.py              # Celery tasks
├── scripts/
│   └── seed.py               # Demo data seeder
├── tests/
│   └── test_auth/
│       └── test_login.py
├── docker/
│   └── Dockerfile
├── docker-compose.yml
├── alembic.ini
├── requirements.txt
├── Makefile
└── .env
```

---

## API Overview

Base URL: `/api/v1`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/login` | POST | Login → returns JWT tokens |
| `/auth/refresh` | POST | Refresh access token |
| `/auth/me` | GET | Current user info |
| `/auth/logout` | POST | Logout |
| `/users/` | GET | List users (admin) |
| `/users/` | POST | Create user (admin) |
| `/config/fields` | GET/POST | Custom field management |
| `/config/statuses` | GET/POST | Status config management |
| `/health` | GET | Health check |

---

## Demo Accounts

After running `make seed`:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@demo.com | demo1234 |
| Manager | manager@demo.com | demo1234 |
| Sales | sales@demo.com | demo1234 |
| Accounts | accounts@demo.com | demo1234 |
| Viewer | viewer@demo.com | demo1234 |

---

## Development Commands

```bash
make dev          # Start dev server
make migrate      # Apply migrations
make seed         # Seed demo data
make test         # Run tests
make worker       # Start Celery worker
make docker-up    # Full Docker stack
make reset-db     # Wipe + re-seed database
```
# Railway deploy
