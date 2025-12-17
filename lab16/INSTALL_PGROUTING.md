# pgRouting суулгах заавар

## Асуудал

PostGIS container дотор pgRouting extension суулгаагүй байсан.

## Шийдэл

### 1. pgRouting суулгах

```bash
# Container дотор pgRouting суулгах
docker exec postgis_gis apt update
docker exec postgis_gis apt install -y postgresql-16-pgrouting
```

### 2. Extension идэвхжүүлэх

```bash
docker exec postgis_gis psql -U gisuser -d gisdb -c "CREATE EXTENSION IF NOT EXISTS pgrouting;"
```

### 3. Шалгах

```bash
# pgRouting хувилбар шалгах
docker exec postgis_gis psql -U gisuser -d gisdb -c "SELECT pgr_version();"
```

### 4. Замын сүлжээ тохируулах

```bash
cd lab16
docker exec -i postgis_gis psql -U gisuser -d gisdb < setup_pgrouting.sql
```

## Одоогийн байдал

✅ pgRouting 3.8.0 суусан
✅ Топологи үүсгэгдсэн
✅ 4 зангилаа, 5 замын сегмент бэлэн

## Ашиглах

```bash
# Local psql-ээр холбогдох (Docker container ашиглах)
docker exec -i postgis_gis psql -U gisuser -d gisdb

# Эсвэл setup скрипт ажиллуулах
docker exec -i postgis_gis psql -U gisuser -d gisdb < setup_pgrouting.sql
```

## Анхаар

Local `psql` командыг ашиглахын оронд `docker exec` ашиглах хэрэгтэй, учир нь:
- Container доторх PostgreSQL socket-т холбогдоно
- `gisuser` role зөв ажиллана




