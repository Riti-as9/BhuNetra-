from fastapi import APIRouter

from app.schemas.risk import RiskInput, RiskResponse
from app.services.risk_service import calculate_risk
from ml.predictor import model_exists


router = APIRouter(
    prefix="/risk",
    tags=["Risk Prediction"],
)


@router.post("/predict", response_model=RiskResponse)
def predict_risk(data: RiskInput):
    return calculate_risk(data)


@router.get("/status")
def risk_engine_status():
    return {
        "service": "Bhunetra Risk Engine",
        "status": "online",
        "model": "XGBoost",
        "model_available": model_exists(),
        "model_features": [
            "rainfall_24h",
            "rainfall_3d",
            "rainfall_7d",
            "soil_moisture",
            "elevation",
            "slope",
            "aspect",
        ],
        "message": "XGBoost risk prediction service is operational",
    }
