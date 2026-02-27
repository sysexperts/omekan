# Architektur

## Überblick

Frontend (HTML/CSS/JS)
→ REST API (PHP)
→ MySQL Datenbank

## Regeln
- Frontend enthält KEINE Businesslogik
- Backend liefert NUR JSON
- Datenbank ist Single Source of Truth
- Keine direkte DB-Nutzung im Frontend

## Deployment
- Ubuntu Server
- Docker Compose
- Container:
  - nginx
  - php-backend
  - mysql (mit Volume)