# Local PostgreSQL зогсоох заавар

## Асуудал

Local PostgreSQL instance порт 5432 дээр ажиллаж байгаа тул Docker container-тэй зөрчилдөж байна.

## Шийдэл

### macOS (Homebrew)

```bash
# PostgreSQL зогсоох
brew services stop postgresql

# Эсвэл
pg_ctl -D /usr/local/var/postgres stop
```

### macOS (Postgres.app)

1. Postgres.app нээх
2. "Stop" товч дарах

### Linux (systemd)

```bash
sudo systemctl stop postgresql
```

### Windows

1. Services (services.msc) нээх
2. PostgreSQL service олох
3. Stop хийх

## Шалгах

```bash
# Порт 5432 дээр юу ажиллаж байгааг харах
lsof -i :5432

# Зөвхөн Docker container ажиллах ёстой
docker ps | grep postgis
```

## Дараа нь

```bash
cd lab16
python app.py
```

Database холболт ажиллах ёстой!


