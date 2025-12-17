"""
Flask API for pgRouting - Богино зам олох
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
import os

app = Flask(__name__)
CORS(app)

# Database connection
# Try to detect if we're in Docker or local
# Default: try Docker container name first, fallback to localhost
def get_database_url():
    """Get database URL, trying Docker first, then localhost"""
    if os.getenv('DATABASE_URL'):
        return os.getenv('DATABASE_URL')
    
    # Try Docker container name first (only works inside Docker network)
    # For local development, use 127.0.0.1:5433 (Docker port mapping)
    try:
        import socket
        # Try to resolve Docker container name
        socket.gethostbyname('postgis_gis')
        # If we can resolve it, we're probably in Docker
        return 'postgresql://gisuser:gispass@postgis_gis:5432/gisdb'
    except (socket.gaierror, OSError):
        # Can't resolve Docker name, use 127.0.0.1:5433 (Docker maps container 5432 to host 5433)
        return 'postgresql://gisuser:gispass@127.0.0.1:5433/gisdb'
    except:
        # Any other error, default to 127.0.0.1:5433
        return 'postgresql://gisuser:gispass@127.0.0.1:5433/gisdb'

DATABASE_URL = get_database_url()

def get_db_connection():
    """Database холболт үүсгэх"""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

@app.route('/')
def index():
    """Үндсэн хуудас"""
    return jsonify({
        "message": "pgRouting API",
        "endpoints": {
            "/route": "POST - Зам олох (start_lat, start_lon, end_lat, end_lon)",
            "/nearest_node": "POST - Хамгийн ойр зангилаа олох (lat, lon)",
            "/health": "GET - API статус шалгах"
        }
    })

@app.route('/health')
def health():
    """API статус шалгах"""
    conn = get_db_connection()
    if conn:
        conn.close()
        return jsonify({"status": "healthy", "database": "connected"})
    return jsonify({"status": "unhealthy", "database": "disconnected"}), 500

@app.route('/nearest_node', methods=['POST'])
def find_nearest_node():
    """Өгөгдсөн цэгээс хамгийн ойр зангилаа олох"""
    try:
        data = request.json
        lat = float(data.get('lat'))
        lon = float(data.get('lon'))
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Хамгийн ойр зангилаа олох
        query = """
            SELECT 
                id,
                ST_X(the_geom) as lon,
                ST_Y(the_geom) as lat,
                ST_Distance(
                    ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography,
                    the_geom::geography
                ) as distance
            FROM roads_vertices_pgr
            ORDER BY distance
            LIMIT 1
        """
        
        cur.execute(query, (lon, lat))
        result = cur.fetchone()
        
        cur.close()
        conn.close()
        
        if result:
            return jsonify({
                "node_id": result['id'],
                "lat": float(result['lat']),
                "lon": float(result['lon']),
                "distance": float(result['distance'])
            })
        else:
            return jsonify({"error": "No nodes found"}), 404
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/route', methods=['POST'])
def find_route():
    """Гэрээсээ сургууль хүртэлх замыг олох"""
    try:
        data = request.json
        start_lat = float(data.get('start_lat'))
        start_lon = float(data.get('start_lon'))
        end_lat = float(data.get('end_lat'))
        end_lon = float(data.get('end_lon'))
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Эхлэх цэгийн хамгийн ойр зангилаа
        query_start = """
            SELECT id
            FROM roads_vertices_pgr
            ORDER BY ST_Distance(
                ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography,
                the_geom::geography
            )
            LIMIT 1
        """
        cur.execute(query_start, (start_lon, start_lat))
        start_node = cur.fetchone()
        
        if not start_node:
            return jsonify({"error": "Start node not found"}), 404
        
        # Төгсгөлийн цэгийн хамгийн ойр зангилаа
        query_end = """
            SELECT id
            FROM roads_vertices_pgr
            ORDER BY ST_Distance(
                ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography,
                the_geom::geography
            )
            LIMIT 1
        """
        cur.execute(query_end, (end_lon, end_lat))
        end_node = cur.fetchone()
        
        if not end_node:
            return jsonify({"error": "End node not found"}), 404
        
        start_node_id = start_node['id']
        end_node_id = end_node['id']
        
        # pgRouting Dijkstra ашиглан замыг олох
        # Check if reverse_cost column exists
        check_col_query = """
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='roads' AND column_name='reverse_cost'
        """
        cur.execute(check_col_query)
        has_reverse_cost = cur.fetchone() is not None
        
        if has_reverse_cost:
            edge_query = 'SELECT id, source, target, cost, reverse_cost FROM roads'
        else:
            edge_query = 'SELECT id, source, target, cost FROM roads'
        
        routing_query = f"""
            SELECT 
                r.id,
                r.name,
                ST_AsGeoJSON(r.geom) as geometry,
                path.seq,
                path.cost,
                r.length
            FROM pgr_dijkstra(
                '{edge_query}',
                %s,  -- Start node
                %s   -- End node
            ) as path
            JOIN roads r ON path.edge = r.id
            ORDER BY path.seq
        """
        
        cur.execute(routing_query, (start_node_id, end_node_id))
        route_segments = cur.fetchall()
        
        if not route_segments:
            return jsonify({
                "error": "No route found",
                "message": "Замын сүлжээнд эхлэх болон очих цэгийн хооронд зам олдсонгүй. Зангилаанууд: start_node={}, end_node={}".format(start_node_id, end_node_id),
                "start_node": start_node_id,
                "end_node": end_node_id
            }), 404
        
        # Бүх замыг нэг геометр болгож авах
        merge_query = f"""
            SELECT 
                ST_AsGeoJSON(ST_LineMerge(ST_Collect(r.geom))) as route_geom,
                SUM(r.cost) as total_cost,
                SUM(r.length) as total_length
            FROM pgr_dijkstra(
                '{edge_query}',
                %s,
                %s
            ) as path
            JOIN roads r ON path.edge = r.id
        """
        
        cur.execute(merge_query, (start_node_id, end_node_id))
        route_summary = cur.fetchone()
        
        cur.close()
        conn.close()
        
        # GeoJSON FeatureCollection үүсгэх
        features = []
        for segment in route_segments:
            import json
            features.append({
                "type": "Feature",
                "properties": {
                    "id": segment['id'],
                    "name": segment['name'],
                    "seq": segment['seq'],
                    "cost": float(segment['cost']),
                    "length": float(segment['length'])
                },
                "geometry": json.loads(segment['geometry'])
            })
        
        # Бүх замыг нэг Feature болгож нэмэх
        if route_summary and route_summary['route_geom']:
            import json
            features.append({
                "type": "Feature",
                "properties": {
                    "type": "full_route",
                    "total_cost": float(route_summary['total_cost']),
                    "total_length": float(route_summary['total_length'])
                },
                "geometry": json.loads(route_summary['route_geom'])
            })
        
        return jsonify({
            "type": "FeatureCollection",
            "features": features,
            "start_node": start_node_id,
            "end_node": end_node_id,
            "total_cost": float(route_summary['total_cost']) if route_summary else 0,
            "total_length": float(route_summary['total_length']) if route_summary else 0
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=True)



