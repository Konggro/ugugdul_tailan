from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import osmium, statistics
import uuid
import urllib.request
import urllib.parse
import json
from sqlalchemy import create_engine, text
import os

app = Flask(__name__)
# CORS-ийг бүх endpoint-д идэвхжүүлэх
CORS(app, resources={r"/*": {"origins": "*", "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"], "allow_headers": ["Content-Type"]}})

# CORS headers-ийг бүх response-д нэмэх (fallback)
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# GeoJSON өгөгдлийг санах ойд хадгалах
geojson_storage = {}

# OSM өгөгдлийг унших класс
class OSMHandler(osmium.SimpleHandler):
    def __init__(self):
        super(OSMHandler, self).__init__()
        self.nodes = []

    def node(self, n):
        self.nodes.append((n.location.lat, n.location.lon))

# Зам, барилгын өгөгдлийг цуглуулах класс
class WayCollector(osmium.SimpleHandler):
    def __init__(self):
        super().__init__()
        self.roads = []
        self.buildings = []  # Бүх барилгууд (layout-д зориулсан)
        self.buildings_shops = []  # Дэлгүүр, хоолны газар
        self.buildings_medical = []  # Эмнэлэг, эмийн сан
        self.buildings_schools = []  # Сургууль, цэцэрлэг
        self.buildings_other = []  # Бусад барилгууд

    def way(self, w):
        tags = dict(w.tags)
        nodes = [
            (n.location.lat, n.location.lon)
            for n in w.nodes
            if n.location and n.location.valid()
        ]
        
        if "highway" in tags and nodes:
            self.roads.append(nodes)
        
        if "building" in tags or "amenity" in tags:
            name = tags.get("name", "Нэргүй")
            building_data = {"nodes": nodes, "name": name}
            
            # Бүх барилгуудыг нэгтгэх (layout-д зориулсан)
            if nodes:
                self.buildings.append(nodes)
            
            amenity = tags.get("amenity", "")
            
            # Дэлгүүр, хоолны газар
            if amenity in ["restaurant", "cafe", "fast_food", "bar", "pub", "shop", "supermarket", "mall"]:
                self.buildings_shops.append(building_data)
            # Эмнэлэг, эмийн сан
            elif amenity in ["hospital", "clinic", "pharmacy", "doctors"]:
                self.buildings_medical.append(building_data)
            # Сургууль, цэцэрлэг
            elif amenity in ["school", "university", "college", "kindergarten"]:
                self.buildings_schools.append(building_data)
            # Бусад барилгууд
            elif nodes:
                self.buildings_other.append(building_data)

@app.route("/")
def index():
    handler = OSMHandler()
    handler.apply_file("osm/map.osm") # /osm фолдер дотроос уншина
    coords = handler.nodes[:100]  # эхний 100 цэгийг л харуулах

    if coords:
        # Бүх цэгүүдийн төв цэгийг тооцоолно
        lats = [c[0] for c in coords]
        lons = [c[1] for c in coords]
        center = (statistics.mean(lats), statistics.mean(lons))  # дундаж цэг
    else:
        center = (47.92, 106.92) # Улаанбаатарыг төв болгох

    return render_template("index.html", coords=coords, center=center)

@app.route("/layout")
def view_layout():
    # Lines ба polygons цуглуулах
    way_handler = WayCollector()
    way_handler.apply_file("osm/map.osm", locations=True)
    roads = way_handler.roads
    buildings = way_handler.buildings

    # Bounds тооцоолол (бүх өгөгдлөөс)
    all_coords = [pt for way in roads + buildings for pt in way if pt]
    if all_coords:
        lats = [lat for lat, lon in all_coords]
        lons = [lon for lat, lon in all_coords]
        bounds = [[min(lats), min(lons)], [max(lats), max(lons)]]
    else:
        bounds = [[47.91, 106.89], [47.93, 106.94]]

    return render_template("layout.html",
                           roads=roads,
                           buildings=buildings,
                           bounds=bounds)

@app.route("/gadm")
def view_gadm():
    """GADM map хуудас"""
    return render_template("gadm.html")

@app.route("/layer")
def view_layer():
    handler = WayCollector()
    handler.apply_file("osm/map.osm", locations = True) # /osm фолдер дотроос уншина

    roads = handler.roads
    buildings_shops = handler.buildings_shops
    buildings_medical = handler.buildings_medical
    buildings_schools = handler.buildings_schools
    buildings_other = handler.buildings_other

    # Бүх координатыг нэгтгэх
    all_buildings = buildings_shops + buildings_medical + buildings_schools + buildings_other
    all_coords = []
    for way in roads:
        all_coords.extend(way)
    for building in all_buildings:
        all_coords.extend(building["nodes"])

    if all_coords:
        lats = [lat for lat, lon in all_coords]
        lons = [lon for lat, lon in all_coords]
        bounds = [[min(lats), min(lons)], [max(lats), max(lons)]]
    else:
        bounds = [[47.91, 106.89], [47.93, 106.94]]  # fallback

    return render_template("layer.html",
                        roads=roads[:100],
                        buildings_shops=buildings_shops[:100],
                        buildings_medical=buildings_medical[:100],
                        buildings_schools=buildings_schools[:100],
                        buildings_other=buildings_other[:100],
                        bounds=bounds)

@app.route("/json", methods=['GET'])
def read_json():
    """Бүх GeoJSON өгөгдлийг унших"""
    # GeoJSON FeatureCollection форматтай буцаах
    features = list(geojson_storage.values())
    return jsonify({
        "type": "FeatureCollection",
        "features": features
    })

@app.route("/json", methods=['POST'])
def create_json():
    """Шинэ GeoJSON өгөгдөл үүсгэх"""
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No JSON data provided"}), 400
    
    # ID үүсгэх (хэрэв байхгүй бол)
    if "id" not in data.get("properties", {}):
        feature_id = str(uuid.uuid4())
        if "properties" not in data:
            data["properties"] = {}
        data["properties"]["id"] = feature_id
    else:
        feature_id = data["properties"]["id"]
    
    # Хадгалах
    geojson_storage[feature_id] = data
    
    return jsonify({
        "message": "GeoJSON created successfully",
        "id": feature_id,
        "data": data
    }), 201

@app.route("/json", methods=['PUT'])
def edit_json():
    """GeoJSON өгөгдөл засварлах"""
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No JSON data provided"}), 400
    
    # ID-г properties-оос авна
    feature_id = data.get("properties", {}).get("id")
    
    if not feature_id:
        return jsonify({"error": "ID not found in properties"}), 400
    
    if feature_id not in geojson_storage:
        return jsonify({"error": "Feature not found"}), 404
    
    # Засварлах
    geojson_storage[feature_id] = data
    
    return jsonify({
        "message": "GeoJSON updated successfully",
        "id": feature_id,
        "data": data
    })

@app.route("/json", methods=['DELETE'])
def delete_json():
    """GeoJSON өгөгдөл устгах"""
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No JSON data provided"}), 400
    
    # ID-г properties-оос авна
    feature_id = data.get("properties", {}).get("id")
    
    if not feature_id:
        return jsonify({"error": "ID not found in properties"}), 400
    
    if feature_id not in geojson_storage:
        return jsonify({"error": "Feature not found"}), 404
    
    # Устгах
    del geojson_storage[feature_id]
    
    return jsonify({
        "message": "GeoJSON deleted successfully",
        "id": feature_id
    })

@app.route("/nearest", methods=['GET'])
def find_nearest_bus_stops():
    """Өгөгдсөн цэгээс хамгийн ойр автобусны буудлуудыг олох"""
    lat = request.args.get('lat', type=float)
    lon = request.args.get('lon', type=float)
    
    if lat is None or lon is None:
        return jsonify({"error": "lat and lon parameters are required"}), 400
    
    # 1000 метр = ойролцоогоор 0.009 градус
    offset = 0.009
    min_lat = lat - offset
    max_lat = lat + offset
    min_lon = lon - offset
    max_lon = lon + offset
    
    # Overpass API query
    query = f"""
    [out:json];
    node["highway"="bus_stop"]({min_lat},{min_lon},{max_lat},{max_lon});
    out;
    """
    
    try:
        # Overpass API-д хүсэлт илгээх
        url = "https://overpass-api.de/api/interpreter"
        data = query.encode('utf-8')
        req = urllib.request.Request(url, data=data, method='POST')
        req.add_header('Content-Type', 'application/x-www-form-urlencoded')
        
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            
            # Автобусны буудлуудыг бэлтгэх
            bus_stops = []
            if 'elements' in result:
                for element in result['elements']:
                    if 'lat' in element and 'lon' in element:
                        bus_stops.append({
                            'lat': element['lat'],
                            'lon': element['lon'],
                            'tags': element.get('tags', {})
                        })
            
            return jsonify({
                "start_point": {"lat": lat, "lon": lon},
                "search_area": {
                    "min_lat": min_lat,
                    "max_lat": max_lat,
                    "min_lon": min_lon,
                    "max_lon": max_lon
                },
                "bus_stops": bus_stops,
                "count": len(bus_stops)
            })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# PostGIS connection for GADM data
# Connect to PostGIS container directly via container name
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://gisuser:gispass@postgis_gis:5432/gisdb')
try:
    db_engine = create_engine(DATABASE_URL)
except:
    db_engine = None

@app.route("/gadm/aimags", methods=['GET'])
def get_aimags():
    """Аймгийн хилийг буцаах"""
    if not db_engine:
        return jsonify({"error": "Database not configured"}), 500
    try:
        with db_engine.connect() as conn:
            # Check if table exists
            check_query = text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'gadm41_mng_1'
                );
            """)
            exists = conn.execute(check_query).scalar()
            
            if not exists:
                return jsonify({
                    "type": "FeatureCollection",
                    "features": [],
                    "message": "GADM data not imported yet. Please import gadm41_MNG_1.shp first."
                })
            
            query = text("""
                SELECT 
                    gid,
                    name_1 as aimag_name,
                    ST_AsGeoJSON(geom) as geometry
                FROM gadm41_mng_1
                ORDER BY name_1
            """)
            result = conn.execute(query)
            
            features = []
            for row in result:
                features.append({
                    "type": "Feature",
                    "properties": {
                        "gid": row.gid,
                        "aimag_name": row.aimag_name
                    },
                    "geometry": json.loads(row.geometry)
                })
            
            return jsonify({
                "type": "FeatureCollection",
                "features": features
            })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/gadm/sums", methods=['GET'])
def get_sums():
    """Аймаг, сумын хилийг буцаах"""
    if not db_engine:
        return jsonify({"error": "Database not configured"}), 500
    try:
        with db_engine.connect() as conn:
            # Check if table exists
            check_query = text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'gadm41_mng_2'
                );
            """)
            exists = conn.execute(check_query).scalar()
            
            if not exists:
                return jsonify({
                    "type": "FeatureCollection",
                    "features": [],
                    "message": "GADM data not imported yet. Please import gadm41_MNG_2.shp first."
                })
            
            query = text("""
                SELECT 
                    gid,
                    name_1 as aimag_name,
                    name_2 as sum_name,
                    ST_AsGeoJSON(geom) as geometry,
                    ST_X(ST_Centroid(geom)) as lon,
                    ST_Y(ST_Centroid(geom)) as lat
                FROM gadm41_mng_2
                ORDER BY name_1, name_2
            """)
            result = conn.execute(query)
            
            features = []
            for row in result:
                features.append({
                    "type": "Feature",
                    "properties": {
                        "gid": row.gid,
                        "aimag_name": row.aimag_name,
                        "sum_name": row.sum_name,
                        "lon": float(row.lon),
                        "lat": float(row.lat)
                    },
                    "geometry": json.loads(row.geometry)
                })
            
            return jsonify({
                "type": "FeatureCollection",
                "features": features
            })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/gadm/sum/<int:gid>", methods=['GET'])
def get_sum_by_id(gid):
    """Тодорхой сумын мэдээллийг буцаах"""
    if not db_engine:
        return jsonify({"error": "Database not configured"}), 500
    try:
        with db_engine.connect() as conn:
            query = text("""
                SELECT 
                    gid,
                    name_1 as aimag_name,
                    name_2 as sum_name,
                    ST_AsGeoJSON(geom) as geometry,
                    ST_X(ST_Centroid(geom)) as lon,
                    ST_Y(ST_Centroid(geom)) as lat
                FROM gadm41_mng_2
                WHERE gid = :gid
            """)
            result = conn.execute(query, {"gid": gid})
            row = result.fetchone()
            
            if row:
                return jsonify({
                    "type": "Feature",
                    "properties": {
                        "gid": row.gid,
                        "aimag_name": row.aimag_name,
                        "sum_name": row.sum_name,
                        "lon": float(row.lon),
                        "lat": float(row.lat)
                    },
                    "geometry": json.loads(row.geometry)
                })
            else:
                return jsonify({"error": "Sum not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/gadm/search", methods=['GET'])
def search_sums():
    """Аймаг, сумын нэрээр хайх"""
    if not db_engine:
        return jsonify({"error": "Database not configured"}), 500
    search_term = request.args.get('q', '')
    
    try:
        with db_engine.connect() as conn:
            query = text("""
                SELECT 
                    gid,
                    name_1 as aimag_name,
                    name_2 as sum_name,
                    ST_X(ST_Centroid(geom)) as lon,
                    ST_Y(ST_Centroid(geom)) as lat
                FROM gadm41_mng_2
                WHERE name_1 ILIKE :search OR name_2 ILIKE :search
                ORDER BY name_1, name_2
                LIMIT 50
            """)
            result = conn.execute(query, {"search": f"%{search_term}%"})
            
            results = []
            for row in result:
                results.append({
                    "gid": row.gid,
                    "aimag_name": row.aimag_name,
                    "sum_name": row.sum_name,
                    "display_name": f"{row.aimag_name} - {row.sum_name}",
                    "lon": float(row.lon),
                    "lat": float(row.lat)
                })
            
            return jsonify({"results": results})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.getenv('PORT', 5000))
    app.run(host="0.0.0.0", port=port)

