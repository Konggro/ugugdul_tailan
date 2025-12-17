# Lab14 - Isochrone & Accessibility Analysis

## Тайлбар

Энэхүү аппликейшн нь Сүхбаатарын талбайгаас алхах хугацааны хүртээмжийн (isochrone) анализ хийж, тухайн бүс дотор хэдэн сургууль байгааг тоолдог.

## Технологи

- **Leaflet.js**: Газрын зураг харуулах
- **OpenRouteService (ORS)**: Isochrone тооцоолох API
- **Turf.js**: Гео-анализ (pointsWithinPolygon функц)

## Тохируулалт

### 1. OpenRouteService API Key авах

1. [openrouteservice.org](https://openrouteservice.org/) сайт руу очно
2. Бүртгүүлэх эсвэл нэвтрэх
3. Dashboard-оос API key авах
4. `script.js` файлд `API_KEY` хувьсагчид оруулна:

```javascript
const API_KEY = 'YOUR_API_KEY_HERE';
```

### 2. Файлууд

- `index.html` - Үндсэн HTML структура
- `script.js` - JavaScript логик (Isochrone тооцоолол, Turf.js анализ)
- `style.css` - CSS стил

## Ажиллуулах

### Арга 1: Browser дээр шууд нээх

```bash
# Файлыг browser дээр нээнэ
open lab14/index.html
```

### Арга 2: Live Server ашиглах (VS Code)

1. VS Code дээр `lab14` фолдер нээнэ
2. `index.html` файл дээр баруун товч → "Open with Live Server"

### Арга 3: Python Simple HTTP Server

```bash
cd lab14
python3 -m http.server 8000
# Browser дээр: http://localhost:8000
```

## Функцүүд

### 1. Isochrone Тооцоолол

- **5 минут** (ногоон) - 300 секунд
- **10 минут** (шар) - 600 секунд  
- **15 минут** (улаан) - 900 секунд

### 2. Turf.js Анализ

`turf.pointsWithinPolygon(points, polygon)` функц ашиглан:
- `points`: 50 ширхэг санамсаргүй сургуулийн цэг (GeoJSON)
- `polygon`: Isochrone polygon (5, 10, 15 минутын бүс)

### 3. Үр дүн

Анализын үр дүн:
- 5 минутын бүс дотор: X сургууль
- 10 минутын бүс дотор: Y сургууль
- 15 минутын бүс дотор: Z сургууль

## Өгөгдөл

- **Эхлэх цэг**: Сүхбаатарын талбай (106.917572, 47.918466)
- **Сургуулиуд**: 50 ширхэг санамсаргүй цэг (хиймэл өгөгдөл)
- **Тээврийн хэрэгсэл**: Алхах (foot-walking)

## Анхааруулга

- API key шаардлагатай (OpenRouteService)
- Интернэт холболт шаардлагатай
- Бодит сургуулиудын өгөгдөл авахын тулд Overpass API ашиглах боломжтой

## Дараагийн алхмууд

1. Бодит OSM өгөгдөл ашиглах (Overpass API)
2. Бусад цэгүүд (эмнэлэг, дэлгүүр) нэмэх
3. Бусад тээврийн хэрэгсэл (машин, автобус) дэмжлэх
4. Илүү нарийвчилсан статистик нэмэх




