"""Seed the database with demo resources and, if configured, the first admin
account for local development."""

from app.core.config import get_settings
from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.enums import ResourceType, UserRole
from app.models.resource import ResourceUnit
from app.models.user import User

DEMO_RESOURCES = [
    {"name": "Fire Engine 7", "resource_type": ResourceType.VEHICLE, "capability": "fire suppression"},
    {"name": "Ambulance 3", "resource_type": ResourceType.VEHICLE, "capability": "medical transport"},
    {"name": "Rescue Team Alpha", "resource_type": ResourceType.TEAM, "capability": "search and rescue"},
    {"name": "Flood Response Unit", "resource_type": ResourceType.TEAM, "capability": "flood response"},
    {"name": "General Hospital", "resource_type": ResourceType.FACILITY, "capability": "trauma care"},
    {"name": "Water Pump Unit 2", "resource_type": ResourceType.EQUIPMENT, "capability": "flood pumping"},
]


def seed_resources(db) -> None:
    if db.query(ResourceUnit).count() > 0:
        print("Resources already seeded, skipping.")
        return

    for entry in DEMO_RESOURCES:
        db.add(ResourceUnit(**entry, latitude=12.9716, longitude=77.5946))
    db.commit()
    print(f"Seeded {len(DEMO_RESOURCES)} resources.")


def seed_initial_admin(db) -> None:
    """Creates the first admin account from INITIAL_ADMIN_EMAIL/PASSWORD env
    vars, if set and no admin exists yet. Self-registration can never create
    an admin (see auth_service.register_user), so this is the only way to
    bootstrap the first one."""
    settings = get_settings()
    if not settings.initial_admin_email or not settings.initial_admin_password:
        print("INITIAL_ADMIN_EMAIL/PASSWORD not set, skipping admin bootstrap.")
        return

    if db.query(User).filter(User.role == UserRole.ADMIN).count() > 0:
        print("An admin already exists, skipping admin bootstrap.")
        return

    admin = User(
        email=settings.initial_admin_email,
        full_name="Initial Admin",
        role=UserRole.ADMIN,
        hashed_password=hash_password(settings.initial_admin_password),
    )
    db.add(admin)
    db.commit()
    print(f"Created initial admin account: {settings.initial_admin_email}")


def seed() -> None:
    db = SessionLocal()
    try:
        seed_resources(db)
        seed_initial_admin(db)
    finally:
        db.close()


if __name__ == "__main__":
    seed()
