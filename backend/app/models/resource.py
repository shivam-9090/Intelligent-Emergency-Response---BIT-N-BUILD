import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Index, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base
from app.models.enums import ResourceStatus, ResourceType

if TYPE_CHECKING:
    from app.models.assignment import Assignment
    from app.models.user import User


class ResourceUnit(Base):
    __tablename__ = "resource_units"
    __table_args__ = (Index("ix_resource_units_status", "status"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)

    name: Mapped[str] = mapped_column(String(255))
    resource_type: Mapped[ResourceType] = mapped_column(Enum(ResourceType, name="resource_type"))
    status: Mapped[ResourceStatus] = mapped_column(
        Enum(ResourceStatus, name="resource_status"), default=ResourceStatus.AVAILABLE
    )

    capability: Mapped[str | None] = mapped_column(String(255), nullable=True)

    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)

    assigned_user_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("users.id"), nullable=True)
    """The field-team user operating this resource, if any. Used to scope
    which assignments a FIELD_TEAM caller is allowed to update the status
    of — see assignment_service.update_assignment_status."""

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    assigned_user: Mapped["User | None"] = relationship()
    assignments: Mapped[list["Assignment"]] = relationship(back_populates="resource")
