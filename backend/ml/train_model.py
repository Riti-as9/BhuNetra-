from pathlib import Path

import joblib
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier


BASE_DIR = Path(__file__).resolve().parent.parent

DATA_PATH = BASE_DIR / "data" / "landslide_training.csv"
MODEL_DIR = BASE_DIR / "ml" / "models"
MODEL_PATH = MODEL_DIR / "landslide_xgboost.joblib"

FEATURE_NAMES = [
    "rainfall_1h",
    "rainfall_6h",
    "rainfall_24h",
    "rainfall_3d",
    "rainfall_7d",
    "soil_moisture",
    "elevation",
    "slope",
    "aspect",
    "historical_landslides",
    "land_cover_risk",
]

TARGET = "landslide"


def main():
    if not DATA_PATH.exists():
        raise FileNotFoundError(
            f"Training dataset not found: {DATA_PATH}"
        )

    print("=" * 60)
    print("Bhunetra XGBoost Training Pipeline")
    print("=" * 60)

    df = pd.read_csv(DATA_PATH)

    print(f"\nDataset shape: {df.shape}")

    missing_features = [
        feature for feature in FEATURE_NAMES
        if feature not in df.columns
    ]

    if missing_features:
        raise ValueError(
            f"Missing feature columns: {missing_features}"
        )

    if TARGET not in df.columns:
        raise ValueError(
            f"Missing target column: {TARGET}"
        )

    df = df.dropna(
        subset=FEATURE_NAMES + [TARGET]
    )

    X = df[FEATURE_NAMES]
    y = df[TARGET].astype(int)

    print(f"Usable rows: {len(df)}")
    print(f"Landslide cases: {int(y.sum())}")
    print(f"Non-landslide cases: {int((y == 0).sum())}")

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=42,
        stratify=y,
    )

    model = XGBClassifier(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.85,
        colsample_bytree=0.85,
        objective="binary:logistic",
        eval_metric="logloss",
        random_state=42,
        n_jobs=-1,
    )

    print("\nTraining XGBoost...")

    model.fit(
        X_train,
        y_train,
    )

    probabilities = model.predict_proba(X_test)[:, 1]
    predictions = (probabilities >= 0.5).astype(int)

    accuracy = accuracy_score(y_test, predictions)
    auc = roc_auc_score(y_test, probabilities)

    print("\n" + "=" * 60)
    print("MODEL EVALUATION")
    print("=" * 60)

    print(f"\nAccuracy : {accuracy:.4f}")
    print(f"ROC-AUC  : {auc:.4f}")

    print("\nClassification Report:")
    print(
        classification_report(
            y_test,
            predictions,
            digits=4,
        )
    )

    print("Confusion Matrix:")
    print(confusion_matrix(y_test, predictions))

    MODEL_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    joblib.dump(
        model,
        MODEL_PATH,
    )

    print("\nModel saved to:")
    print(MODEL_PATH)

    print("\nFeature importance:")
    importance = pd.Series(
        model.feature_importances_,
        index=FEATURE_NAMES,
    ).sort_values(
        ascending=False
    )

    print(importance.to_string())

    print("\nTraining completed successfully.")


if __name__ == "__main__":
    main()
