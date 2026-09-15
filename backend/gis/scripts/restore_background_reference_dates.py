from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BASE_DIR / "data" / "processed"

TERRAIN_FILE = DATA_DIR / "background_terrain_features.csv"
REFERENCE_FILE = DATA_DIR / "background_environment_points.csv"
OUTPUT_FILE = DATA_DIR / "background_terrain_features.csv"

terrain = pd.read_csv(TERRAIN_FILE)
reference = pd.read_csv(
    REFERENCE_FILE,
    usecols=[
        "sample_id",
        "reference_date",
        "reference_date_source",
        "reference_date_rule",
    ],
)

terrain["sample_id"] = terrain["sample_id"].astype(str)
reference["sample_id"] = reference["sample_id"].astype(str)

# Remove any old reference columns if present.
terrain = terrain.drop(
    columns=[
        "reference_date",
        "reference_date_source",
        "reference_date_rule",
    ],
    errors="ignore",
)

result = terrain.merge(
    reference,
    on="sample_id",
    how="left",
    validate="one_to_one",
)

result.to_csv(
    OUTPUT_FILE,
    index=False,
)

print("=" * 70)
print("RESTORING BACKGROUND REFERENCE DATES")
print("=" * 70)

print()
print("Terrain records   :", len(terrain))
print("Reference records :", len(reference))
print("Final records     :", len(result))

print()
print("Missing reference dates:")
print(result["reference_date"].isna().sum())

print()
print("Terrain availability:")
print("Elevation:", result["elevation"].notna().sum(), "/", len(result))
print("Slope    :", result["slope"].notna().sum(), "/", len(result))
print("Aspect   :", result["aspect"].notna().sum(), "/", len(result))

print()
print("First 5:")
print(
    result[
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
    ].head().to_string(index=False)
)

print()
print("=" * 70)
print("REFERENCE DATES RESTORED")
print("=" * 70)
