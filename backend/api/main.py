from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.websockets import WebSocket, WebSocketDisconnect
from contextlib import asynccontextmanager
import uvicorn
import logging

from core.config import settings
from api.routes import dashboard, positions, trading, analytics, market_data
from core.database import init_db

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info(f"Starting {settings.app_name}...")
    await init_db()
    yield
    # Shutdown
    logger.info("Shutting down...")

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(positions.router, prefix="/api/positions", tags=["positions"])
app.include_router(trading.router, prefix="/api/trading", tags=["trading"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(market_data.router, prefix="/api/market", tags=["market"])

@app.get("/")
async def root():
    return {
        "message": f"{settings.app_name} API",
        "version": "1.0.0",
        "paper_trading": settings.paper_trading
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "environment": settings.app_env}

# WebSocket endpoint for real-time data
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming messages and send updates
            await websocket.send_json({
                "type": "market_update",
                "data": {"message": f"Received: {data}"}
            })
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug
    )
