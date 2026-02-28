// PWA Installation and Service Worker Management
class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.isInstalled = false;
        this.swRegistration = null;
        this.init();
    }

    async init() {
        this.checkInstallStatus();
        this.registerServiceWorker();
        this.setupInstallPrompt();
        this.setupUpdatePrompt();
        this.setupOfflineHandling();
    }

    checkInstallStatus() {
        // Check if app is installed
        if (window.matchMedia('(display-mode: standalone)').matches || 
            window.navigator.standalone === true) {
            this.isInstalled = true;
            document.body.classList.add('pwa-installed');
        }
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                this.swRegistration = await navigator.serviceWorker.register('/frontend/sw.js', {
                    scope: '/'
                });

                console.log('Service Worker registered successfully:', this.swRegistration);

                // Handle updates
                this.swRegistration.addEventListener('updatefound', () => {
                    const newWorker = this.swRegistration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.showUpdatePrompt();
                        }
                    });
                });

                // Listen for messages from SW
                navigator.serviceWorker.addEventListener('message', (event) => {
                    this.handleServiceWorkerMessage(event.data);
                });

            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }

    setupInstallPrompt() {
        // Listen for beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });

        // Listen for app installed event
        window.addEventListener('appinstalled', () => {
            console.log('PWA was installed');
            this.isInstalled = true;
            this.hideInstallButton();
            this.showToast('App erfolgreich installiert!', 'success');
        });
    }

    showInstallButton() {
        if (this.isInstalled) return;

        const installButton = document.createElement('button');
        installButton.id = 'pwa-install-btn';
        installButton.className = 'pwa-install-btn';
        installButton.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7,10 12,15 17,10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            App installieren
        `;
        
        installButton.addEventListener('click', () => this.installApp());
        
        // Add to navigation
        const nav = document.querySelector('.nav-links');
        if (nav) {
            nav.appendChild(installButton);
        }
    }

    hideInstallButton() {
        const installButton = document.getElementById('pwa-install-btn');
        if (installButton) {
            installButton.remove();
        }
    }

    async installApp() {
        if (!this.deferredPrompt) return;

        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }
        
        this.deferredPrompt = null;
    }

    showUpdatePrompt() {
        const updateBanner = document.createElement('div');
        updateBanner.className = 'update-banner';
        updateBanner.innerHTML = `
            <div class="update-content">
                <div class="update-text">
                    <strong>Update verfügbar</strong>
                    <p>Eine neue Version der App ist verfügbar.</p>
                </div>
                <div class="update-actions">
                    <button class="update-btn" onclick="pwaManager.applyUpdate()">
                        Aktualisieren
                    </button>
                    <button class="update-dismiss" onclick="pwaManager.dismissUpdate()">
                        Später
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(updateBanner);
        setTimeout(() => updateBanner.classList.add('show'), 100);
    }

    async applyUpdate() {
        if (this.swRegistration && this.swRegistration.waiting) {
            this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
        }
    }

    dismissUpdate() {
        const updateBanner = document.querySelector('.update-banner');
        if (updateBanner) {
            updateBanner.remove();
        }
    }

    setupOfflineHandling() {
        // Online/offline status
        window.addEventListener('online', () => {
            this.showToast('Verbindung wiederhergestellt', 'success');
            this.syncOfflineData();
        });

        window.addEventListener('offline', () => {
            this.showToast('Offline-Modus aktiviert', 'info');
        });

        // Show offline indicator
        if (!navigator.onLine) {
            this.showOfflineIndicator();
        }
    }

    showOfflineIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'offline-indicator';
        indicator.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="1" y1="9" x2="23" y2="9"></line>
                <line x1="1" y1="15" x2="23" y2="15"></line>
                <line x1="1" y1="21" x2="23" y2="21"></line>
                <line x1="1" y1="3" x2="23" y2="3"></line>
            </svg>
            Offline
        `;
        
        document.body.appendChild(indicator);
    }

    async syncOfflineData() {
        // Sync favorites
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            try {
                await this.swRegistration.sync.register('sync-favorites');
                await this.swRegistration.sync.register('sync-user-actions');
            } catch (error) {
                console.error('Background sync registration failed:', error);
            }
        }
    }

    handleServiceWorkerMessage(data) {
        switch (data.type) {
            case 'CACHE_UPDATED':
                console.log('Cache updated:', data.url);
                break;
            case 'OFFLINE_FALLBACK':
                this.showToast('Offline-Daten geladen', 'info');
                break;
            default:
                console.log('SW message:', data);
        }
    }

    // Push notifications
    async requestNotificationPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
                this.showToast('Benachrichtigungen aktiviert', 'success');
                this.subscribeToPush();
            } else {
                this.showToast('Benachrichtigungen deaktiviert', 'warning');
            }
        }
    }

    async subscribeToPush() {
        if (!this.swRegistration) return;

        try {
            const subscription = await this.swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array('YOUR_VAPID_PUBLIC_KEY') // Replace with actual key
            });

            // Send subscription to server
            await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('omekan_token')}`
                },
                body: JSON.stringify(subscription)
            });

            console.log('Push subscription successful');
        } catch (error) {
            console.error('Push subscription failed:', error);
        }
    }

    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    // Share API
    async shareEvent(event) {
        const shareData = {
            title: event.title || event.slug,
            text: event.description || 'Schau dir dieses Event an!',
            url: `${window.location.origin}/frontend/event-detail.html?slug=${event.slug}`
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
                console.log('Event shared successfully');
            } catch (error) {
                console.error('Error sharing:', error);
                this.fallbackShare(shareData);
            }
        } else {
            this.fallbackShare(shareData);
        }
    }

    fallbackShare(shareData) {
        // Copy to clipboard as fallback
        navigator.clipboard.writeText(shareData.url).then(() => {
            this.showToast('Link in Zwischenablage kopiert', 'success');
        }).catch(() => {
            this.showToast('Teilen nicht möglich', 'error');
        });
    }

    // Utility methods
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    // Cache management
    async clearCache() {
        if (this.swRegistration) {
            this.swRegistration.active.postMessage({ type: 'CLEAR_CACHE' });
            this.showToast('Cache geleert', 'success');
        }
    }

    async preloadUrls(urls) {
        if (this.swRegistration) {
            this.swRegistration.active.postMessage({ 
                type: 'CACHE_URLS', 
                urls: urls 
            });
        }
    }

    // App shortcuts
    setupAppShortcuts() {
        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K for search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.getElementById('hero-search');
                if (searchInput) {
                    searchInput.focus();
                }
            }

            // Ctrl/Cmd + N for new event (admin)
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                window.open('/admin/create-event.html', '_blank');
            }
        });
    }

    // Performance monitoring
    monitorPerformance() {
        if ('performance' in window) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    console.log('Page load time:', perfData.loadEventEnd - perfData.loadEventStart);
                    
                    // Send to analytics if needed
                    this.sendPerformanceData(perfData);
                }, 0);
            });
        }
    }

    sendPerformanceData(perfData) {
        // Send performance data to analytics endpoint
        fetch('/api/analytics/performance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                loadTime: perfData.loadEventEnd - perfData.loadEventStart,
                domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                firstPaint: performance.getEntriesByType('paint')[0]?.startTime,
                url: window.location.href,
                userAgent: navigator.userAgent
            })
        }).catch(error => console.error('Performance data send failed:', error));
    }
}

// Initialize PWA Manager
let pwaManager;
document.addEventListener('DOMContentLoaded', () => {
    pwaManager = new PWAManager();
});

// Export for global access
window.pwaManager = pwaManager;
