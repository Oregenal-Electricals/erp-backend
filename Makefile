# ── FlowERP Backend Makefile ──────────────────────────────────────────
.PHONY: help install dev docker-up docker-down migrate seed test lint

help:
	@echo ""
	@echo "FlowERP Backend — Developer Commands"
	@echo "────────────────────────────────────"
	@echo "  make install      Install Python dependencies"
	@echo "  make dev          Start dev server (uvicorn --reload)"
	@echo "  make docker-up    Start full stack (DB + Redis + API + Workers)"
	@echo "  make docker-down  Stop all containers"
	@echo "  make migrate      Run Alembic migrations"
	@echo "  make seed         Seed demo data"
	@echo "  make test         Run tests with pytest"
	@echo "  make lint         Run ruff linter"
	@echo "  make worker       Start Celery worker"
	@echo ""

install:
	pip install --upgrade pip
	pip install -r requirements.txt

dev:
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

docker-up:
	docker compose up -d --build
	@echo "✅  Stack started. API at http://localhost:8000"
	@echo "    Docs at http://localhost:8000/api/docs"

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f api

db-shell:
	docker compose exec db psql -U erp_user -d erp_db

migrate:
	alembic upgrade head
	@echo "✅  Migrations applied"

migrate-new:
	@read -p "Migration name: " name; alembic revision --autogenerate -m "$$name"

migrate-down:
	alembic downgrade -1

seed:
	python scripts/seed.py

reset-db:
	alembic downgrade base
	alembic upgrade head
	python scripts/seed.py
	@echo "✅  Database reset and seeded"

test:
	pytest tests/ -v --asyncio-mode=auto

test-cov:
	pytest tests/ -v --asyncio-mode=auto --cov=app --cov-report=html

lint:
	ruff check app/ --fix

format:
	black app/ tests/ scripts/ workers/

worker:
	celery -A workers.tasks.celery_app worker --loglevel=info -Q notifications,emails,documents,automations

beat:
	celery -A workers.tasks.celery_app beat --loglevel=info

flower:
	celery -A workers.tasks.celery_app flower --port=5555
