# Lab16 - Асуудал засах заавар

## Database холболтын асуудал

### Асуудал: "role gisuser does not exist"

Энэ нь local PostgreSQL instance ажиллаж байгаатай холбоотой. 

#### Шийдэл 1: Local PostgreSQL зогсоох (Зөвлөмж)

```bash
# macOS (Homebrew)
brew services stop postgresql

# Эсвэл
pg_ctl -D /usr/local/var/postgres stop
```

Дараа нь дахин оролдоно уу:

```bash
cd lab16
python app.py
```

#### Шийдэл 2: Docker IP ашиглах

```bash
# Docker container-ийн IP олох
DOCKER_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' postgis_gis)

# Environment variable ашиглах
export DATABASE_URL="postgresql://gisuser:gispass@${DOCKER_IP}:5432/gisdb"
python app.py
```

#### Шийдэл 3: Docker Compose ашиглах

```bash
cd lab16
docker-compose up
```

Энэ нь Docker network дотор ажиллах тул `postgis_gis` hostname ажиллана.

### Асуудал: "ModuleNotFoundError: No module named 'flask'"

```bash
cd lab16
pip3 install -r requirements.txt
```

Эсвэл virtual environment ашиглах:

```bash
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
```

### Асуудал: "Port 5002 is already in use"

```bash
# Хуучин процесс устгах
pkill -f "python.*app.py"

# Эсвэл өөр порт ашиглах
PORT=5003 python app.py
```

Frontend дээр `script.js` файлд `API_BASE` утгыг өөрчлөх хэрэгтэй.

### Асуудал: "container is not running"

```bash
cd lab10
docker-compose up -d
```

### Асуудал: "function pgr_dijkstra does not exist"

```bash
docker exec postgis_gis psql -U gisuser -d gisdb -c "CREATE EXTENSION pgrouting;"
```

### Асуудал: Frontend API-д холбогдохгүй байна

1. API ажиллаж байгаа эсэхийг шалгах:
   ```bash
   curl http://localhost:5002/health
   ```

2. `script.js` файлд `API_BASE` утгыг шалгах:
   ```javascript
   const API_BASE = 'http://localhost:5002';
   ```

3. CORS асуудал байвал `app.py` дээр CORS идэвхжсэн эсэхийг шалгах.

## Холболт шалгах

### Database холболт шалгах:

```bash
# Docker container дотор
docker exec postgis_gis psql -U gisuser -d gisdb -c "SELECT 1;"

# Localhost-оос (Docker port mapping)
psql -h 127.0.0.1 -p 5432 -U gisuser -d gisdb -c "SELECT 1;"
```

### API шалгах:

```bash
# Health check
curl http://localhost:5002/health

# API endpoints
curl http://localhost:5002/
```


