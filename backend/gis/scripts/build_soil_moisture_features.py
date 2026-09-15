import csv
import time
from datetime import date
from pathlib import Path

import requests


BASE_DIR = Path(__file__).resolve().parents[2]

INPUT_FILE = BASE_DIR / "data" / "processed" / "gsi_rainfall_features.csv"
OUTPUT_FILE = BASE_DIR / "data" / "processed" / "gsi_soil_moisture_features.csv"

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


def make_key(row):
    return (
        f"{row.get('Sl.No', '')}|"
        f"{row.get('event_date', '')}|"
        f"{row.get('Latitude', '')}|"
        f"{row.get('Longitude', '')}"
    )


def fetch_soil_moisture(latitude, longitude, event_date):
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "start_date": event_date.isoformat(),
        "end_date": event_date.isoformat(),
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

            data = response.json()
            hourly = data.get("hourly", {})
            times = hourly.get("time", [])

            if not times:
                raise ValueError("No soil moisture data returned")

            values = {}

            for variable in SOIL_VARIABLES:
                series = hourly.get(variable, [])
                valid = [
                    float(value)
                    for value in series
                    if value is not None
                ]

                if not valid:
                    raise ValueError(
                        f"No values returned for {variable}"
                    )

                values[variable] = sum(valid) / len(valid)

            values["soil_moisture_mean"] = sum(
                values[variable]
                for variable in SOIL_VARIABLES
            ) / len(SOIL_VARIABLES)

            return values

        except Exception as exc:
            last_error = exc

            if attempt < MAX_RETRIES:
                delay = RETRY_DELAY * (2 ** (attempt - 1))
                print(
                    f"    Retry {attempt}/{MAX_RETRIES - 1} "
                    f"after error: {exc}"
                )
                time.sleep(delay)

    raise RuntimeError(
        f"Failed after {MAX_RETRIES} attempts: {last_error}"
    )


def load_existing_output():
    if not OUTPUT_FILE.exists():
        return [], set()

    try:
        with OUTPUT_FILE.open(
            "r",
            encoding="utf-8-sig",
            newline=""
        ) as file:
            rows = list(csv.DictReader(file))

        keys = {make_key(row) for row in rows}

        return rows, keys

    except Exception as exc:
        print(f"WARNING: Could not read existing output: {exc}")
        return [], set()


def save_output(rows):
    if not rows:
        return

    fieldnames = list(rows[0].keys())

    OUTPUT_FILE.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    temp_file = OUTPUT_FILE.with_suffix(".tmp")

    with temp_file.open(
        "w",
        encoding="utf-8",
        newline=""
    ) as file:
        writer = csv.DictWriter(
            file,
            fieldnames=fieldnames
        )
        writer.writeheader()
        writer.writerows(rows)

    temp_file.replace(OUTPUT_FILE)


def main():
    print("=" * 70)
    print("BHUNETRA - RESUMABLE HISTORICAL SOIL MOISTURE EXTRACTION")
    print("=" * 70)

    if not INPUT_FILE.exists():
        raise FileNotFoundError(
            f"Input file not found: {INPUT_FILE}"
        )

    with INPUT_FILE.open(
        "r",
        encoding="utf-8-sig",
        newline=""
    ) as file:
        input_rows = list(csv.DictReader(file))

    print(f"Input rainfall records: {len(input_rows)}")

    existing_rows, existing_keys = load_existing_output()

    print(
        f"Existing successful records: {len(existing_rows)}"
    )

    pending_rows = [
        row
        for row in input_rows
        if make_key(row) not in existing_keys
    ]

    print(f"Records still requiring extraction: {len(pending_rows)}")
    print()

    all_rows = list(existing_rows)

    successful_new = 0
    failed = 0

    for index, row in enumerate(pending_rows, start=1):
        try:
            latitude = float(row["Latitude"])
            longitude = float(row["Longitude"])
            event_date = date.fromisoformat(row["event_date"])

            soil = fetch_soil_moisture(
                latitude,
                longitude,
                event_date
            )

            output_row = dict(row)

            output_row.update({
                "soil_moisture_0_7cm": round(
                    soil["soil_moisture_0_to_7cm"],
                    6
                ),
                "soil_moisture_7_28cm": round(
                    soil["soil_moisture_7_to_28cm"],
                    6
                ),
                "soil_moisture_28_100cm": round(
                    soil["soil_moisture_28_to_100cm"],
                    6
                ),
                "soil_moisture_100_255cm": round(
                    soil["soil_moisture_100_to_255cm"],
                    6
                ),
                "soil_moisture": round(
                    soil["soil_moisture_mean"],
                    6
                ),
                "soil_moisture_source": (
                    "Open-Meteo ERA5-Land"
                ),
                "soil_moisture_source_type": "reanalysis",
                "soil_moisture_status": "available",
            })

            all_rows.append(output_row)
            existing_keys.add(make_key(output_row))
            successful_new += 1

            print(
                f"[{index}/{len(pending_rows)}] "
                f"OK | {row['State']} | "
                f"{row['event_date']} | "
                f"soil={soil['soil_moisture_mean']:.4f} m3/m3"
            )

            # Save after every successful record.
            # This makes the pipeline safely resumable.
            save_output(all_rows)

        except Exception as exc:
            failed += 1

            print(
                f"[{index}/{len(pending_rows)}] "
                f"FAILED | {row.get('State', 'unknown')} | "
                f"{row.get('event_date', 'unknown')} | {exc}"
            )

        time.sleep(0.25)

    print()
    print("=" * 70)
    print("SOIL MOISTURE EXTRACTION COMPLETED")
    print("=" * 70)
    print(f"Original records:       {len(input_rows)}")
    print(f"Previously successful:  {len(existing_rows)}")
    print(f"New successful:         {successful_new}")
    print(f"Failed this run:        {failed}")
    print(f"Total successful:       {len(all_rows)}")
    print(
        f"Remaining missing:      "
        f"{len(input_rows) - len(all_rows)}"
    )
    print(f"Output:                 {OUTPUT_FILE}")
    print("=" * 70)


if __name__ == "__main__":
    main()
