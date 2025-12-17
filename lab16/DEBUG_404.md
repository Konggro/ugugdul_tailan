# 404 Error Debugging Guide

## Шалгах алхмууд

### 1. Flask API ажиллаж байгаа эсэх

```bash
# Terminal дээр
curl http://localhost:5002/health
```

Хариу: `{"database": "connected", "status": "healthy"}`

Хэрэв алдаа гарвал:
```bash
cd lab16
python app.py
```

### 2. Test Page ашиглах

Browser дээр нээх:
```
http://localhost:8003/test_api.html
```

Энэ нь API-г автоматаар шалгана.

### 3. Browser Console шалгах

1. Browser дээр F12 дарах
2. Console tab нээх
3. "Зам олох" товч дарах
4. Алдааны мэдээллийг харах

### 4. Network Tab шалгах

1. Browser дээр F12 дарах
2. Network tab нээх
3. "Зам олох" товч дарах
4. `/route` хүсэлтийг олох
5. Дээр нь дарах, дэлгэрэнгүй мэдээлэл харах:
   - Request URL
   - Request Method
   - Status Code
   - Response

## Нийтлэг асуудлууд

### Асуудал 1: Flask app ажиллахгүй

**Тэмдэг:**
- Browser console: "Failed to fetch" эсвэл "Network error"
- curl: "Connection refused"

**Шийдэл:**
```bash
cd lab16
python app.py
```

Terminal дээр дараах мэдээлэл харагдах ёстой:
```
 * Running on http://0.0.0.0:5002
 * Debug mode: on
```

### Асуудал 2: 404 Error (Route not found)

**Тэмдэг:**
- Browser: "404 (NOT FOUND)"
- Network tab: Status 404

**Шалгах:**
```bash
# Route байгаа эсэх
curl http://localhost:5002/

# Route тест
curl -X POST http://localhost:5002/route \
  -H "Content-Type: application/json" \
  -d '{"start_lat": 0, "start_lon": 0, "end_lat": 10, "end_lon": 10}'
```

**Шийдэл:**
- Flask app дахин эхлүүлэх
- Browser cache цэвэрлэх (Ctrl+Shift+Delete)

### Асуудал 3: CORS Error

**Тэмдэг:**
- Browser console: "CORS policy" алдаа

**Шалгах:**
`app.py` дээр:
```python
from flask_cors import CORS
app = Flask(__name__)
CORS(app)  # ← Энэ мөр байх ёстой
```

### Асуудал 4: Database Error

**Тэмдэг:**
- API: "No route found" (pgRouting алдаа)
- Health check: "database": "disconnected"

**Шийдэл:**
```bash
# PostGIS container ажиллаж байгаа эсэх
docker ps | grep postgis

# Хэрэв ажиллахгүй байвал
cd lab10
docker-compose up -d

# pgRouting extension шалгах
docker exec postgis_gis psql -U gisuser -d gisdb -c "SELECT * FROM pg_extension WHERE extname='pgrouting';"
```

## Quick Fix

Хэрэв бүх зүйл ажиллахгүй байвал:

```bash
# 1. Бүх процесс устгах
pkill -f "python.*app.py"

# 2. PostGIS container эхлүүлэх
cd lab10
docker-compose up -d

# 3. Flask API эхлүүлэх
cd ../lab16
python app.py

# 4. Browser дээр hard refresh (Ctrl+F5 эсвэл Cmd+Shift+R)
```

## Test Commands

```bash
# 1. Health check
curl http://localhost:5002/health

# 2. API endpoints
curl http://localhost:5002/

# 3. Route test
curl -X POST http://localhost:5002/route \
  -H "Content-Type: application/json" \
  -d '{"start_lat": 0, "start_lon": 0, "end_lat": 10, "end_lon": 10}'

# 4. Flask app routes
cd lab16
python3 -c "from app import app; print([str(rule) for rule in app.url_map.iter_rules()])"
```


