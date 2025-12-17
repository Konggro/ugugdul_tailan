# Lab16 - Эхлэх заавар

## ⚠️ Анхаар: Зөв Directory

`app.py` файл нь **lab16** folder дотор байна!

```bash
# Зөв directory руу шилжих
cd lab16

# Файл байгаа эсэхийг шалгах
ls app.py

# Дараа нь ажиллуулах
python app.py
```

## 🚀 Хурдан эхлэх

### 1. Directory руу шилжих

```bash
cd /Users/macbook/lab6gazarzui/lab16
```

### 2. Dependencies суулгах (зөвхөн нэг удаа)

```bash
pip install -r requirements.txt
```

### 3. API ажиллуулах

```bash
python app.py
```

Эсвэл:

```bash
python3 app.py
```

API `http://localhost:5002` дээр ажиллана.

### 4. Frontend ажиллуулах (өөр terminal)

```bash
cd /Users/macbook/lab6gazarzui/lab16
python3 -m http.server 8003
```

Browser дээр `http://localhost:8003` нээнэ.

## 📁 Directory бүтэц

```
lab6gazarzui/
├── lab16/          ← ЭНД байна!
│   ├── app.py      ← Flask API
│   ├── index.html  ← Frontend
│   ├── script.js
│   ├── style.css
│   └── ...
├── lab10/          ← PostGIS
├── lab06/          ← Flask API (өөр)
└── ...
```

## ❌ Алдаа: "can't open file 'app.py'"

Энэ нь буруу directory-д байгаа гэсэн үг.

**Шийдэл:**

```bash
# Одоогийн directory-г харах
pwd

# lab16 руу шилжих
cd lab16

# Дахин оролдох
python app.py
```

## ✅ Шалгах

```bash
# Зөв directory-д байгаа эсэх
pwd
# Хариу: /Users/macbook/lab6gazarzui/lab16

# Файл байгаа эсэх
ls app.py
# Хариу: app.py
```


