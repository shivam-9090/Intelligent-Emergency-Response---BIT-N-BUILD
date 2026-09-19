import enum


class IncidentSource(str, enum.Enum):
    CITIZEN_REPORT = "citizen_report"
    SENSOR = "sensor"
    EMERGENCY_CALL = "emergency_call"
    FIELD_TEAM = "field_team"
    HOSPITAL = "hospital"
    GOVERNMENT = "government"


class IncidentType(str, enum.Enum):
    FIRE = "fire"
    FLOOD = "flood"
    INDUSTRIAL_ACCIDENT = "industrial_accident"
    ROAD_ACCIDENT = "road_accident"
    MEDICAL = "medical"
    OTHER = "other"


class Severity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class IncidentStatus(str, enum.Enum):
    REPORTED = "reported"
    VERIFIED = "verified"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class ResourceType(str, enum.Enum):
    TEAM = "team"
    VEHICLE = "vehicle"
    EQUIPMENT = "equipment"
    FACILITY = "facility"


class ResourceStatus(str, enum.Enum):
    AVAILABLE = "available"
    ASSIGNED = "assigned"
    UNAVAILABLE = "unavailable"


class AssignmentStatus(str, enum.Enum):
    ASSIGNED = "assigned"
    EN_ROUTE = "en_route"
    ON_SCENE = "on_scene"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class AlertType(str, enum.Enum):
    CRITICAL_INCIDENT = "critical_incident"
    DELAYED_RESPONSE = "delayed_response"
    ESCALATION = "escalation"


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    DISPATCHER = "dispatcher"
    FIELD_TEAM = "field_team"
