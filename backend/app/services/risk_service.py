from app.schemas.risk import RiskInput, RiskResponse

from ml.predictor import (
    model_exists,
    predict,
)


def calculate_risk(data: RiskInput) -> RiskResponse:

    features = {
        "rainfall_1h": data.rainfall_1h,
        "rainfall_6h": data.rainfall_6h,
        "rainfall_24h": data.rainfall_24h,
        "rainfall_3d": data.rainfall_3d,
        "rainfall_7d": data.rainfall_7d,
        "soil_moisture": data.soil_moisture,
        "elevation": data.elevation,
        "slope": data.slope,
        "aspect": data.aspect,
        "historical_landslides": data.historical_landslides,
        "land_cover_risk": data.land_cover_risk,
    }

    # Use trained XGBoost model when available.
    if model_exists():
        # A saved model may be present on a lightweight deployment where its
        # optional training runtime (for example XGBoost) is not installed.
        # In that case the rule engine below remains a working, explicit
        # fallback instead of returning a 500 error to the command centre.
        try:
            result = predict(features)
        except (ImportError, ModuleNotFoundError, OSError, ValueError):
            result = None

        if result is not None:

            score = result["risk_score"]
            risk_level = result["risk_level"]
            probability = result["probability"]

            drivers = []

            if data.rainfall_24h >= 100:
                drivers.append("Heavy 24-hour rainfall")

            if data.rainfall_6h >= 50:
                drivers.append("High short-term rainfall intensity")

            if data.soil_moisture >= 0.7:
                drivers.append("High soil moisture")

            if data.slope >= 30:
                drivers.append("Steep terrain")

            if data.historical_landslides > 0:
                drivers.append("Historical landslide activity")

            if data.land_cover_risk >= 0.6:
                drivers.append("High-risk land cover")

            if not drivers:
                drivers.append("No major risk driver detected")

            if risk_level == "CRITICAL":
                recommendation = "Immediate monitoring and emergency preparedness recommended."
            elif risk_level == "HIGH":
                recommendation = "Increase monitoring and prepare for possible slope failure."
            elif risk_level == "MODERATE":
                recommendation = "Continue monitoring rainfall, soil moisture and slope conditions."
            else:
                recommendation = "No immediate action required; continue routine monitoring."

            return RiskResponse(latitude=data.latitude, longitude=data.longitude, risk_score=score, risk_level=risk_level, confidence=probability, drivers=drivers, recommendation=recommendation)

    # Fallback baseline engine.
    score = 0.0
    drivers = []

    score += min(data.rainfall_24h / 200.0, 1.0) * 25
    score += min(data.rainfall_6h / 100.0, 1.0) * 10
    score += data.soil_moisture * 20
    score += min(data.slope / 45.0, 1.0) * 20
    score += min(data.historical_landslides / 10.0, 1.0) * 15
    score += data.land_cover_risk * 10

    if data.rainfall_24h >= 100:
        drivers.append("Heavy 24-hour rainfall")

    if data.rainfall_6h >= 50:
        drivers.append("High short-term rainfall intensity")

    if data.soil_moisture >= 0.7:
        drivers.append("High soil moisture")

    if data.slope >= 30:
        drivers.append("Steep terrain")

    if data.historical_landslides > 0:
        drivers.append("Historical landslide activity")

    if data.land_cover_risk >= 0.6:
        drivers.append("High-risk land cover")

    score = round(min(score, 100.0), 2)

    if score >= 80:
        risk_level = "CRITICAL"
        recommendation = (
            "Immediate monitoring and emergency preparedness recommended."
        )
    elif score >= 60:
        risk_level = "HIGH"
        recommendation = (
            "Increase monitoring and prepare for possible slope failure."
        )
    elif score >= 35:
        risk_level = "MODERATE"
        recommendation = (
            "Continue monitoring rainfall, soil moisture and slope conditions."
        )
    else:
        risk_level = "LOW"
        recommendation = (
            "No immediate action required; continue routine monitoring."
        )

    confidence = round(
        min(0.60 + (score / 250), 0.90),
        2,
    )

    if not drivers:
        drivers.append("No major risk driver detected")

    return RiskResponse(
        latitude=data.latitude,
        longitude=data.longitude,
        risk_score=score,
        risk_level=risk_level,
        confidence=confidence,
        drivers=drivers,
        recommendation=recommendation,
    )
