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


BASE = Path(__file__).resolve().parents[2]

DATASET = BASE / "data" / "processed" / "presentation_landslide_training_dataset.csv"
MODEL_DIR = BASE / "ml" / "models"
MODEL_PATH = MODEL_DIR / "landslide_xgboost_presentation.joblib"

FEATURES = [
    "rainfall_24h",
    "rainfall_3d",
    "rainfall_7d",
    "soil_moisture",
    "elevation",
    "slope",
    "aspect",
]

df = pd.read_csv(DATASET)

X = df[FEATURES]
y = df["landslide"]

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y,
)

negative = (y_train == 0).sum()
positive = (y_train == 1).sum()
scale_pos_weight = negative / positive

model = XGBClassifier(
    n_estimators=300,
    max_depth=5,
    learning_rate=0.05,
    subsample=0.85,
    colsample_bytree=0.85,
    objective="binary:logistic",
    eval_metric="logloss",
    random_state=42,
    n_jobs=-1,
    scale_pos_weight=scale_pos_weight,
)

print("Training XGBoost...")
print("Training samples:", len(X_train))
print("Testing samples:", len(X_test))
print("Scale positive weight:", round(scale_pos_weight, 4))

model.fit(X_train, y_train)

predictions = model.predict(X_test)
probabilities = model.predict_proba(X_test)[:, 1]

accuracy = accuracy_score(y_test, predictions)
auc = roc_auc_score(y_test, probabilities)

print()
print("=== PRESENTATION MODEL RESULTS ===")
print("Accuracy:", round(accuracy, 4))
print("ROC-AUC:", round(auc, 4))
print()
print("Classification report:")
print(classification_report(y_test, predictions, digits=4))
print("Confusion matrix:")
print(confusion_matrix(y_test, predictions))

MODEL_DIR.mkdir(parents=True, exist_ok=True)
joblib.dump(
    {
        "model": model,
        "feature_names": FEATURES,
        "training_samples": len(df),
        "model_type": "XGBoost",
        "dataset": "presentation_landslide_training_dataset",
    },
    MODEL_PATH,
)

print()
print("Model saved:", MODEL_PATH)
print("Features:", ", ".join(FEATURES))
