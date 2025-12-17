FROM python:3.11-slim

WORKDIR /app

# Шаардлагатай системийн library-уудыг суулгана
RUN apt-get update && apt-get install -y \
    libexpat1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["python", "app.py"]






