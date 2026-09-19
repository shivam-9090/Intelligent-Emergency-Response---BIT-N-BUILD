# External data staging

External sources are kept separate from `data/synthetic/` and are never called Bengaluru production history.

- India Flood Inventory–Impacts: event-level India flood research source.
- FDNY Fire Incident Dispatch: external dispatch-pattern benchmark only.

Fetch source metadata or a review snapshot with:

```bash
cd backend
python scripts/import_external_history.py india-flood
python scripts/import_external_history.py fdny-fire
```

Review licensing, fields, geography, quality, and missingness before mapping any source to training or scenario features.
