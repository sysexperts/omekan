# 🎭 Omekan - Modern Event Platform

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/sysexperts/omekan)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![PWA](https://img.shields.io/badge/PWA-Ready-purple.svg)](https://web.dev/progressive-web-apps/)
[![Docker](https://img.shields.io/badge/Docker-Supported-blue.svg)](https://www.docker.com/)

> Eine moderne, vollständig ausgestattete Event-Plattform mit PWA-Features, User Authentication, Analytics und Admin Dashboard.

## ✨ Features

### 🎨 **Frontend Features**
- **Moderne Events-Seite** mit Hero Section und Glassmorphism Design
- **Event Modal System** mit Favoriten, Sharing und Kalender-Integration
- **Live-Suche** mit Debouncing und erweiterten Filtern
- **Responsive Design** - Mobile-First Approach
- **PWA Support** - Installierbar als App mit Offline-Funktionalität
- **Dark Mode** und High Contrast Support

### 🔐 **Authentication System**
- **User Registration/Login** mit E-Mail Validation
- **Social Login** Integration (Google, Facebook)
- **JWT Token** basierte Authentifizierung
- **Password Reset** Funktionalität
- **User Profile** Management

### 📱 **PWA Features**
- **Service Worker** mit Cache-First Strategy
- **Offline Support** für Events und Favoriten
- **App Installation** mit Custom Install Prompt
- **Push Notifications** für neue Events
- **Background Sync** für Offline-Aktionen
- **App Shortcuts** für schnellen Zugriff

### 📊 **Analytics & Tracking**
- **Event Tracking** für User-Interaktionen
- **Performance Monitoring** mit Core Web Vitals
- **Error Tracking** und Crash Reporting
- **A/B Testing** Framework
- **Conversion Funnel** Tracking
- **Heatmap Data** Collection

### 🛠️ **Admin Dashboard**
- **Modern Dashboard** mit Live-Statistiken
- **Event Management** (CRUD Operations)
- **User Management** System
- **Analytics Dashboard** mit Charts
- **Community & Category** Management
- **Real-time Activity** Feed

### 🚀 **Performance**
- **Lazy Loading** für Bilder und Komponenten
- **Code Splitting** für optimale Bundle-Größe
- **Image Optimization** mit WebP Support
- **CDN Ready** für statische Assets
- **Caching Strategy** für API-Requests

## 🏗️ Architektur

```
omekan/
├── frontend/           # Modern Frontend (Vanilla JS + PWA)
│   ├── css/           # Modular CSS mit Custom Properties
│   ├── js/            # ES6+ JavaScript Module
│   ├── images/        # Optimierte Bilder und Icons
│   ├── manifest.json  # PWA Manifest
│   └── sw.js          # Service Worker
├── admin/             # Admin Dashboard
│   ├── css/           # Admin-spezifische Styles
│   ├── js/            # Dashboard JavaScript
│   └── *.html         # Admin Pages
├── backend/           # PHP Backend API
│   ├── src/           # MVC Architecture
│   │   ├── Controller/
│   │   ├── Service/
│   │   ├── Repository/
│   │   └── Database/
│   └── public/        # API Endpoints
└── docker/            # Docker Configuration
    ├── nginx/
    ├── php/
    └── mysql/
```

## 🚀 Quick Start

### Voraussetzungen
- Docker & Docker Compose
- Git
- Node.js (optional, für Development)

### Installation

1. **Repository klonen**
```bash
git clone https://github.com/sysexperts/omekan.git
cd omekan
```

2. **Docker Container starten**
```bash
docker-compose up -d --build
```

3. **Datenbank initialisieren**
```bash
# Warten bis MySQL Container bereit ist (ca. 30 Sekunden)
docker-compose exec mysql mysql -u root -proot omekan < docker/mysql/init.sql
```

4. **Anwendung öffnen**
- Frontend: http://localhost/frontend/events.html
- Admin Dashboard: http://localhost/admin/dashboard.html
- API: http://localhost/api/events

## 📱 PWA Installation

### Desktop (Chrome/Edge)
1. Besuche http://localhost/frontend/events.html
2. Klicke auf "App installieren" Button in der Navigation
3. Bestätige die Installation im Browser-Dialog

### Mobile (Android/iOS)
1. Öffne die Seite im Browser
2. Android: "Zur Startseite hinzufügen"
3. iOS: Teilen → "Zum Home-Bildschirm"

## 🔧 Konfiguration

### Environment Variables
```bash
# .env (optional)
DB_HOST=mysql
DB_NAME=omekan
DB_USER=root
DB_PASS=root
JWT_SECRET=your-secret-key
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
```

### PWA Konfiguration
```javascript
// frontend/manifest.json
{
  "name": "Omekan - Event Platform",
  "short_name": "Omekan",
  "start_url": "/frontend/events.html",
  "display": "standalone",
  "theme_color": "#6366f1"
}
```

## 🎯 API Endpoints

### Events
```http
GET    /api/events              # Alle Events
GET    /api/events/{id}         # Event Details
POST   /api/events              # Event erstellen
PUT    /api/events/{id}         # Event aktualisieren
DELETE /api/events/{id}         # Event löschen
```

### Authentication
```http
POST   /api/auth/register       # User Registration
POST   /api/auth/login          # User Login
POST   /api/auth/logout         # User Logout
GET    /api/auth/verify         # Token Verification
```

### Communities & Categories
```http
GET    /api/communities         # Alle Communities
GET    /api/categories          # Alle Kategorien
```

### Analytics
```http
POST   /api/analytics/events    # Event Tracking
POST   /api/analytics/performance # Performance Metrics
```

## 🎨 Design System

### Farben
```css
:root {
  --primary-color: #6366f1;      /* Indigo */
  --secondary-color: #f59e0b;    /* Amber */
  --success-color: #10b981;      /* Emerald */
  --danger-color: #ef4444;       /* Red */
  --text-primary: #1f2937;       /* Gray 800 */
  --text-secondary: #6b7280;     /* Gray 500 */
}
```

### Typography
- **Primary Font**: Inter (Google Fonts)
- **Fallback**: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto

### Components
- **Buttons**: Gradient backgrounds mit Hover-Effekten
- **Cards**: Glassmorphism mit Backdrop Blur
- **Modals**: Smooth Animations mit Backdrop
- **Forms**: Modern Input Styling mit Focus States

## 📊 Analytics Integration

### Event Tracking
```javascript
// Manual Event Tracking
window.analytics.track('button_click', {
  buttonName: 'event_share',
  eventId: 'event_123'
});

// Automatic Tracking
// - Page Views
// - User Interactions
// - Performance Metrics
// - Error Tracking
```

### Performance Monitoring
- **Core Web Vitals**: LCP, FID, CLS
- **Load Times**: Page Load, API Response
- **User Experience**: Scroll Depth, Session Duration

## 🔒 Security Features

- **JWT Authentication** mit Refresh Tokens
- **CSRF Protection** für Forms
- **XSS Prevention** durch Content Security Policy
- **SQL Injection** Prevention mit Prepared Statements
- **Rate Limiting** für API Endpoints
- **Input Validation** und Sanitization

## 🧪 Testing

### Frontend Testing
```bash
# Unit Tests (Jest)
npm test

# E2E Tests (Playwright)
npm run test:e2e

# Performance Tests
npm run test:performance
```

### Backend Testing
```bash
# PHP Unit Tests
composer test

# API Tests
composer test:api
```

## 🚀 Deployment

### Production Setup
1. **Environment konfigurieren**
```bash
cp .env.example .env
# Bearbeite .env mit Production-Werten
```

2. **SSL Zertifikat einrichten**
```bash
# Let's Encrypt mit Certbot
certbot --nginx -d yourdomain.com
```

3. **Docker Production Build**
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### Performance Optimierung
- **Nginx Gzip** Compression aktiviert
- **Browser Caching** für statische Assets
- **CDN Integration** für Images und Fonts
- **Database Indexing** für häufige Queries

## 📈 Monitoring

### Health Checks
- **Application Health**: `/api/health`
- **Database Health**: `/api/health/db`
- **Cache Health**: `/api/health/cache`

### Logging
- **Application Logs**: `logs/app.log`
- **Error Logs**: `logs/error.log`
- **Access Logs**: `logs/access.log`

## 🤝 Contributing

1. Fork das Repository
2. Erstelle einen Feature Branch (`git checkout -b feature/amazing-feature`)
3. Committe deine Änderungen (`git commit -m 'Add amazing feature'`)
4. Push zum Branch (`git push origin feature/amazing-feature`)
5. Öffne einen Pull Request

### Development Setup
```bash
# Frontend Development
npm install
npm run dev

# Backend Development
composer install
php -S localhost:8000 -t backend/public
```

## 📝 Changelog

### v2.0.0 (2026-02-28)
- ✨ **Neue Features**
  - Event Modal System mit Favoriten
  - User Authentication System
  - PWA Support mit Offline-Funktionalität
  - Analytics und Performance Monitoring
  - Modernes Admin Dashboard
  - Push Notifications

- 🎨 **UI/UX Verbesserungen**
  - Glassmorphism Design
  - Smooth Animations
  - Mobile-First Responsive Design
  - Dark Mode Support

- ⚡ **Performance**
  - Service Worker Implementation
  - Lazy Loading
  - Image Optimization
  - API Caching

### v1.0.0 (2026-02-27)
- 🎉 Initial Release
- Basic Event Management
- Admin Panel
- Docker Setup

## 📄 License

Dieses Projekt ist unter der MIT License lizenziert - siehe [LICENSE](LICENSE) für Details.

## 🙏 Acknowledgments

- **Inter Font** von Google Fonts
- **Heroicons** für SVG Icons
- **Docker** für Containerization
- **PWA** Standards von Google

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/sysexperts/omekan/issues)
- **Discussions**: [GitHub Discussions](https://github.com/sysexperts/omekan/discussions)
- **Email**: support@omekan.com

---

**Made with ❤️ by the Omekan Team**

*Omekan - Bringing Communities Together Through Events*
