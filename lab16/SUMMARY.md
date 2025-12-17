# Lab16 - pgRouting: Богино зам олох

## ✅ Бэлэн файлууд

### Backend (Flask API)
- ✅ `app.py` - Flask API сервер
  - `/route` - Зам олох endpoint
  - `/nearest_node` - Хамгийн ойр зангилаа олох
  - `/health` - Статус шалгах
  - Database connection (Docker болон local хоёуланд ажиллана)

### Frontend
- ✅ `index.html` - Leaflet газрын зураг интерфейс
- ✅ `script.js` - JavaScript логик
- ✅ `style.css` - CSS стил

### Database Setup
- ✅ `setup_pgrouting.sql` - pgRouting тохируулалт
  - PostGIS, pgRouting extension идэвхжүүлэх
  - `roads` хүснэгт үүсгэх
  - 5 замын сегмент оруулах (дөрвөлжин + товчлол)
  - Топологи үүсгэх
  - Cost тооцоолох

- ✅ `routing_example.sql` - SQL жишээүүд

### Docker
- ✅ `docker-compose.yml` - Docker Compose тохируулалт
- ✅ `Dockerfile` - Docker image тохируулалт

### Documentation
- ✅ `README.md` - Дэлгэрэнгүй заавар
- ✅ `INSTALL_PGROUTING.md` - pgRouting суулгах заавар
- ✅ `test_setup.sh` - Тохируулалт шалгах script

### Configuration
- ✅ `requirements.txt` - Python dependencies
- ✅ `.gitignore` - Git ignore файл

## 🚀 Ажиллуулах

### 1. Database тохируулах

```bash
# pgRouting extension суулгах
docker exec postgis_gis psql -U gisuser -d gisdb -c "CREATE EXTENSION IF NOT EXISTS pgrouting;"

# Замын сүлжээ үүсгэх
docker exec -i postgis_gis psql -U gisuser -d gisdb < setup_pgrouting.sql
```

### 2. Python dependencies суулгах

```bash
cd lab16
pip install -r requirements.txt
```

### 3. API ажиллуулах

```bash
python app.py
```

API `http://localhost:5002` дээр ажиллана.

### 4. Frontend ажиллуулах

```bash
# Өөр terminal дээр
python3 -m http.server 8003
```

Browser дээр `http://localhost:8003` нээнэ.

## 📋 Функционал

1. ✅ Газрын зураг дээр эхлэх/очих цэг сонгох
2. ✅ pgRouting Dijkstra ашиглан богино зам олох
3. ✅ Замыг газрын зураг дээр харуулах
4. ✅ Замын мэдээлэл харуулах (урт, зардал)
5. ✅ API endpoints (RESTful)

## 🔧 Технологи

- **Backend**: Flask, Python
- **Database**: PostgreSQL + PostGIS + pgRouting
- **Frontend**: Leaflet.js, HTML5, CSS3, JavaScript
- **Containerization**: Docker, Docker Compose

## 📝 Дараагийн алхмууд

1. Бодит OSM өгөгдөл ашиглах
2. Бусад routing алгоритмууд (A*, bidirectional)
3. Олон цэгээс routing (TSP)
4. Бусад тээврийн хэрэгсэл (машин, дугуй)
5. Real-time traffic data нэгтгэх


