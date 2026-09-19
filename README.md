# PS-9 — Intelligent Emergency Response & Resource Coordination Platform

State-level hackathon project (BIT-N-BUILD). Collects emergency incident data from multiple sources, classifies severity/priority, detects duplicates, recommends resources, and coordinates response in real time.

See [STATEMENT.MD](./STATEMENT.MD) for the full problem statement.

## Team

- Shivam Vaghani — Backend, AI/ML, Infra, DB (branch: `develop`)
- Ved Goyani — Frontend / other scope (branch: `develop-ved`)

## Branch strategy

- `main` — protected, deploy-ready only
- `develop` — Shivam's integration branch
- `develop-ved` — Ved's integration branch

Feature branches off `develop` or `develop-ved`, PR back into the owner's branch, then periodically merge into `main` after review.

## Stack

- **Backend**: FastAPI (Python)
- **AI/ML**: Python, scikit-learn, LLM APIs (classification, severity estimation, duplicate detection, summarization)
- **Frontend**: React
- **Database**: PostgreSQL
- **Maps**: OpenStreetMap / Leaflet / MapLibre
- **Real-time**: WebSockets
- **Notifications**: email / SMS / push

## Project layout

```
backend/        FastAPI service (API, ML, DB models, services)
frontend/       React app
infra/          Docker, deployment config
data/           Synthetic/sensor datasets
docs/           Architecture notes, API docs
.github/        CI workflows
```

## Getting started

See [backend/README.md](./backend/README.md) and [frontend/README.md](./frontend/README.md) (to be added by owning team member).
