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
