from pathlib import Path
import pandas as pd

BASE = Path(__file__).resolve().parents[2]

POSITIVE = BASE / "data" / "processed" / "landslide_training_real.csv"
BACKGROUND = BASE / "data" / "processed" / "background_environment_features_presentation_snapshot.csv"
OUTPUT = BASE / "data" / "processed" / "presentation_landslide_training_dataset.csv"

FEATURES = [
    "rainfall_24h",
    "rainfall_3d",
    "rainfall_7d",
    "soil_moisture",
    "elevation",
    "slope",
    "aspect",
]

positive = pd.read_csv(POSITIVE)
background = pd.read_csv(BACKGROUND)

# Positive GSI observations.
positive = positive.copy()
positive["landslide"] = 1
positive["sample_source"] = "GSI_field_inventory"
positive["data_type"] = "observed_landslide"

# Keep only verified environmental features.
positive = positive.dropna(subset=FEATURES)

# Background observations:
# Only use rows whose rainfall has actually been repaired.
background = background[
    (background["rainfall_24h"] > 0)
    | (background["rainfall_3d"] > 0)
    | (background["rainfall_7d"] > 0)
].copy()

background["landslide"] = 0
background["sample_source"] = "spatial_background_sample"
background["data_type"] = "spatial_background_reference"

# Rename reference date to event_date for a common schema.
background["event_date"] = background["reference_date"]

background = background.dropna(subset=FEATURES)

columns = FEATURES + [
    "landslide",
    "sample_source",
    "data_type",
    "State",
    "Latitude",
    "Longitude",
    "event_date",
]

positive_out = positive[[c for c in columns if c in positive.columns]]
background_out = background[[c for c in columns if c in background.columns]]

final = pd.concat(
    [positive_out, background_out],
    ignore_index=True,
)

final = final.sample(frac=1, random_state=42).reset_index(drop=True)

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
final.to_csv(OUTPUT, index=False)

print("Presentation dataset created.")
print("Positive samples:", len(positive_out))
print("Background samples:", len(background_out))
print("Total samples:", len(final))
print("Features:", ", ".join(FEATURES))
print("\nClass distribution:")
print(final["landslide"].value_counts())
print("\nState distribution:")
print(final["State"].value_counts())
print("\nOutput:", OUTPUT)
