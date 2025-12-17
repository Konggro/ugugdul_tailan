window.onload = init;

function init(){
  // Check if Leaflet is loaded
  if (typeof L === 'undefined') {
    console.error('Leaflet library is not loaded!');
    return;
  }

  // Check if leaflet-providers is loaded
  if (typeof L.tileLayer.provider === 'undefined') {
    console.error('leaflet-providers library is not loaded!');
    // Fallback to standard tileLayer
    console.warn('Using standard tileLayer instead of provider');
  }

  // HTML element
  const mapElement = document.getElementById('mapid');

  // Basemaps using leaflet-providers
  let OpenStreetMapStandard, StadiaAlidadeSatellite;
  
  if (typeof L.tileLayer.provider !== 'undefined') {
    OpenStreetMapStandard = L.tileLayer.provider('OpenStreetMap.Mapnik', {
      maxZoom: 19,
      noWrap: true
    });

    // Stadia Maps Alidade Satellite with API key
    // Based on: https://tiles.stadiamaps.com/styles/alidade_satellite.json?api_key=YOUR-API-KEY
    StadiaAlidadeSatellite = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}.png?api_key=7a232cdf-2671-4083-81b4-49727f2da128', {
      maxZoom: 18,
      noWrap: true,
      attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
    });
    
    // Alternative: Free Esri World Imagery (if Stadia Maps doesn't work)
    // StadiaAlidadeSatellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    //   maxZoom: 19,
    //   noWrap: true,
    //   attribution: '&copy; <a href="https://www.esri.com/">Esri</a>, &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, Maxar, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community'
    // });
  } else {
    // Fallback to standard tileLayer
    OpenStreetMapStandard = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    noWrap: true,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  });

    // Stadia Maps Alidade Satellite with API key (fallback)
    StadiaAlidadeSatellite = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}.png?api_key=7a232cdf-2671-4083-81b4-49727f2da128', {
      maxZoom: 18,
      noWrap: true,
      attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
    });
  }

  


  // Leaflet map object
  const mymap = L.map(mapElement, {
    center: [46.91, 106.91],
    zoom: 5,
    minZoom: 2,
    zoomSnap: 0.25,
    zoomDelta:0.25,

    easeLinearity: 0.1,
    worldCopyJump: true,
    layers: [OpenStreetMapStandard]
  })


  // Overlays
  // Leaflet imageOverlay bounds format: [[south, west], [north, east]]
  // Format: [[min_lat, min_lon], [max_lat, max_lon]]
  
  // Dornod Aimag overlay
  // Note: Bounds corrected - [[south, west], [north, east]]
  const dornodImage = './Data/Dornod_aimag.png'; // Fixed: uppercase D
  const dornodBounds = [[46.28, 111.43], [50.53, 119.98]]; // [[south, west], [north, east]]
  const dornodOverlay = L.imageOverlay(dornodImage, dornodBounds, {
    opacity: 0.7,
    interactive: true
  });

  // Overlay object - only Dornod Aimag
  const overlayerLayers = {};
  
  // Add Dornod overlay
  overlayerLayers['Dornod Aimag'] = dornodOverlay; 

  // Baselayers object
  const baseLayers = {
    'OpenStreetMap': OpenStreetMapStandard,
    'Stadia.AlidadeSatellite': StadiaAlidadeSatellite
  }

  // Map layer control
  const layerControls = L.control.layers(baseLayers, overlayerLayers, {
    collapsed: false,
    position: 'topright'
  }).addTo(mymap)


  // Perth Marker
  const perthMarker = L.marker([49.63, 100.15],{
    title: 'Murun coming from the marker',
    alt: 'test of alt',
    opacity: 1,
  }).addTo(mymap)

  const perthMarkerPopup = perthMarker.bindPopup('Popup');
  perthMarker.bindTooltip('Tooltip');


  // Улаанбаатар хотын төв цэг
  const ubCenter = [47.92, 106.92];
  const ubCenterMarker = L.marker(ubCenter, {
    title: 'Улаанбаатар хотын төв'
  }).addTo(mymap)
    .bindPopup('Улаанбаатар хотын төв цэг')
    .bindTooltip('УБ төв', {permanent: false, direction: 'top'});

  // Geolocation - одоогийн байршлыг авах
  var locationMarker = null; // Global scope for location marker
  
  mymap.locate({setView: false, maxZoom: 13, watch: false, enableHighAccuracy: true});

  function onLocationFound(e){
    var radius = e.accuracy.toFixed(2);
    var currentLocation = e.latlng;

    // УБ төв цэгээс одоогийн байршил хүртэлх зайг тооцох (метрээр)
    var distance = mymap.distance(ubCenter, currentLocation);
    var distanceKm = (distance / 1000).toFixed(2);
    var distanceM = distance.toFixed(0);

    // u_r_here.PNG дүрсээр одоогийн байршлыг харуулах
    // Хэрэв файл байхгүй бол fallback divIcon ашиглана
    var currentLocationIcon = L.divIcon({
      className: 'current-location-icon',
      html: '<div style="background: #ff0000; border: 3px solid white; border-radius: 50%; width: 24px; height: 24px; box-shadow: 0 0 10px rgba(0,0,0,0.5); position: relative;"><div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 8px; height: 8px; background: white; border-radius: 50%;"></div></div>',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
    
    // PNG файл байвал ашиглах (optional)
    var img = new Image();
    img.onload = function() {
      // PNG файл амжилттай ачаалагдсан бол icon-ийг солих
      if (locationMarker) {
        var newIcon = L.icon({
          iconUrl: './Data/u_r_here.png',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32]
        });
        locationMarker.setIcon(newIcon);
      }
    };
    img.onerror = function() {
      // PNG файл байхгүй бол fallback icon ашиглана (аль хэдийн divIcon ашиглаж байна)
    };
    img.src = './Data/u_r_here.png'; // Try lowercase first, fallback to uppercase

    locationMarker = L.marker(currentLocation, {
      icon: currentLocationIcon,
      title: 'Одоогийн байршил'
    }).addTo(mymap)
      .bindPopup('Одоогийн байршил<br>УБ төв цэгээс: ' + distanceKm + ' км (' + distanceM + ' м)')
      .bindTooltip('УБ төвээс: ' + distanceKm + ' км', {permanent: false, direction: 'top'})
      .openPopup();
    
    // Нарийвчлалын тойрог
    var locationCircle = L.circle(currentLocation, {
      radius: radius,
      color: '#3388ff',
      fillColor: '#3388ff',
      fillOpacity: 0.2
    }).addTo(mymap);

    // УБ төв цэгээс одоогийн байршил хүртэлх шугам
    var distanceLine = L.polyline([ubCenter, currentLocation], {
      color: '#ff0000',
      weight: 2,
      dashArray: '5, 10',
      opacity: 0.7
    }).addTo(mymap);
  }

  mymap.on('locationfound', onLocationFound);

  function onLocationError(e){
    window.alert('Байршлын мэдээлэл авах боломжгүй: ' + e.message);
  }

  mymap.on('locationerror', onLocationError);


  // Distance calculation demo
  // New code
  /*var myCustomIcon = L.icon({
    iconUrl: '../Data/icon_point.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -15],
  })*/

  
  var myDivIcon = L.divIcon({
    className: 'my-div-icon',
    iconSize: 30,
  })

  var counter = 0;
  var coordinates = [];

  mymap.on('click', function (e) {
    counter += 1;
    let latlng = e.latlng;
    coordinates.push(latlng)

    let popup = L.popup({
      autoClose: false,
      closeOnClick: false,
    }).setContent(String(counter))
    
    L.marker(latlng, {icon: myDivIcon})
      .addTo(mymap)    
      .bindPopup(popup)
      .openPopup()      
    
    if (counter >= 2) {
      let distance = mymap.distance(coordinates[0], coordinates[1])
      console.log(`The distance between ${counter - 1} and ${counter} is ${distance}` , )
      coordinates.shift()
    }
  })
  
}