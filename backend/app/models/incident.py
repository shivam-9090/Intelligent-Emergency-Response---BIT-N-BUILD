import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Index, Integer, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base
from app.models.enums import IncidentSource, IncidentStatus, IncidentType, Severity

if TYPE_CHECKING:
    from app.models.alert import Alert
    from app.models.assignment import Assignment


class Incident(Base):
    __tablename__ = "incidents"
    __table_args__ = (
        Index("ix_incidents_status", "status"),
        Index("ix_incidents_reported_at", "reported_at"),
        Index("ix_incidents_incident_type", "incident_type"),
        Index("ix_incidents_severity", "severity"),
        Index("ix_incidents_priority", "priority"),
        Index("ix_incidents_status_reported_at", "status", "reported_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)

    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    source: Mapped[IncidentSource] = mapped_column(Enum(IncidentSource, name="incident_source"))
    incident_type: Mapped[IncidentType] = mapped_column(Enum(IncidentType, name="incident_type"))
    severity: Mapped[Severity] = mapped_column(Enum(Severity, name="severity"), default=Severity.LOW)
    priority: Mapped[int] = mapped_column(Integer, default=3)
    status: Mapped[IncidentStatus] = mapped_column(
        Enum(IncidentStatus, name="incident_status"), default=IncidentStatus.REPORTED
    )

    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)

    duplicate_of_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("incidents.id"), nullable=True)
    duplicate_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    duplicate_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    duplicate_of: Mapped["Incident | None"] = relationship(remote_side=[id])

    reported_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    assignments: Mapped[list["Assignment"]] = relationship(back_populates="incident")
    alerts: Mapped[list["Alert"]] = relationship(back_populates="incident")
