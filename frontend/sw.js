// Service Worker for PWA Features
const CACHE_NAME = 'omekan-v1.0.0';
const STATIC_CACHE = 'omekan-static-v1';
const DYNAMIC_CACHE = 'omekan-dynamic-v1';

// Files to cache immediately
const STATIC_FILES = [
    '/',
    '/frontend/events.html',
    '/frontend/css/events.css',
    '/frontend/css/event-modal.css',
    '/frontend/css/auth.css',
    '/frontend/css/enhanced-style.css',
    '/frontend/js/events.js',
    '/frontend/js/event-modal.js',
    '/frontend/js/auth.js',
    '/frontend/images/default-event.svg',
    '/frontend/images/default-avatar.svg',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// API endpoints to cache
const API_ENDPOINTS = [
    '/api/events',
    '/api/communities',
    '/api/categories'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('Caching static files...');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('Static files cached successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Error caching static files:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Handle API requests
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(handleApiRequest(request));
        return;
    }
    
    // Handle static files
    if (request.method === 'GET') {
        event.respondWith(handleStaticRequest(request));
        return;
    }
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
    const url = new URL(request.url);
    
    try {
        // Try network first
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache successful API responses
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
            return networkResponse;
        }
        
        throw new Error('Network response not ok');
    } catch (error) {
        console.log('Network failed, trying cache for:', url.pathname);
        
        // Fallback to cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline fallback for API
        return new Response(
            JSON.stringify({
                status: 'error',
                message: 'Offline - Keine Internetverbindung',
                data: [],
                offline: true
            }),
            {
                status: 503,
                statusText: 'Service Unavailable',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    }
}

// Handle static requests with cache-first strategy
async function handleStaticRequest(request) {
    try {
        // Try cache first
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Fallback to network
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache the response
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('Request failed:', request.url);
        
        // Return offline page for HTML requests
        if (request.headers.get('accept').includes('text/html')) {
            return caches.match('/frontend/offline.html') || 
                   new Response('<h1>Offline</h1><p>Keine Internetverbindung</p>', {
                       headers: { 'Content-Type': 'text/html' }
                   });
        }
        
        // Return empty response for other requests
        return new Response('', { status: 408, statusText: 'Request Timeout' });
    }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('Background sync triggered:', event.tag);
    
    if (event.tag === 'sync-favorites') {
        event.waitUntil(syncFavorites());
    }
    
    if (event.tag === 'sync-user-actions') {
        event.waitUntil(syncUserActions());
    }
});

// Sync favorites when back online
async function syncFavorites() {
    try {
        const favorites = JSON.parse(localStorage.getItem('omekan_favorites_pending') || '[]');
        
        if (favorites.length > 0) {
            // Send to server
            const response = await fetch('/api/user/favorites', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('omekan_token')}`
                },
                body: JSON.stringify({ favorites })
            });
            
            if (response.ok) {
                localStorage.removeItem('omekan_favorites_pending');
                console.log('Favorites synced successfully');
            }
        }
    } catch (error) {
        console.error('Error syncing favorites:', error);
    }
}

// Sync user actions when back online
async function syncUserActions() {
    try {
        const actions = JSON.parse(localStorage.getItem('omekan_actions_pending') || '[]');
        
        for (const action of actions) {
            try {
                await fetch('/api/user/actions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('omekan_token')}`
                    },
                    body: JSON.stringify(action)
                });
            } catch (error) {
                console.error('Error syncing action:', action, error);
            }
        }
        
        localStorage.removeItem('omekan_actions_pending');
        console.log('User actions synced successfully');
    } catch (error) {
        console.error('Error syncing user actions:', error);
    }
}

// Push notification handling
self.addEventListener('push', (event) => {
    console.log('Push notification received');
    
    const options = {
        body: 'Neue Events verfügbar!',
        icon: '/frontend/images/icon-192.png',
        badge: '/frontend/images/badge-72.png',
        vibrate: [200, 100, 200],
        data: {
            url: '/frontend/events.html'
        },
        actions: [
            {
                action: 'view',
                title: 'Ansehen',
                icon: '/frontend/images/view-icon.png'
            },
            {
                action: 'dismiss',
                title: 'Schließen',
                icon: '/frontend/images/close-icon.png'
            }
        ]
    };
    
    if (event.data) {
        const data = event.data.json();
        options.title = data.title || 'Omekan';
        options.body = data.body || options.body;
        options.data.url = data.url || options.data.url;
    }
    
    event.waitUntil(
        self.registration.showNotification('Omekan', options)
    );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event.notification.data);
    
    event.notification.close();
    
    if (event.action === 'view') {
        event.waitUntil(
            clients.openWindow(event.notification.data.url)
        );
    }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
    console.log('Service Worker received message:', event.data);
    
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data.type === 'CACHE_URLS') {
        event.waitUntil(
            caches.open(DYNAMIC_CACHE)
                .then(cache => cache.addAll(event.data.urls))
        );
    }
    
    if (event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.delete(DYNAMIC_CACHE)
                .then(() => caches.open(DYNAMIC_CACHE))
        );
    }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
    console.log('Periodic sync triggered:', event.tag);
    
    if (event.tag === 'update-events') {
        event.waitUntil(updateEventsCache());
    }
});

// Update events cache in background
async function updateEventsCache() {
    try {
        const response = await fetch('/api/events');
        if (response.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put('/api/events', response);
            console.log('Events cache updated in background');
        }
    } catch (error) {
        console.error('Error updating events cache:', error);
    }
}

// Utility functions for cache management
async function cleanupCache() {
    const cacheNames = await caches.keys();
    const dynamicCache = await caches.open(DYNAMIC_CACHE);
    const requests = await dynamicCache.keys();
    
    // Remove old entries (keep last 50)
    if (requests.length > 50) {
        const toDelete = requests.slice(0, requests.length - 50);
        await Promise.all(
            toDelete.map(request => dynamicCache.delete(request))
        );
    }
}

// Run cleanup periodically
setInterval(cleanupCache, 60000); // Every minute
