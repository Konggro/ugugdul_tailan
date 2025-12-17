// GADM Map Viewer
window.onload = function() {
    const map = L.map('map').setView([47.92, 106.92], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    let aimagLayer = null;
    let sumLayer = null;
    let selectedSumLayer = null;
    const API_BASE = 'http://localhost:5001';

    // Аймгийн хил ачаалах
    function loadAimags() {
        if (aimagLayer) {
            map.removeLayer(aimagLayer);
        }
        
        fetch(`${API_BASE}/gadm/aimags`)
            .then(res => res.json())
            .then(data => {
                if (data.message) {
                    document.getElementById('info-panel').innerHTML = '<p style="color: orange;">' + data.message + '</p>';
                    return;
                }
                if (!data.features || data.features.length === 0) {
                    document.getElementById('info-panel').innerHTML = '<p>Өгөгдөл олдсонгүй.</p>';
                    return;
                }
                aimagLayer = L.geoJSON(data, {
                    style: {
                        color: '#ff7800',
                        weight: 2,
                        fillColor: '#ff7800',
                        fillOpacity: 0.1
                    },
                    onEachFeature: function(feature, layer) {
                        layer.bindPopup(feature.properties.aimag_name);
                    }
                }).addTo(map);
                
                if (aimagLayer.getBounds().isValid()) {
                    map.fitBounds(aimagLayer.getBounds());
                }
            })
            .catch(error => {
                console.error('Алдаа:', error);
                document.getElementById('info-panel').innerHTML = '<p style="color: red;">Алдаа: ' + error.message + '</p>';
            });
    }

    // Аймаг + Сум ачаалах
    function loadSums() {
        if (sumLayer) {
            map.removeLayer(sumLayer);
        }
        
        fetch(`${API_BASE}/gadm/sums`)
            .then(res => res.json())
            .then(data => {
                if (data.message) {
                    document.getElementById('info-panel').innerHTML = '<p style="color: orange;">' + data.message + '</p>';
                    return;
                }
                if (!data.features || data.features.length === 0) {
                    document.getElementById('info-panel').innerHTML = '<p>Өгөгдөл олдсонгүй.</p>';
                    return;
                }
                sumLayer = L.geoJSON(data, {
                    style: {
                        color: '#3388ff',
                        weight: 1,
                        fillColor: '#3388ff',
                        fillOpacity: 0.2
                    },
                    onEachFeature: function(feature, layer) {
                        const props = feature.properties;
                        layer.bindPopup(`${props.aimag_name} - ${props.sum_name}`);
                    }
                }).addTo(map);
                
                // Dropdown-д нэмэх
                const searchSelect = document.getElementById('searchSelect');
                searchSelect.innerHTML = '<option value="">--- Сум сонгох ---</option>';
                
                data.features.forEach(feature => {
                    const props = feature.properties;
                    const option = document.createElement('option');
                    option.value = props.gid;
                    option.textContent = `${props.aimag_name} - ${props.sum_name}`;
                    searchSelect.appendChild(option);
                });
                
                if (sumLayer.getBounds().isValid()) {
                    map.fitBounds(sumLayer.getBounds());
                }
            })
            .catch(error => {
                console.error('Алдаа:', error);
                document.getElementById('info-panel').innerHTML = '<p style="color: red;">Алдаа: ' + error.message + '</p>';
            });
    }

    // Сонгогдсон сумыг харуулах
    function showSelectedSum(gid) {
        if (selectedSumLayer) {
            map.removeLayer(selectedSumLayer);
        }
        
        fetch(`${API_BASE}/gadm/sum/${gid}`)
            .then(res => res.json())
            .then(data => {
                selectedSumLayer = L.geoJSON(data, {
                    style: {
                        color: '#ff0000',
                        weight: 3,
                        fillColor: '#ff0000',
                        fillOpacity: 0.3
                    }
                }).addTo(map);
                
                // Төв цэг рүү шилжих
                const props = data.properties;
                map.setView([props.lat, props.lon], 10);
                
                // Мэдээлэл харуулах
                document.getElementById('info-panel').innerHTML = `
                    <p><strong>Аймаг:</strong> ${props.aimag_name}</p>
                    <p><strong>Сум:</strong> ${props.sum_name}</p>
                    <p><strong>Төв:</strong> ${props.lat.toFixed(4)}, ${props.lon.toFixed(4)}</p>
                `;
            })
            .catch(error => {
                console.error('Алдаа:', error);
            });
    }

    // Давхарга сонгох
    document.getElementById('layerSelect').addEventListener('change', function(e) {
        const selected = e.target.value;
        
        if (selected === 'aimags') {
            loadAimags();
            document.getElementById('info-panel').innerHTML = '<p>Аймгийн хилийг харуулж байна.</p>';
        } else if (selected === 'sums') {
            loadSums();
            document.getElementById('info-panel').innerHTML = '<p>Аймаг, сумын хилийг харуулж байна.</p>';
        } else {
            if (aimagLayer) map.removeLayer(aimagLayer);
            if (sumLayer) map.removeLayer(sumLayer);
            if (selectedSumLayer) map.removeLayer(selectedSumLayer);
            document.getElementById('info-panel').innerHTML = '<p>Давхарга сонгоно уу.</p>';
        }
    });

    // Сум сонгох
    document.getElementById('searchSelect').addEventListener('change', function(e) {
        const gid = e.target.value;
        if (gid) {
            showSelectedSum(parseInt(gid));
        } else {
            if (selectedSumLayer) {
                map.removeLayer(selectedSumLayer);
                selectedSumLayer = null;
            }
        }
    });
};

