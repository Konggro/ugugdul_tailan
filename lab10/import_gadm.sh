#!/bin/bash
# GADM shapefile-уудыг PostGIS-д импорт хийх скрипт

echo "GADM shapefile импорт эхлэж байна..."

# Shapefile-ууд data/gadm фолдерт байх ёстой
# gadm41_MNG_0.shp, gadm41_MNG_1.shp, gadm41_MNG_2.shp

# Level 0 (Улсын хил)
echo "Level 0 импорт хийж байна..."
docker exec -i postgis_gis shp2pgsql -s 4326 -I -D /data/gadm/gadm41_MNG_0.shp gadm41_mng_0 | docker exec -i postgis_gis psql -U gisuser -d gisdb

# Level 1 (Аймгууд)
echo "Level 1 импорт хийж байна..."
docker exec -i postgis_gis shp2pgsql -s 4326 -I -D /data/gadm/gadm41_MNG_1.shp gadm41_mng_1 | docker exec -i postgis_gis psql -U gisuser -d gisdb

# Level 2 (Сум/Дүүрэг)
echo "Level 2 импорт хийж байна..."
docker exec -i postgis_gis shp2pgsql -s 4326 -I -D /data/gadm/gadm41_MNG_2.shp gadm41_mng_2 | docker exec -i postgis_gis psql -U gisuser -d gisdb

echo "Импорт дууссан!"




