#!/bin/bash
# Frontend Server Startup Script

cd "$(dirname "$0")"

echo "=========================================="
echo "Starting Frontend Server"
echo "=========================================="
echo "Frontend will run on: http://localhost:3000"
echo "=========================================="
echo ""

npm run dev

