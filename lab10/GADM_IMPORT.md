# GADM Shapefile Import Instructions

## 1. Download GADM Shapefiles

Visit: https://gadm.org/download_country.html

Select:
- Country: Mongolia
- Format: Shapefile
- Download: gadm41_MNG_shp.zip

Extract and copy these files to `lab10/data/gadm/`:
- `gadm41_MNG_0.shp` (and .shx, .dbf, .prj files)
- `gadm41_MNG_1.shp` (and related files)
- `gadm41_MNG_2.shp` (and related files)

## 2. Import into PostGIS

### Option 1: Using the script
```bash
cd lab10
chmod +x import_gadm.sh
./import_gadm.sh
```

### Option 2: Manual import
```bash
# Level 0 (Country boundary)
docker exec -i postgis_gis shp2pgsql -s 4326 -I -D /data/gadm/gadm41_MNG_0.shp gadm41_mng_0 | docker exec -i postgis_gis psql -U gisuser -d gisdb

# Level 1 (Aimags/Provinces)
docker exec -i postgis_gis shp2pgsql -s 4326 -I -D /data/gadm/gadm41_MNG_1.shp gadm41_mng_1 | docker exec -i postgis_gis psql -U gisuser -d gisdb

# Level 2 (Sums/Districts)
docker exec -i postgis_gis shp2pgsql -s 4326 -I -D /data/gadm/gadm41_MNG_2.shp gadm41_mng_2 | docker exec -i postgis_gis psql -U gisuser -d gisdb
```

## 3. Verify Import

In pgAdmin, check:
- Tables: `gadm41_mng_0`, `gadm41_mng_1`, `gadm41_mng_2`

## 4. Query: Аймаг бүрийн сумын нэрсийг, төвийн координаттай харуулах

```sql
SELECT 
    name_1 as aimag_name,
    name_2 as sum_name,
    ST_X(ST_Centroid(geom)) as lon,
    ST_Y(ST_Centroid(geom)) as lat
FROM gadm41_mng_2
ORDER BY name_1, name_2;
```

## 5. Access the Map

After starting lab06 Flask app:
- URL: http://localhost:5001/gadm




