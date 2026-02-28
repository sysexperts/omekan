# 🔌 Omekan API Documentation

## Base URL
```
http://localhost/api
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```http
Authorization: Bearer <your-jwt-token>
```

---

## 📅 Events API

### Get All Events
```http
GET /api/events
```

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "slug": "summer-festival-2026",
      "title": "Summer Festival 2026",
      "description": "The biggest summer festival in the city",
      "start_datetime": "2026-07-15T18:00:00Z",
      "end_datetime": "2026-07-15T23:00:00Z",
      "location_name": "Central Park",
      "image_path": "/uploads/events/summer-festival.jpg",
      "is_promoted": true,
      "hero_video_path": null,
      "affiliate_url": "https://tickets.example.com/summer-festival",
      "organizer_id": 1,
      "communities": [
        {
          "id": 1,
          "name": "Türkisch",
          "slug": "tuerkisch",
          "flag_emoji": "🇹🇷"
        }
      ],
      "categories": [
        {
          "id": 2,
          "name": "Festival",
          "slug": "festival"
        }
      ],
      "artists": [
        {
          "id": 1,
          "name": "DJ Example",
          "spotify_id": "4uLU6hMCjMI75M1A2tKUQC",
          "image_path": "/uploads/artists/dj-example.jpg"
        }
      ]
    }
  ]
}
```

### Get Event by ID
```http
GET /api/events/{id}
```

**Parameters:**
- `id` (integer) - Event ID

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "slug": "summer-festival-2026",
    "title": "Summer Festival 2026",
    "description": "The biggest summer festival in the city",
    "start_datetime": "2026-07-15T18:00:00Z",
    "end_datetime": "2026-07-15T23:00:00Z",
    "location_name": "Central Park",
    "image_path": "/uploads/events/summer-festival.jpg",
    "is_promoted": true,
    "hero_video_path": null,
    "affiliate_url": "https://tickets.example.com/summer-festival",
    "organizer_id": 1,
    "communities": [...],
    "categories": [...],
    "artists": [...]
  }
}
```

### Create Event
```http
POST /api/events
```
**Authentication Required**

**Request Body:**
```json
{
  "title": "New Event",
  "description": "Event description",
  "start_datetime": "2026-08-01T19:00:00Z",
  "end_datetime": "2026-08-01T23:00:00Z",
  "location_name": "Event Location",
  "is_promoted": false,
  "affiliate_url": "https://tickets.example.com/new-event",
  "community_ids": [1, 2],
  "category_ids": [1],
  "artist_ids": [1, 2]
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Event created successfully",
  "data": {
    "id": 2,
    "slug": "new-event-2026"
  }
}
```

### Update Event
```http
PUT /api/events/{id}
```
**Authentication Required**

**Parameters:**
- `id` (integer) - Event ID

**Request Body:** Same as Create Event

**Response:**
```json
{
  "status": "success",
  "message": "Event updated successfully"
}
```

### Delete Event
```http
DELETE /api/events/{id}
```
**Authentication Required**

**Parameters:**
- `id` (integer) - Event ID

**Response:**
```json
{
  "status": "success",
  "message": "Event deleted successfully"
}
```

---

## 🏘️ Communities API

### Get All Communities
```http
GET /api/communities
```

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "name": "Türkisch",
      "slug": "tuerkisch",
      "flag_emoji": "🇹🇷",
      "flag_icon": null,
      "preview_image": null,
      "is_active": true
    },
    {
      "id": 2,
      "name": "Griechisch",
      "slug": "griechisch",
      "flag_emoji": "🇬🇷",
      "flag_icon": null,
      "preview_image": null,
      "is_active": true
    }
  ]
}
```

### Get Community by ID
```http
GET /api/communities/{id}
```

**Parameters:**
- `id` (integer) - Community ID

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "Türkisch",
    "slug": "tuerkisch",
    "flag_emoji": "🇹🇷",
    "flag_icon": null,
    "preview_image": null,
    "is_active": true,
    "events_count": 15
  }
}
```

---

## 🏷️ Categories API

### Get All Categories
```http
GET /api/categories
```

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "name": "Konzert",
      "slug": "konzert"
    },
    {
      "id": 2,
      "name": "Festival",
      "slug": "festival"
    },
    {
      "id": 3,
      "name": "Party",
      "slug": "party"
    },
    {
      "id": 4,
      "name": "Kultur",
      "slug": "kultur"
    }
  ]
}
```

---

## 🔐 Authentication API

### Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "password_confirm": "securepassword123"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "created_at": "2026-02-28T17:00:00Z"
    }
  }
}
```

### Login User
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

### Verify Token
```http
GET /api/auth/verify
```
**Authentication Required**

**Response:**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

### Logout User
```http
POST /api/auth/logout
```
**Authentication Required**

**Response:**
```json
{
  "status": "success",
  "message": "Logout successful"
}
```

---

## 🎭 Artists API

### Get All Artists
```http
GET /api/artists
```

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "name": "DJ Example",
      "spotify_id": "4uLU6hMCjMI75M1A2tKUQC",
      "image_path": "/uploads/artists/dj-example.jpg",
      "bio": "Famous DJ from Berlin",
      "website": "https://djexample.com"
    }
  ]
}
```

---

## 📊 Analytics API

### Track Events
```http
POST /api/analytics/events
```

**Request Body:**
```json
{
  "events": [
    {
      "id": "evt_1234567890_abc123",
      "type": "page_view",
      "sessionId": "session_1234567890_xyz789",
      "userId": "user_1234567890_def456",
      "timestamp": "2026-02-28T17:30:00Z",
      "url": "http://localhost/frontend/events.html",
      "userAgent": "Mozilla/5.0...",
      "properties": {
        "title": "Events - Omekan",
        "referrer": "https://google.com",
        "viewport": "1920x1080",
        "isOnline": true
      }
    }
  ]
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Events tracked successfully",
  "processed": 1
}
```

### Track Performance
```http
POST /api/analytics/performance
```

**Request Body:**
```json
{
  "loadTime": 1250,
  "domContentLoaded": 800,
  "firstPaint": 600,
  "url": "http://localhost/frontend/events.html",
  "userAgent": "Mozilla/5.0..."
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Performance data recorded"
}
```

---

## 📤 Upload API

### Upload Event Image
```http
POST /api/upload/event-image
```
**Authentication Required**

**Request:** Multipart form data
- `image` (file) - Image file (JPG, PNG, GIF, WEBP, max 10MB)

**Response:**
```json
{
  "status": "success",
  "message": "Image uploaded successfully",
  "data": {
    "filename": "event_1234567890.jpg",
    "path": "/uploads/events/event_1234567890.jpg",
    "size": 1024000,
    "mime_type": "image/jpeg"
  }
}
```

---

## 🔍 Search API

### Search Events
```http
GET /api/search/events
```

**Query Parameters:**
- `q` (string) - Search query
- `community` (integer) - Community ID filter
- `category` (integer) - Category ID filter
- `date` (string) - Date filter (YYYY-MM-DD)
- `limit` (integer) - Results limit (max 50, default 20)
- `offset` (integer) - Results offset (default 0)
- `sort` (string) - Sort by: date, title, location (default: date)

**Example:**
```http
GET /api/search/events?q=festival&community=1&limit=10&sort=date
```

**Response:**
```json
{
  "status": "success",
  "data": [...],
  "pagination": {
    "total": 25,
    "limit": 10,
    "offset": 0,
    "has_more": true
  },
  "filters": {
    "search": "festival",
    "community": "1",
    "category": "",
    "date": "",
    "sort": "date"
  }
}
```

---

## 🔔 Push Notifications API

### Subscribe to Push
```http
POST /api/push/subscribe
```
**Authentication Required**

**Request Body:**
```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM",
    "auth": "tBHItJI5svbpez7KI4CCXg"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Push subscription saved"
}
```

### Send Push Notification
```http
POST /api/push/send
```
**Authentication Required (Admin)**

**Request Body:**
```json
{
  "title": "New Event Available!",
  "body": "Check out the latest events in your area",
  "url": "/frontend/events.html",
  "icon": "/frontend/images/icon-192.png",
  "badge": "/frontend/images/badge-72.png"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Push notification sent",
  "sent_count": 150
}
```

---

## 🏥 Health Check API

### Application Health
```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-28T17:30:00Z",
  "version": "2.0.0",
  "uptime": 86400,
  "checks": {
    "database": "healthy",
    "cache": "healthy",
    "storage": "healthy"
  }
}
```

### Database Health
```http
GET /api/health/db
```

**Response:**
```json
{
  "status": "healthy",
  "connection": "active",
  "query_time": 12,
  "tables": {
    "events": 150,
    "users": 1250,
    "communities": 5,
    "categories": 8
  }
}
```

---

## ❌ Error Responses

All API endpoints return consistent error responses:

### 400 Bad Request
```json
{
  "status": "error",
  "message": "Invalid request data",
  "errors": {
    "email": ["Email is required"],
    "password": ["Password must be at least 6 characters"]
  }
}
```

### 401 Unauthorized
```json
{
  "status": "error",
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "status": "error",
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "status": "error",
  "message": "Resource not found"
}
```

### 429 Too Many Requests
```json
{
  "status": "error",
  "message": "Rate limit exceeded",
  "retry_after": 60
}
```

### 500 Internal Server Error
```json
{
  "status": "error",
  "message": "Internal server error",
  "error_id": "err_1234567890"
}
```

---

## 📝 Rate Limiting

API endpoints are rate limited to prevent abuse:

- **Authentication endpoints**: 5 requests per minute per IP
- **Upload endpoints**: 10 requests per minute per user
- **General endpoints**: 100 requests per minute per IP
- **Search endpoints**: 30 requests per minute per IP

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## 🔒 Security

### CORS
CORS is configured to allow requests from:
- `http://localhost`
- `https://yourdomain.com`

### Content Security Policy
CSP headers are set to prevent XSS attacks:
```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src fonts.gstatic.com;
```

### Input Validation
All input is validated and sanitized:
- SQL injection prevention with prepared statements
- XSS prevention with output encoding
- File upload validation (type, size, content)

---

## 📚 SDKs & Libraries

### JavaScript SDK
```javascript
// Initialize Omekan API Client
const omekan = new OmekanAPI({
  baseUrl: 'http://localhost/api',
  token: 'your-jwt-token'
});

// Get events
const events = await omekan.events.getAll();

// Create event
const newEvent = await omekan.events.create({
  title: 'New Event',
  description: 'Event description',
  // ...
});
```

### PHP SDK
```php
// Initialize Omekan API Client
$omekan = new OmekanAPI([
    'base_url' => 'http://localhost/api',
    'token' => 'your-jwt-token'
]);

// Get events
$events = $omekan->events()->getAll();

// Create event
$newEvent = $omekan->events()->create([
    'title' => 'New Event',
    'description' => 'Event description',
    // ...
]);
```

---

## 🧪 Testing

### API Testing with cURL

```bash
# Get all events
curl -X GET http://localhost/api/events

# Create event (with authentication)
curl -X POST http://localhost/api/events \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Event",
    "description": "Test Description",
    "start_datetime": "2026-08-01T19:00:00Z",
    "end_datetime": "2026-08-01T23:00:00Z",
    "location_name": "Test Location"
  }'
```

### Postman Collection
Import the Postman collection: `docs/Omekan-API.postman_collection.json`

---

## 📞 Support

For API support and questions:
- **Documentation**: [GitHub Wiki](https://github.com/sysexperts/omekan/wiki)
- **Issues**: [GitHub Issues](https://github.com/sysexperts/omekan/issues)
- **Email**: api-support@omekan.com
