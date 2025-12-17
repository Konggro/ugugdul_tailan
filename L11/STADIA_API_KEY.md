# Stadia Maps API Key тохируулалт

Хэрэв та Stadia Maps Alidade Satellite layer-ийг ашиглахыг хүсвэл:

## 1. API Key авах

1. [Stadia Maps](https://stadiamaps.com/) сайт руу очно
2. Бүртгүүлэх эсвэл нэвтрэх
3. Dashboard-оос API key авах

## 2. Кодод нэмэх

`main.js` файлд дараах байдлаар API key нэмнэ:

1. Esri World Imagery-ийн мөрийг comment хийх (эсвэл устгах)
2. Stadia Maps-ийн мөрийг uncomment хийж, `YOUR_API_KEY`-ийг өөрийн API key-ээр солих:

```javascript
// Comment out Esri layer:
// StadiaAlidadeSatellite = L.tileLayer('https://server.arcgisonline.com/...', {...});

// Uncomment and use Stadia Maps with API key:
StadiaAlidadeSatellite = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}.png?api_key=YOUR_API_KEY_HERE', {
  maxZoom: 18,
  noWrap: true,
  attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
});
```

**Анхаар**: 
- `{r}` параметрийг устгах хэрэгтэй (retina display support нь API key-тэй ажиллахгүй байж болно)
- API key-ийг URL-д query parameter болгон нэмнэ: `?api_key=YOUR_API_KEY`
- Style JSON: https://tiles.stadiamaps.com/styles/alidade_satellite.json?api_key=YOUR-API-KEY

## 3. Одоогийн шийдэл

Одоогоор код нь **Esri World Imagery** ашиглаж байна - энэ нь үнэгүй бөгөөд API key шаарддаггүй.

