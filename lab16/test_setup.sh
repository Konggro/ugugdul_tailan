#!/bin/bash

# Lab16 тохируулалт шалгах script

echo "=========================================="
echo "Lab16 Setup Test"
echo "=========================================="

# 1. Check Python
echo "[1/5] Checking Python..."
if command -v python3 &> /dev/null; then
    echo "✓ Python3 found: $(python3 --version)"
else
    echo "✗ Python3 not found"
    exit 1
fi

# 2. Check dependencies
echo "[2/5] Checking Python dependencies..."
cd "$(dirname "$0")"
if [ -f "requirements.txt" ]; then
    echo "✓ requirements.txt found"
    echo "  Install with: pip install -r requirements.txt"
else
    echo "✗ requirements.txt not found"
fi

# 3. Check PostGIS connection
echo "[3/5] Checking PostGIS connection..."
if docker ps | grep -q postgis_gis; then
    echo "✓ PostGIS container is running"
    
    # Try to connect
    if docker exec postgis_gis psql -U gisuser -d gisdb -c "SELECT 1;" > /dev/null 2>&1; then
        echo "✓ Can connect to PostGIS database"
    else
        echo "✗ Cannot connect to PostGIS database"
    fi
else
    echo "⚠ PostGIS container not running"
    echo "  Start with: cd lab10 && docker-compose up -d"
fi

# 4. Check pgRouting extension
echo "[4/5] Checking pgRouting extension..."
if docker ps | grep -q postgis_gis; then
    if docker exec postgis_gis psql -U gisuser -d gisdb -c "SELECT * FROM pg_extension WHERE extname='pgrouting';" 2>/dev/null | grep -q pgrouting; then
        echo "✓ pgRouting extension is installed"
    else
        echo "⚠ pgRouting extension not found"
        echo "  Install with: docker exec postgis_gis psql -U gisuser -d gisdb -c 'CREATE EXTENSION pgrouting;'"
    fi
fi

# 5. Check roads table
echo "[5/5] Checking roads table..."
if docker ps | grep -q postgis_gis; then
    if docker exec postgis_gis psql -U gisuser -d gisdb -c "SELECT COUNT(*) FROM roads;" > /dev/null 2>&1; then
        COUNT=$(docker exec postgis_gis psql -U gisuser -d gisdb -t -c "SELECT COUNT(*) FROM roads;" 2>/dev/null | xargs)
        echo "✓ roads table exists with $COUNT rows"
    else
        echo "⚠ roads table not found or empty"
        echo "  Setup with: docker exec -i postgis_gis psql -U gisuser -d gisdb < setup_pgrouting.sql"
    fi
fi

echo ""
echo "=========================================="
echo "Setup Test Complete"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Install dependencies: pip install -r requirements.txt"
echo "2. Start API: python app.py"
echo "3. Start frontend: python3 -m http.server 8003"
echo "4. Open browser: http://localhost:8003"


