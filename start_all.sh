#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Starting All Services${NC}"
echo -e "${GREEN}========================================${NC}"

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

# 1. Database (lab10)
echo -e "${BLUE}[1/7] Starting PostGIS & pgAdmin (lab10)...${NC}"
cd lab10
if ! docker-compose ps | grep -q "Up"; then
    docker-compose up -d
    sleep 3
    echo -e "${GREEN}✓ PostGIS running on port 5432${NC}"
    echo -e "${GREEN}✓ pgAdmin running on http://localhost:5050${NC}"
else
    echo -e "${YELLOW}⚠ PostGIS already running${NC}"
fi
cd ..

# 2. Flask API (lab06)
echo -e "${BLUE}[2/7] Starting Flask API (lab06)...${NC}"
cd lab06
if ! docker-compose ps | grep -q "Up"; then
    docker-compose up -d
    sleep 3
    echo -e "${GREEN}✓ Flask API running on http://localhost:5001${NC}"
else
    echo -e "${YELLOW}⚠ Flask API already running${NC}"
fi
cd ..

# 3. Frontend (Nginx)
echo -e "${BLUE}[3/7] Starting Frontend (Nginx)...${NC}"
cd frontend
if ! docker-compose ps | grep -q "Up"; then
    docker-compose up -d
    sleep 2
    echo -e "${GREEN}✓ Frontend running on http://localhost:8080${NC}"
else
    echo -e "${YELLOW}⚠ Frontend already running${NC}"
fi
cd ..

# 4. L11 - Leaflet Map
echo -e "${BLUE}[4/7] Starting L11 (Leaflet Map) on port 8000...${NC}"
cd L11
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠ Port 8000 already in use${NC}"
else
    python3 -m http.server 8000 > /dev/null 2>&1 &
    L11_PID=$!
    echo $L11_PID > /tmp/l11_pid.txt
    sleep 1
    echo -e "${GREEN}✓ L11 running on http://localhost:8000 (PID: $L11_PID)${NC}"
fi
cd ..

# 5. lab14 - Isochrone Analysis
echo -e "${BLUE}[5/7] Starting lab14 (Isochrone) on port 8001...${NC}"
cd lab14
if lsof -Pi :8001 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠ Port 8001 already in use${NC}"
else
    python3 -m http.server 8001 > /dev/null 2>&1 &
    LAB14_PID=$!
    echo $LAB14_PID > /tmp/lab14_pid.txt
    sleep 1
    echo -e "${GREEN}✓ lab14 running on http://localhost:8001 (PID: $LAB14_PID)${NC}"
fi
cd ..

# 6. lab15 - 15 минутын хот
echo -e "${BLUE}[6/7] Starting lab15 (15 минутын хот) on port 8002...${NC}"
cd lab15
if lsof -Pi :8002 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠ Port 8002 already in use${NC}"
else
    python3 -m http.server 8002 > /dev/null 2>&1 &
    LAB15_PID=$!
    echo $LAB15_PID > /tmp/lab15_pid.txt
    sleep 1
    echo -e "${GREEN}✓ lab15 running on http://localhost:8002 (PID: $LAB15_PID)${NC}"
fi
cd ..

# 7. lab16 - pgRouting
echo -e "${BLUE}[7/7] Starting lab16 (pgRouting)...${NC}"
cd lab16

# Check if Flask API is running
if lsof -Pi :5002 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠ Port 5002 (lab16 API) already in use${NC}"
else
    python app.py > /tmp/lab16_api.log 2>&1 &
    LAB16_API_PID=$!
    echo $LAB16_API_PID > /tmp/lab16_api_pid.txt
    sleep 3
    echo -e "${GREEN}✓ lab16 API running on http://localhost:5002 (PID: $LAB16_API_PID)${NC}"
fi

# Frontend
if lsof -Pi :8003 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠ Port 8003 (lab16 Frontend) already in use${NC}"
else
    python3 -m http.server 8003 > /dev/null 2>&1 &
    LAB16_FRONTEND_PID=$!
    echo $LAB16_FRONTEND_PID > /tmp/lab16_frontend_pid.txt
    sleep 1
    echo -e "${GREEN}✓ lab16 Frontend running on http://localhost:8003 (PID: $LAB16_FRONTEND_PID)${NC}"
fi
cd ..

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}All Services Started!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Web Views:${NC}"
echo "  📍 Frontend (Nginx):     http://localhost:8080"
echo "     - index.html (Widget)"
echo "     - raster.html (Elevation)"
echo "     - routine.html (Routing)"
echo "     - multimodal.html (Multi-modal)"
echo ""
echo "  🔧 Flask API (lab06):     http://localhost:5001"
echo "     - / (API endpoints)"
echo "     - /gadm (GADM map)"
echo ""
echo "  🗄️  pgAdmin (lab10):      http://localhost:5050"
echo "     - Login: admin@example.com / admin123"
echo ""
echo "  🗺️  L11 (Leaflet):        http://localhost:8000"
echo "     - Base layers, Overlays, Geolocation"
echo ""
echo "  📊 lab14 (Isochrone):     http://localhost:8001"
echo "     - 15 минутын Isochrone анализ"
echo ""
echo "  🏙️  lab15 (15 мин хот):   http://localhost:8002"
echo "     - Хороолол анализ, Heatmap, Clustering"
echo ""
echo "  🛣️  lab16 (pgRouting):    http://localhost:8003"
echo "     - API: http://localhost:5002"
echo ""
echo -e "${YELLOW}To stop all services, run: ./stop_all.sh${NC}"
echo ""




