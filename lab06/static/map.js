// Leaflet санг ашиглан газрын зургийг эхлүүлнэ
function initMap() {
//zoom=2 → дэлхийн хэмжээний зураг
//zoom=12 → хотын хэмжээ
//zoom=16 → гудамж, барилга тод харагдана
//zoom=0-22
  var map = L.map('map').setView([47.92, 106.92], 16);
  map.fitBounds(window.bounds);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  return map;
}

// Зам болон барилгын өгөгдлийг Flask-аас дамжуулсан JSON-оос авна
function createLayers(roads, buildings) {
  var roadLayer = L.layerGroup();
  var buildingLayer = L.layerGroup();

  roads.forEach(function(path) {
    L.polyline(path, {color: 'blue'}).addTo(roadLayer);
  });
  buildings.forEach(function(area) {
    L.polygon(area, {color: 'green'}).addTo(buildingLayer);
  });

  return { roadLayer, buildingLayer };
}

function setInfo(msg) {
  document.getElementById("infoBox").value = msg;
}

// layout.html-д зориулсан map код
function showLayoutMap() {
  var map = initMap();

  // Line layer үүсгэх (roads - L.polyline)
  var roadLayer = L.featureGroup();
  var roads = window.roadsData || [];
  roads.forEach(function(road) {
      // Line зурах (coordinates-ыг [lat, lon] форматтай байлгах)
      var coords = road.map(function(pt) { return [pt[0], pt[1]]; });
      L.polyline(coords, {color: 'blue', weight: 3}).addTo(roadLayer);
  });

  // Polygon layer үүсгэх (buildings - L.polygon)
  var buildingLayer = L.featureGroup();
  var buildings = window.buildingsData || [];
  buildings.forEach(function(building) {
      // Polygon зурах (coordinates-ыг [lat, lon] форматтай байлгах)
      var coords = building.map(function(pt) { return [pt[0], pt[1]]; });
      L.polygon(coords, {color: 'red', fillColor: 'orange', fillOpacity: 0.5}).addTo(buildingLayer);
  });

  // Зурах давхарга үүсгэх
  var drawnItems = L.featureGroup();
  // Шинэ: Draw control үүсгэх (draw болон edit toolbar-уудыг идэвхжүүлэх)
  var drawControl = new L.Control.Draw({
      position: 'topleft',  // Toolbar-ийн байрлал (default: topleft)
      draw: {
          marker: true,     // Point (marker) зурахыг зөвшөөрөх
          polyline: {       // Line (polyline) зурах тохиргоо
              shapeOptions: {
                  color: 'blue',
                  weight: 4
              }
          },
          polygon: {        // Polygon зурах тохиргоо
              allowIntersection: false,  // Өөрийгөө огтлолцуулахгүй
              showArea: true,            // Талбайг харуулах
              shapeOptions: {
                  color: 'red',
                  fillColor: 'green'
              }
          },
          rectangle: true,  // Rectangle зурах
          circle: false,     // Circle зурах
          circlemarker: false  // Circle marker-ийг идэвхгүй болгох (шаардлагагүй бол)
      },
      edit: {
          featureGroup: drawnItems,  // Засварлах өгөгдлийг эндээс авна
          remove: true               // Устгахыг зөвшөөрөх
      }
  });
  map.addControl(drawControl);

  // Event listener нэмэх (map үүсгэсний дараа)
  map.on('draw:created', function(e) {
      var type = e.layerType;  // 'marker', 'polyline', 'polygon' г.м.
      var layer = e.layer;     // Зурсан layer (L.Marker, L.Polyline г.м.)
      
      // GeoJSON болгон хөрвүүлэх
      var geoJson = layer.toGeoJSON();
      
      // drawnItems-д нэмэх
      drawnItems.addLayer(layer);
      
      // Сервер рүү илгээх (POST)
      fetch('/json', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(geoJson)
      })
      .then(response => response.json())
      .then(data => {
          console.log('Амжилттай хадгалагдлаа:', data);
          // Layer-д ID-г хадгалах (дараа засварлах, устгахад ашиглах)
          if (data.id && data.data) {
              // GeoJSON-ийг шинэчлэх (ID-тэй)
              layer.feature = data.data;
              // Layer-ийн properties-д ID-г нэмэх
              if (!layer.options) layer.options = {};
              if (data.data.properties) {
                  layer.options.properties = data.data.properties;
              }
          }
      })
      .catch(error => {
          console.error('Алдаа гарлаа:', error);
      });
  });

  // Бусад event-үүд:
  map.on('draw:edited', function(e) {
      var layers = e.layers;  // Засварлагдсан layer-үүд
      layers.eachLayer(function(layer) {
          var geoJson = layer.toGeoJSON();
          
          // ID-г layer.feature-ээс авна (хэрэв байгаа бол)
          if (layer.feature && layer.feature.properties && layer.feature.properties.id) {
              if (!geoJson.properties) geoJson.properties = {};
              geoJson.properties.id = layer.feature.properties.id;
          }
          
          console.log('Засварлагдсан: ' + JSON.stringify(geoJson));
          
          // Сервер рүү илгээх (PUT)
          fetch('/json', {
              method: 'PUT',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify(geoJson)
          })
          .then(response => response.json())
          .then(data => {
              console.log('Амжилттай засварлагдлаа:', data);
              // Шинэчлэгдсэн өгөгдлийг хадгалах
              if (data.data) {
                  layer.feature = data.data;
              }
          })
          .catch(error => {
              console.error('Алдаа гарлаа:', error);
          });
      });
  });

  map.on('draw:deleted', function(e) {
      var layers = e.layers;  // Устгагдсан layer-үүд
      layers.eachLayer(function(layer) {
          var geoJson = layer.toGeoJSON();
          
          // ID-г layer.feature-ээс авна (хэрэв байгаа бол)
          if (layer.feature && layer.feature.properties && layer.feature.properties.id) {
              if (!geoJson.properties) geoJson.properties = {};
              geoJson.properties.id = layer.feature.properties.id;
          }
          
          console.log('Устгагдсан: ' + JSON.stringify(geoJson));
          
          // Сервер рүү илгээх (DELETE)
          fetch('/json', {
              method: 'DELETE',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify(geoJson)
          })
          .then(response => response.json())
          .then(data => {
              console.log('Амжилттай устгагдлаа:', data);
          })
          .catch(error => {
              console.error('Алдаа гарлаа:', error);
          });
      });
  });

  // Layer control нэмэх (overlay layers)
  var overlays = {
      "Зам (Lines)": roadLayer,
      "Барилга (Polygons)": buildingLayer,
      "Зурах хэсэг": drawnItems
  };
  L.control.layers(null, overlays).addTo(map);

  // Анхдагчаар доорх layer-үүдийг асаах
  roadLayer.addTo(map);
  buildingLayer.addTo(map);
}

// layer.html-д зориулсан map код
function showLayerMap() {
  var map = initMap();
  var roads = window.roadsData || [];
  var buildingsShops = window.buildingsShopsData || [];
  var buildingsMedical = window.buildingsMedicalData || [];
  var buildingsSchools = window.buildingsSchoolsData || [];
  var buildingsOther = window.buildingsOtherData || [];

  var roadLayer = L.layerGroup();
  var buildingShopsLayer = L.layerGroup();
  var buildingMedicalLayer = L.layerGroup();
  var buildingSchoolsLayer = L.layerGroup();
  var buildingOtherLayer = L.layerGroup();
  
  // Хадгалагдсан GeoJSON өгөгдлийг ачаалах
  var savedGeoJsonLayer = L.geoJSON(null, {
      style: function(feature) {
          return {
              color: 'purple',
              weight: 3,
              fillColor: 'purple',
              fillOpacity: 0.4
          };
      },
      onEachFeature: function(feature, layer) {
          // ID-г хадгалах (дараа засварлах, устгахад ашиглах)
          if (feature.properties && feature.properties.id) {
              layer.feature = feature;
          }
      }
  });
  
  // GET API-аас өгөгдөл татах
  fetch('/json')
      .then(response => response.json())
      .then(data => {
          if (data.features && data.features.length > 0) {
              savedGeoJsonLayer.addData(data);
              savedGeoJsonLayer.addTo(map);
              console.log('Хадгалагдсан GeoJSON өгөгдөл ачааллаа:', data.features.length, 'обьект');
          }
      })
      .catch(error => {
          console.error('GeoJSON өгөгдөл ачаалахад алдаа гарлаа:', error);
      });

  // Замнууд
  roads.forEach(function(path) {
    L.polyline(path, {color: 'blue'}).addTo(roadLayer);
  });

  // Дэлгүүр, хоолны газар (улаан)
  buildingsShops.forEach(function(building) {
    var polygon = L.polygon(building.nodes, {color: 'red', fillColor: 'red', fillOpacity: 0.3});
    polygon.bindPopup(building.name);
    polygon.addTo(buildingShopsLayer);
  });

  // Эмнэлэг, эмийн сан (цэнхэр)
  buildingsMedical.forEach(function(building) {
    var polygon = L.polygon(building.nodes, {color: 'blue', fillColor: 'blue', fillOpacity: 0.3});
    polygon.bindPopup(building.name);
    polygon.addTo(buildingMedicalLayer);
  });

  // Сургууль, цэцэрлэг (шар)
  buildingsSchools.forEach(function(building) {
    var polygon = L.polygon(building.nodes, {color: 'orange', fillColor: 'yellow', fillOpacity: 0.3});
    polygon.bindPopup(building.name);
    polygon.addTo(buildingSchoolsLayer);
  });

  // Бусад барилгууд (ногоон)
  buildingsOther.forEach(function(building) {
    var polygon = L.polygon(building.nodes, {color: 'green', fillColor: 'green', fillOpacity: 0.3});
    polygon.bindPopup(building.name);
    polygon.addTo(buildingOtherLayer);
  });

  document.getElementById("loadBtn").addEventListener("click", function() {
    setInfo("Ачаалж байна...");

    // Бүх layer-уудыг map-аас хасах
    map.removeLayer(roadLayer);
    map.removeLayer(buildingShopsLayer);
    map.removeLayer(buildingMedicalLayer);
    map.removeLayer(buildingSchoolsLayer);
    map.removeLayer(buildingOtherLayer);

    const selected = document.getElementById("layerSelect").value;

    if (selected === "roads") {
      roadLayer.addTo(map);
      setInfo("Замын polyline-уудыг харуулж байна.");
    } else if (selected === "shops") {
      buildingShopsLayer.addTo(map);
      setInfo("Дэлгүүр, хоолны газруудыг харуулж байна.");
    } else if (selected === "medical") {
      buildingMedicalLayer.addTo(map);
      setInfo("Эмнэлэг, эмийн сангуудыг харуулж байна.");
    } else if (selected === "schools") {
      buildingSchoolsLayer.addTo(map);
      setInfo("Сургууль, цэцэрлэгүүдийг харуулж байна.");
    } else if (selected === "buildings_all") {
      buildingShopsLayer.addTo(map);
      buildingMedicalLayer.addTo(map);
      buildingSchoolsLayer.addTo(map);
      buildingOtherLayer.addTo(map);
      setInfo("Бүх барилгуудыг харуулж байна.");
    } else if (selected === "both") {
      roadLayer.addTo(map);
      buildingShopsLayer.addTo(map);
      buildingMedicalLayer.addTo(map);
      buildingSchoolsLayer.addTo(map);
      buildingOtherLayer.addTo(map);
      setInfo("Зам болон бүх барилгуудыг давхар харуулж байна.");
    } else {
      setInfo("Давхарга байхгүй.");
    }
  });
}
