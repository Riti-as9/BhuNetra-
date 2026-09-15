from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BASE_DIR / "data" / "processed"

INVENTORY_FILE = DATA_DIR / "gsi_landslide_inventory.csv"
RAINFALL_FILE = DATA_DIR / "gsi_rainfall_features.csv"
SOIL_FILE = DATA_DIR / "gsi_soil_moisture_features.csv"
TERRAIN_FILE = DATA_DIR / "gsi_terrain_features.csv"
OUTPUT_FILE = DATA_DIR / "landslide_training_real.csv"


def clean_key(df):
    df["Sl.No"] = df["Sl.No"].astype(str).str.strip()
    return df


print("=" * 70)
print("BUILDING REAL TRAINING DATASET")
print("=" * 70)

# ------------------------------------------------------------
# 1. LOAD SOURCE DATA
# ------------------------------------------------------------

inventory = pd.read_csv(INVENTORY_FILE)
rainfall = pd.read_csv(RAINFALL_FILE)
soil = pd.read_csv(SOIL_FILE)
terrain = pd.read_csv(TERRAIN_FILE)

print()
print("Records loaded:")
print(f"  Inventory : {len(inventory)}")
print(f"  Rainfall  : {len(rainfall)}")
print(f"  Soil      : {len(soil)}")
print(f"  Terrain   : {len(terrain)}")

# ------------------------------------------------------------
# 2. NORMALIZE JOIN KEY
# ------------------------------------------------------------

inventory = clean_key(inventory)
rainfall = clean_key(rainfall)
soil = clean_key(soil)
terrain = clean_key(terrain)

# ------------------------------------------------------------
# 3. KEEP ONLY REQUIRED ENVIRONMENTAL FEATURES
# ------------------------------------------------------------

rainfall = rainfall[
    [
        "Sl.No",
        "rainfall_24h",
        "rainfall_3d",
        "rainfall_7d",
        "rainfall_source",
        "rainfall_source_type",
        "rainfall_status",
    ]
].copy()

soil = soil[
    [
        "Sl.No",
        "soil_moisture",
        "soil_moisture_source",
        "soil_moisture_source_type",
        "soil_moisture_status",
    ]
].copy()

terrain = terrain[
    [
        "Sl.No",
        "elevation_m",
        "slope_deg",
        "aspect_deg",
    ]
].copy()

# ------------------------------------------------------------
# 4. RENAME TERRAIN FEATURES TO MODEL NAMES
# ------------------------------------------------------------

terrain = terrain.rename(
    columns={
        "elevation_m": "elevation",
        "slope_deg": "slope",
        "aspect_deg": "aspect",
    }
)

# ------------------------------------------------------------
# 5. REMOVE DUPLICATE ENVIRONMENTAL KEYS
# ------------------------------------------------------------

rainfall = rainfall.drop_duplicates(subset=["Sl.No"])
soil = soil.drop_duplicates(subset=["Sl.No"])
terrain = terrain.drop_duplicates(subset=["Sl.No"])

# ------------------------------------------------------------
# 6. MERGE RAINFALL
# ------------------------------------------------------------

print()
print("Merging rainfall data...")

dataset = inventory.merge(
    rainfall,
    on="Sl.No",
    how="left",
    validate="one_to_one",
)

print(f"After rainfall merge: {len(dataset)} records")
print(
    "Rainfall matched:",
    dataset["rainfall_24h"].notna().sum(),
    "/",
    len(dataset),
)

# ------------------------------------------------------------
# 7. MERGE SOIL MOISTURE
# ------------------------------------------------------------

print()
print("Merging soil moisture data...")

dataset = dataset.merge(
    soil,
    on="Sl.No",
    how="left",
    validate="one_to_one",
)

print(f"After soil merge: {len(dataset)} records")
print(
    "Soil moisture matched:",
    dataset["soil_moisture"].notna().sum(),
    "/",
    len(dataset),
)

# ------------------------------------------------------------
# 8. MERGE TERRAIN
# ------------------------------------------------------------

print()
print("Merging terrain data...")

dataset = dataset.merge(
    terrain,
    on="Sl.No",
    how="left",
    validate="one_to_one",
)

print(f"After terrain merge: {len(dataset)} records")

# ------------------------------------------------------------
# 9. ADD TRAINING LABEL
# ------------------------------------------------------------

dataset["landslide"] = 1
dataset["sample_source"] = "GSI_field_inventory"

# ------------------------------------------------------------
# 10. AVAILABILITY FLAGS
# ------------------------------------------------------------

dataset["rainfall_available"] = dataset["rainfall_24h"].notna()
dataset["soil_moisture_available"] = dataset["soil_moisture"].notna()

dataset["terrain_available"] = (
    dataset["elevation"].notna()
    & dataset["slope"].notna()
    & dataset["aspect"].notna()
)

# ------------------------------------------------------------
# 11. SAVE
# ------------------------------------------------------------

dataset.to_csv(OUTPUT_FILE, index=False)

# ------------------------------------------------------------
# 12. REPORT
# ------------------------------------------------------------

print()
print("=" * 70)
print("REAL TRAINING DATASET CREATED")
print("=" * 70)

print(f"Output file: {OUTPUT_FILE}")
print(f"Total records: {len(dataset)}")

print()
print("Data availability:")
print(
    f"  rainfall_available       "
    f"{dataset['rainfall_available'].sum()}/{len(dataset)}"
)
print(
    f"  soil_moisture_available  "
    f"{dataset['soil_moisture_available'].sum()}/{len(dataset)}"
)
print(
    f"  terrain_available        "
    f"{dataset['terrain_available'].sum()}/{len(dataset)}"
)

print()
print("Environmental feature statistics:")

feature_columns = [
    "rainfall_24h",
    "rainfall_3d",
    "rainfall_7d",
    "soil_moisture",
    "elevation",
    "slope",
    "aspect",
]

print(dataset[feature_columns].describe().round(3).to_string())

print()
print("Sample source:")
print(dataset["sample_source"].value_counts().to_string())

print()
print("First 5 environmental records:")
print(
    dataset[
        [
            "Sl.No",
            "rainfall_24h",
            "rainfall_3d",
            "rainfall_7d",
            "soil_moisture",
            "elevation",
            "slope",
            "aspect",
        ]
    ]
    .head()
    .to_string(index=False)
)

print()
print("=" * 70)
print("DATASET BUILD COMPLETED")
print("=" * 70)
