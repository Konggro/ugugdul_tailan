// --- 1. ТОХИРУУЛГА ---
const API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjIwODAzMGUzMTI1OTQ3ZjU5ZDY0ZjJlMmEwMGU0NGNjIiwiaCI6Im11cm11cjY0In0=';

// Хорооллуудын координат
const horoolols = {
    "36": { name: "36-р хороолол", center: [106.88, 47.90] },
    "15": { name: "15-р хороолол", center: [106.92, 47.92] },
    "1": { name: "1-р хороолол", center: [106.90, 47.91] },
    "bayangol": { name: "Баянгол дүүрэг", center: [106.95, 47.93] }
};

let currentCenter = horoolols["36"].center; // Default: 36-р хороолол

// Газрын зураг үүсгэх
const map = L.map('map').setView([currentCenter[1], currentCenter[0]], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// --- 2. LAYER-ҮҮД ---
let isochroneLayer = null;
let heatmapLayer = null;
let schoolsCluster = null;
let pharmaciesCluster = null;

// --- 3. ISOCHRONE ТООЦООЛОХ ---
async function calculateIsochrone() {
    const select = document.getElementById('horoololSelect');
    const selectedHoroolol = horoolols[select.value];
    currentCenter = selectedHoroolol.center;
    
    // Газрын зургийг шинэчлэх
    map.setView([currentCenter[1], currentCenter[0]], 13);
    
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = "15 минутын Isochrone тооцоолж байна...";

    // Хуучин Isochrone устгах
    if (isochroneLayer) {
        map.removeLayer(isochroneLayer);
    }

    // OpenRouteService API Request
    let body = {
        "locations": [currentCenter], // [Lon, Lat]
        "range": [900], // 15 минут = 900 секунд
        "range_type": "time",
        "attributes": ["area"]
    };

    try {
        let response = await fetch('https://api.openrouteservice.org/v2/isochrones/foot-walking', {
            method: 'POST',
            headers: {
                'Authorization': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error("API Error: " + response.statusText);
        }

        let data = await response.json();

        // Isochrone давхарга нэмэх
        isochroneLayer = L.geoJSON(data, {
            style: {
                fillColor: '#3388ff',
                weight: 3,
                opacity: 1,
                color: '#0066cc',
                dashArray: '5, 10',
                fillOpacity: 0.2
            }
        }).addTo(map);

        map.fitBounds(isochroneLayer.getBounds());

        // Анализ хийх
        analyzeAccessibility(data.features[0]);

    } catch (error) {
        console.error(error);
        document.getElementById('results').innerHTML = "Алдаа: " + error.message;
    }
}

// --- 4. АНАЛИЗ: 15 МИНУТЫН ХОТ ---
async function analyzeAccessibility(isochronePolygon) {
    const resultsDiv = document.getElementById('results');
    
    // ЕБС-ууд татах
    const schools = await loadSchools();
    const schoolsWithin = turf.pointsWithinPolygon(schools, isochronePolygon);
    
    // Эмийн сангууд татах
    const pharmacies = await loadPharmacies();
    const pharmaciesWithin = turf.pointsWithinPolygon(pharmacies, isochronePolygon);
    
    // Авто ослууд татах (heatmap-д ашиглах)
    const accidents = await loadAccidents();
    const accidentsWithin = turf.pointsWithinPolygon(accidents, isochronePolygon);
    
    // Үр дүн харуулах
    resultsDiv.innerHTML = `
        <h4>${document.getElementById('horoololSelect').selectedOptions[0].text}</h4>
        <p><strong>15 минутын бүс дотор:</strong></p>
        <ul>
            <li>📚 ЕБС: ${schoolsWithin.features.length}</li>
            <li>💊 Эмийн сан: ${pharmaciesWithin.features.length}</li>
            <li>⚠️ Авто осол: ${accidentsWithin.features.length}</li>
        </ul>
        <p><small>15 минутын хот: ${schoolsWithin.features.length > 0 && pharmaciesWithin.features.length > 0 ? '✅ Хангаж байна' : '❌ Хангахгүй байна'}</small></p>
    `;
}

// --- 5. ЕБС-УУД ТАТАХ (Clustering) ---
async function loadSchools() {
    const center = currentCenter;
    const overpassQuery = `
        [out:json][timeout:25];
        (
          node["amenity"="school"](around:2000, ${center[1]}, ${center[0]});
          node["amenity"="university"](around:2000, ${center[1]}, ${center[0]});
          way["amenity"="school"](around:2000, ${center[1]}, ${center[0]});
          way["amenity"="university"](around:2000, ${center[1]}, ${center[0]});
        );
        out center;
    `;

    try {
        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: overpassQuery
        });
        const data = await response.json();
        
        const schools = {
            "type": "FeatureCollection",
            "features": []
        };

        data.elements.forEach(element => {
            let lat, lon, name;
            if (element.type === 'node') {
                lat = element.lat;
                lon = element.lon;
            } else if (element.center) {
                lat = element.center.lat;
                lon = element.center.lon;
            } else return;

            name = element.tags['name:mn'] || element.tags['name'] || 'ЕБС';
            schools.features.push(turf.point([lon, lat], { name: name }));
        });

        return schools;
    } catch (error) {
        console.error("ЕБС-ууд татахад алдаа:", error);
        return { type: "FeatureCollection", features: [] };
    }
}

// --- 6. ЭМИЙН САНГУУД ТАТАХ (Clustering) ---
async function loadPharmacies() {
    const center = currentCenter;
    const overpassQuery = `
        [out:json][timeout:25];
        (
          node["amenity"="pharmacy"](around:2000, ${center[1]}, ${center[0]});
          way["amenity"="pharmacy"](around:2000, ${center[1]}, ${center[0]});
        );
        out center;
    `;

    try {
        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: overpassQuery
        });
        const data = await response.json();
        
        const pharmacies = {
            "type": "FeatureCollection",
            "features": []
        };

        data.elements.forEach(element => {
            let lat, lon, name;
            if (element.type === 'node') {
                lat = element.lat;
                lon = element.lon;
            } else if (element.center) {
                lat = element.center.lat;
                lon = element.center.lon;
            } else return;

            name = element.tags['name:mn'] || element.tags['name'] || 'Эмийн сан';
            pharmacies.features.push(turf.point([lon, lat], { name: name }));
        });

        return pharmacies;
    } catch (error) {
        console.error("Эмийн сангууд татахад алдаа:", error);
        return { type: "FeatureCollection", features: [] };
    }
}

// --- 7. АВТО ОСЛУУД ТАТАХ (Heatmap) ---
async function loadAccidents() {
    // Бодит байдал дээр авто ослын өгөгдөл байхгүй тул simulation
    // Бодит өгөгдөл авахын тулд OpenStreetMap-д "traffic_accident" tag ашиглах эсвэл
    // бусад өгөгдлийн сангаас татах хэрэгтэй
    
    const center = currentCenter;
    const accidents = {
        "type": "FeatureCollection",
        "features": []
    };

    // Санамсаргүй авто ослын цэгүүд үүсгэх (simulation)
    for (let i = 0; i < 30; i++) {
        const lon = center[0] + (Math.random() - 0.5) * 0.03;
        const lat = center[1] + (Math.random() - 0.5) * 0.02;
        accidents.features.push(turf.point([lon, lat], {
            severity: Math.random() // 0.0 - 1.0
        }));
    }

    return accidents;
}

// --- 8. HEATMAP TOGGLE ---
async function toggleHeatmap() {
    const show = document.getElementById('showHeatmap').checked;
    
    if (show) {
        const accidents = await loadAccidents();
        
        // Heatmap өгөгдөл бэлтгэх: [lat, lng, intensity]
        const heatData = accidents.features.map(feature => {
            const [lon, lat] = feature.geometry.coordinates;
            const intensity = feature.properties.severity || 0.5;
            return [lat, lon, intensity];
        });

        heatmapLayer = L.heatLayer(heatData, {
            radius: 25,  // Нөлөөллийн радиус (pixel)
            blur: 15,    // Бүдэгрүүлэлт
            maxZoom: 17,
            gradient: {
                0.0: 'blue',
                0.5: 'yellow',
                1.0: 'red'
            }
        }).addTo(map);
    } else {
        if (heatmapLayer) {
            map.removeLayer(heatmapLayer);
            heatmapLayer = null;
        }
    }
}

// --- 9. CLUSTERING TOGGLE ---
async function toggleClusters() {
    const show = document.getElementById('showClusters').checked;
    
    if (show) {
        if (schoolsCluster) {
            map.removeLayer(schoolsCluster);
        }
        
        schoolsCluster = L.markerClusterGroup();
        const schools = await loadSchools();
        
        schools.features.forEach(feature => {
            const [lon, lat] = feature.geometry.coordinates;
            const marker = L.marker([lat, lon])
                .bindPopup(feature.properties.name || 'ЕБС');
            schoolsCluster.addLayer(marker);
        });
        
        map.addLayer(schoolsCluster);
    } else {
        if (schoolsCluster) {
            map.removeLayer(schoolsCluster);
            schoolsCluster = null;
        }
    }
}

async function togglePharmacies() {
    const show = document.getElementById('showPharmacies').checked;
    
    if (show) {
        if (pharmaciesCluster) {
            map.removeLayer(pharmaciesCluster);
        }
        
        pharmaciesCluster = L.markerClusterGroup();
        const pharmacies = await loadPharmacies();
        
        pharmacies.features.forEach(feature => {
            const [lon, lat] = feature.geometry.coordinates;
            const marker = L.marker([lat, lon], {
                icon: L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41]
                })
            }).bindPopup(feature.properties.name || 'Эмийн сан');
            pharmaciesCluster.addLayer(marker);
        });
        
        map.addLayer(pharmaciesCluster);
    } else {
        if (pharmaciesCluster) {
            map.removeLayer(pharmaciesCluster);
            pharmaciesCluster = null;
        }
    }
}

// Эхлэх: ЕБС-уудыг автоматаар харуулах
toggleClusters();




