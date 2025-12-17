#!/bin/bash

# OSM файл импорт хийх script

set -e

echo "=========================================="
echo "OSM файл импорт хийх"
echo "=========================================="

# 1. OSM файлын нэрийг асуух
if [ -z "$1" ]; then
    echo "Ашиглах: $0 <osm_file.osm>"
    echo ""
    echo "OSM файлыг lab10/data/ folder дотор байрлуулна уу."
    exit 1
fi

OSM_FILE="$1"
OSM_BASENAME=$(basename "$OSM_FILE")

# 2. OSM файл байгаа эсэхийг шалгах
if [ ! -f "lab10/data/$OSM_BASENAME" ]; then
    echo "❌ Алдаа: OSM файл олдсонгүй: lab10/data/$OSM_BASENAME"
    echo ""
    echo "OSM файлыг lab10/data/ folder руу хуулаарай:"
    echo "  cp $OSM_FILE lab10/data/"
    exit 1
fi

echo "✓ OSM файл олдлоо: lab10/data/$OSM_BASENAME"

# 3. PostGIS container ажиллаж байгаа эсэхийг шалгах
if ! docker ps | grep -q postgis_gis; then
    echo "❌ PostGIS container ажиллахгүй байна!"
    echo "Эхлүүлэх: cd lab10 && docker-compose up -d"
    exit 1
fi

echo "✓ PostGIS container ажиллаж байна"

# 4. osm2pgsql суулгагдсан эсэхийг шалгах
if ! docker exec postgis_gis which osm2pgsql > /dev/null 2>&1; then
    echo "osm2pgsql суулгаж байна..."
    docker exec postgis_gis bash -c "apt-get update && apt-get install -y osm2pgsql"
fi

echo "✓ osm2pgsql суулгагдсан"

# 5. OSM файл импорт хийх
echo ""
echo "OSM файл импорт хийж байна (энэ нь удаан хугацаа шаардаж болно)..."
docker exec -i postgis_gis osm2pgsql \
  -d gisdb \
  -U gisuser \
  -H localhost \
  --hstore \
  --slim \
  -C 2000 \
  /data/$OSM_BASENAME

if [ $? -ne 0 ]; then
    echo "❌ Импорт алдаатай дууслаа"
    exit 1
fi

echo "✓ OSM файл импорт хийгдлээ"

# 6. Хуучин roads хүснэгт устгах
echo ""
echo "Хуучин roads хүснэгт устгаж байна..."
docker exec postgis_gis psql -U gisuser -d gisdb -c "DROP TABLE IF EXISTS roads CASCADE;" > /dev/null 2>&1

# 7. roads хүснэгт үүсгэх
echo "roads хүснэгт үүсгэж байна..."
docker exec postgis_gis psql -U gisuser -d gisdb << 'EOF'
CREATE TABLE roads AS
SELECT 
    osm_id as id,
    name,
    highway,
    way as geom
FROM planet_osm_line
WHERE highway IS NOT NULL
  AND highway NOT IN ('footway', 'path', 'steps', 'pedestrian', 'cycleway');

ALTER TABLE roads ADD PRIMARY KEY (id);
CREATE INDEX roads_geom_idx ON roads USING GIST (geom);
EOF

echo "✓ roads хүснэгт үүсгэгдлээ"

# 8. pgRouting баганууд нэмэх
echo "pgRouting баганууд нэмж байна..."
docker exec postgis_gis psql -U gisuser -d gisdb << 'EOF'
ALTER TABLE roads ADD COLUMN IF NOT EXISTS source INTEGER;
ALTER TABLE roads ADD COLUMN IF NOT EXISTS target INTEGER;
ALTER TABLE roads ADD COLUMN IF NOT EXISTS length FLOAT;
ALTER TABLE roads ADD COLUMN IF NOT EXISTS cost FLOAT;
ALTER TABLE roads ADD COLUMN IF NOT EXISTS reverse_cost FLOAT;
EOF

echo "✓ Баганууд нэмэгдлээ"

# 9. Топологи үүсгэх
echo ""
echo "Топологи үүсгэж байна (энэ нь удаан хугацаа шаардаж болно)..."
docker exec postgis_gis psql -U gisuser -d gisdb -c "SELECT pgr_createTopology('roads', 0.0001, 'geom', 'id');"

echo "✓ Топологи үүсгэгдлээ"

# 10. Урт болон cost тооцоолох
echo "Урт болон cost тооцоолж байна..."
docker exec postgis_gis psql -U gisuser -d gisdb << 'EOF'
UPDATE roads SET length = ST_Length(geom::geography);
UPDATE roads SET cost = length;
UPDATE roads SET reverse_cost = length;
EOF

echo "✓ Урт болон cost тооцоологдлоо"

# 11. Үр дүн харах
echo ""
echo "=========================================="
echo "Импорт амжилттай!"
echo "=========================================="
echo ""

docker exec postgis_gis psql -U gisuser -d gisdb << 'EOF'
SELECT 
    'Замууд' as type,
    COUNT(*)::text as count
FROM roads
UNION ALL
SELECT 
    'Зангилаанууд' as type,
    COUNT(*)::text as count
FROM roads_vertices_pgr;
EOF

echo ""
echo "Замын сүлжээний бүс:"
docker exec postgis_gis psql -U gisuser -d gisdb -t -c "
SELECT 
    'Min: (' || ROUND(ST_XMin(ST_Collect(geom))::numeric, 6) || ', ' || 
           ROUND(ST_YMin(ST_Collect(geom))::numeric, 6) || ')'
FROM roads
UNION ALL
SELECT 
    'Max: (' || ROUND(ST_XMax(ST_Collect(geom))::numeric, 6) || ', ' || 
           ROUND(ST_YMax(ST_Collect(geom))::numeric, 6) || ')'
FROM roads;
"

echo ""
echo "=========================================="
echo "Дараагийн алхмууд:"
echo "1. Flask app дахин эхлүүлэх: cd lab16 && python app.py"
echo "2. Browser дээр http://localhost:8003 нээх"
echo "3. Замын сүлжээний бүс доторх цэгүүдийг сонгох"
echo "=========================================="


