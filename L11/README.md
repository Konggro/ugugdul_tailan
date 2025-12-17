# L11 - Leaflet Map with Geolocation

## Шаардлага

1. **Base Layers**: OpenStreetMap, Stadia.AlidadeSatellite (leaflet-providers ашиглан)
2. **Bayan-Ölgiy Aimag Overlay**: PNG файл overlay layer
3. **Geolocation**: Browser-ийн одоогийн байршлыг харуулах
4. **Distance Calculation**: УБ төв цэгээс одоогийн байршил хүртэлх зай

## Файлууд

- `index.html` - Үндсэн HTML файл
- `main.js` - Leaflet map логик
- `styles.css` - CSS стил
- `get_bayan_ulgii_map.html` - Bayan-Ölgiy аймгийн PNG файл авах туслах хуудас

## Тохируулалт

### 1. Bayan-Ölgiy Aimag PNG файл авах

**Арга 1: get_bayan_ulgii_map.html ашиглах**
1. `get_bayan_ulgii_map.html` файлыг browser-д нээнэ
2. OpenTopoMap layer сонгоно
3. Баян-Өлгий аймгийг төвлөрүүлнэ
4. Browser-ийн Developer Tools (F12) нээнэ
5. Console дээр дараах командыг ажиллуулна:
   ```javascript
   html2canvas(document.getElementById('map')).then(canvas => {
     const link = document.createElement('a');
     link.download = 'BayanUlgii_aimag.png';
     link.href = canvas.toDataURL();
     link.click();
   });
   ```
6. PNG файлыг `Data/BayanUlgii_aimag.png` гэж хадгална

**Арга 2: Manual screenshot**
1. https://leaflet-extras.github.io/leaflet-providers/preview/ сайт руу очно
2. OpenTopoMap сонгоно
3. Баян-Өлгий аймгийг олж, zoom level тохируулна (zoom 7-9)
4. Screenshot хийж, зөвхөн газрын зургийг сонгоод хадгална
5. PNG файлыг `Data/BayanUlgii_aimag.png` гэж хадгална

### 2. u_r_here.PNG дүрс үүсгэх

Хэрэв `Data/u_r_here.PNG` файл байхгүй бол:
- Улаан тойрог дүрс (32x32 пиксел)
- Эсвэл "You are here" текст бүхий marker icon
- Эсвэл одоогийн `icon_point.png`-ийг хуулж `u_r_here.PNG` гэж нэрлэнэ

**Энгийн улаан marker үүсгэх:**
- Online tool ашиглах: https://www.favicon-generator.org/
- Эсвэл энгийн улаан тойрог зурж PNG болгох

## Ашиглах

1. `index.html` файлыг browser-д нээнэ
2. Browser байршлын мэдээлэл өгөх эрхийг зөвшөөрнө
3. Газрын зураг дээр:
   - Base layer сонгох (OpenStreetMap эсвэл Stadia.AlidadeSatellite)
   - Overlay layer сонгох (BayanUlgii aimag)
   - Одоогийн байршил автоматаар харуулагдана
   - УБ төв цэгээс одоогийн байршил хүртэлх зай Tooltip болон Popup-аар харуулагдана

## Функцүүд

- **Base Layer Switching**: OpenStreetMap болон Stadia.AlidadeSatellite хооронд солих
- **Overlay Layers**: Khuvsgul, Dornod, Bayan-Ölgiy аймгийн PNG overlay-үүд
- **Geolocation**: Browser-ийн одоогийн байршлыг автоматаар олох
- **Distance Calculation**: УБ төв (47.92, 106.92) цэгээс одоогийн байршил хүртэлх зайг метр, километрээр харуулах
- **Visual Indicators**: 
  - Улаан шугам: УБ төвээс одоогийн байршил хүртэлх зай
  - Цэнхэр тойрог: Нарийвчлалын радиус




