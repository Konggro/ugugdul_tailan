(function() {
  // Анхдагч төв (ШУТИС орчим)
  var initialLatLng = [47.92, 106.92];
  var initialZoom = 16;

  // ШУТИС хичээлийн байрнуудын оройлцоо буудлын координатууд (ойролцоо)
  var buildingEntrances = {
    "1": [47.9205, 106.9180],  // Хичээлийн 1-р байр
    "2": [47.9215, 106.9190],  // Хичээлийн 2-р байр
    "3": [47.9225, 106.9200],  // Хичээлийн 3-р байр
    "4": [47.9235, 106.9210],  // Хичээлийн 4-р байр
    "5": [47.9245, 106.9220],  // Хичээлийн 5-р байр
    "6": [47.9255, 106.9230]   // Хичээлийн 6-р байр
  };

  // Инициализаци: map
  var map = null;
  var startMarker = null;
  var busStopMarkers = L.layerGroup();
  var searchAreaLayer = null;

  function initMap() {
    var mapContainer = document.getElementById('map');
    if (!mapContainer) {
      console.error('Map container not found');
      return null;
    }

    var m = L.map('map', {
      center: initialLatLng,
      zoom: initialZoom,
      zoomControl: true
    });

    // OSM tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(m);

    // Map-ийн хэмжээг дахин тооцоолох (flexbox layout-д шаардлагатай)
    // Энэ нь container-ийн хэмжээ бүрэн тооцоологдсоны дараа хийгдэнэ
    setTimeout(function() {
      m.invalidateSize();
    }, 100);

    // Map дээр дарахад хамгийн ойр автобусны буудлыг олох
    m.on('click', function(e) {
      var lat = e.latlng.lat;
      var lon = e.latlng.lng;
      
      // API-аас хамгийн ойр автобусны буудлуудыг авах (lab06 прожектийн API)
      fetch('http://localhost:5001/nearest?lat=' + lat + '&lon=' + lon)
        .then(res => res.json())
        .then(data => {
          // Хуучин marker-уудыг устгах
          if (startMarker) {
            m.removeLayer(startMarker);
          }
          m.removeLayer(busStopMarkers);
          busStopMarkers.clearLayers();
          if (searchAreaLayer) {
            m.removeLayer(searchAreaLayer);
          }

          // Эхлэх цэгийг улаан marker-аар харуулах
          startMarker = L.marker([lat, lon], {
            icon: L.icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            })
          }).addTo(m).bindPopup('Эхлэх цэг');

          // Хайх талбайг харуулах (1000м x 1000м)
          var searchArea = turf.buffer(turf.point([lon, lat]), 1000, {units: 'meters'});
          searchAreaLayer = L.geoJSON(searchArea, {
            style: {
              color: '#ff7800',
              weight: 2,
              fillColor: '#ff7800',
              fillOpacity: 0.1
            }
          }).addTo(m);

          // Автобусны буудлуудыг хөх marker-аар харуулах
          if (data.bus_stops && data.bus_stops.length > 0) {
            data.bus_stops.forEach(function(stop) {
              var marker = L.marker([stop.lat, stop.lon], {
                icon: L.icon({
                  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
                  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                  popupAnchor: [1, -34],
                  shadowSize: [41, 41]
                })
              }).bindPopup('Автобусны буудал');
              busStopMarkers.addLayer(marker);
            });
            busStopMarkers.addTo(m);
          }

          // Газрын зургийг эхлэх цэг дээр төвлөрүүлэх
          m.setView([lat, lon], 15);
        })
        .catch(error => {
          console.error('Алдаа гарлаа:', error);
        });
    });

    return m;
  }

  // Хайх талбайг тооцоолох (1000м x 1000м)
  function calculateSearchBounds(lat, lon) {
    // 1000 метр = ойролцоогоор 0.009 градус (latitude)
    var offset = 0.009;
    return {
      minLat: lat - offset,
      maxLat: lat + offset,
      minLon: lon - offset,
      maxLon: lon + offset
    };
  }

  // Автобусны буудлуудыг олох
  function findBusStops(lat, lon) {
    // Хуучин marker-уудыг устгах
    if (startMarker) {
      map.removeLayer(startMarker);
    }
    map.removeLayer(busStopMarkers);
    busStopMarkers.clearLayers();
    if (searchAreaLayer) {
      map.removeLayer(searchAreaLayer);
    }

    // Эхлэх цэгийг улаан marker-аар харуулах
    startMarker = L.marker([lat, lon], {
      icon: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      })
    }).addTo(map).bindPopup('Эхлэх цэг');

    // Хайх талбайг тооцоолох
    var bounds = calculateSearchBounds(lat, lon);
    
    // Хайх талбайг харуулах
    var searchArea = turf.buffer(turf.point([lon, lat]), 1000, {units: 'meters'});
    searchAreaLayer = L.geoJSON(searchArea, {
      style: {
        color: '#ff7800',
        weight: 2,
        fillColor: '#ff7800',
        fillOpacity: 0.1
      }
    }).addTo(map);

    // Overpass API query
    const query = `
      [out:json];
      node["highway"="bus_stop"](${bounds.minLat},${bounds.minLon},${bounds.maxLat},${bounds.maxLon});
      out;
    `;

    fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query
    })
    .then(res => res.json())
    .then(data => {
      if (data.elements && data.elements.length > 0) {
        // Автобусны буудлуудыг хөх marker-аар харуулах
        data.elements.forEach(function(el) {
          var marker = L.marker([el.lat, el.lon], {
            icon: L.icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            })
          }).bindPopup('Автобусны буудал');
          busStopMarkers.addLayer(marker);
        });
        busStopMarkers.addTo(map);
      }
    })
    .catch(error => {
      console.error('Алдаа гарлаа:', error);
    });

    // Газрын зургийг эхлэх цэг дээр төвлөрүүлэх
    map.setView([lat, lon], 15);
  }

  // Main: hookup events
  document.addEventListener('DOMContentLoaded', function() {
    // Map container-ийн хэмжээг шалгах
    function tryInitMap() {
      var mapContainer = document.getElementById('map');
      if (mapContainer && mapContainer.offsetWidth > 0 && mapContainer.offsetHeight > 0) {
        map = initMap();
        if (map) {
          setupEventHandlers();
        }
      } else {
        // Хэрэв container харагдахгүй байвал бага зэрэг хүлээгээд дахин оролдох
        setTimeout(tryInitMap, 100);
      }
    }

    function setupEventHandlers() {
      var layerSelect = document.getElementById('layerSelect');
      var loadBtn = document.getElementById('loadBtn');

      // Dropdown сонголт өөрчлөгдөхөд
      layerSelect.addEventListener('change', function() {
        var selected = layerSelect.value;
        
        if (selected !== 'empty' && buildingEntrances[selected]) {
          var coords = buildingEntrances[selected];
          findBusStops(coords[0], coords[1]);
        }
      });

      // Товч дарахад (сонголт хийсэн бол)
      loadBtn.addEventListener('click', function() {
        var selected = layerSelect.value;
        
        if (selected !== 'empty' && buildingEntrances[selected]) {
          var coords = buildingEntrances[selected];
          findBusStops(coords[0], coords[1]);
        }
      });
    }

    // Map-ийг бүрэн ачаалсны дараа эхлүүлэх
    setTimeout(tryInitMap, 50);

    var layerSelect = document.getElementById('layerSelect');
    var loadBtn = document.getElementById('loadBtn');

    // Dropdown сонголт өөрчлөгдөхөд
    layerSelect.addEventListener('change', function() {
      var selected = layerSelect.value;
      
      if (selected !== 'empty' && buildingEntrances[selected]) {
        var coords = buildingEntrances[selected];
        findBusStops(coords[0], coords[1]);
      }
    });

    // Товч дарахад (сонголт хийсэн бол)
    loadBtn.addEventListener('click', function() {
      var selected = layerSelect.value;
      
      if (selected !== 'empty' && buildingEntrances[selected]) {
        var coords = buildingEntrances[selected];
        findBusStops(coords[0], coords[1]);
      }
    });
  });
})();
