from pathlib import Path
import json
import math
import random

import pandas as pd


BASE_DIR = Path(__file__).resolve().parents[2]

BOUNDARY_FILE = BASE_DIR / "data" / "india_states.geojson"
INVENTORY_FILE = BASE_DIR / "data" / "processed" / "gsi_landslide_inventory.csv"
OUTPUT_FILE = BASE_DIR / "data" / "processed" / "spatial_background_samples.csv"

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

RANDOM_SEED = 42
TARGET_SAMPLES = 9300
MIN_DISTANCE_KM = 10.0

random.seed(RANDOM_SEED)


def normalize_state_name(name):
    if not isinstance(name, str):
        return ""

    aliases = {
        "Arunāchal Pradesh": "Arunachal Pradesh",
        "Meghālaya": "Meghalaya",
        "Nāgāland": "Nagaland",
        "Mizoram": "Mizoram",
        "Manipur": "Manipur",
        "Assam": "Assam",
        "Sikkim": "Sikkim",
        "Tripura": "Tripura",
    }

    return aliases.get(name.strip(), name.strip())


def point_in_ring(lon, lat, ring):
    inside = False

    j = len(ring) - 1

    for i in range(len(ring)):
        xi, yi = ring[i]
        xj, yj = ring[j]

        intersects = (
            ((yi > lat) != (yj > lat))
            and (
                lon
                < (xj - xi) * (lat - yi) / ((yj - yi) or 1e-12)
                + xi
            )
        )

        if intersects:
            inside = not inside

        j = i

    return inside


def point_in_polygon(lon, lat, polygon):
    if not polygon:
        return False

    outer = polygon[0]

    if not point_in_ring(lon, lat, outer):
        return False

    for hole in polygon[1:]:
        if point_in_ring(lon, lat, hole):
            return False

    return True


def point_in_geometry(lon, lat, geometry):
    if not geometry:
        return False

    geometry_type = geometry.get("type")
    coordinates = geometry.get("coordinates", [])

    if geometry_type == "Polygon":
        return point_in_polygon(lon, lat, coordinates)

    if geometry_type == "MultiPolygon":
        return any(
            point_in_polygon(lon, lat, polygon)
            for polygon in coordinates
        )

    return False


def haversine_km(lat1, lon1, lat2, lon2):
    radius = 6371.0

    p1 = math.radians(lat1)
    p2 = math.radians(lat2)

    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_lat / 2) ** 2
        + math.cos(p1)
        * math.cos(p2)
        * math.sin(delta_lon / 2) ** 2
    )

    return 2 * radius * math.asin(math.sqrt(min(1.0, a)))


def load_ner_polygons():
    with BOUNDARY_FILE.open(encoding="utf-8") as source:
        data = json.load(source)

    polygons = []

    for feature in data.get("features", []):
        properties = feature.get("properties", {})
        state_name = normalize_state_name(
            properties.get("shapeName")
            or properties.get("shape_name")
            or properties.get("NAME_1")
            or properties.get("name")
            or ""
        )

        if state_name not in NER_STATES:
            continue

        geometry = feature.get("geometry")

        if geometry:
            polygons.append(
                {
                    "state": state_name,
                    "geometry": geometry,
                }
            )

    return polygons


def geometry_bbox(geometry):
    coordinates = []

    def collect(obj):
        if isinstance(obj, (list, tuple)):
            if (
                len(obj) >= 2
                and isinstance(obj[0], (int, float))
                and isinstance(obj[1], (int, float))
            ):
                coordinates.append((obj[0], obj[1]))
            else:
                for item in obj:
                    collect(item)

    collect(geometry.get("coordinates", []))

    if not coordinates:
        return None

    longitudes = [point[0] for point in coordinates]
    latitudes = [point[1] for point in coordinates]

    return (
        min(longitudes),
        max(longitudes),
        min(latitudes),
        max(latitudes),
    )


def load_landslide_points():
    inventory = pd.read_csv(
        INVENTORY_FILE,
        usecols=[
            "Sl.No",
            "Slide_No",
            "State",
            "District",
            "Latitude",
            "Longitude",
        ],
    )

    inventory = inventory.dropna(
        subset=["Latitude", "Longitude"]
    ).copy()

    return list(
        zip(
            inventory["Latitude"].astype(float),
            inventory["Longitude"].astype(float),
        )
    )


def is_far_from_landslides(lat, lon, landslide_points):
    for event_lat, event_lon in landslide_points:
        if haversine_km(
            lat,
            lon,
            event_lat,
            event_lon,
        ) < MIN_DISTANCE_KM:
            return False

    return True


def main():
    print("=" * 70)
    print("GENERATING GEOGRAPHIC BACKGROUND SAMPLES")
    print("=" * 70)

    print()
    print("Loading actual NER state boundaries...")

    polygons = load_ner_polygons()

    print(f"NER state polygons loaded: {len(polygons)}")

    if len(polygons) != 8:
        raise RuntimeError(
            f"Expected 8 NER state polygons, found {len(polygons)}"
        )

    print()
    print("Loading GSI landslide locations...")

    landslide_points = load_landslide_points()

    print(f"GSI landslide points loaded: {len(landslide_points)}")

    print()
    print("Generating background points...")
    print(f"Target samples       : {TARGET_SAMPLES}")
    print(f"Minimum event radius : {MIN_DISTANCE_KM} km")
    print(f"Random seed          : {RANDOM_SEED}")

    samples = []
    attempts = 0
    max_attempts = TARGET_SAMPLES * 200

    while len(samples) < TARGET_SAMPLES and attempts < max_attempts:
        attempts += 1

        selected = random.choice(polygons)

        bbox = geometry_bbox(selected["geometry"])

        if bbox is None:
            continue

        min_lon, max_lon, min_lat, max_lat = bbox

        lon = random.uniform(min_lon, max_lon)
        lat = random.uniform(min_lat, max_lat)

        if not point_in_geometry(
            lon,
            lat,
            selected["geometry"],
        ):
            continue

        if not is_far_from_landslides(
            lat,
            lon,
            landslide_points,
        ):
            continue

        samples.append(
            {
                "sample_id": f"BG-{len(samples) + 1:05d}",
                "State": selected["state"],
                "Latitude": round(lat, 6),
                "Longitude": round(lon, 6),
                "landslide": 0,
                "sample_source": "spatial_background_sample",
                "background_rule": "inside_NER_boundary_and_10km_from_GSI_inventory",
            }
        )

        if len(samples) % 500 == 0:
            print(
                f"  Generated {len(samples)}/{TARGET_SAMPLES}"
            )

    if len(samples) < TARGET_SAMPLES:
        raise RuntimeError(
            f"Only generated {len(samples)} samples "
            f"after {attempts} attempts."
        )

    result = pd.DataFrame(samples)

    result.to_csv(
        OUTPUT_FILE,
        index=False,
    )

    print()
    print("=" * 70)
    print("BACKGROUND DATASET CREATED")
    print("=" * 70)

    print(f"Output file       : {OUTPUT_FILE}")
    print(f"Samples generated : {len(result)}")
    print(f"Attempts           : {attempts}")

    print()
    print("State distribution:")
    print(
        result["State"]
        .value_counts()
        .sort_index()
        .to_string()
    )

    print()
    print("Label distribution:")
    print(
        result["landslide"]
        .value_counts()
        .sort_index()
        .to_string()
    )

    print()
    print("Sample records:")
    print(
        result.head(10).to_string(index=False)
    )

    print()
    print("=" * 70)
    print("BACKGROUND SAMPLE GENERATION COMPLETED")
    print("=" * 70)


if __name__ == "__main__":
    main()
