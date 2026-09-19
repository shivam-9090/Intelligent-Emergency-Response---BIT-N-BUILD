# RESPONDR / COMMAND

**Emergency operations command center for consolidating reports, triaging risk, coordinating resources, and keeping dispatchers informed.**

Built for **PS-9: Intelligent Emergency Response & Resource Coordination Platform**.

> Status: hackathon prototype for simulation, evaluation, and controlled demonstrations—not live public-safety dispatch.

## What it does

- Consolidates citizen, field-team, sensor, hospital, government, and emergency-call reports.
- Classifies incident type, severity, and priority with ML-assisted safety floors.
- Detects duplicate reports with an auditable similarity score and reason.
- Recommends teams, vehicles, equipment, and facilities; includes fleet optimization.
- Shows incidents, resource readiness, alerts, response delays, and capacity in a map-first dashboard.
- Creates critical, delayed-response, and escalation alerts; authenticated operators receive WebSocket events.

## Model boundary

The demand layer is a **scenario KDE with heuristic temporal weighting**. It is not calibrated or validated as a Bengaluru prediction model.

- The UI calls it a scenario and asks operators to validate before dispatch.
- Training artifacts store holdout metrics, model version, training time, and dataset SHA-256.
- `backend/app/ml/backtest_classifier.py` runs chronological holdout evaluation on real labelled history.
- Public external data remains separate from synthetic data and is never represented as Bengaluru dispatch history.

## Data provenance

| Source | Repository use | Boundary |
|---|---|---|
| `data/synthetic/` | Local development and repeatable tests | Synthetic, not operational evidence |
| India Flood Inventory–Impacts (IIT Delhi) | India flood scenario research | Flood-focused, not dispatch/ETA history |
| FDNY Fire Incident Dispatch | External dispatch-pattern benchmark | New York City only, never Bengaluru data |

Fetch review snapshots without committing external records:

```bash
cd backend
python scripts/import_external_history.py india-flood
python scripts/import_external_history.py fdny-fire
```

See [external-data guidance](data/external/README.md) before importing any source. Production calibration requires governed local incident, assignment, arrival-time, and outcome data.

## Run locally

```bash
cp backend/.env.example backend/.env
cd infra/docker
docker compose up -d --build
```

- Dashboard: `http://localhost:5173`
- API/docs: `http://localhost:8001/docs`
- Adminer: `http://localhost:8081`

Apply migrations after pulling updates:

```bash
cd backend
alembic upgrade head
```

### Operator live session

The public dashboard is viewable without login. Select **Connect live** and sign in with a provisioned dispatcher or administrator account to activate authenticated WebSocket updates. **Live connected** signs out and clears the active browser token.

## Quality checks

```bash
cd frontend && npm run lint && npm run build
cd ../backend && make check
```

## Repository map

```text
backend/       FastAPI API, models, migrations, ML, tests
frontend/      React + TypeScript command center
data/          synthetic, facilities, sensors, external-data staging
infra/docker/  local Docker environment
STATEMENT.MD   original hackathon statement
```

## Deployment safety

- Use a strong `SECRET_KEY` outside development and configure CORS for the deployed dashboard origin.
- SMTP is currently best-effort; delivery guarantees require a persisted outbox/retry worker and provider monitoring.
- Do not connect this prototype to live emergency dispatch without security, governance, reliability, and domain validation.
