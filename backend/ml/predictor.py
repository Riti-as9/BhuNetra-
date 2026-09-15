from pathlib import Path

import joblib
import numpy as np

MODEL_PATH = (
    Path(__file__).resolve().parent
    / "models"
    / "landslide_xgboost_presentation.joblib"
)

FEATURE_NAMES = [
    "rainfall_24h",
    "rainfall_3d",
    "rainfall_7d",
    "soil_moisture",
    "elevation",
    "slope",
    "aspect",
]


def model_exists() -> bool:
    return MODEL_PATH.exists()


def load_model():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Trained model not found at {MODEL_PATH}"
        )

    artifact = joblib.load(MODEL_PATH)

    # New presentation model is saved with metadata.
    if isinstance(artifact, dict) and "model" in artifact:
        return artifact["model"]

    # Compatibility with a plain XGBoost model.
    return artifact


def probability_to_score(probability: float) -> float:
    return round(float(np.clip(probability, 0, 1)) * 100, 2)


def classify_risk(score: float) -> str:
    if score >= 80:
        return "CRITICAL"
    elif score >= 60:
        return "HIGH"
    elif score >= 35:
        return "MODERATE"
    return "LOW"


def predict(features: dict) -> dict:
    model = load_model()

    values = np.array(
        [[features[name] for name in FEATURE_NAMES]],
        dtype=float,
    )

    probability = float(
        model.predict_proba(values)[0][1]
    )

    score = probability_to_score(probability)
    risk_level = classify_risk(score)

    return {
        "probability": round(probability, 4),
        "risk_score": score,
        "risk_level": risk_level,
    }
