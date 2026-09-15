from pydantic import BaseModel, Field


class RiskInput(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)

    rainfall_1h: float = Field(0, ge=0)
    rainfall_6h: float = Field(0, ge=0)
    rainfall_24h: float = Field(0, ge=0)
    rainfall_3d: float = Field(0, ge=0)
    rainfall_7d: float = Field(0, ge=0)

    soil_moisture: float = Field(0, ge=0, le=1)

    elevation: float = Field(0, ge=0)
    slope: float = Field(0, ge=0, le=90)
    aspect: float = Field(0, ge=0, le=360)

    historical_landslides: int = Field(0, ge=0)
    land_cover_risk: float = Field(0, ge=0, le=1)


class RiskResponse(BaseModel):
    latitude: float
    longitude: float

    risk_score: float
    risk_level: str

    confidence: float

    drivers: list[str]

    recommendation: str
