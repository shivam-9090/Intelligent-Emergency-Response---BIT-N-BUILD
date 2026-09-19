# Backend — Intelligent Emergency Response Platform

FastAPI service. Owned by Shivam (Claude).

## Setup with Docker (recommended)

Starts Postgres, Redis, Adminer, and the API together.

```bash
cd infra/docker
cp ../../backend/.env.example ../../backend/.env
docker compose up -d --build
```

- API: http://localhost:8000 (docs at `/docs`)
- Postgres: `localhost:5433` (user/pass/db: `emergency` / `emergency` / `emergency_db`)
- Redis: `localhost:6380`
- Adminer (DB UI): http://localhost:8081

Stop the stack with `docker compose down` (add `-v` to also drop volumes).

## Setup without Docker

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# point DATABASE_URL / REDIS_URL at services you're running locally
uvicorn app.main:app --reload
```

## Database migrations

```bash
cd backend
alembic revision --autogenerate -m "description"
alembic upgrade head
```

## Tests

```bash
cd backend
pytest
```

## Structure

- `app/api/` — route handlers
- `app/core/` — config, security
- `app/models/` — SQLAlchemy models
- `app/schemas/` — Pydantic schemas
- `app/services/` — business logic (incident intake, resource matching, alerts)
- `app/ml/` — classification, severity scoring, duplicate detection
- `app/db/` — DB session/engine setup
- `alembic/` — database migrations
