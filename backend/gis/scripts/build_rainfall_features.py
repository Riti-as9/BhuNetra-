from pathlib import Path
from datetime import timedelta
import time

import pandas as pd
import requests


ROOT = Path(__file__).resolve().parents[2]

# Original GSI inventory contains History/event dates.
GSI_FILE = ROOT / "data" / "processed" / "gsi_landslide_inventory.csv"

# Real DEM-derived terrain features.
TERRAIN_FILE = ROOT / "data" / "processed" / "gsi_terrain_features.csv"

# Final rainfall feature dataset.
OUTPUT_FILE = ROOT / "data" / "processed" / "gsi_rainfall_features.csv"

# Historical weather API.
# Important: this is reanalysis, NOT a physical rain gauge.
API_URL = "https://archive-api.open-meteo.com/v1/archive"


def parse_event_date(value):
    """
    Convert the GSI History field into a real calendar date.

    Example:
        12 July 2020 -> 2020-07-12

    Year-only and missing values are rejected.
    """

    if not value:
        return None

    value = str(value).strip()

    try:
        return pd.to_datetime(
            value,
            format="%d %B %Y",
            errors="raise",
        ).date()

    except (ValueError, TypeError):
        return None


def fetch_daily_rainfall(
    latitude,
    longitude,
    start_date,
    end_date,
):
    """
    Fetch daily accumulated precipitation.

    Values are returned in millimetres.
    """

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "daily": "precipitation_sum",
        "timezone": "UTC",
    }

    response = requests.get(
        API_URL,
        params=params,
        timeout=30,
    )

    response.raise_for_status()

    payload = response.json()

    daily = payload.get("daily", {})

    dates = daily.get("time", [])
    rainfall = daily.get(
        "precipitation_sum",
        [],
    )

    if not dates or not rainfall:
        raise ValueError(
            "No rainfall data returned"
        )

    return {
        pd.to_datetime(day).date(): (
            0.0 if value is None else float(value)
        )
        for day, value in zip(
            dates,
            rainfall,
        )
    }


def calculate_rainfall_features(
    latitude,
    longitude,
    event_date,
):
    """
    Calculate rainfall before/during the event.

    24h = event day

    3d = event day + previous 2 days

    7d = event day + previous 6 days
    """

    start_date = event_date - timedelta(
        days=6
    )

    end_date = event_date

    daily = fetch_daily_rainfall(
        latitude,
        longitude,
        start_date,
        end_date,
    )

    rainfall_24h = daily.get(
        event_date,
        0.0,
    )

    rainfall_3d = sum(
        daily.get(
            event_date - timedelta(days=i),
            0.0,
        )
        for i in range(3)
    )

    rainfall_7d = sum(
        daily.get(
            event_date - timedelta(days=i),
            0.0,
        )
        for i in range(7)
    )

    return {
        "rainfall_24h": round(
            rainfall_24h,
            3,
        ),
        "rainfall_3d": round(
            rainfall_3d,
            3,
        ),
        "rainfall_7d": round(
            rainfall_7d,
            3,
        ),
        "rainfall_source": (
            "Open-Meteo historical weather"
        ),
        "rainfall_source_type": "reanalysis",
        "rainfall_status": "available",
    }


def main():

    print("=" * 70)
    print(
        "BhuNetra rainfall feature extraction"
    )
    print("=" * 70)

    # ---------------------------------------------------------
    # 1. Check required files
    # ---------------------------------------------------------

    if not GSI_FILE.exists():
        raise FileNotFoundError(
            f"GSI file not found: {GSI_FILE}"
        )

    if not TERRAIN_FILE.exists():
        raise FileNotFoundError(
            f"Terrain file not found: {TERRAIN_FILE}"
        )

    # ---------------------------------------------------------
    # 2. Load datasets
    # ---------------------------------------------------------

    gsi = pd.read_csv(GSI_FILE)

    terrain = pd.read_csv(
        TERRAIN_FILE
    )

    print(
        f"GSI inventory rows: {len(gsi)}"
    )

    print(
        f"Terrain feature rows: {len(terrain)}"
    )

    # ---------------------------------------------------------
    # 3. Validate required columns
    # ---------------------------------------------------------

    required_gsi = {
        "Sl.No",
        "Slide_No",
        "State",
        "District",
        "Slide_Name",
        "History",
        "Latitude",
        "Longitude",
    }

    required_terrain = {
        "Sl.No",
        "Slide_No",
        "Latitude",
        "Longitude",
        "elevation_m", "slope_deg", "aspect_deg",
    }

    missing_gsi = (
        required_gsi
        - set(gsi.columns)
    )

    missing_terrain = (
        required_terrain
        - set(terrain.columns)
    )

    if missing_gsi:
        raise ValueError(
            "GSI dataset missing columns: "
            + ", ".join(
                sorted(missing_gsi)
            )
        )

    if missing_terrain:
        raise ValueError(
            "Terrain dataset missing columns: "
            + ", ".join(
                sorted(missing_terrain)
            )
        )

    # ---------------------------------------------------------
    # 4. Join original GSI records with terrain features
    # ---------------------------------------------------------

    terrain_columns = [
        "Sl.No",
        "Slide_No",
        "elevation_m", "slope_deg", "aspect_deg",
    ]

    merged = gsi.merge(
        terrain[terrain_columns],
        on=[
            "Sl.No",
            "Slide_No",
        ],
        how="inner",
        suffixes=(
            "",
            "_terrain",
        ),
    )

    print(
        f"Joined GSI + terrain rows: "
        f"{len(merged)}"
    )

    # ---------------------------------------------------------
    # 5. Parse event dates
    # ---------------------------------------------------------

    merged["event_date"] = (
        merged["History"]
        .apply(parse_event_date)
    )

    exact_date = merged[
        merged["event_date"].notna()
    ].copy()

    print(
        f"Exact-date events: "
        f"{len(exact_date)}"
    )

    print(
        "Year-only/no-date events are "
        "excluded from event rainfall."
    )

    if exact_date.empty:
        raise RuntimeError(
            "No exact-date GSI events found."
        )

    # ---------------------------------------------------------
    # 6. Fetch rainfall
    # ---------------------------------------------------------

    records = []

    total = len(exact_date)

    for index, (_, row) in enumerate(
        exact_date.iterrows(),
        start=1,
    ):

        latitude = float(
            row["Latitude"]
        )

        longitude = float(
            row["Longitude"]
        )

        event_date = row[
            "event_date"
        ]

        try:

            rainfall = (
                calculate_rainfall_features(
                    latitude,
                    longitude,
                    event_date,
                )
            )

            record = {
                "Sl.No": row["Sl.No"],
                "Slide_No": row["Slide_No"],
                "State": row["State"],
                "District": row["District"],
                "Slide_Name": row[
                    "Slide_Name"
                ],
                "Latitude": latitude,
                "Longitude": longitude,
                "event_date": (
                    event_date.isoformat()
                ),

                # DEM-derived terrain
                "elevation": row["elevation_m"],
                "slope": row["slope_deg"],
                "aspect": row["aspect_deg"],

                # Rainfall
                **rainfall,
            }

            records.append(record)

            print(
                f"[{index}/{total}] "
                f"{row['State']} | "
                f"{event_date} | "
                f"24h={rainfall['rainfall_24h']} mm | "
                f"3d={rainfall['rainfall_3d']} mm | "
                f"7d={rainfall['rainfall_7d']} mm"
            )

        except Exception as exc:

            print(
                f"[{index}/{total}] "
                f"FAILED | "
                f"{row['State']} | "
                f"{event_date} | "
                f"{exc}"
            )

        # Be respectful to the public API.
        time.sleep(0.2)

    # ---------------------------------------------------------
    # 7. Save
    # ---------------------------------------------------------

    result = pd.DataFrame(records)

    if result.empty:
        raise RuntimeError(
            "No rainfall records were created."
        )

    result.to_csv(
        OUTPUT_FILE,
        index=False,
        encoding="utf-8",
    )

    # ---------------------------------------------------------
    # 8. Report
    # ---------------------------------------------------------

    print()
    print("=" * 70)
    print(
        "RAINFALL EXTRACTION COMPLETED"
    )
    print("=" * 70)

    print(
        f"Successful records: "
        f"{len(result)}"
    )

    print(
        f"Output: {OUTPUT_FILE}"
    )

    print()
    print(
        "Rainfall statistics:"
    )

    print(
        result[
            [
                "rainfall_24h",
                "rainfall_3d",
                "rainfall_7d",
            ]
        ].describe()
    )


if __name__ == "__main__":
    main()

