// Multi-modal routing (явган + автобус)
window.onload = function() {
    const map = L.map('map').setView([47.92, 106.92], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    let startPoint = null;
    let endPoint = null;
    let startMarker = null;
    let endMarker = null;
    let startBusStop = null;
    let endBusStop = null;
    let startBusStopMarker = null;
    let endBusStopMarker = null;
    let walkingRoute1 = null;  // Start to start bus stop
    let busRoute = null;        // Start bus stop to end bus stop
    let walkingRoute2 = null;  // End bus stop to end

    const WALKING_SPEED = 5; // km/h
    const BUS_SPEED = 20;    // km/h

    // Хугацаа тооцоолох функц
    function calculateTime(distanceKm, speedKmh) {
        return (distanceKm / speedKmh) * 60; // минутаар
    }

    // Зай тооцоолох функц (Haversine formula)
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Дэлхийн радиус (км)
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    // Хамгийн ойр автобусны буудлыг олох
    function findNearestBusStop(lat, lon, callback) {
        fetch(`http://localhost:5001/nearest?lat=${lat}&lon=${lon}`)
            .then(res => res.json())
            .then(data => {
                if (data.bus_stops && data.bus_stops.length > 0) {
                    // Turf.js ашиглан хамгийн ойрыг олох
                    const userPoint = turf.point([lon, lat]);
                    const stops = data.bus_stops.map(stop => 
                        turf.point([stop.lon, stop.lat], stop)
                    );
                    const fc = turf.featureCollection(stops);
                    const nearest = turf.nearestPoint(userPoint, fc);
                    callback(nearest.geometry.coordinates[1], nearest.geometry.coordinates[0]);
                } else {
                    alert("Ойролцоо автобусны буудал олдсонгүй.");
                }
            })
            .catch(error => {
                console.error('Алдаа:', error);
                alert("Автобусны буудлыг олоход алдаа гарлаа.");
            });
    }

    // Зам тооцоолох (OSRM API)
    function getRoute(start, end, callback) {
        const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
        
        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (data.routes && data.routes.length > 0) {
                    const route = data.routes[0];
                    callback(route.geometry, route.distance / 1000); // км-д хөрвүүлэх
                } else {
                    callback(null, 0);
                }
            })
            .catch(error => {
                console.error('Зам тооцоолох алдаа:', error);
                callback(null, 0);
            });
    }

    // Бүх замуудыг устгах
    function clearRoutes() {
        if (walkingRoute1) map.removeLayer(walkingRoute1);
        if (busRoute) map.removeLayer(busRoute);
        if (walkingRoute2) map.removeLayer(walkingRoute2);
        if (startBusStopMarker) map.removeLayer(startBusStopMarker);
        if (endBusStopMarker) map.removeLayer(endBusStopMarker);
        walkingRoute1 = null;
        busRoute = null;
        walkingRoute2 = null;
        startBusStopMarker = null;
        endBusStopMarker = null;
    }

    // Мэдээлэл харуулах
    function updateInfo(message) {
        document.getElementById('info-panel').innerHTML = '<p>' + message + '</p>';
    }

    // Хугацааны мэдээлэл харуулах
    function displayTimeInfo(times) {
        const timeInfoDiv = document.getElementById('time-info');
        const timeDetailsDiv = document.getElementById('time-details');
        
        let html = '';
        if (times.walking1 > 0) {
            html += `<div class="time-segment">
                <strong>Эхлэх цэг → Автобусны буудал:</strong> ${times.walking1.toFixed(1)} мин (явган)
            </div>`;
        }
        if (times.bus > 0) {
            html += `<div class="time-segment">
                <strong>Автобусны буудал → Автобусны буудал:</strong> ${times.bus.toFixed(1)} мин (автобус)
            </div>`;
        }
        if (times.walking2 > 0) {
            html += `<div class="time-segment">
                <strong>Автобусны буудал → Төгсөх цэг:</strong> ${times.walking2.toFixed(1)} мин (явган)
            </div>`;
        }
        if (times.total > 0) {
            html += `<div class="time-total">
                Нийт: ${times.total.toFixed(1)} мин
            </div>`;
        }
        
        timeDetailsDiv.innerHTML = html;
        timeInfoDiv.style.display = 'block';
    }

    // Бүх замуудыг тооцоолох
    function calculateAllRoutes() {
        if (!startPoint || !endPoint) return;

        clearRoutes();
        updateInfo('Замуудыг тооцоолж байна...');

        // 1. Эхлэх цэгээс хамгийн ойр автобусны буудлыг олох
        findNearestBusStop(startPoint.lat, startPoint.lng, function(busStop1Lat, busStop1Lon) {
            startBusStop = {lat: busStop1Lat, lng: busStop1Lon};
            
            // Эхлэх автобусны буудлыг marker-аар харуулах
            startBusStopMarker = L.marker([busStop1Lat, busStop1Lon], {
                icon: L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                })
            }).addTo(map).bindPopup('Эхлэх автобусны буудал');

            // 2. Төгсөх цэгээс хамгийн ойр автобусны буудлыг олох
            findNearestBusStop(endPoint.lat, endPoint.lng, function(busStop2Lat, busStop2Lon) {
                endBusStop = {lat: busStop2Lat, lng: busStop2Lon};
                
                // Төгсөх автобусны буудлыг marker-аар харуулах
                endBusStopMarker = L.marker([busStop2Lat, busStop2Lon], {
                    icon: L.icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowSize: [41, 41]
                    })
                }).addTo(map).bindPopup('Төгсөх автобусны буудал');

                // 3. Эхлэх цэгээс эхлэх автобусны буудал хүрэх зам (явган - тасархай)
                getRoute(startPoint, startBusStop, function(geometry1, distance1) {
                    if (geometry1) {
                        walkingRoute1 = L.geoJSON(geometry1, {
                            style: {
                                color: 'green',
                                weight: 4,
                                dashArray: '10, 10'
                            }
                        }).addTo(map);
                    }
                    const time1 = calculateTime(distance1 || calculateDistance(startPoint.lat, startPoint.lng, busStop1Lat, busStop1Lon), WALKING_SPEED);

                    // 4. Эхлэх автобусны буудлаас төгсөх автобусны буудал хүрэх зам (автобус - үргэлжилсэн)
                    getRoute(startBusStop, endBusStop, function(geometry2, distance2) {
                        if (geometry2) {
                            busRoute = L.geoJSON(geometry2, {
                                style: {
                                    color: 'blue',
                                    weight: 5
                                }
                            }).addTo(map);
                        }
                        const time2 = calculateTime(distance2 || calculateDistance(busStop1Lat, busStop1Lon, busStop2Lat, busStop2Lon), BUS_SPEED);

                        // 5. Төгсөх автобусны буудлаас төгсөх цэг хүрэх зам (явган - тасархай)
                        getRoute(endBusStop, endPoint, function(geometry3, distance3) {
                            if (geometry3) {
                                walkingRoute2 = L.geoJSON(geometry3, {
                                    style: {
                                        color: 'green',
                                        weight: 4,
                                        dashArray: '10, 10'
                                    }
                                }).addTo(map);
                            }
                            const time3 = calculateTime(distance3 || calculateDistance(busStop2Lat, busStop2Lon, endPoint.lat, endPoint.lng), WALKING_SPEED);

                            // Бүх замуудыг харуулах
                            const allLayers = [walkingRoute1, busRoute, walkingRoute2].filter(l => l !== null);
                            if (allLayers.length > 0) {
                                const group = new L.featureGroup(allLayers);
                                map.fitBounds(group.getBounds().pad(0.1));
                            }

                            // Хугацааны мэдээлэл харуулах
                            displayTimeInfo({
                                walking1: time1,
                                bus: time2,
                                walking2: time3,
                                total: time1 + time2 + time3
                            });

                            updateInfo('Замууд амжилттай тооцоологдлоо.');
                        });
                    });
                });
            });
        });
    }

    // Map дээр дарахад
    map.on('click', function(e) {
        if (!startPoint) {
            // Эхлэх цэг сонгох
            startPoint = e.latlng;
            if (startMarker) map.removeLayer(startMarker);
            startMarker = L.marker(e.latlng, {
                icon: L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                })
            }).addTo(map).bindPopup('Эхлэх цэг').openPopup();
            updateInfo('Одоо төгсөх цэгээ сонгоно уу.');
        } else if (!endPoint) {
            // Төгсөх цэг сонгох
            endPoint = e.latlng;
            if (endMarker) map.removeLayer(endMarker);
            endMarker = L.marker(e.latlng, {
                icon: L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                })
            }).addTo(map).bindPopup('Төгсөх цэг').openPopup();
            
            // Бүх замуудыг тооцоолох
            calculateAllRoutes();
        } else {
            // Шинэ эхлэх цэг сонгох (reset)
            map.removeLayer(startMarker);
            map.removeLayer(endMarker);
            clearRoutes();
            document.getElementById('time-info').style.display = 'none';
            
            startPoint = e.latlng;
            endPoint = null;
            startMarker = L.marker(e.latlng, {
                icon: L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                })
            }).addTo(map).bindPopup('Эхлэх цэг').openPopup();
            updateInfo('Одоо төгсөх цэгээ сонгоно уу.');
        }
    });
};




