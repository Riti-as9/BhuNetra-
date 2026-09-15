from pathlib import Path
from datetime import timedelta
import shutil
import time

import pandas as pd
import requests


# ============================================================
# PATHS
# ============================================================

ROOT = Path(__file__).resolve().parents[2]

INPUT_FILE = ROOT / "data" / "processed" / "background_environment_features.csv"

BACKUP_FILE = (
    ROOT
    / "data"
    / "processed"
    / "background_environment_features_before_rainfall_fix.csv"
)

OUTPUT_FILE = (
    ROOT
    / "data"
    / "processed"
    / "background_environment_features.csv"
)

API_URL = "https://archive-api.open-meteo.com/v1/archive"


# ============================================================
# SETTINGS
# ============================================================

MAX_RETRIES = 4
TIMEOUT_SECONDS = 60
RETRY_DELAYS = [2, 4, 8, 16]
SAVE_EVERY = 100


# ============================================================
# FETCH RAINFALL
# ============================================================

def fetch_daily_rainfall(
    latitude: float,
    longitude: float,
    start_date,
    end_date,
):
    """
    Fetch historical daily precipitation from Open-Meteo.

    IMPORTANT:
    We intentionally DO NOT specify models=era5_land here.

    The previous background extraction used:
        models=era5_land

    That returned NULL precipitation values for these dates,
    which were incorrectly converted to 0.0.

    Open-Meteo's default historical precipitation response
    provides usable precipitation values.
    """

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "daily": "precipitation_sum",
        "timezone": "UTC",
    }

    last_error = None

    for attempt in range(MAX_RETRIES):

        try:
            response = requests.get(
                API_URL,
                params=params,
                timeout=TIMEOUT_SECONDS,
            )

            response.raise_for_status()

            payload = response.json()

            daily = payload.get("daily")

            if not daily:
                raise ValueError("Open-Meteo response does not contain daily data")

            dates = daily.get("time", [])
            rainfall_values = daily.get("precipitation_sum", [])

            if not dates:
                raise ValueError("No rainfall dates returned")

            if len(dates) != len(rainfall_values):
                raise ValueError(
                    "Rainfall date/value length mismatch"
                )

            rainfall = {}

            for day, value in zip(dates, rainfall_values):

                parsed_day = pd.to_datetime(day).date()

                # DO NOT silently convert missing rainfall to zero.
                if value is None:
                    rainfall[parsed_day] = None
                else:
                    rainfall[parsed_day] = float(value)

            return rainfall

        except Exception as error:

            last_error = error

            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAYS[attempt])

    raise RuntimeError(
        f"Rainfall request failed after {MAX_RETRIES} attempts: {last_error}"
    )


# ============================================================
# CALCULATE RAINFALL FEATURES
# ============================================================

def calculate_rainfall_features(
    latitude: float,
    longitude: float,
    reference_date,
):
    """
    Calculate:

    rainfall_24h
    rainfall_3d
    rainfall_7d

    using the reference date and preceding days.
    """

    start_date = reference_date - timedelta(days=6)
    end_date = reference_date

    rainfall = fetch_daily_rainfall(
        latitude,
        longitude,
        start_date,
        end_date,
    )

    required_dates = [
        reference_date - timedelta(days=i)
        for i in range(7)
    ]

    # Make sure every required day exists.
    for day in required_dates:

        if day not in rainfall:
            raise ValueError(
                f"Missing rainfall date {day}"
            )

        if rainfall[day] is None:
            raise ValueError(
                f"Rainfall value is NULL for {day}"
            )

    rainfall_24h = rainfall[reference_date]

    rainfall_3d = sum(
        rainfall[reference_date - timedelta(days=i)]
        for i in range(3)
    )

    rainfall_7d = sum(
        rainfall[reference_date - timedelta(days=i)]
        for i in range(7)
    )

    return {
        "rainfall_24h": round(rainfall_24h, 3),
        "rainfall_3d": round(rainfall_3d, 3),
        "rainfall_7d": round(rainfall_7d, 3),
        "rainfall_source": "Open-Meteo historical weather",
        "rainfall_source_type": "reanalysis",
        "rainfall_status": "available",
    }


# ============================================================
# MAIN
# ============================================================

def main():

    print("=" * 70)
    print("BACKGROUND RAINFALL REPAIR")
    print("=" * 70)

    print()
    print("Input:")
    print(INPUT_FILE)

    print()
    print("Checking input file...")

    if not INPUT_FILE.exists():
        raise FileNotFoundError(
            f"Input file not found:\n{INPUT_FILE}"
        )

    # --------------------------------------------------------
    # Backup
    # --------------------------------------------------------

    if not BACKUP_FILE.exists():

        print()
        print("Creating backup...")

        shutil.copy2(
            INPUT_FILE,
            BACKUP_FILE,
        )

        print(f"Backup created:")
        print(BACKUP_FILE)

    else:

        print()
        print("Backup already exists:")
        print(BACKUP_FILE)

    # --------------------------------------------------------
    # Load dataset
    # --------------------------------------------------------

    df = pd.read_csv(INPUT_FILE)

    print()
    print(f"Original records: {len(df)}")

    required_columns = [
        "sample_id",
        "Latitude",
        "Longitude",
        "reference_date",
    ]

    missing_columns = [
        column
        for column in required_columns
        if column not in df.columns
    ]

    if missing_columns:

        raise ValueError(
            "Missing required columns: "
            + ", ".join(missing_columns)
        )

    # --------------------------------------------------------
    # Parse dates
    # --------------------------------------------------------

    df["reference_date"] = pd.to_datetime(
        df["reference_date"],
        errors="coerce",
    ).dt.date

    invalid_dates = df["reference_date"].isna().sum()

    if invalid_dates:

        raise ValueError(
            f"{invalid_dates} records have invalid reference_date values"
        )

    # --------------------------------------------------------
    # Repair rainfall
    # --------------------------------------------------------

    total = len(df)

    successful = 0
    failed = 0

    failed_records = []

    print()
    print("Starting rainfall repair...")
    print()
    print("IMPORTANT:")
    print("Existing terrain and soil-moisture values will NOT be changed.")
    print("Only rainfall fields will be replaced.")
    print()

    for index, row in df.iterrows():

        latitude = float(row["Latitude"])
        longitude = float(row["Longitude"])
        reference_date = row["reference_date"]

        try:

            rainfall_features = calculate_rainfall_features(
                latitude,
                longitude,
                reference_date,
            )

            # Update ONLY rainfall fields.
            for key, value in rainfall_features.items():
                df.at[index, key] = value

            successful += 1

        except Exception as error:

            failed += 1

            failed_records.append(
                {
                    "sample_id": row["sample_id"],
                    "reference_date": reference_date,
                    "latitude": latitude,
                    "longitude": longitude,
                    "error": str(error),
                }
            )

            print(
                f"[FAILED {failed}] "
                f"sample_id={row['sample_id']} "
                f"date={reference_date} "
                f"error={error}"
            )

        # Progress
        processed = index + 1

        if processed % SAVE_EVERY == 0:

            df.to_csv(
                OUTPUT_FILE,
                index=False,
            )

            print(
                f"Progress: {processed}/{total} | "
                f"Successful: {successful} | "
                f"Failed: {failed}"
            )

        # Small delay to avoid aggressive API requests.
        time.sleep(0.25)

    # --------------------------------------------------------
    # Final save
    # --------------------------------------------------------

    df.to_csv(
        OUTPUT_FILE,
        index=False,
    )

    # --------------------------------------------------------
    # Validation
    # --------------------------------------------------------

    print()
    print("=" * 70)
    print("VALIDATION")
    print("=" * 70)

    rainfall_columns = [
        "rainfall_24h",
        "rainfall_3d",
        "rainfall_7d",
    ]

    for column in rainfall_columns:

        values = pd.to_numeric(
            df[column],
            errors="coerce",
        )

        print()
        print(column)

        print(f"  Non-null : {values.notna().sum()}/{len(df)}")
        print(f"  Zero     : {(values == 0).sum()}")
        print(f"  Mean     : {values.mean():.3f}")
        print(f"  Minimum  : {values.min():.3f}")
        print(f"  Maximum  : {values.max():.3f}")

    # --------------------------------------------------------
    # Soil validation
    # --------------------------------------------------------

    if "soil_moisture" in df.columns:

        soil = pd.to_numeric(
            df["soil_moisture"],
            errors="coerce",
        )

        print()
        print("soil_moisture")

        print(f"  Non-null : {soil.notna().sum()}/{len(df)}")
        print(f"  Mean     : {soil.mean():.4f}")
        print(f"  Minimum  : {soil.min():.4f}")
        print(f"  Maximum  : {soil.max():.4f}")

    # --------------------------------------------------------
    # Failure report
    # --------------------------------------------------------

    if failed_records:

        failure_file = (
            ROOT
            / "data"
            / "processed"
            / "background_rainfall_failures.csv"
        )

        pd.DataFrame(failed_records).to_csv(
            failure_file,
            index=False,
        )

        print()
        print(f"Failure report:")
        print(failure_file)

    # --------------------------------------------------------
    # Final summary
    # --------------------------------------------------------

    print()
    print("=" * 70)
    print("BACKGROUND RAINFALL REPAIR COMPLETED")
    print("=" * 70)

    print(f"Original records : {total}")
    print(f"Successful       : {successful}")
    print(f"Failed           : {failed}")
    print(f"Remaining missing: {total - successful}")

    print()
    print(f"Output:")
    print(OUTPUT_FILE)

    print()
    print(f"Backup:")
    print(BACKUP_FILE)


if __name__ == "__main__":
    main()