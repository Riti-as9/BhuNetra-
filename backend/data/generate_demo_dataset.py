from pathlib import Path

import numpy as np
import pandas as pd


OUTPUT = (
    Path(__file__).resolve().parent
    / "landslide_training.csv"
)

RANDOM_SEED = 42
ROWS = 5000


def sigmoid(x):
    return 1 / (1 + np.exp(-x))


def main():
    rng = np.random.default_rng(RANDOM_SEED)

    rainfall_1h = rng.gamma(
        shape=1.8,
        scale=8,
        size=ROWS,
    )

    rainfall_6h = (
        rainfall_1h * rng.uniform(1.5, 3.5, ROWS)
        + rng.normal(0, 5, ROWS)
    )

    rainfall_24h = (
        rainfall_6h * rng.uniform(1.5, 3.0, ROWS)
        + rng.normal(0, 15, ROWS)
    )

    rainfall_24h = np.clip(
        rainfall_24h,
        0,
        None,
    )

    rainfall_3d = (
        rainfall_24h * rng.uniform(1.5, 3.0, ROWS)
        + rng.normal(0, 25, ROWS)
    )

    rainfall_3d = np.clip(
        rainfall_3d,
        0,
        None,
    )

    rainfall_7d = (
        rainfall_3d * rng.uniform(1.2, 2.2, ROWS)
        + rng.normal(0, 40, ROWS)
    )

    rainfall_7d = np.clip(
        rainfall_7d,
        0,
        None,
    )

    soil_moisture = rng.beta(
        3,
        3,
        ROWS,
    )

    elevation = rng.uniform(
        50,
        4500,
        ROWS,
    )

    slope = rng.uniform(
        0,
        55,
        ROWS,
    )

    aspect = rng.uniform(
        0,
        360,
        ROWS,
    )

    historical_landslides = rng.poisson(
        lam=1.2,
        size=ROWS,
    )

    land_cover_risk = rng.beta(
        2.5,
        2.5,
        ROWS,
    )

    risk_signal = (
        0.010 * rainfall_24h
        + 0.006 * rainfall_3d
        + 0.65 * soil_moisture
        + 0.055 * slope
        + 0.20 * historical_landslides
        + 0.55 * land_cover_risk
        - 2.9
    )

    probability = sigmoid(
        risk_signal
    )

    landslide = (
        rng.random(ROWS) < probability
    ).astype(int)

    df = pd.DataFrame(
        {
            "rainfall_1h": rainfall_1h,
            "rainfall_6h": rainfall_6h,
            "rainfall_24h": rainfall_24h,
            "rainfall_3d": rainfall_3d,
            "rainfall_7d": rainfall_7d,
            "soil_moisture": soil_moisture,
            "elevation": elevation,
            "slope": slope,
            "aspect": aspect,
            "historical_landslides": historical_landslides,
            "land_cover_risk": land_cover_risk,
            "landslide": landslide,
        }
    )

    # Balance the demonstration dataset.
    positive = df[df["landslide"] == 1]
    negative = df[df["landslide"] == 0]

    target_count = min(
        len(positive),
        len(negative),
    )

    positive = positive.sample(
        target_count,
        random_state=RANDOM_SEED,
    )

    negative = negative.sample(
        target_count,
        random_state=RANDOM_SEED,
    )

    df = pd.concat(
        [positive, negative],
        ignore_index=True,
    )

    df = df.sample(
        frac=1,
        random_state=RANDOM_SEED,
    ).reset_index(drop=True)

    df.to_csv(
        OUTPUT,
        index=False,
    )

    print("=" * 60)
    print("Bhunetra DEMO dataset generated")
    print("=" * 60)
    print(f"Rows: {len(df)}")
    print(
        f"Landslide cases: "
        f"{int(df['landslide'].sum())}"
    )
    print(
        f"Non-landslide cases: "
        f"{int((df['landslide'] == 0).sum())}"
    )
    print(f"Saved to: {OUTPUT}")
    print()
    print(
        "WARNING: This is synthetic data for "
        "pipeline testing only."
    )


if __name__ == "__main__":
    main()
