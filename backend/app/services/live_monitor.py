import asyncio
import random
from datetime import datetime, timezone

from app.api.monitoring import ZONES, enrich_zones_with_historical_data
from app.schemas.risk import RiskInput
from app.services.risk_service import calculate_risk
from app.services.websocket_manager import manager


async def monitor_loop():
    enrich_zones_with_historical_data()
    while True:
        updates = []

        for zone in ZONES:
            rainfall_24h = max(
                0,
                zone["rainfall_24h"] + random.uniform(-3, 3),
            )

            rainfall_6h = max(
                0,
                rainfall_24h * random.uniform(0.28, 0.42),
            )

            rainfall_1h = max(
                0,
                rainfall_6h * random.uniform(0.12, 0.25),
            )

            rainfall_3d = rainfall_24h * random.uniform(1.5, 2.2)
            rainfall_7d = rainfall_3d * random.uniform(1.5, 2.5)

            soil_moisture = min(
                1.0,
                max(
                    0.0,
                    zone["soil_moisture"] / 100
                    + random.uniform(-0.01, 0.01),
                ),
            )

            risk_input = RiskInput(
                latitude=zone["coordinates"][0],
                longitude=zone["coordinates"][1],
                rainfall_1h=rainfall_1h,
                rainfall_6h=rainfall_6h,
                rainfall_24h=rainfall_24h,
                rainfall_3d=rainfall_3d,
                rainfall_7d=rainfall_7d,
                soil_moisture=soil_moisture,
                elevation=1000,
                slope=zone["slope"],
                aspect=180,
                historical_landslides=zone.get('historical_landslides', 0),
                land_cover_risk=0.6,
            )

            result = calculate_risk(risk_input)

            zone["risk_score"] = result.risk_score
            zone["risk_level"] = result.risk_level.lower()
            zone["rainfall_24h"] = round(rainfall_24h, 2)
            zone["soil_moisture"] = round(soil_moisture * 100, 2)

            updates.append({
                **zone,
                "data_mode": "simulation",
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "risk": result.model_dump(),
            })

        await manager.broadcast({
            "type": "monitoring_update",
            "data_mode": "simulation",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "zones": updates,
        })

        await asyncio.sleep(10)




