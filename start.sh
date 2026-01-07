#!/bin/bash

# FastAPI Backend Startup Script

echo "Starting FastAPI Backend..."

# Activate virtual environment
source venv/bin/activate

# Run migrations
echo "Running database migrations..."
alembic upgrade head

# Start the server
echo "Starting server on http://localhost:8000"
uvicorn main:app --reload --host 0.0.0.0 --port 8000

