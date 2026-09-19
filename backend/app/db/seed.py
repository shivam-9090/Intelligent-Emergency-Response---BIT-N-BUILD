"""Seed the database with a handful of demo resources for local development."""

from app.db.session import SessionLocal
from app.models.enums import ResourceType
from app.models.resource import ResourceUnit

DEMO_RESOURCES = [
    {"name": "Fire Engine 7", "resource_type": ResourceType.VEHICLE, "capability": "fire suppression"},
    {"name": "Ambulance 3", "resource_type": ResourceType.VEHICLE, "capability": "medical transport"},
    {"name": "Rescue Team Alpha", "resource_type": ResourceType.TEAM, "capability": "search and rescue"},
    {"name": "Flood Response Unit", "resource_type": ResourceType.TEAM, "capability": "flood response"},
    {"name": "General Hospital", "resource_type": ResourceType.FACILITY, "capability": "trauma care"},
    {"name": "Water Pump Unit 2", "resource_type": ResourceType.EQUIPMENT, "capability": "flood pumping"},
]


def seed() -> None:
    db = SessionLocal()
    try:
        if db.query(ResourceUnit).count() > 0:
            print("Resources already seeded, skipping.")
            return

        for entry in DEMO_RESOURCES:
            db.add(ResourceUnit(**entry, latitude=12.9716, longitude=77.5946))
        db.commit()
        print(f"Seeded {len(DEMO_RESOURCES)} resources.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
