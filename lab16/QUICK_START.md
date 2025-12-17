# Lab16 - Хурдан Эхлэх Заавар

## ✅ Бэлэн байдал шалгах

```bash
# 1. PostGIS container ажиллаж байгаа эсэх
docker ps | grep postgis

# Хэрэв ажиллахгүй байвал:
cd lab10
docker-compose up -d
```

## 🚀 Тохируулалт

### 1. pgRouting extension суулгах

```bash
docker exec postgis_gis psql -U gisuser -d gisdb -c "CREATE EXTENSION IF NOT EXISTS pgrouting;"
```

### 2. Замын сүлжээ үүсгэх

```bash
cd lab16
docker exec -i postgis_gis psql -U gisuser -d gisdb < setup_pgrouting.sql
```

### 3. Шалгах

```bash
# Замууд шалгах
docker exec postgis_gis psql -U gisuser -d gisdb -c "SELECT COUNT(*) FROM roads;"

# Зангилаанууд шалгах
docker exec postgis_gis psql -U gisuser -d gisdb -c "SELECT COUNT(*) FROM roads_vertices_pgr;"
```

## 🎯 Ажиллуулах

### Terminal 1: Flask API

```bash
cd lab16
pip install -r requirements.txt  # Зөвхөн нэг удаа
python app.py
```

API `http://localhost:5002` дээр ажиллана.

### Terminal 2: Frontend

```bash
cd lab16
python3 -m http.server 8003
```

Browser дээр `http://localhost:8003` нээнэ.

## 🧪 Тест хийх

### API тест:

```bash
# Health check
curl http://localhost:5002/health

# Зам олох
curl -X POST http://localhost:5002/route \
  -H "Content-Type: application/json" \
  -d '{
    "start_lat": 0,
    "start_lon": 0,
    "end_lat": 10,
    "end_lon": 10
  }'
```

### SQL тест:

```bash
docker exec postgis_gis psql -U gisuser -d gisdb -c "
SELECT seq, node, edge, cost 
FROM pgr_dijkstra('SELECT id, source, target, cost, reverse_cost FROM roads', 1, 3) 
ORDER BY seq;
"
```

## ❌ Алдаа засах

### "container is not running"

```bash
cd lab10
docker-compose up -d
```

### "no such file or directory: setup_pgrouting.sql"

```bash
cd lab16  # Зөв directory руу шилжих
pwd  # Шалгах
ls setup_pgrouting.sql  # Файл байгаа эсэхийг шалгах
```

### "function pgr_dijkstra does not exist"

```bash
docker exec postgis_gis psql -U gisuser -d gisdb -c "CREATE EXTENSION pgrouting;"
```

### "relation roads does not exist"

```bash
cd lab16
docker exec -i postgis_gis psql -U gisuser -d gisdb < setup_pgrouting.sql
```


