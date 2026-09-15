import asyncio

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.risk import router as risk_router
from app.api.monitoring import router as monitoring_router
from app.api.location import router as location_router

from app.services.websocket_manager import manager as websocket_manager
from app.services.live_monitor import monitor_loop


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=settings.APP_DESCRIPTION,
    docs_url="/docs",
    redoc_url="/redoc",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(
    risk_router,
    prefix=settings.API_PREFIX,
)

app.include_router(
    monitoring_router,
    prefix=settings.API_PREFIX,
)

app.include_router(
    location_router,
    prefix=settings.API_PREFIX,
)


@app.get("/")
def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "online",
        "message": "Bhunetra backend is running",
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
    }

@app.websocket("/ws/monitoring")
async def monitoring_websocket(websocket: WebSocket):
    await websocket_manager.connect(websocket)

    try:
        while True:
            await websocket.receive_text()
    except Exception:
        websocket_manager.disconnect(websocket)

@app.on_event("startup")
async def start_live_monitor():
    asyncio.create_task(monitor_loop())






