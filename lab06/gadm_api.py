from flask import Flask, jsonify
from flask_cors import CORS
from sqlalchemy import create_engine, text
import os

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# PostGIS connection string
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://gisuser:gispass@localhost:5432/gisdb')
engine = create_engine(DATABASE_URL)

@app.route("/gadm/aimags", methods=['GET'])
def get_aimags():
    """Аймгийн хилийг буцаах"""
    try:
        with engine.connect() as conn:
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
    try:
        with engine.connect() as conn:
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
    try:
        with engine.connect() as conn:
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
    search_term = request.args.get('q', '')
    
    try:
        with engine.connect() as conn:
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
    app.run(host="0.0.0.0", port=5000)

