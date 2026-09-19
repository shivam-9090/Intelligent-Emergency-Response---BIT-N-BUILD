<div align="center">

<img src="https://raw.githubusercontent.com/twbs/icons/main/icons/broadcast-pin.svg" width="56" height="56" alt="platform icon" />

# Intelligent Emergency Response & Resource Coordination Platform

**A unified platform for real-time emergency intake, classification, and resource coordination.**

![Status](https://img.shields.io/badge/status-in--development-orange)
![Hackathon](https://img.shields.io/badge/state--level-hackathon-blueviolet)
![Backend](https://img.shields.io/badge/backend-FastAPI-009688)
![Frontend](https://img.shields.io/badge/frontend-React-61DAFB)
![Database](https://img.shields.io/badge/database-PostgreSQL-336791)
![License](https://img.shields.io/badge/license-TBD-lightgrey)

</div>

---

## Overview

During large-scale emergencies, incident information arrives from many disconnected sources — emergency calls, citizen reports, field teams, sensors, hospitals, and government departments. This fragmentation slows down situational awareness and delays coordinated response.

This platform consolidates incoming reports into a single operational picture. It classifies incidents, estimates severity, detects duplicate or related reports, and recommends the appropriate emergency teams, vehicles, equipment, and facilities — all surfaced through a real-time monitoring dashboard.

Built for a state-level hackathon submission.

## Core capabilities

- **Multi-source incident intake** — citizen reports, sensor feeds, emergency calls, and field team updates funneled into one pipeline.
- **AI-driven classification** — incident type, severity estimation, and priority assignment.
- **Duplicate detection** — consolidates related reports of the same event into a single incident record.
- **Resource recommendation** — matches incidents to the nearest suitable teams, vehicles, equipment, and facilities.
- **Real-time dashboard** — live view of active emergencies, severity, assigned teams, and response status.
- **Alerts and escalation** — flags critical incidents, delayed responses, and cases requiring escalation.
- **AI-generated summaries** — concise situational briefings and recommendations for response teams.
- **Analytics** — trends across incident types, response delays, resource shortages, and frequently affected areas.
- **Notifications** — timely updates delivered to emergency personnel and relevant authorities.

## Tech stack

| Layer | Technology |
|---|---|
| Backend | FastAPI (Python) |
| AI / ML | Python, scikit-learn, LLM APIs |
| Frontend | React |
| Database | PostgreSQL |
| Maps | OpenStreetMap, Leaflet / MapLibre |
| Real-time | WebSockets |
| Notifications | Email, SMS, push |

## Repository structure

```
backend/        FastAPI service — API, ML pipeline, database models, business logic
frontend/       React application
infra/          Docker and deployment configuration
data/           Synthetic and sensor datasets used for development
docs/           Architecture notes and design documentation
.github/        CI workflows
```

## Getting started

Backend setup instructions are in [backend/README.md](./backend/README.md).
Frontend setup instructions are in [frontend/README.md](./frontend/README.md).

## Team and branching

| Branch | Owner | Scope |
|---|---|---|
| `main` | Protected | Stable, deploy-ready code only |
| `develop` | Shivam Vaghani | Backend, AI/ML, database, infrastructure |
| `develop-ved` | Ved Goyani | Frontend and related scope |

Feature work branches off the relevant owner branch, is submitted as a pull request, reviewed, and merged back before periodic integration into `main`.

## Contributing

This repository is maintained by a two-person team for hackathon submission. External contributions are not currently accepted.
