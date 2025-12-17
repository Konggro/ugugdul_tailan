# 404 Error засах заавар

## Асуудал

Frontend-ээс `/route` endpoint руу хүсэлт илгээхэд 404 алдаа гарч байна.

## Шалгах алхмууд

### 1. Flask API ажиллаж байгаа эсэх

```bash
# Health check
curl http://localhost:5002/health

# Хариу: {"database": "connected", "status": "healthy"}
```

### 2. Route шалгах

```bash
# API endpoints харах
curl http://localhost:5002/

# Route тест хийх
curl -X POST http://localhost:5002/route \
  -H "Content-Type: application/json" \
  -d '{"start_lat": 0, "start_lon": 0, "end_lat": 10, "end_lon": 10}'
```

### 3. Flask app дахин эхлүүлэх

```bash
# Хуучин процесс устгах
pkill -f "python.*app.py"

# Дахин ажиллуулах
cd lab16
python app.py
```

### 4. Browser console шалгах

Browser дээр F12 дараад Console tab нээх. Алдааны мэдээллийг харах.

### 5. Network tab шалгах

Browser дээр F12 → Network tab нээх. `/route` хүсэлтийг харах:
- Request URL: `http://localhost:5002/route`
- Request Method: `POST`
- Status Code: 404 эсвэл бусад

## Нийтлэг асуудлууд

### Асуудал 1: Flask app ажиллахгүй байна

**Шийдэл:**
```bash
cd lab16
python app.py
```

Terminal дээр дараах мэдээлэл харагдах ёстой:
```
 * Running on http://0.0.0.0:5002
```

### Асуудал 2: Порт зөрчил

**Шийдэл:**
```bash
# Порт 5002 дээр юу ажиллаж байгааг харах
lsof -i :5002

# Хэрэв өөр процесс байвал устгах
pkill -f "python.*app.py"
```

### Асуудал 3: CORS асуудал

`app.py` дээр CORS идэвхжсэн эсэхийг шалгах:

```python
from flask_cors import CORS
app = Flask(__name__)
CORS(app)  # ← Энэ мөр байх ёстой
```

### Асуудал 4: Browser cache

Browser cache цэвэрлэх:
- Chrome: Ctrl+Shift+Delete (Windows) эсвэл Cmd+Shift+Delete (Mac)
- Hard refresh: Ctrl+F5 (Windows) эсвэл Cmd+Shift+R (Mac)

### Асуудал 5: script.js дээрх API_BASE

`script.js` файлд зөв URL байгаа эсэхийг шалгах:

```javascript
const API_BASE = 'http://localhost:5002';  // ← Зөв порт
```

## Тест хийх

### Terminal дээр:

```bash
# 1. API ажиллаж байгаа эсэх
curl http://localhost:5002/health

# 2. Route тест
curl -X POST http://localhost:5002/route \
  -H "Content-Type: application/json" \
  -d '{"start_lat": 0, "start_lon": 0, "end_lat": 10, "end_lon": 10}'
```

### Browser дээр:

1. `http://localhost:8003` нээх
2. F12 дарах (Developer Tools)
3. Console tab нээх
4. "Зам олох" товч дарах
5. Алдааны мэдээллийг харах

## Шийдэл

Хэрэв дээрх бүх алхмуудыг хийсэн ч ажиллахгүй байвал:

1. Flask app-ийг дахин эхлүүлэх
2. Browser-ийг дахин ачаалах (hard refresh)
3. Terminal дээрх Flask log-ийг харах (алдааны мэдээлэл байгаа эсэх)

