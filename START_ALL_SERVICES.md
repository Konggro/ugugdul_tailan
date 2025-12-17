# Бүх Сервисүүдийг Зэрэг Ажиллуулах Заавар

## Сервисүүд ба Портүүд

| Сервис | Порт | URL | Тайлбар |
|--------|------|-----|---------|
| **lab10 - PostGIS** | 5432 | - | Database (Docker) |
| **lab10 - pgAdmin** | 5050 | http://localhost:5050 | Database Admin |
| **lab06 - Flask API** | 5001 | http://localhost:5001 | Flask Backend |
| **frontend - Nginx** | 8080 | http://localhost:8080 | Static Frontend |
| **L11** | 8000 | http://localhost:8000 | Leaflet Map |
| **lab14** | 8001 | http://localhost:8001 | Isochrone Analysis |
| **lab15** | 8002 | http://localhost:8002 | 15 минутын хот |
| **lab16** | 5002, 8003 | http://localhost:5002 (API)<br>http://localhost:8003 (Frontend) | pgRouting |

## Ажиллуулах Дараалал

### 1. Database (lab10) - Зөвхөн нэг удаа

```bash
cd lab10
docker-compose up -d
```

**Шалгах:**
```bash
docker ps | grep postgis
# PostGIS container ажиллаж байгаа эсэхийг шалгана
```

### 2. Flask API (lab06)

```bash
# Terminal 1
cd lab06
docker-compose up
# Эсвэл
python app.py  # Хэрэв Docker ашиглахгүй бол
```

**URL:** http://localhost:5001

### 3. Frontend (Nginx)

```bash
# Terminal 2
cd frontend
docker-compose up
```

**URL:** http://localhost:8080

### 4. L11 - Leaflet Map

```bash
# Terminal 3
cd L11
python3 -m http.server 8000
```

**URL:** http://localhost:8000

### 5. lab14 - Isochrone Analysis

```bash
# Terminal 4
cd lab14
python3 -m http.server 8001
```

**URL:** http://localhost:8001

### 6. lab15 - 15 минутын хот

```bash
# Terminal 5
cd lab15
python3 -m http.server 8002
```

**URL:** http://localhost:8002

### 7. lab16 - pgRouting

```bash
# Terminal 6 (API)
cd lab16
python app.py

# Terminal 7 (Frontend)
cd lab16
python3 -m http.server 8003
```

**URLs:**
- API: http://localhost:5002
- Frontend: http://localhost:8003

## Бүх Web Views

### 1. **Frontend (Nginx)** - http://localhost:8080
- **/** (index.html) - Үндсэн хуудас (Widget iframe)
- **/raster.html** - OpenLayers elevation map (өндөржилтийн зураг)
- **/routine.html** - Routing demo (зам олох)
- **/multimodal.html** - Multi-modal routing (алхах + автобус)

### 2. **lab06 - Flask API** - http://localhost:5001
- **/** - API endpoints list
- **/gadm** - GADM administrative boundaries map
- **/gadm/aimags** - API: Aimag boundaries (GeoJSON)
- **/gadm/sums** - API: Sum boundaries (GeoJSON)
- **/gadm/search?q=...** - API: Search sums
- **/nearest?lat=...&lon=...** - API: Nearest bus stops

### 3. **lab10 - pgAdmin** - http://localhost:5050
- Database administration interface
- Login: admin@example.com / admin123

### 4. **L11 - Leaflet Map** - http://localhost:8000
- Base layers: OpenStreetMap, Stadia.AlidadeSatellite
- Overlay: Dornod Aimag PNG
- Geolocation: Current location with distance from UB center
- Features: Tooltip, Popup, Distance calculation

### 5. **lab14 - Isochrone Analysis** - http://localhost:8001
- 15 минутын Isochrone (Сүхбаатарын талбай)
- Real schools from OSM
- Turf.js analysis: Schools within isochrone polygons
- Results: "X минутын бүс дотор Y сургууль байна"

### 6. **lab15 - 15 минутын хот** - http://localhost:8002
- Horoolol selection (36-р, 15-р, 1-р, Баянгол)
- 15 минутын Isochrone
- Heatmap: Авто ослууд
- Clustering: ЕБС-ууд, Эмийн сангууд
- Analysis: "15 минутын хот" стандарт хангаж байгаа эсэх

### 7. **lab16 - pgRouting** - http://localhost:8003
- Frontend: Route finding interface
- Click on map to set start/end points
- Visualize shortest path
- API: http://localhost:5002

## Бүгдийг Нэгэн Зэрэг Ажиллуулах (Script)

### macOS/Linux:

```bash
# start_all.sh файл үүсгэх
cat > start_all.sh << 'EOF'
#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting all services...${NC}"

# 1. Database
echo -e "${BLUE}[1/7] Starting PostGIS...${NC}"
cd lab10 && docker-compose up -d && cd ..

# 2. Flask API
echo -e "${BLUE}[2/7] Starting Flask API (lab06)...${NC}"
cd lab06 && docker-compose up -d && cd ..

# 3. Frontend
echo -e "${BLUE}[3/7] Starting Frontend...${NC}"
cd frontend && docker-compose up -d && cd ..

# 4. L11
echo -e "${BLUE}[4/7] Starting L11 (port 8000)...${NC}"
cd L11 && python3 -m http.server 8000 > /dev/null 2>&1 &
L11_PID=$!
cd ..

# 5. lab14
echo -e "${BLUE}[5/7] Starting lab14 (port 8001)...${NC}"
cd lab14 && python3 -m http.server 8001 > /dev/null 2>&1 &
LAB14_PID=$!
cd ..

# 6. lab15
echo -e "${BLUE}[6/7] Starting lab15 (port 8002)...${NC}"
cd lab15 && python3 -m http.server 8002 > /dev/null 2>&1 &
LAB15_PID=$!
cd ..

# 7. lab16
echo -e "${BLUE}[7/7] Starting lab16 API (port 5002)...${NC}"
cd lab16 && python app.py > /dev/null 2>&1 &
LAB16_API_PID=$!
sleep 2
cd lab16 && python3 -m http.server 8003 > /dev/null 2>&1 &
LAB16_FRONTEND_PID=$!
cd ..

echo -e "${GREEN}All services started!${NC}"
echo ""
echo "Web Views:"
echo "  - Frontend:        http://localhost:8080"
echo "  - Flask API:       http://localhost:5001"
echo "  - pgAdmin:         http://localhost:5050"
echo "  - L11:             http://localhost:8000"
echo "  - lab14:           http://localhost:8001"
echo "  - lab15:           http://localhost:8002"
echo "  - lab16 Frontend:  http://localhost:8003"
echo "  - lab16 API:       http://localhost:5002"
echo ""
echo "Press Ctrl+C to stop all services"
echo "PIDs: L11=$L11_PID, lab14=$LAB14_PID, lab15=$LAB15_PID, lab16=$LAB16_API_PID, lab16_frontend=$LAB16_FRONTEND_PID"

# Wait for Ctrl+C
trap "kill $L11_PID $LAB14_PID $LAB15_PID $LAB16_API_PID $LAB16_FRONTEND_PID 2>/dev/null; exit" INT
wait
EOF

chmod +x start_all.sh
```

### Ажиллуулах:

```bash
./start_all.sh
```

### Зогсоох:

```bash
# Зөвхөн Python серверүүд
pkill -f "python3 -m http.server"

# Docker сервисүүд
cd lab06 && docker-compose down && cd ..
cd frontend && docker-compose down && cd ..
cd lab10 && docker-compose down && cd ..
```

## Шалгах

### Бүх портууд шалгах:

```bash
# macOS
lsof -i :5001,5002,5050,8000,8001,8002,8003,8080

# Эсвэл
netstat -an | grep LISTEN | grep -E '5001|5002|5050|8000|8001|8002|8003|8080'
```

### Docker containers шалгах:

```bash
docker ps
```

## Анхааруулга

1. **Порт зөрчил**: Хэрэв порт завгүй байвал өөр порт ашиглах
2. **Docker**: lab06, frontend, lab10 нь Docker ашигладаг
3. **Python**: L11, lab14, lab15, lab16 нь Python HTTP server ашигладаг
4. **Database**: lab10 PostGIS container эхлээд ажиллах ёстой

## Хурдан Заавар

```bash
# 1. Database
cd lab10 && docker-compose up -d && cd ..

# 2. Flask API  
cd lab06 && docker-compose up -d && cd ..

# 3. Frontend
cd frontend && docker-compose up -d && cd ..

# 4. L11, lab14, lab15, lab16 (өөр terminal-үүдэд)
cd L11 && python3 -m http.server 8000 &
cd ../lab14 && python3 -m http.server 8001 &
cd ../lab15 && python3 -m http.server 8002 &
cd ../lab16 && python app.py & python3 -m http.server 8003 &
```

