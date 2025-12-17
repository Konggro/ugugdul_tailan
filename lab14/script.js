// --- 1. ТОХИРУУЛГА ---
// OpenRouteService API Key
// openrouteservice.org сайтад бүртгүүлэн API key авах хэрэгтэй
const API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjIwODAzMGUzMTI1OTQ3ZjU5ZDY0ZjJlMmEwMGU0NGNjIiwiaCI6Im11cm11cjY0In0=';

const startPoint = [106.917572, 47.918466]; // Сүхбаатарын талбай (Lon, Lat)

// Газрын зураг үүсгэх
const map = L.map('map').setView([startPoint[1], startPoint[0]], 14);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Эхлэх цэгийг тэмдэглэх
L.marker([startPoint[1], startPoint[0]])
 .addTo(map)
 .bindPopup("Эхлэх цэг: Сүхбаатарын талбай")
 .openPopup();

// --- 2. БОДИТ СУРГУУЛИУДЫН ӨГӨГДӨЛ ТАТАХ (Overpass API) ---
// OpenStreetMap-аас бодит сургуулиудын өгөгдөл татах
let realSchools = {
    "type": "FeatureCollection",
    "features": []
};

let schoolsLayer = null;

// Overpass API ашиглан сургуулиудыг татах
async function loadRealSchools() {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = "Сургуулиудын өгөгдөл татаж байна...";
    
    // Сүхбаатарын талбайг тойроод 5км радиустай бүс доторх сургуулиуд
    // Overpass QL query
    const overpassQuery = `
        [out:json][timeout:25];
        (
          node["amenity"="school"](around:5000, ${startPoint[1]}, ${startPoint[0]});
          node["amenity"="university"](around:5000, ${startPoint[1]}, ${startPoint[0]});
          node["amenity"="college"](around:5000, ${startPoint[1]}, ${startPoint[0]});
          way["amenity"="school"](around:5000, ${startPoint[1]}, ${startPoint[0]});
          way["amenity"="university"](around:5000, ${startPoint[1]}, ${startPoint[0]});
          way["amenity"="college"](around:5000, ${startPoint[1]}, ${startPoint[0]});
        );
        out center;
    `;

    try {
        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: overpassQuery
        });

        if (!response.ok) {
            throw new Error("Overpass API алдаа: " + response.statusText);
        }

        const data = await response.json();
        
        // Overpass API-ийн хариуг GeoJSON болгон хөрвүүлэх
        realSchools.features = [];
        
        data.elements.forEach(element => {
            let lat, lon, name;
            
            if (element.type === 'node') {
                lat = element.lat;
                lon = element.lon;
            } else if (element.type === 'way' && element.center) {
                lat = element.center.lat;
                lon = element.center.lon;
            } else {
                return; // Skip if no coordinates
            }
            
            // Нэрийг олох (Mongolian эсвэл English)
            name = element.tags['name:mn'] || 
                   element.tags['name'] || 
                   element.tags['name:en'] || 
                   'Сургууль';
            
            // Сургуулийн төрөл
            const type = element.tags['amenity'] || 'school';
            const fullName = `${name} (${type})`;
            
            realSchools.features.push(turf.point([lon, lat], {
                name: fullName,
                type: type,
                osm_id: element.id
            }));
        });

        // Хуучин layer байвал устгах
        if (schoolsLayer) {
            map.removeLayer(schoolsLayer);
        }

        // Сургуулиудыг газрын зураг дээр цэнхэр цэгээр харуулах
        schoolsLayer = L.geoJSON(realSchools, {
            pointToLayer: function (feature, latlng) {
                return L.circleMarker(latlng, {
                    radius: 6,
                    fillColor: "#0078A8",
                    color: "#fff",
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8
                });
            },
            onEachFeature: function(feature, layer) {
                layer.bindPopup(feature.properties.name);
            }
        }).addTo(map);

        resultsDiv.innerHTML = `<p>${realSchools.features.length} сургууль олдлоо. "Тооцоолох & Анализ хийх" товч дараад үргэлжлүүлнэ үү.</p>`;

    } catch (error) {
        console.error("Сургуулиудын өгөгдөл татахад алдаа гарлаа:", error);
        resultsDiv.innerHTML = `<p style="color: red;">Сургуулиудын өгөгдөл татахад алдаа гарлаа: ${error.message}</p>`;
    }
}

// Сургуулиудыг автоматаар ачаалах
loadRealSchools();



// --- 3. ISOCHRONE ТООЦООЛОХ ФУНКЦ ---
async function calculateIsochrones() {

    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = "Тооцоолж байна...";

    // API Request Body
    // range: секундээр (300 = 5 минут, 600 = 10 минут, 900 = 15 минут)
    let body = {
        "locations": [startPoint], // [Lon, Lat]
        "range": [300, 600, 900],   // 5, 10, 15 минут (секундээр)
        "range_type": "time",
        "attributes": ["area"]      // Талбайн хэмжээг буцаах
    };

    try {
        // Fetch Request to OpenRouteService API
        let response = await fetch('https://api.openrouteservice.org/v2/isochrones/foot-walking', {
            method: 'POST',
            headers: {
                'Authorization': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error("API Key буруу эсвэл байхгүй байна. OpenRouteService.org-оос API key авах хэрэгтэй.");
            }
            throw new Error("API Error: " + response.statusText);
        }

        let data = await response.json();
        
        // Хуучин Isochrone давхарга байвал устгах (давхардахаас сэргийлэх)
        map.eachLayer((layer) => {
            if (layer.options.isIsochrone) {
                map.removeLayer(layer);
            }
        });

        // --- 4. LEAFLET ДЭЭР ДҮРСЛЭХ ---
        // ORS нь том Polygon-оо түрүүлж өгдөг тул давхарлаж зурахад 
        // жижиг нь дарагдчихдаг. Тиймээс эсрэгээр нь эрэмбэлнэ эсвэл style хийнэ.
        
        // Style тохируулах функц
        function getStyle(feature) {
            let range = feature.properties.value; // секундээр ирнэ (300, 600, 900)
            let color = 'red'; // Default 15 min
            if (range <= 300) color = 'green';
            else if (range <= 600) color = 'yellow';
            
            return {
                fillColor: color,
                weight: 2,
                opacity: 1,
                color: 'white',  // Хүрээний өнгө
                dashArray: '3',
                fillOpacity: 0.4,
                isIsochrone: true // Дараа нь таньж устгахад хэрэгтэй
            };
        }

        // Газрын зурагт нэмэх
        let isoLayer = L.geoJSON(data, {
            style: getStyle
        }).addTo(map);
        
        // Газрын зургийг Isochrone руу тааруулж томруулах
        map.fitBounds(isoLayer.getBounds());

        // --- 5. TURF.JS АНАЛИЗ ---
        // Polygon бүрийн дотор хэдэн сургууль байгааг тоолох
        // Функц: turf.pointsWithinPolygon(points, polygon)
        // points: OSM-аас татсан сургуулиудын жагсаалт (GeoJSON)
        // polygon: 5, 10, 15 минутын Isochrone
        
        let statsHTML = "<h3>Анализын үр дүн:</h3>";
        
        // Хялбар болгох үүднээс эрэмбэлэх:
        data.features.sort((a, b) => a.properties.value - b.properties.value);
        // Одоо [5мин, 10мин, 15мин] гэсэн дараалалтай болно.

        data.features.forEach(function(polygonFeature) {
            let minutes = polygonFeature.properties.value / 60; // Секундийг минут болгох
            
            // Turf.js ашиглан тоолох: polygon дотор хэдэн сургууль байгааг олох
            // Бодит сургуулиудын өгөгдөл ашиглах
            let ptsWithin = turf.pointsWithinPolygon(realSchools, polygonFeature);
            let count = ptsWithin.features.length;

            let colorName = minutes === 5 ? "Ногоон" : (minutes === 10 ? "Шар" : "Улаан");

            statsHTML += `
                <div class="stat-item">
                    ${minutes} минутын бүс (${colorName}): <br>
                    👉 ${count} сургууль хамрагдаж байна.
                </div>
            `;
        });

        resultsDiv.innerHTML = statsHTML;

    } catch (error) {
        console.error(error);
        resultsDiv.innerHTML = "<p style='color: red;'>Алдаа гарлаа: " + error.message + "</p>";
    }
}

