# Порт өөрчлөлт - 5432 → 5433

## Өөрчлөлт

PostGIS Docker container-ийн портыг **5432**-оос **5433** руу өөрчилсөн. Энэ нь local PostgreSQL instance-тэй зөрчилдөхгүй байхын тулд.

## Файлууд

### 1. `lab10/docker-compose.yml`
```yaml
ports:
  - "5433:5432"  # Host:Container
```

### 2. `lab16/app.py`
```python
# Local development uses port 5433
return 'postgresql://gisuser:gispass@127.0.0.1:5433/gisdb'
```

## Ашиглах

### Docker container ажиллуулах:

```bash
cd lab10
docker-compose down
docker-compose up -d
```

### psql ашиглах:

```bash
# Docker container дотор
docker exec -it postgis_gis psql -U gisuser -d gisdb

# Localhost-оос (port 5433)
psql -h 127.0.0.1 -p 5433 -U gisuser -d gisdb
```

### pgAdmin тохируулалт:

pgAdmin дээр server нэмэхдээ:
- **Host:** localhost (эсвэл 127.0.0.1)
- **Port:** 5433
- **Username:** gisuser
- **Password:** gispass
- **Database:** gisdb

## Шалгах

```bash
# Порт шалгах
docker port postgis_gis

# Холболт тест хийх
psql -h 127.0.0.1 -p 5433 -U gisuser -d gisdb -c "SELECT version();"
```

## Анхаар

- Docker container доторх порт нь 5432 хэвээр байна
- Зөвхөн host port нь 5433 болсон
- `app.py` автоматаар зөв портыг ашиглана


