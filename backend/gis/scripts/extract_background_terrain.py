from pathlib import Path
import gzip
import math
import struct

import pandas as pd


BASE_DIR = Path(__file__).resolve().parents[2]

INPUT_FILE = BASE_DIR / "data" / "processed" / "spatial_background_samples.csv"
OUTPUT_FILE = BASE_DIR / "data" / "processed" / "background_terrain_features.csv"
DEM_DIR = BASE_DIR / "data" / "raw" / "dem"


SRTM_SIZE = 3601


def tile_name(latitude, longitude):
    lat = math.floor(latitude)
    lon = math.floor(longitude)

    lat_prefix = "N" if lat >= 0 else "S"
    lon_prefix = "E" if lon >= 0 else "W"

    return f"{lat_prefix}{abs(lat):02d}{lon_prefix}{abs(lon):03d}"


def load_dem(tile):
    hgt_file = DEM_DIR / f"{tile}.hgt"
    gz_file = DEM_DIR / f"{tile}.hgt.gz"

    if not hgt_file.exists() and gz_file.exists():
        with gzip.open(gz_file, "rb") as source:
            hgt_file.write_bytes(source.read())

    if not hgt_file.exists():
        return None

    expected_size = SRTM_SIZE * SRTM_SIZE * 2

    if hgt_file.stat().st_size != expected_size:
        return None

    with hgt_file.open("rb") as source:
        data = source.read()

    values = struct.unpack(
        f">{SRTM_SIZE * SRTM_SIZE}h",
        data,
    )

    return values


DEM_CACHE = {}


def get_elevation(latitude, longitude):
    tile = tile_name(latitude, longitude)

    if tile not in DEM_CACHE:
        DEM_CACHE[tile] = load_dem(tile)

    dem = DEM_CACHE[tile]

    if dem is None:
        return None

    base_lat = math.floor(latitude)
    base_lon = math.floor(longitude)

    row = round(
        (base_lat + 1 - latitude) * 3600
    )

    column = round(
        (longitude - base_lon) * 3600
    )

    row = max(0, min(SRTM_SIZE - 1, row))
    column = max(0, min(SRTM_SIZE - 1, column))

    value = dem[row * SRTM_SIZE + column]

    if value == -32768:
        return None

    return float(value)


def get_terrain(latitude, longitude):
    tile = tile_name(latitude, longitude)

    if tile not in DEM_CACHE:
        DEM_CACHE[tile] = load_dem(tile)

    dem = DEM_CACHE[tile]

    if dem is None:
        return None, None, None

    base_lat = math.floor(latitude)
    base_lon = math.floor(longitude)

    row = round(
        (base_lat + 1 - latitude) * 3600
    )

    column = round(
        (longitude - base_lon) * 3600
    )

    row = max(1, min(SRTM_SIZE - 2, row))
    column = max(1, min(SRTM_SIZE - 2, column))

    center = dem[row * SRTM_SIZE + column]

    if center == -32768:
        return None, None, None

    north = dem[(row - 1) * SRTM_SIZE + column]
    south = dem[(row + 1) * SRTM_SIZE + column]
    west = dem[row * SRTM_SIZE + column - 1]
    east = dem[row * SRTM_SIZE + column + 1]

    neighbors = [north, south, west, east]

    if any(value == -32768 for value in neighbors):
        return float(center), None, None

    # SRTM 1 arc-second ≈ 30.87 m north/south.
    meters_per_degree_lat = 111320.0

    meters_per_degree_lon = (
        111320.0
        * math.cos(math.radians(latitude))
    )

    cell_lat_m = meters_per_degree_lat / 3600.0
    cell_lon_m = meters_per_degree_lon / 3600.0

    dz_dy = (south - north) / (2.0 * cell_lat_m)
    dz_dx = (east - west) / (2.0 * cell_lon_m)

    slope_rad = math.atan(
        math.sqrt(
            dz_dx ** 2 + dz_dy ** 2
        )
    )

    slope_deg = math.degrees(slope_rad)

    aspect_rad = math.atan2(
        dz_dx,
        -dz_dy,
    )

    aspect_deg = math.degrees(aspect_rad)

    if aspect_deg < 0:
        aspect_deg += 360.0

    return (
        float(center),
        round(slope_deg, 4),
        round(aspect_deg, 4),
    )


def main():
    print("=" * 70)
    print("EXTRACTING TERRAIN FOR BACKGROUND SAMPLES")
    print("=" * 70)

    points = pd.read_csv(INPUT_FILE)

    print()
    print(f"Background samples : {len(points)}")
    print(f"DEM directory      : {DEM_DIR}")

    elevations = []
    slopes = []
    aspects = []
    tiles = []

    failed = 0

    for index, row in points.iterrows():

        latitude = float(row["Latitude"])
        longitude = float(row["Longitude"])

        tile = tile_name(latitude, longitude)

        elevation, slope, aspect = get_terrain(
            latitude,
            longitude,
        )

        if elevation is None:
            failed += 1

        elevations.append(elevation)
        slopes.append(slope)
        aspects.append(aspect)
        tiles.append(tile)

        if (index + 1) % 500 == 0:
            print(
                f"  Processed {index + 1}/{len(points)}"
            )

    points["dem_tile"] = tiles
    points["elevation"] = elevations
    points["slope"] = slopes
    points["aspect"] = aspects

    points["terrain_source"] = "SRTM 1 arc-second DEM"
    points["terrain_source_type"] = "DEM-derived"
    points["terrain_status"] = points[
        "elevation"
    ].notna()

    points.to_csv(
        OUTPUT_FILE,
        index=False,
    )

    print()
    print("=" * 70)
    print("BACKGROUND TERRAIN EXTRACTION COMPLETED")
    print("=" * 70)

    print(f"Output file : {OUTPUT_FILE}")
    print(f"Records     : {len(points)}")
    print(f"Failed DEM  : {failed}")

    print()
    print("Terrain availability:")

    print(
        "Elevation:",
        points["elevation"].notna().sum(),
        "/",
        len(points),
    )

    print(
        "Slope:",
        points["slope"].notna().sum(),
        "/",
        len(points),
    )

    print(
        "Aspect:",
        points["aspect"].notna().sum(),
        "/",
        len(points),
    )

    print()
    print("Terrain statistics:")

    print(
        points[
            [
                "elevation",
                "slope",
                "aspect",
            ]
        ]
        .describe()
        .round(3)
        .to_string()
    )


if __name__ == "__main__":
    main()

