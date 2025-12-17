# OSM файл импорт хийх заавар

## 1. OSM файлыг байрлуулах

OSM файлыг `lab10/data/` folder дотор байрлуулна:

```bash
# Folder үүсгэх (хэрэв байхгүй бол)
mkdir -p lab10/data

# OSM файлыг хуулах
cp /path/to/your/file.osm lab10/data/
# Эсвэл
mv /path/to/your/file.osm lab10/data/
```

## 2. osm2pgsql суулгах (Docker container дотор)

```bash
# Container дотор нэвтрэх
docker exec -it postgis_gis bash

# osm2pgsql суулгах
apt-get update
apt-get install -y osm2pgsql

# Гарах
exit
```

## 3. OSM файл импорт хийх

```bash
# OSM файлыг PostGIS руу импорт хийх
docker exec -it postgis_gis osm2pgsql \
  -d gisdb \
  -U gisuser \
  -H localhost \
  --hstore \
  --slim \
  -C 2000 \
  /data/your_file.osm
```

**Анхаар:** `your_file.osm` гэсэн хэсгийг өөрийн OSM файлын нэрээр солино.

**Жишээ:**
```bash
docker exec -it postgis_gis osm2pgsql \
  -d gisdb \
  -U gisuser \
  -H localhost \
  --hstore \
  --slim \
  -C 2000 \
  /data/ulaanbaatar.osm
```

## 4. Замын сүлжээг pgRouting-д тохируулах

### 4.1. Хуучин roads хүснэгт устгах (хэрэв байвал)

```bash
docker exec postgis_gis psql -U gisuser -d gisdb -c "DROP TABLE IF EXISTS roads CASCADE;"
```

### 4.2. OSM өгөгдлөөс roads хүснэгт үүсгэх

```bash
docker exec postgis_gis psql -U gisuser -d gisdb << EOF
-- Замын сүлжээ хүснэгт үүсгэх
CREATE TABLE roads AS
SELECT 
    osm_id as id,
    name,
    highway,
    way as geom
FROM planet_osm_line
WHERE highway IS NOT NULL
  AND highway NOT IN ('footway', 'path', 'steps', 'pedestrian', 'cycleway');

-- Primary key нэмэх
ALTER TABLE roads ADD PRIMARY KEY (id);

-- Index үүсгэх
CREATE INDEX roads_geom_idx ON roads USING GIST (geom);
EOF
```

### 4.3. pgRouting-д шаардлагатай баганууд нэмэх

```bash
docker exec postgis_gis psql -U gisuser -d gisdb << EOF
-- pgRouting баганууд
ALTER TABLE roads ADD COLUMN IF NOT EXISTS source INTEGER;
ALTER TABLE roads ADD COLUMN IF NOT EXISTS target INTEGER;
ALTER TABLE roads ADD COLUMN IF NOT EXISTS length FLOAT;
ALTER TABLE roads ADD COLUMN IF NOT EXISTS cost FLOAT;
ALTER TABLE roads ADD COLUMN IF NOT EXISTS reverse_cost FLOAT;
EOF
```

### 4.4. Топологи үүсгэх

```bash
docker exec postgis_gis psql -U gisuser -d gisdb << EOF
-- Топологи үүсгэх (0.0001 tolerance - нарийвчлал)
SELECT pgr_createTopology('roads', 0.0001, 'geom', 'id');
EOF
```

**Анхаар:** Tolerance утга нь замын сүлжээний нарийвчлалаас хамаарна. Их файлд илүү том утга ашиглах хэрэгтэй.

### 4.5. Урт болон cost тооцоолох

```bash
docker exec postgis_gis psql -U gisuser -d gisdb << EOF
-- Урт тооцоолох (метрээр)
UPDATE roads SET length = ST_Length(geom::geography);

-- Cost тооцоолох (урт = cost)
UPDATE roads SET cost = length;
UPDATE roads SET reverse_cost = length;
EOF
```

## 5. Шалгах

```bash
# Замуудын тоо
docker exec postgis_gis psql -U gisuser -d gisdb -c "SELECT COUNT(*) FROM roads;"

# Зангилаануудын тоо
docker exec postgis_gis psql -U gisuser -d gisdb -c "SELECT COUNT(*) FROM roads_vertices_pgr;"

# Замын сүлжээний бүс харах
docker exec postgis_gis psql -U gisuser -d gisdb -c "
SELECT 
    ST_XMin(ST_Collect(geom)) as min_lon,
    ST_YMin(ST_Collect(geom)) as min_lat,
    ST_XMax(ST_Collect(geom)) as max_lon,
    ST_YMax(ST_Collect(geom)) as max_lat
FROM roads;
"
```

## 6. Flask app дахин эхлүүлэх

```bash
cd lab16
pkill -f "python.*app.py"
python app.py
```

## 7. Frontend дээр тест хийх

Browser дээр `http://localhost:8003` нээж, замын сүлжээний бүс доторх цэгүүдийг сонгоно уу.

## Нийтлэг асуудлууд

### Асуудал 1: "osm2pgsql: command not found"

**Шийдэл:**
```bash
docker exec -it postgis_gis bash
apt-get update && apt-get install -y osm2pgsql
exit
```

### Асуудал 2: "No such file or directory: /data/file.osm"

**Шийдэл:**
- OSM файлыг `lab10/data/` folder дотор байрлуулсан эсэхийг шалгах
- Файлын нэрийг зөв бичсэн эсэхийг шалгах

### Асуудал 3: "relation planet_osm_line does not exist"

**Шийдэл:**
- OSM файл импорт хийгдсэн эсэхийг шалгах
- `osm2pgsql` амжилттай дууссан эсэхийг шалгах

### Асуудал 4: Топологи үүсгэхэд удаан хугацаа шаардагдана

**Шийдэл:**
- Том файлд tolerance утгыг нэмэгдүүлэх (жишээ: 0.001)
- Эсвэл хүлээх (том файлд цаг хугацаа шаардагдана)

## Дараагийн алхмууд

1. **Бодит координат ашиглах:** Frontend дээр бодит газрын зураг ашиглах
2. **Бусад тээврийн хэрэгсэл:** Машин, дугуй, алхах гэх мэт
3. **Real-time traffic:** Тээврийн хөдөлгөөний мэдээлэл нэгтгэх
4. **Олон цэгээс routing:** TSP (Traveling Salesman Problem)


