#!/bin/bash

# SPX Trading System Backend Setup Script
# This script creates the complete backend structure with all necessary files

echo "🚀 Setting up Dynamic Option Pilot Backend..."

# Create main backend directory
mkdir -p backend
cd backend

# Create directory structure
echo "📁 Creating directory structure..."
mkdir -p api/routes
mkdir -p core
mkdir -p plugins/{data,analysis,trading,risk,execution}
mkdir -p models
mkdir -p tests
mkdir -p scripts
mkdir -p logs

# Create __init__.py files for all Python packages
echo "📄 Creating __init__.py files..."
touch api/__init__.py
touch api/routes/__init__.py
touch core/__init__.py
touch plugins/__init__.py
touch plugins/data/__init__.py
touch plugins/analysis/__init__.py
touch plugins/trading/__init__.py
touch plugins/risk/__init__.py
touch plugins/execution/__init__.py
touch models/__init__.py
touch tests/__init__.py

# Create requirements.txt
echo "📦 Creating requirements.txt..."
cat > requirements.txt << 'EOF'
# Core Framework
fastapi==0.104.1
uvicorn==0.24.0
python-multipart==0.0.6
websockets==12.0

# Configuration & Validation
pydantic==2.4.2
pydantic-settings==2.0.3
python-dotenv==1.0.0

# Database
sqlalchemy==2.0.23
asyncpg==0.29.0
alembic==1.12.1

# Data Processing
pandas==2.1.3
numpy==1.26.2
scipy==1.11.4

# HTTP & Async
aiohttp==3.9.0
httpx==0.25.1
tenacity==8.2.3

# Caching & Background Tasks
redis==5.0.1
celery==5.3.4

# Testing
pytest==7.4.3
pytest-asyncio==0.21.1
pytest-cov==4.1.0

# Development
black==23.11.0
flake8==6.1.0
mypy==1.7.0

# Options Trading Specific
yfinance==0.2.33  # For market data
ib-insync==0.9.86  # Interactive Brokers API
td-ameritrade-python-api==0.3.0  # TD Ameritrade API
EOF

# Create .env.example
echo "🔐 Creating .env.example..."
cat > .env.example << 'EOF'
# Application Settings
APP_NAME="Dynamic Option Pilot"
APP_ENV=development
DEBUG=true
SECRET_KEY=your-secret-key-here

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/option_pilot

# Redis
REDIS_URL=redis://localhost:6379

# Broker Configuration
BROKER_PLUGIN=td_ameritrade
PAPER_TRADING=true
BROKER_API_KEY=your-broker-api-key
BROKER_API_SECRET=your-broker-api-secret
BROKER_ACCOUNT_ID=your-account-id

# Strategy Parameters
SYMBOL=SPX
DTE_MIN=30
DTE_MAX=45
DELTA_TARGET=0.10
CREDIT_THRESHOLD=0.50
MAX_SPREAD_WIDTH=50

# Risk Management
MAX_POSITIONS=5
POSITION_SIZE_PCT=0.02
MAX_MARGIN_USAGE=0.50
MAX_DRAWDOWN=0.15
KELLY_FRACTION=0.25

# Technical Indicators
RSI_PERIOD=14
RSI_OVERBOUGHT=70
RSI_OVERSOLD=30
EMA_FAST=9
EMA_SLOW=21

# Volatility Settings
IV_PERCENTILE_PERIOD=252
HIGH_VOL_THRESHOLD=0.75
EOF

# Create core/config.py
echo "⚙️ Creating configuration module..."
cat > core/config.py << 'EOF'
from pydantic_settings import BaseSettings
from typing import Optional
from functools import lru_cache

class Settings(BaseSettings):
    # Application
    app_name: str = "Dynamic Option Pilot"
    app_env: str = "development"
    debug: bool = True
    secret_key: str
    
    # Database
    database_url: str
    
    # Redis
    redis_url: str
    
    # Broker Configuration
    broker_plugin: str = "td_ameritrade"
    paper_trading: bool = True
    broker_api_key: str
    broker_api_secret: str
    broker_account_id: Optional[str] = None
    
    # Strategy Parameters
    symbol: str = "SPX"
    dte_min: int = 30
    dte_max: int = 45
    delta_target: float = 0.10
    credit_threshold: float = 0.50
    max_spread_width: int = 50
    
    # Risk Management
    max_positions: int = 5
    position_size_pct: float = 0.02
    max_margin_usage: float = 0.50
    max_drawdown: float = 0.15
    kelly_fraction: float = 0.25
    
    # Technical Indicators
    rsi_period: int = 14
    rsi_overbought: int = 70
    rsi_oversold: int = 30
    ema_fast: int = 9
    ema_slow: int = 21
    
    # Volatility Settings
    iv_percentile_period: int = 252
    high_vol_threshold: float = 0.75
    
    class Config:
        env_file = ".env"
        case_sensitive = False

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
EOF

# Create api/main.py
echo "🚀 Creating FastAPI main application..."
cat > api/main.py << 'EOF'
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
EOF

# Create API route files
echo "🛣️ Creating API routes..."

# Dashboard route
cat > api/routes/dashboard.py << 'EOF'
from fastapi import APIRouter, Depends
from typing import Dict, Any
from datetime import datetime, timedelta
import random

router = APIRouter()

@router.get("/metrics")
async def get_metrics() -> Dict[str, Any]:
    """Get dashboard metrics"""
    # TODO: Replace with real data from database
    return {
        "account_balance": 125430.50,
        "total_pnl": 12850.75,
        "pnl_percentage": 11.4,
        "win_rate": 78.5,
        "total_trades": 54,
        "winning_trades": 42,
        "sharpe_ratio": 2.34,
        "max_drawdown": 4.6,
        "positions_open": 3,
        "margin_used": 17500.00,
        "buying_power": 107930.50,
        "last_updated": datetime.utcnow().isoformat()
    }

@router.get("/signals")
async def get_market_signals() -> Dict[str, Any]:
    """Get current market signals"""
    # TODO: Implement real signal calculation
    return {
        "market_bias": "BULLISH",
        "confidence": 0.75,
        "signals": {
            "rsi": {"value": 72.3, "signal": "OVERBOUGHT"},
            "ema_cross": {"value": 1, "signal": "BULLISH"},
            "macd": {"value": 0.5, "signal": "BULLISH"},
            "iv_percentile": {"value": 45.2, "signal": "NORMAL"}
        },
        "recommendation": {
            "action": "PUT_CREDIT_SPREAD",
            "reason": "Bullish signals with normal volatility"
        }
    }

@router.get("/performance")
async def get_performance_history(days: int = 30) -> Dict[str, Any]:
    """Get performance history"""
    # TODO: Implement real performance data
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    return {
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "data": [
            {
                "date": (start_date + timedelta(days=i)).isoformat(),
                "pnl": random.uniform(-500, 1000),
                "cumulative_pnl": random.uniform(0, 15000)
            }
            for i in range(days)
        ]
    }
EOF

# Positions route
cat > api/routes/positions.py << 'EOF'
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from datetime import datetime, timedelta
from pydantic import BaseModel

router = APIRouter()

class Position(BaseModel):
    id: str
    symbol: str
    type: str  # PUT or CALL
    short_strike: float
    long_strike: float
    quantity: int
    entry_credit: float
    entry_date: datetime
    expiration: datetime
    current_value: float
    pnl: float
    pnl_percentage: float
    status: str
    delta: float
    theta: float
    margin_required: float

@router.get("/", response_model=List[Position])
async def get_positions():
    """Get all open positions"""
    # TODO: Fetch from database
    return [
        Position(
            id="pos_001",
            symbol="SPX",
            type="PUT",
            short_strike=4200,
            long_strike=4150,
            quantity=2,
            entry_credit=2.35,
            entry_date=datetime.utcnow() - timedelta(days=7),
            expiration=datetime.utcnow() + timedelta(days=8),
            current_value=1.20,
            pnl=230.00,
            pnl_percentage=51.0,
            status="OPEN",
            delta=-0.10,
            theta=0.15,
            margin_required=10000.00
        )
    ]

@router.post("/close/{position_id}")
async def close_position(position_id: str):
    """Close a specific position"""
    # TODO: Implement position closing logic
    return {
        "status": "success",
        "message": f"Position {position_id} closed successfully",
        "execution_price": 1.20,
        "realized_pnl": 230.00
    }

@router.get("/history")
async def get_position_history(limit: int = 50):
    """Get closed positions history"""
    # TODO: Fetch from database
    return {
        "total": 54,
        "positions": []
    }
EOF

# Trading route
cat > api/routes/trading.py << 'EOF'
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

router = APIRouter()

class SpreadOrder(BaseModel):
    symbol: str = "SPX"
    spread_type: str  # PUT or CALL
    short_strike: float
    long_strike: float
    quantity: int
    expiration: datetime
    order_type: str = "LIMIT"
    limit_credit: Optional[float] = None

class OrderResponse(BaseModel):
    order_id: str
    status: str
    message: str
    execution_price: Optional[float] = None
    commission: Optional[float] = None

@router.post("/execute", response_model=OrderResponse)
async def execute_trade(order: SpreadOrder, background_tasks: BackgroundTasks):
    """Execute a new credit spread order"""
    # TODO: Implement real order execution
    
    # Validate order
    if order.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be positive")
    
    if order.short_strike <= order.long_strike and order.spread_type == "PUT":
        raise HTTPException(status_code=400, detail="Short strike must be higher than long strike for PUT spreads")
    
    # Simulate order execution
    order_id = f"ORD_{datetime.utcnow().timestamp()}"
    
    # Add background task for order monitoring
    background_tasks.add_task(monitor_order, order_id)
    
    return OrderResponse(
        order_id=order_id,
        status="FILLED",
        message="Order executed successfully",
        execution_price=2.35,
        commission=2.60
    )

async def monitor_order(order_id: str):
    """Background task to monitor order status"""
    # TODO: Implement order monitoring
    pass

@router.get("/opportunities")
async def get_trade_opportunities():
    """Get current trade opportunities based on signals"""
    # TODO: Implement trade opportunity scanning
    return {
        "opportunities": [
            {
                "type": "PUT",
                "short_strike": 4200,
                "long_strike": 4150,
                "expiration": "2025-01-29",
                "credit": 2.35,
                "probability_profit": 0.82,
                "expected_value": 285.00,
                "delta": 0.10,
                "score": 8.5
            }
        ]
    }

@router.post("/validate")
async def validate_trade(order: SpreadOrder):
    """Validate a trade before execution"""
    # TODO: Implement trade validation
    return {
        "valid": True,
        "margin_required": 10000.00,
        "buying_power_effect": -10000.00,
        "max_loss": 5000.00,
        "max_profit": 235.00,
        "break_even": 4197.65
    }
EOF

# Analytics route
cat > api/routes/analytics.py << 'EOF'
from fastapi import APIRouter
from typing import Dict, Any, List
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/statistics")
async def get_statistics():
    """Get trading statistics"""
    return {
        "all_time": {
            "total_trades": 245,
            "winning_trades": 198,
            "losing_trades": 47,
            "win_rate": 80.8,
            "average_win": 325.50,
            "average_loss": -185.25,
            "profit_factor": 2.35,
            "expectancy": 215.75
        },
        "monthly": {
            "total_trades": 18,
            "winning_trades": 15,
            "win_rate": 83.3,
            "total_pnl": 3850.00
        }
    }

@router.get("/risk-metrics")
async def get_risk_metrics():
    """Get current risk metrics"""
    return {
        "portfolio_metrics": {
            "total_delta": -0.68,
            "total_theta": 45.50,
            "total_vega": -125.30,
            "total_gamma": -0.015
        },
        "var_95": 2500.00,
        "expected_shortfall": 3200.00,
        "correlation_spy": 0.85
    }

@router.get("/backtest/{strategy_id}")
async def get_backtest_results(strategy_id: str):
    """Get backtest results for a strategy"""
    # TODO: Implement backtesting
    return {
        "strategy_id": strategy_id,
        "period": "2024-01-01 to 2024-12-31",
        "total_return": 45.6,
        "sharpe_ratio": 2.1,
        "max_drawdown": 8.5,
        "total_trades": 125
    }
EOF

# Market data route
cat > api/routes/market_data.py << 'EOF'
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from datetime import datetime

router = APIRouter()

@router.get("/option-chain/{symbol}")
async def get_option_chain(symbol: str, expiration: str):
    """Get option chain for a symbol"""
    # TODO: Implement real option chain fetching
    return {
        "symbol": symbol,
        "underlying_price": 4385.50,
        "expiration": expiration,
        "puts": [],
        "calls": []
    }

@router.get("/quote/{symbol}")
async def get_quote(symbol: str):
    """Get real-time quote for a symbol"""
    return {
        "symbol": symbol,
        "price": 4385.50,
        "change": 12.30,
        "change_percent": 0.28,
        "volume": 1234567,
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/volatility/{symbol}")
async def get_volatility_data(symbol: str):
    """Get volatility data"""
    return {
        "symbol": symbol,
        "iv_current": 15.5,
        "iv_percentile": 45.2,
        "iv_rank": 38.5,
        "hv_20": 14.2,
        "hv_30": 13.8,
        "vix": 16.5
    }
EOF

# Create plugin base classes
echo "🔌 Creating plugin system..."

# Plugin interface
cat > plugins/base.py << 'EOF'
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class PluginInterface(ABC):
    """Base interface for all plugins"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self._initialized = False
    
    async def initialize(self) -> None:
        """Initialize the plugin"""
        if self._initialized:
            return
        
        await self._setup()
        self._initialized = True
        logger.info(f"{self.__class__.__name__} initialized")
    
    @abstractmethod
    async def _setup(self) -> None:
        """Plugin-specific setup logic"""
        pass
    
    @abstractmethod
    async def execute(self, *args, **kwargs) -> Any:
        """Execute plugin functionality"""
        pass
    
    async def shutdown(self) -> None:
        """Cleanup plugin resources"""
        logger.info(f"{self.__class__.__name__} shutting down")
EOF

# Data plugin base
cat > plugins/data/base.py << 'EOF'
from plugins.base import PluginInterface
from abc import abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional
import pandas as pd

@dataclass
class OptionChain:
    symbol: str
    underlying_price: float
    timestamp: datetime
    calls: pd.DataFrame
    puts: pd.DataFrame

@dataclass
class MarketData:
    symbol: str
    price: float
    volume: int
    timestamp: datetime
    atr: float
    vix: float

class DataPlugin(PluginInterface):
    """Base class for data provider plugins"""
    
    @abstractmethod
    async def get_option_chain(self, symbol: str, expiration: datetime) -> OptionChain:
        """Fetch option chain data"""
        pass
    
    @abstractmethod
    async def get_market_data(self, symbol: str) -> MarketData:
        """Fetch current market data"""
        pass
    
    @abstractmethod
    async def get_historical_data(self, symbol: str, period: str) -> pd.DataFrame:
        """Fetch historical price data"""
        pass
EOF

# Create core orchestrator
cat > core/orchestrator.py << 'EOF'
import importlib
from typing import Dict, Any, Optional
import logging
from core.config import settings

logger = logging.getLogger(__name__)

class PluginOrchestrator:
    """Dynamically loads and manages plugins"""
    
    def __init__(self):
        self.plugins: Dict[str, Any] = {}
        self._load_plugins()
    
    def _load_plugins(self):
        """Load configured plugins"""
        plugin_map = {
            "data": f"plugins.data.{settings.broker_plugin}",
            "signals": "plugins.analysis.composite_signals",
            "selector": "plugins.trading.spread_selector",
            "risk": "plugins.risk.portfolio_manager",
            "executor": f"plugins.execution.{settings.broker_plugin}"
        }
        
        for name, module_path in plugin_map.items():
            try:
                module = importlib.import_module(module_path)
                plugin_class = getattr(module, f"{name.title()}Plugin")
                self.plugins[name] = plugin_class(settings.dict())
                logger.info(f"Loaded plugin: {name} from {module_path}")
            except Exception as e:
                logger.error(f"Failed to load plugin {name}: {e}")
    
    async def initialize_all(self):
        """Initialize all plugins"""
        for name, plugin in self.plugins.items():
            await plugin.initialize()
    
    def get_plugin(self, name: str):
        """Get a specific plugin"""
        return self.plugins.get(name)

orchestrator = PluginOrchestrator()
EOF

# Create database models
echo "🗄️ Creating database models..."

cat > models/database.py << 'EOF'
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

from core.config import settings

Base = declarative_base()

class Trade(Base):
    __tablename__ = "trades"
    
    id = Column(Integer, primary_key=True)
    order_id = Column(String, unique=True, index=True)
    symbol = Column(String)
    trade_type = Column(String)  # PUT or CALL
    short_strike = Column(Float)
    long_strike = Column(Float)
    quantity = Column(Integer)
    entry_credit = Column(Float)
    entry_date = Column(DateTime, default=datetime.utcnow)
    expiration_date = Column(DateTime)
    exit_price = Column(Float, nullable=True)
    exit_date = Column(DateTime, nullable=True)
    pnl = Column(Float, nullable=True)
    commission = Column(Float)
    status = Column(String, default="OPEN")  # OPEN, CLOSED, EXPIRED
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class MarketSnapshot(Base):
    __tablename__ = "market_snapshots"
    
    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    symbol = Column(String)
    price = Column(Float)
    iv_rank = Column(Float)
    vix = Column(Float)
    market_bias = Column(String)
    signal_confidence = Column(Float)

class PerformanceMetric(Base):
    __tablename__ = "performance_metrics"
    
    id = Column(Integer, primary_key=True)
    date = Column(DateTime, unique=True)
    total_pnl = Column(Float)
    win_rate = Column(Float)
    sharpe_ratio = Column(Float)
    max_drawdown = Column(Float)
    total_trades = Column(Integer)
    winning_trades = Column(Integer)

# Database setup
engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

async def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)

def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
EOF

# Create test file
echo "🧪 Creating test structure..."

cat > tests/test_api.py << 'EOF'
import pytest
from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_get_metrics():
    response = client.get("/api/dashboard/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "account_balance" in data
    assert "total_pnl" in data
    assert "win_rate" in data

def test_get_positions():
    response = client.get("/api/positions/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
EOF

# Create Docker files
echo "🐳 Creating Docker configuration..."

cat > Dockerfile << 'EOF'
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
EOF

cat > .dockerignore << 'EOF'
__pycache__
*.pyc
*.pyo
*.pyd
.Python
venv/
env/
.env
.coverage
.pytest_cache/
.mypy_cache/
.git/
.gitignore
README.md
tests/
docs/
*.log
EOF

# Create startup script
echo "🚀 Creating startup script..."

cat > scripts/start.sh << 'EOF'
#!/bin/bash

echo "Starting Dynamic Option Pilot Backend..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install/upgrade dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Run database migrations (if using alembic)
# alembic upgrade head

# Start the application
echo "Starting FastAPI server..."
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
EOF

chmod +x scripts/start.sh

# Create README for backend
cat > README.md << 'EOF'
# Dynamic Option Pilot - Backend

## Overview
Backend service for the SPX Credit Spread Trading System.

## Quick Start

### Using Docker
```bash
docker-compose up
```

### Local Development
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env

# Start the server
./scripts/start.sh
# Or directly: uvicorn api.main:app --reload
```

## API Documentation
Once running, visit:
- API Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure
```
backend/
├── api/          # FastAPI routes and endpoints
├── core/         # Core functionality (config, orchestrator)
├── plugins/      # Plugin system for modular components
├── models/       # Database models
├── tests/        # Test suite
└── scripts/      # Utility scripts
```

## Configuration
Edit `.env` file to configure:
- Database connection
- Broker API credentials
- Trading parameters
- Risk management rules

## Testing
```bash
pytest
# With coverage: pytest --cov=.
```
EOF

# Create core.database module
cat > core/database.py << 'EOF'
from models.database import init_db as _init_db

async def init_db():
    """Initialize the database"""
    await _init_db()
EOF

# Return to parent directory
cd ..

echo "✅ Backend setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. cd backend"
echo "2. python -m venv venv"
echo "3. source venv/bin/activate  # On Windows: venv\\Scripts\\activate"
echo "4. pip install -r requirements.txt"
echo "5. cp .env.example .env"
echo "6. Edit .env with your configuration"
echo "7. ./scripts/start.sh"
echo ""
echo "📚 API documentation will be available at:"
echo "   - http://localhost:8000/docs"
echo "   - http://localhost:8000/redoc"