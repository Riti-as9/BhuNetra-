from pathlib import Path
import random
import pandas as pd

BASE_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BASE_DIR / "data" / "processed"

BACKGROUND_FILE = DATA_DIR / "background_terrain_features.csv"
INVENTORY_FILE = DATA_DIR / "gsi_landslide_inventory.csv"
OUTPUT_FILE = DATA_DIR / "background_environment_points.csv"

random.seed(42)

background = pd.read_csv(BACKGROUND_FILE)
inventory = pd.read_csv(
    INVENTORY_FILE,
    usecols=["Sl.No", "State"]
)

# The inventory's event dates are taken from the rainfall dataset
rainfall_file = DATA_DIR / "gsi_rainfall_features.csv"

rainfall = pd.read_csv(
    rainfall_file,
    usecols=["Sl.No", "State", "event_date"]
)

rainfall["event_date"] = pd.to_datetime(
    rainfall["event_date"],
    errors="coerce"
)

rainfall = rainfall.dropna(
    subset=["event_date"]
)

print("=" * 70)
print("ASSIGNING STATE-MATCHED REFERENCE DATES")
print("=" * 70)

print()
print("Background samples :", len(background))
print("Historical events  :", len(rainfall))

# Build a pool of historical event dates for each NER state.
state_dates = {}

for state, group in rainfall.groupby("State"):
    dates = group["event_date"].dt.strftime("%Y-%m-%d").tolist()

    if dates:
        state_dates[state] = dates

# Assign one historical date from the same state to every background point.
assigned_dates = []

missing_state_dates = 0

for _, row in background.iterrows():

    state = row["State"]

    dates = state_dates.get(state, [])

    if not dates:
        assigned_dates.append(None)
        missing_state_dates += 1
        continue

    assigned_dates.append(
        random.choice(dates)
    )

background["reference_date"] = assigned_dates

background["reference_date"] = pd.to_datetime(
    background["reference_date"],
    errors="coerce"
)

background["reference_date_source"] = (
    "GSI_event_date_same_state_reference"
)

background["reference_date_rule"] = (
    "random_historical_event_date_from_same_NER_state"
)

background.to_csv(
    OUTPUT_FILE,
    index=False
)

print()
print("Reference dates assigned :", background["reference_date"].notna().sum())
print("Missing reference dates  :", missing_state_dates)

print()
print("Reference dates by state:")

summary = (
    background
    .dropna(subset=["reference_date"])
    .groupby("State")["reference_date"]
    .agg(
        samples="count",
        earliest="min",
        latest="max"
    )
)

print(summary.to_string())

print()
print("First 10 records:")

print(
    background[
        [
            "sample_id",
            "State",
            "Latitude",
            "Longitude",
            "reference_date",
            "elevation",
            "slope",
            "aspect",
        ]
    ]
    .head(10)
    .to_string(index=False)
)

print()
print("=" * 70)
print("REFERENCE DATE ASSIGNMENT COMPLETED")
print("=" * 70)
