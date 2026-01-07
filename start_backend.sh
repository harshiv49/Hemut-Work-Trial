#!/bin/bash
# Backend Server Startup Script

cd "$(dirname "$0")"
source venv/bin/activate

echo "=========================================="
echo "Starting Backend Server"
echo "=========================================="
echo "Backend will run on: http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"
echo "=========================================="
echo ""

uvicorn main:app --host 0.0.0.0 --port 8000 --reload

