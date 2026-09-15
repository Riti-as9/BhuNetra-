from pathlib import Path

import numpy as np
import pandas as pd


BASE_DIR = Path(__file__).resolve().parents[2]

GSI_PATH = BASE_DIR / "data" / "processed" / "gsi_landslide_inventory.csv"
OUTPUT_PATH = BASE_DIR / "data" / "processed" / "gsi_training_samples.csv"

RANDOM_SEED = 42
NEGATIVE_PER_POSITIVE = 1


def main():
    print("=" * 70)
    print("BhuNetra - GSI Training Sample Builder")
    print("=" * 70)

    if not GSI_PATH.exists():
        raise FileNotFoundError(f"GSI inventory not found: {GSI_PATH}")

    gsi = pd.read_csv(GSI_PATH)

    required = [
        "State",
        "District",
        "Latitude",
        "Longitude",
    ]

    missing = [column for column in required if column not in gsi.columns]

    if missing:
        raise ValueError(f"Missing GSI columns: {missing}")

    gsi = gsi.dropna(
        subset=["Latitude", "Longitude"]
    ).copy()

    gsi["Latitude"] = pd.to_numeric(
        gsi["Latitude"],
        errors="coerce",
    )

    gsi["Longitude"] = pd.to_numeric(
        gsi["Longitude"],
        errors="coerce",
    )

    gsi = gsi.dropna(
        subset=["Latitude", "Longitude"]
    ).reset_index(drop=True)

    # ---------------------------------------------------------
    # Positive samples
    # ---------------------------------------------------------
    positive = pd.DataFrame(
        {
            "latitude": gsi["Latitude"],
            "longitude": gsi["Longitude"],
            "state": gsi["State"],
            "district": gsi["District"],
            "landslide": 1,
            "sample_source": "GSI_field_inventory",
        }
    )

    # ---------------------------------------------------------
    # Negative samples
    #
    # These are spatial background samples, NOT confirmed
    # "no landslide" observations.
    #
    # We deliberately keep the source label so they are not
    # misrepresented as observed negative events.
    # ---------------------------------------------------------
    rng = np.random.default_rng(RANDOM_SEED)

    negative_count = len(positive) * NEGATIVE_PER_POSITIVE

    min_lat = positive["latitude"].min()
    max_lat = positive["latitude"].max()

    min_lon = positive["longitude"].min()
    max_lon = positive["longitude"].max()

    negative = pd.DataFrame(
        {
            "latitude": rng.uniform(
                min_lat,
                max_lat,
                negative_count,
            ),
            "longitude": rng.uniform(
                min_lon,
                max_lon,
                negative_count,
            ),
        }
    )

    negative["state"] = "UNKNOWN"
    negative["district"] = "UNKNOWN"
    negative["landslide"] = 0
    negative["sample_source"] = "spatial_background_sample"

    # ---------------------------------------------------------
    # Combine
    # ---------------------------------------------------------
    dataset = pd.concat(
        [positive, negative],
        ignore_index=True,
    )

    dataset = dataset.sample(
        frac=1,
        random_state=RANDOM_SEED,
    ).reset_index(drop=True)

    OUTPUT_PATH.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    dataset.to_csv(
        OUTPUT_PATH,
        index=False,
    )

    print()
    print(f"GSI positive samples : {len(positive)}")
    print(f"Background samples   : {len(negative)}")
    print(f"Total samples        : {len(dataset)}")
    print()
    print(f"Saved to: {OUTPUT_PATH}")
    print()
    print("IMPORTANT:")
    print("- Positive samples come from the GSI inventory.")
    print("- Negative samples are spatial background samples.")
    print("- They are NOT confirmed non-landslide observations.")
    print("- Environmental features must be attached before")
    print("  using this dataset for final model training.")


if __name__ == "__main__":
    main()