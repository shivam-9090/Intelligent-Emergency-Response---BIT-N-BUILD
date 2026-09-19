"""Fetch provenance-preserving public history for scenario research.

This script does not relabel US records as Bengaluru incidents and does not
overwrite the synthetic development dataset. It writes raw source snapshots
under data/external/ for review before any model training.
"""

import argparse
import json
import os
from datetime import UTC, datetime
from pathlib import Path
from urllib.request import urlopen

ROOT = Path(os.environ.get("PROJECT_ROOT", Path(__file__).resolve().parents[2]))
OUTPUT = ROOT / "data" / "external"
SOURCES = {
    "india-flood": "https://zenodo.org/api/records/11275211",
    "fdny-fire": "https://data.cityofnewyork.us/resource/8m42-w767.json?$limit=50000",
}


def fetch_json(url: str) -> object:
    with urlopen(url, timeout=60) as response:  # nosec B310: fixed public sources above
        return json.load(response)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", choices=SOURCES)
    args = parser.parse_args()
    OUTPUT.mkdir(parents=True, exist_ok=True)

    payload = fetch_json(SOURCES[args.source])
    if args.source == "india-flood":
        files = payload.get("files", []) if isinstance(payload, dict) else []
        print("India Flood Inventory metadata downloaded. Available files:")
        for file in files:
            print(f"- {file['key']}: {file['links']['self']}")
        print("Review the source schema before downloading or mapping it to scenario features.")
        return

    target = OUTPUT / "fdny_fire_dispatch_snapshot.json"
    target.write_text(
        json.dumps(
            {
                "source": SOURCES[args.source],
                "retrieved_at": datetime.now(UTC).isoformat(),
                "geography": "New York City; external dispatch benchmark only",
                "records": payload,
            }
        ),
        encoding="utf-8",
    )
    print(f"Wrote {target}")


if __name__ == "__main__":
    main()
