# Lab16 - pgRouting: Богино зам олох

## Тайлбар

pgRouting ашиглан PostgreSQL/PostGIS дээр богино зам олох систем.

## Шаардлага

- PostgreSQL + PostGIS
- pgRouting extension
- Python 3.x
- Flask

## Хурдан Эхлэх

### Автомат шалгах:

```bash
cd lab16
./test_setup.sh
```

Энэ нь бүх тохируулалтыг шалгана.

## Тохируулалт

### 1. PostgreSQL дээр pgRouting суулгах

**Docker ашиглаж байгаа бол:**

```bash
# pgRouting extension суулгах
docker exec postgis_gis psql -U gisuser -d gisdb -c "CREATE EXTENSION IF NOT EXISTS pgrouting;"
```

**Local PostgreSQL ашиглаж байгаа бол:**

```bash
# PostgreSQL-д нэвтрэх
psql -U gisuser -d gisdb

# pgRouting extension суулгах
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgrouting;
```

### 2. Замын сүлжээ үүсгэх

**Docker:**

```bash
docker exec -i postgis_gis psql -U gisuser -d gisdb < setup_pgrouting.sql
```

**Local (Docker port 5433):**

```bash
psql -h 127.0.0.1 -p 5433 -U gisuser -d gisdb -f setup_pgrouting.sql
```

Энэ нь:
- `roads` хүснэгт үүсгэнэ
- 5 замын сегмент оруулна (дөрвөлжин + товчлол)
- Топологи үүсгэнэ (`roads_vertices_pgr` хүснэгт)
- Cost тооцоолно

### 3. Python dependencies суулгах

```bash
cd lab16
pip install -r requirements.txt
```

**Анхаар:** Python virtual environment ашиглахыг зөвлөж байна:

```bash
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# эсвэл
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### 4. Flask API ажиллуулах

#### Гараар (Local):

```bash
python app.py
```

API `http://localhost:5002` дээр ажиллана.

#### Docker ашиглах:

```bash
# lab10 PostGIS container ажиллаж байгаа эсэхийг шалгах
docker ps | grep postgis

# lab16 API ажиллуулах
docker-compose up -d
```

### 5. Frontend нээх

```bash
# Өөр terminal дээр
cd lab16
python3 -m http.server 8003
# Browser: http://localhost:8003
```

**Анхаар:** Frontend нь `http://localhost:5002` дээрх API-г дуудна. Хэрэв API өөр порт дээр ажиллаж байвал `script.js` дээрх `API_BASE` утгыг өөрчлөх хэрэгтэй.

## Ашиглах

### 1. Энгийн жишээ (SQL)

```sql
-- Богино зам олох
SELECT * FROM pgr_dijkstra(
    'SELECT id, source, target, cost, reverse_cost FROM roads',
    1,  -- Start node
    3   -- End node
);
```

### 2. API ашиглах

#### Зам олох

```bash
curl -X POST http://localhost:5002/route \
  -H "Content-Type: application/json" \
  -d '{
    "start_lat": 0,
    "start_lon": 0,
    "end_lat": 10,
    "end_lon": 10
  }'
```

#### Хамгийн ойр зангилаа олох

```bash
curl -X POST http://localhost:5002/nearest_node \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 5,
    "lon": 5
  }'
```

### 3. Frontend ашиглах

1. Browser дээр `http://localhost:8003` нээнэ
2. "Газрын зураг дээр сонгох" товч дарах
3. Газрын зураг дээр эхлэх цэг (ногоон marker) сонгох
4. Очих цэг (улаан marker) сонгох
5. "Зам олох" товч дарах
6. Зам улаан шугамаар харагдана

**Анхаар:** API (`app.py`) эхлээд ажиллаж байх ёстой!

## OpenStreetMap өгөгдөл ашиглах

### 1. OSM файл татах

```bash
# Overpass API ашиглан татах
wget -O area.osm "https://overpass-api.de/api/map?bbox=106.8,47.8,107.0,48.0"
```

### 2. osm2pgsql ашиглан импорт хийх

```bash
osm2pgsql -d gisdb -U gisuser -H localhost -P 5432 \
  --hstore --slim area.osm
```

### 3. Замын сүлжээг pgRouting-д тохируулах

```sql
-- ways хүснэгтээс roads хүснэгт үүсгэх
CREATE TABLE roads AS
SELECT 
    osm_id as id,
    name,
    way as geom
FROM planet_osm_line
WHERE highway IS NOT NULL;

-- Топологи үүсгэх
ALTER TABLE roads ADD COLUMN source INTEGER;
ALTER TABLE roads ADD COLUMN target INTEGER;
ALTER TABLE roads ADD COLUMN length FLOAT;
ALTER TABLE roads ADD COLUMN cost FLOAT;
ALTER TABLE roads ADD COLUMN reverse_cost FLOAT;

SELECT pgr_createTopology('roads', 0.001, 'geom', 'id');
UPDATE roads SET length = ST_Length(geom::geography) / 1000;
UPDATE roads SET cost = length;
UPDATE roads SET reverse_cost = length;
```

## Файлууд

- `setup_pgrouting.sql` - pgRouting тохируулалт ба замын сүлжээ
- `routing_example.sql` - SQL жишээүүд
- `app.py` - Flask API
- `index.html` - Frontend HTML
- `script.js` - Frontend JavaScript
- `style.css` - CSS стил
- `requirements.txt` - Python dependencies
- `docker-compose.yml` - Docker Compose тохируулалт
- `Dockerfile` - Docker image тохируулалт
- `INSTALL_PGROUTING.md` - pgRouting суулгах заавар

## API Endpoints

- `GET /` - API мэдээлэл
- `GET /health` - Статус шалгах
- `POST /route` - Зам олох
- `POST /nearest_node` - Хамгийн ойр зангилаа олох

## Дараагийн алхмууд

1. Бодит OSM өгөгдөл ашиглах
2. Бусад routing алгоритмууд (A*, bidirectional)
3. Олон цэгээс routing (TSP)
4. Бусад тээврийн хэрэгсэл (машин, дугуй)
5. Real-time traffic data нэгтгэх

