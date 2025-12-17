# PostGIS Setup Instructions

## 1. Folder Structure
```
lab10/
├── data/          # OSM файл хадгалах
├── pgdata/        # PostgreSQL өгөгдөл
├── pgadmin_data/  # pgAdmin өгөгдөл
└── docker-compose.yml
```

## 2. Build and Start Docker Containers

```bash
docker-compose build --no-cache
docker-compose up -d
```

## 3. Access pgAdmin

- URL: http://localhost:5050
- Email: admin@demo.local
- Password: admin123

## 4. Connect to PostGIS from pgAdmin

1. Right-click "Servers" → "Register" → "Server"
2. General tab:
   - Name: postgis
3. Connection tab:
   - Host: postgis (Docker network дотор) эсвэл localhost (host-оос)
   - Port: 5432 (Docker network дотор) эсвэл 5433 (host-оос)
   - User: gisuser
   - Password: gispass
   - Database: gisdb
   
   **Анхаар:** Host-оос холбогдох үед порт **5433** ашиглана (local PostgreSQL-тэй зөрчилдөхгүй байхын тулд).

## 5. Install osm2pgsql in Docker Container

```bash
docker exec -it postgis_gis bash
apt update && apt install osm2pgsql -y
exit
```

## 6. Import OSM File

Place your `.osm` file in the `data/` folder, then:

```bash
docker exec -it postgis_gis bash
osm2pgsql \
  -d gisdb \
  -U gisuser \
  -H localhost \
  -W \
  --prefix=ubdata \
  --create \
  -S /usr/share/osm2pgsql/default.style \
  /data/your_file.osm
# Password: gispass
exit
```

## 7. Verify Import

In pgAdmin, check:
- Servers → postgis → Databases → gisdb → Schemas → public → Tables

You should see:
- ubdata_point
- ubdata_line
- ubdata_polygon
- ubdata_roads

## 8. Sample Queries

### Count polygons
```sql
SELECT COUNT(*) FROM ubdata_polygon;
```

### Distinct building types
```sql
SELECT DISTINCT building FROM ubdata_polygon LIMIT 10;
```

### Geometry types
```sql
SELECT osm_id, ST_GeometryType(way) AS geom_type
FROM ubdata_polygon
LIMIT 5;
```

### Building areas
```sql
SELECT name, building, ST_Area(way::geography)/10000 AS area_ha
FROM ubdata_polygon
WHERE building IS NOT NULL
ORDER BY area_ha DESC
LIMIT 10;
```

### Building centroids
```sql
SELECT name, ST_X(ST_Centroid(way)) AS lon, ST_Y(ST_Centroid(way)) AS lat
FROM ubdata_polygon
WHERE building IS NOT NULL
LIMIT 10;
```

### Point in polygon (district check)
```sql
SELECT d.name AS district
FROM ubdata_polygon d
WHERE d.boundary='administrative' AND d.admin_level='7'
AND ST_Contains(d.way, ST_SetSRID(ST_Point(106.92, 47.92), 4326));
```

### Nearby hospitals (500m radius)
```sql
SELECT name, amenity, ST_Distance(way::geography, ST_MakePoint(106.92,47.92)::geography) AS dist_m
FROM ubdata_point
WHERE amenity='hospital'
AND ST_DWithin(way::geography, ST_MakePoint(106.92,47.92)::geography, 500)
ORDER BY dist_m;
```

### Closest point on road
```sql
SELECT ST_AsText(ST_ClosestPoint(r.way, ST_MakePoint(106.9,47.92)))
FROM ubdata_line r
WHERE highway IS NOT NULL
LIMIT 1;
```

## Download OSM Data

For Ulaanbaatar data:
- URL: https://download.geofabrik.de/asia/mongolia.html
- Download: mongolia-latest.osm.pbf
- Rename to: ub.osm (or keep as .pbf and use appropriate osm2pgsql flags)

