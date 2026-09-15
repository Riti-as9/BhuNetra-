"""Command-centre data exposed to the Bhunetra web client.

The records below are deliberately labelled as demo monitoring data.  They give
the UI a stable API contract until live sensor and alert providers are wired in.
The GSI inventory, however, is read from the processed project dataset.
"""

from datetime import datetime, timezone
import json
import math
from pathlib import Path

from fastapi import APIRouter, HTTPException


router = APIRouter(prefix="/monitoring", tags=["Monitoring"])

ZONES = [
    {"id": "ZN-AS-001", "name": "Dima Hasao Highland", "state": "Assam", "district": "Dima Hasao", "coordinates": [25.6532, 93.1028], "risk_score": 82, "risk_level": "critical", "rainfall_24h": 147, "soil_moisture": 87, "slope": 38, "sensors_online": 3, "sensors_total": 3},
    {"id": "ZN-MG-001", "name": "Garo Hills West", "state": "Meghalaya", "district": "West Garo Hills", "coordinates": [25.5707, 90.2167], "risk_score": 74, "risk_level": "critical", "rainfall_24h": 183, "soil_moisture": 91, "slope": 35, "sensors_online": 2, "sensors_total": 2},
    {"id": "ZN-SK-001", "name": "North Sikkim Range", "state": "Sikkim", "district": "North Sikkim", "coordinates": [27.8528, 88.4252], "risk_score": 91, "risk_level": "critical", "rainfall_24h": 211, "soil_moisture": 94, "slope": 42, "sensors_online": 2, "sensors_total": 3},
    {"id": "ZN-AR-001", "name": "West Kameng Slopes", "state": "Arunachal Pradesh", "district": "West Kameng", "coordinates": [27.2489, 92.5541], "risk_score": 67, "risk_level": "high", "rainfall_24h": 124, "soil_moisture": 79, "slope": 31, "sensors_online": 2, "sensors_total": 2},
    {"id": "ZN-MN-001", "name": "Senapati Highland", "state": "Manipur", "district": "Senapati", "coordinates": [25.2678, 94.0165], "risk_score": 56, "risk_level": "moderate", "rainfall_24h": 108, "soil_moisture": 74, "slope": 27, "sensors_online": 2, "sensors_total": 2},
    {"id": "ZN-MZ-001", "name": "Lunglei Range South", "state": "Mizoram", "district": "Lunglei", "coordinates": [22.8892, 92.7347], "risk_score": 48, "risk_level": "moderate", "rainfall_24h": 89, "soil_moisture": 68, "slope": 24, "sensors_online": 1, "sensors_total": 1},
]

ALERTS = [
    {"id": "ALT-001", "zone_id": "ZN-SK-001", "severity": "critical", "title": "Imminent landslide warning", "message": "High rainfall, saturated soil and steep terrain exceed the configured response threshold.", "recommended_action": "Prepare evacuation and restrict access to exposed road corridors.", "status": "active", "confidence": 94},
    {"id": "ALT-002", "zone_id": "ZN-AS-001", "severity": "critical", "title": "Slope failure warning", "message": "Dima Hasao monitoring indicators show sustained high risk.", "recommended_action": "Issue a district-level warning and inspect NH-27 slope sections.", "status": "active", "confidence": 89},
    {"id": "ALT-003", "zone_id": "ZN-AR-001", "severity": "high", "title": "Elevated rainfall watch", "message": "Three-day rainfall accumulation is approaching the critical threshold.", "recommended_action": "Increase field monitoring and prepare local response teams.", "status": "active", "confidence": 78},
]


def _inventory_path() -> Path:
    return Path(__file__).resolve().parents[2] / "data" / "processed" / "gsi_landslide_inventory.geojson"


def _load_inventory() -> list[dict]:
    try:
        with _inventory_path().open(encoding='utf-8') as source:
            return json.load(source).get('features', [])
    except (OSError, json.JSONDecodeError):
        return []


def _historical_landslides_near_zone(latitude: float, longitude: float, radius_km: float = 25.0) -> int:
    earth_radius_km = 6371.0
    count = 0

    for feature in _load_inventory():
        coordinates = feature.get('geometry', {}).get('coordinates', [])
        if len(coordinates) < 2:
            continue

        event_longitude, event_latitude = coordinates[:2]

        lat1 = math.radians(latitude)
        lat2 = math.radians(event_latitude)
        delta_lat = math.radians(event_latitude - latitude)
        delta_lon = math.radians(event_longitude - longitude)

        haversine = (
            math.sin(delta_lat / 2) ** 2
            + math.cos(lat1) * math.cos(lat2) * math.sin(delta_lon / 2) ** 2
        )

        distance_km = 2 * earth_radius_km * math.asin(math.sqrt(haversine))

        if distance_km <= radius_km:
            count += 1

    return count


def enrich_zones_with_historical_data() -> None:
    for zone in ZONES:
        latitude, longitude = zone['coordinates']
        zone['historical_landslides'] = _historical_landslides_near_zone(
            latitude,
            longitude,
        )


def _zone(zone_id: str) -> dict:
    for zone in ZONES:
        if zone["id"] == zone_id:
            return zone
    raise HTTPException(status_code=404, detail="Monitoring zone not found")


@router.get("/dashboard")
def dashboard():
    enrich_zones_with_historical_data()
    critical = sum(zone["risk_level"] == "critical" for zone in ZONES)
    high = sum(zone["risk_level"] == "high" for zone in ZONES)
    sensor_total = sum(zone["sensors_total"] for zone in ZONES)
    sensor_online = sum(zone["sensors_online"] for zone in ZONES)
    inventory_count = 0
    try:
        with _inventory_path().open(encoding="utf-8") as source:
            inventory_count = len(json.load(source).get("features", []))
    except (OSError, json.JSONDecodeError):
        pass
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "data_mode": "demo-monitoring-data",
        "stats": {"critical_zones": critical, "high_risk_zones": high, "active_alerts": sum(a["status"] == "active" for a in ALERTS), "historical_events": inventory_count, "sensors_online": sensor_online, "sensors_total": sensor_total},
        "zones": ZONES,
        "alerts": [_alert_with_zone(alert) for alert in ALERTS],
    }


def _alert_with_zone(alert: dict) -> dict:
    zone = _zone(alert["zone_id"])
    return {**alert, "zone_name": zone["name"], "state": zone["state"]}


@router.get("/zones")
def list_zones():
    enrich_zones_with_historical_data()
    return {"data_mode": "demo-monitoring-data", "generated_at": datetime.now(timezone.utc).isoformat(), "zones": ZONES}


@router.get("/zones/{zone_id}")
def zone_detail(zone_id: str):
    enrich_zones_with_historical_data()
    zone = _zone(zone_id)
    return {**zone, "generated_at": datetime.now(timezone.utc).isoformat(), "alerts": [_alert_with_zone(a) for a in ALERTS if a["zone_id"] == zone_id]}


@router.get("/alerts")
def list_alerts():
    return {"data_mode": "demo-monitoring-data", "alerts": [_alert_with_zone(alert) for alert in ALERTS]}


@router.post("/alerts/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: str):
    for alert in ALERTS:
        if alert["id"] == alert_id:
            alert["status"] = "acknowledged"
            return _alert_with_zone(alert)
    raise HTTPException(status_code=404, detail="Alert not found")


@router.get("/inventory")
def landslide_inventory():
    try:
        with _inventory_path().open(encoding="utf-8") as source:
            return json.load(source)
    except FileNotFoundError as error:
        raise HTTPException(status_code=404, detail="GSI inventory is not available") from error


@router.get("/analytics")
def analytics():
    enrich_zones_with_historical_data()
    return {
        "data_mode": "demo-monitoring-data",
        "risk_distribution": [{"level": level, "count": sum(z["risk_level"] == level for z in ZONES)} for level in ("critical", "high", "moderate")],
        "rainfall_by_zone": [{"zone": z["name"], "rainfall_24h": z["rainfall_24h"], "risk_score": z["risk_score"]} for z in ZONES],
    }





