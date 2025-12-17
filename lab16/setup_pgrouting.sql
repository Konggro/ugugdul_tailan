-- ============================================
-- pgRouting тохируулалт ба замын сүлжээ үүсгэх
-- ============================================

-- 1. pgRouting өргөтгөлийг идэвхжүүлэх
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgrouting;

-- 2. Замын сүлжээ хүснэгт үүсгэх
CREATE TABLE IF NOT EXISTS roads (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50),
    geom GEOMETRY(LineString, 4326),
    source INTEGER,
    target INTEGER,
    length FLOAT,
    cost FLOAT DEFAULT 1.0,
    reverse_cost FLOAT DEFAULT 1.0
);

-- Хуучин өгөгдөл байвал устгах
TRUNCATE TABLE roads;

-- 3. Өгөгдөл оруулах (Дөрвөлжин зам + товчлол)
INSERT INTO roads (name, geom) VALUES
('Road 1', ST_GeomFromText('LINESTRING(0 0, 10 0)', 4326)),      -- Доод
('Road 2', ST_GeomFromText('LINESTRING(10 0, 10 10)', 4326)),   -- Баруун
('Road 3', ST_GeomFromText('LINESTRING(10 10, 0 10)', 4326)),   -- Дээд
('Road 4', ST_GeomFromText('LINESTRING(0 10, 0 0)', 4326)),     -- Зүүн
('Shortcut', ST_GeomFromText('LINESTRING(0 0, 10 10)', 4326));  -- Диагональ товчлол

-- 4. Замын уртыг тооцох
UPDATE roads SET length = ST_Length(geom::geography) / 1000; -- км-ээр

-- 5. Топологи үүсгэх (0.001 нь хүлцэх алдаа буюу tolerance)
-- Энэ нь source, target багануудыг автоматаар дүүргэнэ
SELECT pgr_createTopology('roads', 0.001, 'geom', 'id');

-- 6. Cost тооцох (урт эсвэл бусад шалгуур)
UPDATE roads SET cost = length;
UPDATE roads SET reverse_cost = length;

-- 7. Хүснэгтийг шалгах
SELECT id, name, source, target, length, cost 
FROM roads 
ORDER BY id;

-- 8. Зангилаануудыг харах
SELECT * FROM roads_vertices_pgr ORDER BY id;




