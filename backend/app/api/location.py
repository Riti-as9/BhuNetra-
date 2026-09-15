from __future__ import annotations

import json
from math import asin, cos, radians, sin, sqrt
from pathlib import Path
from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field


router = APIRouter(prefix="/location", tags=["Location"])


# ---------------------------------------------------------------------------
# CONFIGURATION
# ---------------------------------------------------------------------------

# Actual India ADM1 state-boundary GeoJSON downloaded from geoBoundaries.
#
# File:
# backend/data/india_states.geojson
#
# GeoJSON uses:
# [longitude, latitude]
#
# BhuNetra receives:
# latitude, longitude
#
# Therefore the point-in-polygon logic below intentionally uses:
# x = longitude
# y = latitude
# ---------------------------------------------------------------------------

STATE_BOUNDARY_FILE = (
    Path(__file__).resolve().parents[2]
    / "data"
    / "india_states.geojson"
)


NER_STATES = {
    "Assam",
    "Arunachal Pradesh",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Sikkim",
    "Tripura",
}


# ---------------------------------------------------------------------------
# MONITORED BHUNETRA ZONES
# ---------------------------------------------------------------------------
# These are the existing six BhuNetra monitoring zones.
#
# IMPORTANT:
# These are monitoring/reference zones, not the boundary of an entire state.
# For a manually selected/GPS location, we use the nearest monitored zone
# only as contextual risk information.
# ---------------------------------------------------------------------------

MONITORED_ZONES = [
    {
        "id": "ZN-AS-001",
        "name": "Dima Hasao Highland",
        "state": "Assam",
        "coordinates": [25.6532, 93.1028],
    },
    {
        "id": "ZN-MG-001",
        "name": "Garo Hills West",
        "state": "Meghalaya",
        "coordinates": [25.5707, 90.2167],
    },
    {
        "id": "ZN-SK-001",
        "name": "North Sikkim Range",
        "state": "Sikkim",
        "coordinates": [27.8528, 88.4252],
    },
    {
        "id": "ZN-AR-001",
        "name": "West Kameng Slopes",
        "state": "Arunachal Pradesh",
        "coordinates": [27.2489, 92.5541],
    },
    {
        "id": "ZN-MN-001",
        "name": "Senapati Highland",
        "state": "Manipur",
        "coordinates": [25.2678, 94.0165],
    },
    {
        "id": "ZN-MZ-001",
        "name": "Lunglei Range South",
        "state": "Mizoram",
        "coordinates": [22.8892, 92.7347],
    },
]


# ---------------------------------------------------------------------------
# REQUEST MODEL
# ---------------------------------------------------------------------------

class LocationRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


# ---------------------------------------------------------------------------
# STATE BOUNDARY CACHE
# ---------------------------------------------------------------------------
# The GeoJSON is loaded once and kept in memory.
#
# This is important because GPS/location requests can happen repeatedly.
# We do NOT want to read the 5 MB GeoJSON from disk on every request.
# ---------------------------------------------------------------------------

_STATE_POLYGONS: dict[str, list[Any]] | None = None


# ---------------------------------------------------------------------------
# STATE NAME NORMALIZATION
# ---------------------------------------------------------------------------

def normalize_state_name(value: Any) -> str | None:
    """
    Normalize state names from the GeoJSON into BhuNetra's
    standard NER state names.

    The geoBoundaries dataset uses names such as:
        Arunāchal Pradesh
        Meghālaya
        Nāgāland

    BhuNetra internally uses:
        Arunachal Pradesh
        Meghalaya
        Nagaland
    """

    if value is None:
        return None

    name = str(value).strip()

    if not name:
        return None

    # Remove Unicode diacritics/macrons so that:
    #   Meghālaya -> Meghalaya
    #   Arunāchal -> Arunachal
    #   Nāgāland -> Nagaland
    #
    # This makes the matching work with the actual GeoJSON data
    # without creating coordinate-specific rules.
    import unicodedata

    name = "".join(
        character
        for character in unicodedata.normalize("NFKD", name)
        if not unicodedata.combining(character)
    )

    normalized = name.casefold()

    aliases = {
        "assam": "Assam",
        "arunachal pradesh": "Arunachal Pradesh",
        "manipur": "Manipur",
        "meghalaya": "Meghalaya",
        "mizoram": "Mizoram",
        "nagaland": "Nagaland",
        "sikkim": "Sikkim",
        "tripura": "Tripura",
    }

    return aliases.get(normalized)


# ---------------------------------------------------------------------------
# GEOJSON PROPERTY EXTRACTION
# ---------------------------------------------------------------------------

def extract_state_name(properties: dict[str, Any]) -> str | None:
    """
    Try the common state-name property fields used by India ADM1 datasets.
    """

    possible_fields = (
        "shapeName",
        "shape_name",
        "NAME_1",
        "name",
        "st_nm",
        "STNAME",
        "STATE_NAME",
        "state_name",
    )

    for field in possible_fields:
        state = normalize_state_name(properties.get(field))

        if state is not None:
            return state

    return None


# ---------------------------------------------------------------------------
# GEOJSON LOADER
# ---------------------------------------------------------------------------

def load_state_polygons() -> dict[str, list[Any]]:
    """
    Load NER state geometries from the India ADM1 GeoJSON.

    The result is cached in memory after the first successful load.
    """

    global _STATE_POLYGONS

    if _STATE_POLYGONS is not None:
        return _STATE_POLYGONS

    try:
        with STATE_BOUNDARY_FILE.open(
            "r",
            encoding="utf-8",
        ) as source:
            geojson = json.load(source)

    except (OSError, json.JSONDecodeError):
        # Fail safely rather than incorrectly assigning a state.
        _STATE_POLYGONS = {}
        return _STATE_POLYGONS

    polygons: dict[str, list[Any]] = {
        state: []
        for state in NER_STATES
    }

    for feature in geojson.get("features", []):
        properties = feature.get("properties") or {}

        state = extract_state_name(properties)

        if state not in NER_STATES:
            continue

        geometry = feature.get("geometry") or {}
        geometry_type = geometry.get("type")
        coordinates = geometry.get("coordinates")

        if not coordinates:
            continue

        if geometry_type == "Polygon":
            polygons[state].append(
                coordinates
            )

        elif geometry_type == "MultiPolygon":
            polygons[state].extend(
                coordinates
            )

    _STATE_POLYGONS = polygons

    return _STATE_POLYGONS


# ---------------------------------------------------------------------------
# POINT ON LINE
# ---------------------------------------------------------------------------

def point_on_segment(
    longitude: float,
    latitude: float,
    point_1: list[float],
    point_2: list[float],
    tolerance: float = 1e-10,
) -> bool:
    """
    Check whether a geographic point lies directly on a polygon boundary.
    """

    x = longitude
    y = latitude

    x1 = point_1[0]
    y1 = point_1[1]

    x2 = point_2[0]
    y2 = point_2[1]

    cross_product = (
        (y - y1) * (x2 - x1)
        - (x - x1) * (y2 - y1)
    )

    if abs(cross_product) > tolerance:
        return False

    return (
        min(x1, x2) - tolerance <= x <= max(x1, x2) + tolerance
        and
        min(y1, y2) - tolerance <= y <= max(y1, y2) + tolerance
    )


# ---------------------------------------------------------------------------
# POINT IN RING
# ---------------------------------------------------------------------------

def point_in_ring(
    latitude: float,
    longitude: float,
    ring: list[list[float]],
) -> bool:
    """
    Ray-casting point-in-polygon test.

    GeoJSON coordinates are:
        [longitude, latitude]
    """

    if len(ring) < 3:
        return False

    x = longitude
    y = latitude

    inside = False

    previous = ring[-1]

    for current in ring:
        x1 = previous[0]
        y1 = previous[1]

        x2 = current[0]
        y2 = current[1]

        # Boundary counts as inside.
        if point_on_segment(
            x,
            y,
            previous,
            current,
        ):
            return True

        intersects = (
            (y1 > y) != (y2 > y)
        ) and (
            x
            <
            (
                (x2 - x1)
                * (y - y1)
                / ((y2 - y1) + 1e-15)
                + x1
            )
        )

        if intersects:
            inside = not inside

        previous = current

    return inside


# ---------------------------------------------------------------------------
# POINT IN POLYGON
# ---------------------------------------------------------------------------

def point_in_polygon(
    latitude: float,
    longitude: float,
    polygon: list[Any],
) -> bool:
    """
    Check a point against a GeoJSON Polygon.

    polygon[0] = outer boundary
    polygon[1:] = holes
    """

    if not polygon:
        return False

    outer_ring = polygon[0]

    if not point_in_ring(
        latitude,
        longitude,
        outer_ring,
    ):
        return False

    # If the point is inside a hole, it is not inside the state.
    for hole in polygon[1:]:
        if point_in_ring(
            latitude,
            longitude,
            hole,
        ):
            return False

    return True


# ---------------------------------------------------------------------------
# STATE DETECTION
# ---------------------------------------------------------------------------

def detect_ner_state(
    latitude: float,
    longitude: float,
) -> str | None:
    """
    Determine the actual NER state using real ADM1 state polygons.

    This replaces the old overlapping rectangular bounding boxes.

    Therefore:
        Meghalaya coordinates -> Meghalaya
        Assam coordinates -> Assam
        Arunachal coordinates -> Arunachal Pradesh
        etc.

    Returns None when the coordinate is outside all supported NER
    state polygons.
    """

    state_polygons = load_state_polygons()

    if not state_polygons:
        return None

    for state, polygons in state_polygons.items():
        for polygon in polygons:
            if point_in_polygon(
                latitude,
                longitude,
                polygon,
            ):
                return state

    return None


# ---------------------------------------------------------------------------
# DISTANCE CALCULATION
# ---------------------------------------------------------------------------

def haversine_distance_km(
    latitude_1: float,
    longitude_1: float,
    latitude_2: float,
    longitude_2: float,
) -> float:
    """
    Calculate distance between two geographic coordinates in kilometres.
    """

    earth_radius_km = 6371.0

    lat1 = radians(latitude_1)
    lat2 = radians(latitude_2)

    delta_lat = radians(latitude_2 - latitude_1)
    delta_lon = radians(longitude_2 - longitude_1)

    value = (
        sin(delta_lat / 2) ** 2
        + cos(lat1)
        * cos(lat2)
        * sin(delta_lon / 2) ** 2
    )

    value = min(
        1.0,
        max(0.0, value),
    )

    return 2 * earth_radius_km * asin(
        sqrt(value)
    )


# ---------------------------------------------------------------------------
# NEAREST MONITORED ZONE
# ---------------------------------------------------------------------------

def find_nearest_zone(
    latitude: float,
    longitude: float,
) -> tuple[dict[str, Any], float]:
    """
    Find the nearest existing BhuNetra monitoring zone.

    This does NOT mean the selected coordinate belongs to that zone.
    It is only used to provide contextual live monitoring information.
    """

    nearest_zone = MONITORED_ZONES[0]

    nearest_distance = haversine_distance_km(
        latitude,
        longitude,
        nearest_zone["coordinates"][0],
        nearest_zone["coordinates"][1],
    )

    for zone in MONITORED_ZONES[1:]:
        distance = haversine_distance_km(
            latitude,
            longitude,
            zone["coordinates"][0],
            zone["coordinates"][1],
        )

        if distance < nearest_distance:
            nearest_zone = zone
            nearest_distance = distance

    return nearest_zone, nearest_distance


# ---------------------------------------------------------------------------
# LOCATION CONTEXT ENDPOINT
# ---------------------------------------------------------------------------

@router.post("/context")
async def get_location_context(
    request: LocationRequest,
):
    """
    Return BhuNetra context for a selected/current location.

    INSIDE NER:
        1. Determine exact NER state from state polygon.
        2. Find nearest monitored BhuNetra zone.
        3. Return contextual live monitoring information.

    OUTSIDE NER:
        1. Show location.
        2. Do not modify NER monitoring data.
        3. Return inside_ner=False.
    """

    latitude = request.latitude
    longitude = request.longitude

    state = detect_ner_state(
        latitude,
        longitude,
    )

    # ---------------------------------------------------------------
    # OUTSIDE NER
    # ---------------------------------------------------------------

    if state is None:
        return {
            "success": True,
            "inside_ner": False,
            "message": (
                "Location is outside the BhuNetra "
                "NER monitoring region."
            ),
            "location": {
                "latitude": latitude,
                "longitude": longitude,
                "state": None,
            },
            "nearest_zone": None,
            "context_source": "none",
            "state_detection_source": "india-adm1-boundary",
            "should_update_monitoring_data": False,
        }

    # ---------------------------------------------------------------
    # INSIDE NER
    # ---------------------------------------------------------------

    nearest_zone, distance_km = find_nearest_zone(
        latitude,
        longitude,
    )

    return {
        "success": True,
        "inside_ner": True,
        "message": (
            f"Location detected in {state}."
        ),
        "location": {
            "latitude": latitude,
            "longitude": longitude,
            "state": state,
        },
        "nearest_zone": {
            "id": nearest_zone["id"],
            "name": nearest_zone["name"],
            "state": nearest_zone["state"],
            "coordinates": nearest_zone["coordinates"],
            "distance_km": round(
                distance_km,
                2,
            ),
        },
        "context_source": "nearest-monitored-zone",
        "state_detection_source": "india-adm1-boundary",
        "should_update_monitoring_data": True,
    }


# ---------------------------------------------------------------------------
# NER STATES ENDPOINT
# ---------------------------------------------------------------------------

@router.get("/states")
async def get_ner_states():
    """
    Return the eight states covered by BhuNetra.
    """

    return {
        "success": True,
        "region": "North Eastern Region",
        "states": [
            "Assam",
            "Arunachal Pradesh",
            "Manipur",
            "Meghalaya",
            "Mizoram",
            "Nagaland",
            "Sikkim",
            "Tripura",
        ],
    }