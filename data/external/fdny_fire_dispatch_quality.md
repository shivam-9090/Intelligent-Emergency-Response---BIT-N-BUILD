# FDNY Fire Incident Dispatch benchmark: initial quality profile

Snapshot profile: 50,000 public records fetched on 2026-09-20 through the
Socrata API. The raw snapshot is intentionally ignored by Git and can be
reproduced with `python backend/scripts/import_external_history.py fdny-fire`.

## Available fields

- `incident_datetime`: 50,000 / 50,000 populated
- `first_activation_datetime`, `first_assignment_datetime`, `first_on_scene_datetime`
- `dispatch_response_seconds_qy`, `incident_response_seconds_qy`, and
  `incident_travel_tm_seconds_qy`
- `incident_classification` and `incident_classification_group`
- borough, ZIP, alarm-box, district, unit-count, and validity-indicator fields

## Suitable use

Use this source to test chronological demand aggregation, response/travel-time
analytics, missing-data handling, and alert-threshold methodology.

## Prohibited use

Do not train or present it as Bengaluru geography, demand, ETA, staffing, or
operational evidence. It is an external fire-dispatch benchmark only.
