"""Chronological classifier backtest for real, labelled incident history.

Usage: python -m app.ml.backtest_classifier /data/historical_incidents.json
The input must contain description, incident_type, severity, and reported_at.
"""

import json
import sys
from datetime import datetime
from pathlib import Path

from sklearn.metrics import classification_report

from app.ml.train_classifier import build_pipeline

REQUIRED_FIELDS = {"description", "incident_type", "severity", "reported_at"}


def run_backtest(dataset_path: Path, train_fraction: float = 0.8) -> dict:
    records = json.loads(dataset_path.read_text(encoding="utf-8"))
    if not isinstance(records, list) or len(records) < 20:
        raise ValueError("Backtesting requires at least 20 labelled historical incidents.")
    missing = REQUIRED_FIELDS - set(records[0])
    if missing:
        raise ValueError(f"Dataset is missing required fields: {', '.join(sorted(missing))}")

    records.sort(key=lambda item: datetime.fromisoformat(item["reported_at"].replace("Z", "+00:00")))
    split_at = int(len(records) * train_fraction)
    train, holdout = records[:split_at], records[split_at:]
    if not holdout:
        raise ValueError("Chronological holdout is empty.")

    type_model = build_pipeline().fit([item["description"] for item in train], [item["incident_type"] for item in train])
    severity_model = build_pipeline().fit(
        [f"[{item['incident_type']}] {item['description']}" for item in train], [item["severity"] for item in train]
    )
    type_predictions = type_model.predict([item["description"] for item in holdout])
    severity_predictions = severity_model.predict([f"[{item['incident_type']}] {item['description']}" for item in holdout])
    return {
        "method": "chronological holdout; no future incidents in training",
        "train_records": len(train),
        "holdout_records": len(holdout),
        "incident_type": classification_report([item["incident_type"] for item in holdout], type_predictions, output_dict=True, zero_division=0),
        "severity": classification_report([item["severity"] for item in holdout], severity_predictions, output_dict=True, zero_division=0),
    }


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python -m app.ml.backtest_classifier /path/to/historical_incidents.json")
    print(json.dumps(run_backtest(Path(sys.argv[1])), indent=2))
