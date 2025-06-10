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
