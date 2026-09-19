# Backend — Intelligent Emergency Response Platform

FastAPI service. Owned by Shivam (Claude).

## Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

## Structure

- `app/api/` — route handlers
- `app/core/` — config, security
- `app/models/` — SQLAlchemy models
- `app/schemas/` — Pydantic schemas
- `app/services/` — business logic (incident intake, resource matching, alerts)
- `app/ml/` — classification, severity scoring, duplicate detection
- `app/db/` — DB session/engine setup
