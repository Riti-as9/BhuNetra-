import csv
import time
from datetime import date, timedelta
from pathlib import Path

import pandas as pd
import requests


BASE_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BASE_DIR / "data" / "processed"

INPUT_FILE = DATA_DIR / "background_terrain_features.csv"
OUTPUT_FILE = DATA_DIR / "background_environment_features.csv"

API_URL = "https://archive-api.open-meteo.com/v1/archive"

SOIL_VARIABLES = [
    "soil_moisture_0_to_7cm",
    "soil_moisture_7_to_28cm",
    "soil_moisture_28_to_100cm",
    "soil_moisture_100_to_255cm",
]

MAX_RETRIES = 4
REQUEST_TIMEOUT = 60
RETRY_DELAY = 2.0
REQUEST_DELAY = 0.25


def make_key(row):
    return (
        f"{row.get('sample_id', '')}|"
        f"{row.get('reference_date', '')}|"
        f"{row.get('Latitude', '')}|"
        f"{row.get('Longitude', '')}"
    )


def fetch_environment(
    latitude,
    longitude,
    reference_date,
):
    """
    Fetch rainfall and ERA5-Land soil moisture for one
    background coordinate and its state-matched reference date.

    Rainfall:
        rainfall_24h = reference date
        rainfall_3d  = reference date + previous 2 days
        rainfall_7d  = reference date + previous 6 days

    Soil moisture:
        Daily mean across the four ERA5-Land soil layers.
    """

    start_date = reference_date - timedelta(days=6)
    end_date = reference_date

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "daily": "precipitation_sum",
        "hourly": ",".join(SOIL_VARIABLES),
        "timezone": "UTC",
        "models": "era5_land",
    }

    last_error = None

    for attempt in range(1, MAX_RETRIES + 1):

        try:

            response = requests.get(
                API_URL,
                params=params,
                timeout=REQUEST_TIMEOUT,
            )

            response.raise_for_status()

            payload = response.json()

            # -------------------------------------------------
            # Rainfall
            # -------------------------------------------------

            daily = payload.get("daily", {})

            rainfall_dates = daily.get("time", [])
            rainfall_values = daily.get(
                "precipitation_sum",
                [],
            )

            if not rainfall_dates or not rainfall_values:
                raise ValueError(
                    "No rainfall data returned"
                )

            rainfall = {
                pd.to_datetime(day).date(): (
                    0.0
                    if value is None
                    else float(value)
                )
                for day, value in zip(
                    rainfall_dates,
                    rainfall_values,
                )
            }

            rainfall_24h = rainfall.get(
                reference_date,
                0.0,
            )

            rainfall_3d = sum(
                rainfall.get(
                    reference_date
                    - timedelta(days=i),
                    0.0,
                )
                for i in range(3)
            )

            rainfall_7d = sum(
                rainfall.get(
                    reference_date
                    - timedelta(days=i),
                    0.0,
                )
                for i in range(7)
            )

            # -------------------------------------------------
            # Soil moisture
            # -------------------------------------------------

            hourly = payload.get(
                "hourly",
                {},
            )

            times = hourly.get(
                "time",
                [],
            )

            if not times:
                raise ValueError(
                    "No soil moisture data returned"
                )

            soil_values = {}

            for variable in SOIL_VARIABLES:

                series = hourly.get(
                    variable,
                    [],
                )

                valid = [
                    float(value)
                    for value in series
                    if value is not None
                ]

                if not valid:
                    raise ValueError(
                        f"No values returned for {variable}"
                    )

                soil_values[variable] = (
                    sum(valid) / len(valid)
                )

            soil_mean = (
                sum(
                    soil_values[variable]
                    for variable in SOIL_VARIABLES
                )
                / len(SOIL_VARIABLES)
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

                "soil_moisture_0_7cm": round(
                    soil_values[
                        "soil_moisture_0_to_7cm"
                    ],
                    6,
                ),
                "soil_moisture_7_28cm": round(
                    soil_values[
                        "soil_moisture_7_to_28cm"
                    ],
                    6,
                ),
                "soil_moisture_28_100cm": round(
                    soil_values[
                        "soil_moisture_28_to_100cm"
                    ],
                    6,
                ),
                "soil_moisture_100_255cm": round(
                    soil_values[
                        "soil_moisture_100_to_255cm"
                    ],
                    6,
                ),
                "soil_moisture": round(
                    soil_mean,
                    6,
                ),

                "soil_moisture_source": (
                    "Open-Meteo ERA5-Land"
                ),
                "soil_moisture_source_type": "reanalysis",
                "soil_moisture_status": "available",
            }

        except Exception as exc:

            last_error = exc

            if attempt < MAX_RETRIES:

                delay = RETRY_DELAY * (
                    2 ** (attempt - 1)
                )

                print(
                    f"    Retry {attempt}/"
                    f"{MAX_RETRIES - 1} "
                    f"after error: {exc}"
                )

                time.sleep(delay)

    raise RuntimeError(
        f"Failed after {MAX_RETRIES} attempts: "
        f"{last_error}"
    )


def load_existing_output():

    if not OUTPUT_FILE.exists():
        return [], set()

    try:

        with OUTPUT_FILE.open(
            "r",
            encoding="utf-8-sig",
            newline="",
        ) as file:

            rows = list(
                csv.DictReader(file)
            )

        keys = {
            make_key(row)
            for row in rows
        }

        return rows, keys

    except Exception as exc:

        print(
            "WARNING: Could not read existing "
            f"output: {exc}"
        )

        return [], set()


def save_output(rows):

    if not rows:
        return

    fieldnames = list(
        rows[0].keys()
    )

    OUTPUT_FILE.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    temp_file = OUTPUT_FILE.with_suffix(
        ".tmp"
    )

    with temp_file.open(
        "w",
        encoding="utf-8",
        newline="",
    ) as file:

        writer = csv.DictWriter(
            file,
            fieldnames=fieldnames,
        )

        writer.writeheader()
        writer.writerows(rows)

    temp_file.replace(
        OUTPUT_FILE
    )


def main():

    print("=" * 70)
    print(
        "BHUNETRA - BACKGROUND ENVIRONMENT EXTRACTION"
    )
    print("=" * 70)

    if not INPUT_FILE.exists():

        raise FileNotFoundError(
            f"Input file not found: {INPUT_FILE}"
        )

    with INPUT_FILE.open(
        "r",
        encoding="utf-8-sig",
        newline="",
    ) as file:

        input_rows = list(
            csv.DictReader(file)
        )

    print(
        f"Background input records: "
        f"{len(input_rows)}"
    )

    required_columns = {
        "sample_id",
        "State",
        "Latitude",
        "Longitude",
        "reference_date",
        "elevation",
        "slope",
        "aspect",
    }

    missing = (
        required_columns
        - set(input_rows[0].keys())
    )

    if missing:

        raise ValueError(
            "Input dataset missing columns: "
            + ", ".join(
                sorted(missing)
            )
        )

    existing_rows, existing_keys = (
        load_existing_output()
    )

    print(
        f"Existing successful records: "
        f"{len(existing_rows)}"
    )

    pending_rows = [
        row
        for row in input_rows
        if make_key(row)
        not in existing_keys
    ]

    print(
        f"Records still requiring extraction: "
        f"{len(pending_rows)}"
    )

    print()

    all_rows = list(existing_rows)

    successful_new = 0
    failed = 0

    total = len(pending_rows)

    for index, row in enumerate(
        pending_rows,
        start=1,
    ):

        try:

            latitude = float(
                row["Latitude"]
            )

            longitude = float(
                row["Longitude"]
            )

            reference_date = date.fromisoformat(
                row["reference_date"]
            )

            environment = fetch_environment(
                latitude,
                longitude,
                reference_date,
            )

            output_row = dict(row)

            output_row.update(
                environment
            )

            all_rows.append(
                output_row
            )

            existing_keys.add(
                make_key(output_row)
            )

            successful_new += 1

            print(
                f"[{index}/{total}] "
                f"OK | {row['State']} | "
                f"{row['reference_date']} | "
                f"rain24="
                f"{environment['rainfall_24h']:.2f} mm | "
                f"soil="
                f"{environment['soil_moisture']:.4f}"
            )

            # Save every successful record.
            save_output(all_rows)

        except Exception as exc:

            failed += 1

            print(
                f"[{index}/{total}] "
                f"FAILED | "
                f"{row.get('State', 'unknown')} | "
                f"{row.get('reference_date', 'unknown')} | "
                f"{exc}"
            )

        time.sleep(
            REQUEST_DELAY
        )

    print()
    print("=" * 70)
    print(
        "BACKGROUND ENVIRONMENT EXTRACTION COMPLETED"
    )
    print("=" * 70)

    print(
        f"Original records:       {len(input_rows)}"
    )

    print(
        f"Previously successful:  "
        f"{len(existing_rows)}"
    )

    print(
        f"New successful:         "
        f"{successful_new}"
    )

    print(
        f"Failed this run:        "
        f"{failed}"
    )

    print(
        f"Total successful:       "
        f"{len(all_rows)}"
    )

    print(
        f"Remaining missing:      "
        f"{len(input_rows) - len(all_rows)}"
    )

    print(
        f"Output:                 "
        f"{OUTPUT_FILE}"
    )

    print("=" * 70)


if __name__ == "__main__":
    main()
