"""IoT Sensor Stream Telemetry & Anomaly Detection Engine.

Processes real-time streaming sensor feeds (water level, optical smoke, toxic gas,
and structural seismic sensors) to detect disasters before human reporting.
"""

from typing import Any

from app.models.enums import IncidentType, Severity

# Baseline safety limits and metric maps
_SENSOR_TYPE_INCIDENT_MAP: dict[str, IncidentType] = {
    "water_level": IncidentType.FLOOD,
    "flood_sensor": IncidentType.FLOOD,
    "toxic_gas": IncidentType.INDUSTRIAL_ACCIDENT,
    "gas_sensor": IncidentType.INDUSTRIAL_ACCIDENT,
    "smoke_optical": IncidentType.FIRE,
    "fire_sensor": IncidentType.FIRE,
    "vibration_structural": IncidentType.INDUSTRIAL_ACCIDENT,
}


def analyze_sensor_telemetry(payload: dict[str, Any]) -> dict[str, Any]:
    """Evaluate streaming IoT sensor telemetry packet for emergency anomalies.

    Returns structured anomaly assessment including auto-generated title,
    description, predicted severity, and incident priority.
    """
    sensor_id = payload.get("sensor_id", "UNKNOWN-SENSOR")
    sensor_type = payload.get("sensor_type", "generic").lower()
    district = payload.get("district", "Monitored Zone")
    readings = payload.get("readings", {})
    thresholds = payload.get("thresholds", {})

    incident_type = _SENSOR_TYPE_INCIDENT_MAP.get(sensor_type, IncidentType.OTHER)
    is_anomaly = False
    severity = Severity.LOW
    priority = 4
    anomaly_score = 0.0
    metric_details = []

    # 1. Water Level / Flood Sensor
    if "water_level_cm" in readings:
        level = float(readings["water_level_cm"])
        crit_th = float(thresholds.get("critical_water_level_cm", 200.0))
        warn_th = float(thresholds.get("warning_water_level_cm", 120.0))

        if level >= crit_th:
            is_anomaly = True
            severity = Severity.CRITICAL
            priority = 1
            anomaly_score = min(1.0, 0.8 + (level - crit_th) / 100.0)
            metric_details.append(f"Water level critical at {level:.1f}cm (exceeds {crit_th:.0f}cm limit)")
        elif level >= warn_th:
            is_anomaly = True
            severity = Severity.HIGH
            priority = 2
            anomaly_score = 0.6 + (level - warn_th) / (crit_th - warn_th) * 0.2
            metric_details.append(f"Water level warning at {level:.1f}cm")

    # 2. Toxic Gas Sensor (Ammonia, Chlorine, VOC)
    elif "concentration_ppm" in readings:
        ppm = float(readings["concentration_ppm"])
        gas_type = readings.get("gas_type", "chemical")
        crit_ppm = float(thresholds.get("critical_ppm", 50.0))
        warn_ppm = float(thresholds.get("warning_ppm", 25.0))

        if ppm >= crit_ppm:
            is_anomaly = True
            severity = Severity.CRITICAL
            priority = 1
            metric_details.append(
                f"Dangerous {gas_type} gas leak at {ppm:.1f} ppm (threshold {crit_ppm:.0f} ppm)"
            )
        elif ppm >= warn_ppm:
            is_anomaly = True
            severity = Severity.HIGH
            priority = 2
            anomaly_score = 0.65
            metric_details.append(f"Elevated {gas_type} gas concentration: {ppm:.1f} ppm")

    # 3. Optical Smoke & Thermal Sensor
    elif "ambient_temp_c" in readings or "obscuration_pct_per_meter" in readings:
        temp = float(readings.get("ambient_temp_c", 25.0))
        smoke = float(readings.get("obscuration_pct_per_meter", 0.0))
        crit_temp = float(thresholds.get("critical_temp_c", 80.0))

        if temp >= crit_temp or smoke >= 15.0:
            is_anomaly = True
            severity = Severity.CRITICAL
            priority = 1
            anomaly_score = 0.95
            metric_details.append(f"Severe thermal flash: {temp:.1f}°C, smoke obscuration {smoke:.1f}%/m")
        elif temp >= 50.0 or smoke >= 8.0:
            is_anomaly = True
            severity = Severity.HIGH
            priority = 2
            anomaly_score = 0.70
            metric_details.append(f"High heat & smoke detected: {temp:.1f}°C")

    # 4. Structural Seismic / Vibration Sensor
    elif "peak_ground_acceleration_g" in readings:
        pga = float(readings["peak_ground_acceleration_g"])
        crit_pga = float(thresholds.get("critical_pga_g", 0.35))

        if pga >= crit_pga:
            is_anomaly = True
            severity = Severity.CRITICAL
            priority = 1
            anomaly_score = min(1.0, 0.85 + (pga - crit_pga))
            metric_details.append(f"Structural shock alert: Peak ground acceleration {pga:.2f}g")

    metrics_summary = "; ".join(metric_details) if metric_details else "Readings within normal limits."

    type_name = incident_type.value.replace("_", " ").title()
    title = f"Automated Sensor Alert: {severity.value.upper()} {type_name} in {district}"
    description = (
        f"IoT telemetry from sensor [{sensor_id}] detected severe anomalous readings. "
        f"Telemetry metrics: {metrics_summary}. Immediate verification and dispatch recommended."
    )

    return {
        "sensor_id": sensor_id,
        "is_anomaly": is_anomaly,
        "incident_type": incident_type,
        "severity": severity,
        "priority": priority,
        "anomaly_score": round(anomaly_score, 3),
        "title": title,
        "description": description,
        "details": metric_details,
    }
