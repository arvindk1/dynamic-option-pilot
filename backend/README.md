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
Configuration values can be supplied either via environment variables or a
`config.yaml` file. The provided `.env` file is still respected, but any
settings found in `config.yaml` will override the defaults.

Use the included `backend/config.yaml` as a starting point and adjust values for:
    - Database connection
    - Broker API credentials
    - Data provider plugin
    - Trading parameters
    - Risk management rules
    - Technical indicator parameters

### Technical Indicators
The `config.yaml` file includes defaults for several indicators used by the
analysis plugins:

| Setting | Description | Default |
|---------|-------------|---------|
| `rsi_period` | Lookback period for RSI calculations | 14 |
| `rsi_overbought` | RSI level considered overbought | 70 |
| `rsi_oversold` | RSI level considered oversold | 30 |
| `ema_fast` | Fast EMA period for MACD | 9 |
| `ema_slow` | Slow EMA period for MACD | 21 |
| `iv_percentile_period` | Days used to compute IV percentile | 252 |
| `high_vol_threshold` | Percentile marking high volatility | 0.75 |

## Testing
```bash
pytest
# With coverage: pytest --cov=.
```
