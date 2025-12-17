// Routine харуулах
window.onload = function() {
    const map = L.map('map').setView([47.92, 106.92], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    let startMarker, endMarker, routeLine;

    map.on('click', function (e) {
      if (!startMarker) {
        startMarker = L.marker(e.latlng).addTo(map).bindPopup("Start").openPopup();
      } else if (!endMarker) {
        endMarker = L.marker(e.latlng).addTo(map).bindPopup("Destination").openPopup();
        getRoute(startMarker.getLatLng(), endMarker.getLatLng());
      } else {
        map.removeLayer(startMarker);
        map.removeLayer(endMarker);
        if (routeLine) map.removeLayer(routeLine);
        startMarker = L.marker(e.latlng).addTo(map).bindPopup("Start").openPopup();
        endMarker = null;
      }
    });

    function getRoute(start, end) {
      const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;

      fetch(url)
        .then(res => res.json())
        .then(data => {
          const route = data.routes[0].geometry;
          routeLine = L.geoJSON(route, {
            style: { color: 'blue', weight: 4 }
          }).addTo(map);
          map.fitBounds(routeLine.getBounds());
        });
    }
};




