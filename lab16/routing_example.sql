-- ============================================
-- pgRouting Dijkstra ашиглан богино зам олох
-- ============================================

-- 1. Хамгийн дөт зам хайх (Dijkstra)
-- 1-р зангилаа (0,0) цэгээс 3-р зангилаа (10,10) руу
SELECT * FROM pgr_dijkstra(
    'SELECT id, source, target, cost, reverse_cost FROM roads',
    1,  -- Эхлэх цэгийн Node ID (Start)
    3   -- Очих цэгийн Node ID (End)
);

-- 2. Үр дүнг геометр болгож харах
SELECT 
    r.id,
    r.name,
    r.geom,
    path.seq,
    path.cost
FROM pgr_dijkstra(
    'SELECT id, source, target, cost, reverse_cost FROM roads',
    1,  -- Start node
    3   -- End node
) as path
JOIN roads r ON path.edge = r.id
ORDER BY path.seq;

-- 3. Бүх замыг нэг геометр болгож авах
SELECT 
    ST_LineMerge(ST_Collect(r.geom)) as route_geom,
    SUM(r.cost) as total_cost,
    SUM(r.length) as total_length
FROM pgr_dijkstra(
    'SELECT id, source, target, cost, reverse_cost FROM roads',
    1,  -- Start node
    3   -- End node
) as path
JOIN roads r ON path.edge = r.id;

-- 4. Олон цэгээс хамгийн ойр зангилааг олох
-- Жишээ: (5, 5) цэгээс хамгийн ойр зангилаа
SELECT 
    id,
    the_geom,
    ST_Distance(
        ST_SetSRID(ST_MakePoint(5, 5), 4326)::geography,
        the_geom::geography
    ) as distance
FROM roads_vertices_pgr
ORDER BY distance
LIMIT 1;




