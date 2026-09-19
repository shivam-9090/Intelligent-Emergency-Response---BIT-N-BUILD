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

After source review, map the official flood CSV into an explicitly India-only
scenario file (it is not dispatch training data):

```bash
python scripts/map_india_flood_scenarios.py India_Flood_Inventory_v3.csv /tmp/india_flood_scenarios.json
```

Profile every reviewed source before it enters analytics or experimentation:

```bash
python scripts/profile_external_dataset.py INPUT.csv --source "source name" --date-field "Start Date" --id-field UEI
```

Review licensing, fields, geography, quality, and missingness before mapping any source to training or scenario features.
