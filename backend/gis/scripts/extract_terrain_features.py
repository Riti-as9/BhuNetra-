"""
BhuNetra - SRTM Terrain Feature Extractor

Extracts real terrain features from SRTM 1-arc-second DEM tiles
for every GSI landslide point.

Outputs:
    data/processed/gsi_terrain_features.csv

Features:
    - elevation_m
    - slope_deg
    - aspect_deg

SRTM tile format:
    3601 x 3601 signed 16-bit big-endian elevation values.
"""

from pathlib import Path
import csv
import math
import struct


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[2]

GSI_FILE = BASE_DIR / "data" / "processed" / "gsi_landslide_inventory.csv"
DEM_DIR = BASE_DIR / "data" / "raw" / "dem"
OUTPUT_FILE = BASE_DIR / "data" / "processed" / "gsi_terrain_features.csv"


# ============================================================
# SRTM CONSTANTS
# ============================================================

GRID_SIZE = 3601

# SRTM 1 arc-second spacing.
# Approximately 30.87 m at the equator.
ARC_SECONDS = 1.0

# Earth radius in metres.
EARTH_RADIUS_M = 6_371_000.0

# SRTM uses signed 16-bit big-endian integers.
VALUE_FORMAT = ">h"
VALUE_SIZE = 2

# SRTM void/no-data value.
SRTM_VOID = -32768


# ============================================================
# TILE NAME
# ============================================================

def get_tile_name(latitude: float, longitude: float) -> str:
    """
    Return the SRTM tile name containing a coordinate.

    Example:
        latitude  = 25.65
        longitude = 93.10

        -> N25E093
    """

    lat_degree = math.floor(latitude)
    lon_degree = math.floor(longitude)

    lat_prefix = "N" if lat_degree >= 0 else "S"
    lon_prefix = "E" if lon_degree >= 0 else "W"

    return (
        f"{lat_prefix}{abs(lat_degree):02d}"
        f"{lon_prefix}{abs(lon_degree):03d}"
    )


# ============================================================
# LOAD DEM TILE
# ============================================================

def load_dem_tile(tile_name: str):
    """
    Load one complete SRTM tile into memory.

    A 3601 x 3601 tile contains 12,967,201 cells.
    Each cell is 2 bytes.
    """

    tile_path = DEM_DIR / f"{tile_name}.hgt"

    if not tile_path.exists():
        raise FileNotFoundError(
            f"DEM tile not found: {tile_path}"
        )

    expected_size = GRID_SIZE * GRID_SIZE * VALUE_SIZE

    actual_size = tile_path.stat().st_size

    if actual_size != expected_size:
        raise ValueError(
            f"Invalid DEM size for {tile_name}: "
            f"{actual_size} bytes; expected {expected_size}"
        )

    with tile_path.open("rb") as file:
        raw_data = file.read()

    # Convert raw bytes to signed 16-bit big-endian elevations.
    values = struct.unpack(
        f">{GRID_SIZE * GRID_SIZE}h",
        raw_data
    )

    return values


# ============================================================
# TILE CACHE
# ============================================================

DEM_CACHE = {}


def get_dem_tile(tile_name: str):
    """
    Load a DEM tile once and keep it in memory.

    This avoids repeatedly reading the same 25 MB file.
    """

    if tile_name not in DEM_CACHE:
        print(f"[LOAD] {tile_name}.hgt")
        DEM_CACHE[tile_name] = load_dem_tile(tile_name)

    return DEM_CACHE[tile_name]


# ============================================================
# GRID INDEX
# ============================================================

def coordinate_to_grid_index(
    latitude: float,
    longitude: float,
):
    """
    Convert geographic coordinates to SRTM row/column.

    SRTM rows are stored from north to south.

    The tile covers:
        latitude  = integer latitude -> integer latitude + 1
        longitude = integer longitude -> integer longitude + 1
    """

    tile_lat = math.floor(latitude)
    tile_lon = math.floor(longitude)

    # Position within the 1-degree tile.
    lat_fraction = latitude - tile_lat
    lon_fraction = longitude - tile_lon

    # Column increases west -> east.
    column = int(round(lon_fraction * 3600))

    # Row increases north -> south,
    # therefore latitude is inverted.
    row = int(round((1.0 - lat_fraction) * 3600))

    # Keep the index inside the valid grid.
    row = max(0, min(GRID_SIZE - 1, row))
    column = max(0, min(GRID_SIZE - 1, column))

    return row, column


# ============================================================
# ELEVATION
# ============================================================

def get_elevation(
    tile,
    row: int,
    column: int,
):
    """
    Return elevation at a DEM cell.

    Returns None if the SRTM cell is a void/no-data value.
    """

    index = row * GRID_SIZE + column

    elevation = tile[index]

    if elevation == SRTM_VOID:
        return None

    return float(elevation)


# ============================================================
# SLOPE + ASPECT
# ============================================================

def calculate_slope_aspect(
    tile,
    row: int,
    column: int,
    latitude: float,
):
    """
    Calculate slope and aspect using a 3x3 Horn-style
    elevation neighborhood.

    Slope:
        angle of terrain steepness in degrees.

    Aspect:
        compass direction the slope faces.

        0   = North
        90  = East
        180 = South
        270 = West
    """

    # We need one cell around the target in every direction.
    if row <= 0 or row >= GRID_SIZE - 1:
        return None, None

    if column <= 0 or column >= GRID_SIZE - 1:
        return None, None

    def elevation_at(r, c):
        value = tile[r * GRID_SIZE + c]

        if value == SRTM_VOID:
            return None

        return float(value)

    # 3 x 3 neighborhood.
    z1 = elevation_at(row - 1, column - 1)
    z2 = elevation_at(row - 1, column)
    z3 = elevation_at(row - 1, column + 1)

    z4 = elevation_at(row, column - 1)
    z5 = elevation_at(row, column)
    z6 = elevation_at(row, column + 1)

    z7 = elevation_at(row + 1, column - 1)
    z8 = elevation_at(row + 1, column)
    z9 = elevation_at(row + 1, column + 1)

    values = [
        z1, z2, z3,
        z4, z5, z6,
        z7, z8, z9,
    ]

    if any(value is None for value in values):
        return None, None

    # --------------------------------------------------------
    # Horizontal ground spacing.
    # --------------------------------------------------------

    # Longitude spacing changes with latitude.
    latitude_rad = math.radians(latitude)

    meters_per_degree_lat = (
        math.pi * EARTH_RADIUS_M / 180.0
    )

    meters_per_degree_lon = (
        math.pi
        * EARTH_RADIUS_M
        * math.cos(latitude_rad)
        / 180.0
    )

    cell_size_x = meters_per_degree_lon / 3600.0
    cell_size_y = meters_per_degree_lat / 3600.0

    # --------------------------------------------------------
    # Horn's method.
    #
    # dz/dx:
    #
    # ((z3 + 2z6 + z9)
    #  -
    #  (z1 + 2z4 + z7))
    # / (8 * cell_size_x)
    #
    # dz/dy:
    #
    # ((z7 + 2z8 + z9)
    #  -
    #  (z1 + 2z2 + z3))
    # / (8 * cell_size_y)
    # --------------------------------------------------------

    dz_dx = (
        (z3 + 2 * z6 + z9)
        - (z1 + 2 * z4 + z7)
    ) / (8.0 * cell_size_x)

    dz_dy = (
        (z7 + 2 * z8 + z9)
        - (z1 + 2 * z2 + z3)
    ) / (8.0 * cell_size_y)

    # --------------------------------------------------------
    # Slope.
    # --------------------------------------------------------

    gradient = math.sqrt(
        dz_dx ** 2 +
        dz_dy ** 2
    )

    slope_rad = math.atan(gradient)

    slope_deg = math.degrees(slope_rad)

    # --------------------------------------------------------
    # Aspect.
    #
    # Convert mathematical angle into compass bearing.
    # --------------------------------------------------------

    aspect_rad = math.atan2(
        dz_dy,
        -dz_dx
    )

    aspect_deg = math.degrees(aspect_rad)

    aspect_deg = (
        90.0 - aspect_deg
    ) % 360.0

    return (
        round(slope_deg, 4),
        round(aspect_deg, 4),
    )


# ============================================================
# PROCESS POINT
# ============================================================

def process_point(latitude: float, longitude: float):
    """
    Extract elevation, slope and aspect for one coordinate.
    """

    tile_name = get_tile_name(
        latitude,
        longitude,
    )

    tile = get_dem_tile(tile_name)

    row, column = coordinate_to_grid_index(
        latitude,
        longitude,
    )

    elevation = get_elevation(
        tile,
        row,
        column,
    )

    slope, aspect = calculate_slope_aspect(
        tile,
        row,
        column,
        latitude,
    )

    return (
        tile_name,
        row,
        column,
        elevation,
        slope,
        aspect,
    )


# ============================================================
# MAIN PROCESS
# ============================================================

def main():

    print("=" * 70)
    print("BhuNetra - Real SRTM Terrain Feature Extraction")
    print("=" * 70)

    if not GSI_FILE.exists():
        raise FileNotFoundError(
            f"GSI inventory not found:\n{GSI_FILE}"
        )

    if not DEM_DIR.exists():
        raise FileNotFoundError(
            f"DEM directory not found:\n{DEM_DIR}"
        )

    print(f"GSI input : {GSI_FILE}")
    print(f"DEM dir   : {DEM_DIR}")
    print(f"Output    : {OUTPUT_FILE}")
    print()

    # --------------------------------------------------------
    # Read GSI inventory.
    # --------------------------------------------------------

    with GSI_FILE.open(
        "r",
        encoding="utf-8-sig",
        newline="",
    ) as file:

        reader = csv.DictReader(file)

        rows = list(reader)

    print(f"GSI points: {len(rows)}")
    print()

    # --------------------------------------------------------
    # Prepare output directory.
    # --------------------------------------------------------

    OUTPUT_FILE.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    output_fields = [
        "Sl.No",
        "Slide_No",
        "State",
        "District",
        "Slide_Name",
        "Latitude",
        "Longitude",
        "dem_tile",
        "dem_row",
        "dem_column",
        "elevation_m",
        "slope_deg",
        "aspect_deg",
    ]

    processed = 0
    missing_elevation = 0
    missing_slope = 0
    failed = 0

    with OUTPUT_FILE.open(
        "w",
        encoding="utf-8",
        newline="",
    ) as file:

        writer = csv.DictWriter(
            file,
            fieldnames=output_fields,
        )

        writer.writeheader()

        # ----------------------------------------------------
        # Process every GSI point.
        # ----------------------------------------------------

        for index, row in enumerate(rows, start=1):

            try:

                latitude = float(
                    row["Latitude"]
                )

                longitude = float(
                    row["Longitude"]
                )

                (
                    tile_name,
                    dem_row,
                    dem_column,
                    elevation,
                    slope,
                    aspect,
                ) = process_point(
                    latitude,
                    longitude,
                )

                if elevation is None:
                    missing_elevation += 1

                if slope is None or aspect is None:
                    missing_slope += 1

                writer.writerow(
                    {
                        "Sl.No": row.get("Sl.No", ""),
                        "Slide_No": row.get("Slide_No", ""),
                        "State": row.get("State", ""),
                        "District": row.get("District", ""),
                        "Slide_Name": row.get("Slide_Name", ""),
                        "Latitude": latitude,
                        "Longitude": longitude,
                        "dem_tile": tile_name,
                        "dem_row": dem_row,
                        "dem_column": dem_column,
                        "elevation_m": (
                            ""
                            if elevation is None
                            else elevation
                        ),
                        "slope_deg": (
                            ""
                            if slope is None
                            else slope
                        ),
                        "aspect_deg": (
                            ""
                            if aspect is None
                            else aspect
                        ),
                    }
                )

                processed += 1

                # Progress every 500 points.
                if index % 500 == 0:
                    print(
                        f"[PROGRESS] "
                        f"{index}/{len(rows)} points processed"
                    )

            except Exception as error:

                failed += 1

                print(
                    f"[FAILED] Point {index}: {error}"
                )

    # --------------------------------------------------------
    # Final summary.
    # --------------------------------------------------------

    print()
    print("=" * 70)
    print("TERRAIN EXTRACTION SUMMARY")
    print("=" * 70)

    print(f"Input points       : {len(rows)}")
    print(f"Processed           : {processed}")
    print(f"Failed              : {failed}")
    print(f"Missing elevation   : {missing_elevation}")
    print(f"Missing slope/aspect: {missing_slope}")
    print(f"DEM tiles loaded    : {len(DEM_CACHE)}")
    print()
    print(f"Output file:")
    print(OUTPUT_FILE)
    print()

    if failed > 0:
        raise RuntimeError(
            "Some GSI points failed during terrain extraction."
        )

    print("Real DEM terrain extraction completed successfully.")


if __name__ == "__main__":
    main()