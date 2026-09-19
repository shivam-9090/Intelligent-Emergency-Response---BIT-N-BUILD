# Backend — Intelligent Emergency Response Platform

FastAPI service. Owned by Shivam (Claude).

## Setup with Docker (recommended)

Starts Postgres, Redis, Adminer, and the API together.

```bash
cd infra/docker
cp ../../backend/.env.example ../../backend/.env
docker compose up -d --build
```

- API: http://localhost:8001 (docs at `/docs`)
- Postgres: `localhost:5433` (user/pass/db: `emergency` / `emergency` / `emergency_db`)
- Redis: `localhost:6380`
- Adminer (DB UI): http://localhost:8081

Stop the stack with `docker compose down` (add `-v` to also drop volumes).

## Setup without Docker

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
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

## Quality checks

Run the same checks CI runs, before pushing:

```bash
cd backend
make check     # lint + typecheck + test
make fmt       # auto-fix lint issues and formatting
```

Individually: `make lint`, `make typecheck`, `make test`.

If you're working inside the running Docker container instead of a local venv:

```bash
docker exec emergency-backend pip install -r requirements-dev.txt
docker exec emergency-backend make check
```

## CI/CD

`.github/workflows/backend-ci.yml` runs on every PR/push touching `backend/**`, targeting `main`, `develop`, and `develop-ved`:

- `lint` — ruff check + format check
- `typecheck` — mypy
- `test` — pytest with coverage
- `docker-build` — verifies the production image builds

All four must pass before a PR can merge into a protected branch (`main`, `develop`, `develop-ved` all require this check).

## Structure

- `app/api/` — route handlers
- `app/core/` — config, security
- `app/models/` — SQLAlchemy models
- `app/schemas/` — Pydantic schemas
- `app/services/` — business logic (incident intake, resource matching, alerts)
- `app/ml/` — classification, severity scoring, duplicate detection
- `app/db/` — DB session/engine setup
- `alembic/` — database migrations
- `tests/` — pytest suite (mirrors `app/` structure)
- `pyproject.toml` — ruff and mypy configuration
- `Makefile` — local lint/typecheck/test commands matching CI
