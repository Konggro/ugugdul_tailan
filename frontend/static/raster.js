// OpenLayers map зохион байгуулалт
window.onload = function() {
    const center = ol.proj.fromLonLat([106.92, 47.92]); // Улаанбаатар хотын төв

    // Давхаргуудыг бүлэглэж, нэршилтэй болгох
    const baseGroup = new ol.layer.Group({
        title: 'Суурь газрын зураг',
        layers: [
            new ol.layer.Tile({
                title: 'OpenStreetMap',
                type: 'base',
                visible: true,
                source: new ol.source.OSM()
            })
        ]
    });

    const overlayGroup = new ol.layer.Group({
        title: 'Өндөржилтийн давхаргууд',
        layers: [
            new ol.layer.Tile({
                title: 'OpenTopoMap Contours',
                visible: true,
                opacity: 0.7,
                source: new ol.source.XYZ({
                    url: 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png',
                    attributions: '&copy; OpenTopoMap'
                })
            })
        ]
    });

    // Map үүсгэх
    window.map = new ol.Map({
        target: 'map',
        layers: [baseGroup, overlayGroup],
        view: new ol.View({
            center: center,
            zoom: 14,
            maxZoom: 17
        })
    });

    // Удирдлагууд нэмэх
    map.addControl(new ol.control.FullScreen());
    map.addControl(new ol.control.ScaleLine());
    map.addControl(new ol.control.ZoomSlider());

    // Layer Switcher (давхарга сонгох)
    const layerSwitcher = new ol.control.LayerSwitcher({
        tipLabel: 'Давхаргууд',
        groupSelectStyle: 'children' // бүлгийн давхаргуудыг харуулах
    });
    map.addControl(layerSwitcher);

    // Popup элементүүд
    const container = document.getElementById('popup');
    const content = document.getElementById('popup-content');
    const closer = document.getElementById('popup-closer');

    // Popup overlay үүсгэх
    const overlay = new ol.Overlay({
      element: container,
      autoPan: true,
      autoPanAnimation: {
        duration: 250
      }
    });
    map.addOverlay(overlay);

    // Close товч
    closer.onclick = function () {
      overlay.setPosition(undefined);
      closer.blur();
      return false;
    };

    // Дурын цэг дээр дарахад өндөржилтийн мэдээлэл авах
    map.on('singleclick', function (evt) {
    const coordinate = ol.proj.toLonLat(evt.coordinate);
    const lat = coordinate[1];
    const lon = coordinate[0];
    const url = `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`;
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.results && data.results.length > 0) {
                content.innerHTML = `<strong>Өндөржилт:</strong><br>${data.results[0].elevation} м`;
                overlay.setPosition(evt.coordinate);
                //alert("Цэгийн өндөржилт: " + data.results[0].elevation + " м");
            } else {
                alert("Өндөржилтийн мэдээлэл олдсонгүй.");
            }
        })
        .catch(() => {
            alert("API холболтын алдаа.");
        });
    });
};




