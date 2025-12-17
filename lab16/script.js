// API Base URL
const API_BASE = 'http://localhost:5002';

// Газрын зураг үүсгэх
const map = L.map('map').setView([5, 5], 10);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Marker-үүд
let startMarker = null;
let endMarker = null;
let routeLayer = null;

// Газрын зураг дээр click хийх
let selectingStart = false;
let selectingEnd = false;

function setStartFromMap() {
    selectingStart = true;
    selectingEnd = false;
    document.getElementById('results').innerHTML = '<p style="color: blue;">Газрын зураг дээр эхлэх цэгээ сонгоно уу...</p>';
}

function setEndFromMap() {
    selectingEnd = true;
    selectingStart = false;
    document.getElementById('results').innerHTML = '<p style="color: blue;">Газрын зураг дээр очих цэгээ сонгоно уу...</p>';
}

map.on('click', function(e) {
    const lat = e.latlng.lat;
    const lon = e.latlng.lng;
    
    if (selectingStart) {
        document.getElementById('start_lat').value = lat.toFixed(4);
        document.getElementById('start_lon').value = lon.toFixed(4);
        
        if (startMarker) {
            map.removeLayer(startMarker);
        }
        
        startMarker = L.marker([lat, lon], {
            icon: L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41]
            })
        }).addTo(map)
        .bindPopup('Эхлэх цэг (Гэр)')
        .openPopup();
        
        selectingStart = false;
        document.getElementById('results').innerHTML = '<p>Эхлэх цэг сонгогдлоо. Одоо очих цэгээ сонгоно уу.</p>';
        
    } else if (selectingEnd) {
        document.getElementById('end_lat').value = lat.toFixed(4);
        document.getElementById('end_lon').value = lon.toFixed(4);
        
        if (endMarker) {
            map.removeLayer(endMarker);
        }
        
        endMarker = L.marker([lat, lon], {
            icon: L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41]
            })
        }).addTo(map)
        .bindPopup('Очих цэг (Сургууль)')
        .openPopup();
        
        selectingEnd = false;
        document.getElementById('results').innerHTML = '<p>Очих цэг сонгогдлоо. "Зам олох" товч дараад...</p>';
    }
});

// Зам олох функц
async function findRoute() {
    const startLat = parseFloat(document.getElementById('start_lat').value);
    const startLon = parseFloat(document.getElementById('start_lon').value);
    const endLat = parseFloat(document.getElementById('end_lat').value);
    const endLon = parseFloat(document.getElementById('end_lon').value);
    
    if (!startLat || !startLon || !endLat || !endLon) {
        document.getElementById('results').innerHTML = '<p style="color: red;">Бүх координат оруулна уу!</p>';
        return;
    }
    
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '<p>Зам хайж байна...</p>';
    
    // Хуучин route устгах
    if (routeLayer) {
        map.removeLayer(routeLayer);
    }
    
    try {
        const response = await fetch(`${API_BASE}/route`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                start_lat: startLat,
                start_lon: startLon,
                end_lat: endLat,
                end_lon: endLon
            })
        });
        
        if (!response.ok) {
            let errorMessage = 'API алдаа';
            try {
                const error = await response.json();
                errorMessage = error.error || error.message || `HTTP ${response.status}: ${response.statusText}`;
            } catch (e) {
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        
        // Замыг газрын зураг дээр харуулах
        routeLayer = L.geoJSON(data, {
            style: function(feature) {
                if (feature.properties.type === 'full_route') {
                    return {
                        color: '#ff0000',
                        weight: 5,
                        opacity: 0.8
                    };
                } else {
                    return {
                        color: '#3388ff',
                        weight: 3,
                        opacity: 0.6
                    };
                }
            },
            onEachFeature: function(feature, layer) {
                if (feature.properties.name) {
                    layer.bindPopup(feature.properties.name);
                }
            }
        }).addTo(map);
        
        // Газрын зургийг route руу тааруулах
        if (routeLayer.getBounds().isValid()) {
            map.fitBounds(routeLayer.getBounds());
        }
        
        // Үр дүн харуулах
        const fullRoute = data.features.find(f => f.properties.type === 'full_route');
        resultsDiv.innerHTML = `
            <h4>Зам олдлоо!</h4>
            <p><strong>Нийт урт:</strong> ${fullRoute ? fullRoute.properties.total_length.toFixed(2) : 'N/A'} км</p>
            <p><strong>Нийт зардал:</strong> ${fullRoute ? fullRoute.properties.total_cost.toFixed(2) : 'N/A'}</p>
            <p><strong>Зам:</strong> ${data.features.length - 1} сегмент</p>
            <p><small>Start Node: ${data.start_node}, End Node: ${data.end_node}</small></p>
        `;
        
    } catch (error) {
        console.error('Error:', error);
        let errorMsg = error.message;
        
        // Хэрэв "No route found" алдаа байвал илүү ойлгомжтой мэдээлэл харуулах
        if (errorMsg.includes('No route found')) {
            errorMsg = 'Замын сүлжээнд зам олдсонгүй. Эхлэх болон очих цэгүүдийг замын сүлжээний ойролцоо сонгоно уу.';
        }
        
        resultsDiv.innerHTML = `
            <p style="color: red;"><strong>Алдаа:</strong> ${errorMsg}</p>
            <p style="font-size: 12px; color: #666;">
                <strong>Зөвлөмж:</strong> Замын сүлжээ нь (0,0) - (10,10) бүс дотор байна. 
                Энэ бүс доторх цэгүүдийг сонгоно уу.
            </p>
        `;
    }
}

// Цэвэрлэх функц
function clearRoute() {
    if (routeLayer) {
        map.removeLayer(routeLayer);
        routeLayer = null;
    }
    if (startMarker) {
        map.removeLayer(startMarker);
        startMarker = null;
    }
    if (endMarker) {
        map.removeLayer(endMarker);
        endMarker = null;
    }
    document.getElementById('results').innerHTML = '<p>Цэвэрлэгдлээ.</p>';
}



