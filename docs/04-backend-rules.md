# Backend Coding Rules

## Architektur
Controller → Service → Repository → DB

## VERBOTEN
- SQL im Controller
- DB-Zugriff im Frontend
- Businesslogik im Template
- Secrets im Code
- Direkte echo-Ausgaben

## ERLAUBT
- Prepared Statements
- DTOs
- JSON only
- ENV Variablen für Secrets