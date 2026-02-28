// Analytics and Event Tracking System
class AnalyticsManager {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.userId = localStorage.getItem('omekan_user_id') || this.generateUserId();
        this.events = [];
        this.pageStartTime = Date.now();
        this.isOnline = navigator.onLine;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.trackPageView();
        this.setupPerformanceTracking();
        this.setupErrorTracking();
        this.setupUserInteractionTracking();
        this.startSessionTracking();
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateUserId() {
        const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('omekan_user_id', userId);
        return userId;
    }

    setupEventListeners() {
        // Online/offline tracking
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.track('connection_restored');
            this.flushOfflineEvents();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.track('connection_lost');
        });

        // Page visibility tracking
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.track('page_hidden', { duration: Date.now() - this.pageStartTime });
            } else {
                this.pageStartTime = Date.now();
                this.track('page_visible');
            }
        });

        // Before unload tracking
        window.addEventListener('beforeunload', () => {
            this.track('page_unload', { 
                duration: Date.now() - this.pageStartTime,
                scrollDepth: this.getScrollDepth()
            });
            this.flushEvents(true);
        });
    }

    trackPageView() {
        const pageData = {
            url: window.location.href,
            title: document.title,
            referrer: document.referrer,
            userAgent: navigator.userAgent,
            screenResolution: `${screen.width}x${screen.height}`,
            viewportSize: `${window.innerWidth}x${window.innerHeight}`,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timestamp: new Date().toISOString()
        };

        this.track('page_view', pageData);
    }

    setupPerformanceTracking() {
        if ('performance' in window) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    const paintEntries = performance.getEntriesByType('paint');
                    
                    const performanceMetrics = {
                        loadTime: Math.round(perfData.loadEventEnd - perfData.loadEventStart),
                        domContentLoaded: Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart),
                        firstPaint: paintEntries.find(entry => entry.name === 'first-paint')?.startTime || 0,
                        firstContentfulPaint: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
                        networkLatency: Math.round(perfData.responseEnd - perfData.requestStart),
                        serverResponseTime: Math.round(perfData.responseEnd - perfData.responseStart),
                        domProcessingTime: Math.round(perfData.domComplete - perfData.domLoading)
                    };

                    this.track('performance_metrics', performanceMetrics);
                }, 0);
            });

            // Track Core Web Vitals
            this.trackCoreWebVitals();
        }
    }

    trackCoreWebVitals() {
        // Largest Contentful Paint (LCP)
        if ('PerformanceObserver' in window) {
            try {
                const lcpObserver = new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    this.track('core_web_vital', {
                        metric: 'LCP',
                        value: Math.round(lastEntry.startTime),
                        rating: lastEntry.startTime < 2500 ? 'good' : lastEntry.startTime < 4000 ? 'needs-improvement' : 'poor'
                    });
                });
                lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

                // First Input Delay (FID)
                const fidObserver = new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    entries.forEach(entry => {
                        this.track('core_web_vital', {
                            metric: 'FID',
                            value: Math.round(entry.processingStart - entry.startTime),
                            rating: entry.processingStart - entry.startTime < 100 ? 'good' : 
                                   entry.processingStart - entry.startTime < 300 ? 'needs-improvement' : 'poor'
                        });
                    });
                });
                fidObserver.observe({ entryTypes: ['first-input'] });

                // Cumulative Layout Shift (CLS)
                let clsValue = 0;
                const clsObserver = new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    entries.forEach(entry => {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                        }
                    });
                    
                    this.track('core_web_vital', {
                        metric: 'CLS',
                        value: Math.round(clsValue * 1000) / 1000,
                        rating: clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs-improvement' : 'poor'
                    });
                });
                clsObserver.observe({ entryTypes: ['layout-shift'] });
            } catch (error) {
                console.warn('Core Web Vitals tracking not supported:', error);
            }
        }
    }

    setupErrorTracking() {
        // JavaScript errors
        window.addEventListener('error', (event) => {
            this.track('javascript_error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack,
                userAgent: navigator.userAgent,
                url: window.location.href
            });
        });

        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.track('unhandled_promise_rejection', {
                reason: event.reason?.toString(),
                stack: event.reason?.stack,
                url: window.location.href
            });
        });

        // Resource loading errors
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.track('resource_error', {
                    type: event.target.tagName,
                    source: event.target.src || event.target.href,
                    message: 'Failed to load resource'
                });
            }
        }, true);
    }

    setupUserInteractionTracking() {
        // Click tracking
        document.addEventListener('click', (event) => {
            const element = event.target.closest('a, button, [onclick], [data-track]');
            if (element) {
                const trackingData = {
                    elementType: element.tagName.toLowerCase(),
                    elementText: element.textContent?.trim().substring(0, 100),
                    elementId: element.id,
                    elementClass: element.className,
                    href: element.href,
                    position: { x: event.clientX, y: event.clientY }
                };

                // Special tracking for specific elements
                if (element.dataset.track) {
                    trackingData.trackingId = element.dataset.track;
                }

                this.track('click', trackingData);
            }
        });

        // Form interactions
        document.addEventListener('submit', (event) => {
            const form = event.target;
            this.track('form_submit', {
                formId: form.id,
                formClass: form.className,
                formAction: form.action,
                fieldCount: form.elements.length
            });
        });

        // Search tracking
        const searchInputs = document.querySelectorAll('input[type="search"], #hero-search');
        searchInputs.forEach(input => {
            let searchTimeout;
            input.addEventListener('input', (event) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    if (event.target.value.length > 2) {
                        this.track('search', {
                            query: event.target.value,
                            inputId: event.target.id,
                            queryLength: event.target.value.length
                        });
                    }
                }, 1000);
            });
        });

        // Scroll depth tracking
        let maxScrollDepth = 0;
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const scrollDepth = this.getScrollDepth();
                if (scrollDepth > maxScrollDepth) {
                    maxScrollDepth = scrollDepth;
                    
                    // Track scroll milestones
                    const milestones = [25, 50, 75, 90, 100];
                    const milestone = milestones.find(m => scrollDepth >= m && maxScrollDepth < m);
                    if (milestone) {
                        this.track('scroll_depth', { depth: milestone });
                    }
                }
            }, 250);
        });
    }

    startSessionTracking() {
        // Track session duration every 30 seconds
        setInterval(() => {
            this.track('session_heartbeat', {
                duration: Date.now() - this.pageStartTime,
                scrollDepth: this.getScrollDepth(),
                isActive: !document.hidden
            });
        }, 30000);
    }

    // Event tracking methods
    trackEvent(eventName, properties = {}) {
        this.track(`event_${eventName}`, properties);
    }

    trackEventView(eventSlug) {
        this.track('event_view', { eventSlug });
    }

    trackEventShare(eventSlug, method) {
        this.track('event_share', { eventSlug, method });
    }

    trackEventFavorite(eventSlug, action) {
        this.track('event_favorite', { eventSlug, action }); // action: 'add' or 'remove'
    }

    trackFilter(filterType, filterValue) {
        this.track('filter_applied', { filterType, filterValue });
    }

    trackSearch(query, resultsCount) {
        this.track('search_performed', { query, resultsCount });
    }

    trackAuth(action, method = 'email') {
        this.track('auth_action', { action, method }); // action: 'login', 'register', 'logout'
    }

    trackPWA(action) {
        this.track('pwa_action', { action }); // action: 'install', 'update', 'offline'
    }

    // Core tracking method
    track(eventType, properties = {}) {
        const event = {
            id: this.generateEventId(),
            type: eventType,
            sessionId: this.sessionId,
            userId: this.userId,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            properties: {
                ...properties,
                viewport: `${window.innerWidth}x${window.innerHeight}`,
                isOnline: this.isOnline
            }
        };

        this.events.push(event);

        // Flush events if buffer is getting full
        if (this.events.length >= 10) {
            this.flushEvents();
        }

        // Console log for development
        if (window.location.hostname === 'localhost') {
            console.log('📊 Analytics:', eventType, properties);
        }
    }

    generateEventId() {
        return 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    async flushEvents(isBeforeUnload = false) {
        if (this.events.length === 0) return;

        const eventsToSend = [...this.events];
        this.events = [];

        try {
            const method = isBeforeUnload ? 'sendBeacon' : 'fetch';
            
            if (method === 'sendBeacon' && 'sendBeacon' in navigator) {
                const success = navigator.sendBeacon(
                    '/api/analytics/events',
                    JSON.stringify({ events: eventsToSend })
                );
                if (!success) {
                    this.storeOfflineEvents(eventsToSend);
                }
            } else {
                const response = await fetch('/api/analytics/events', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ events: eventsToSend })
                });

                if (!response.ok) {
                    throw new Error('Analytics request failed');
                }
            }
        } catch (error) {
            console.warn('Analytics flush failed:', error);
            this.storeOfflineEvents(eventsToSend);
        }
    }

    storeOfflineEvents(events) {
        try {
            const offlineEvents = JSON.parse(localStorage.getItem('omekan_offline_analytics') || '[]');
            offlineEvents.push(...events);
            
            // Keep only last 100 events to prevent storage overflow
            const recentEvents = offlineEvents.slice(-100);
            localStorage.setItem('omekan_offline_analytics', JSON.stringify(recentEvents));
        } catch (error) {
            console.warn('Failed to store offline analytics:', error);
        }
    }

    async flushOfflineEvents() {
        try {
            const offlineEvents = JSON.parse(localStorage.getItem('omekan_offline_analytics') || '[]');
            if (offlineEvents.length === 0) return;

            const response = await fetch('/api/analytics/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ events: offlineEvents })
            });

            if (response.ok) {
                localStorage.removeItem('omekan_offline_analytics');
                console.log('Offline analytics synced:', offlineEvents.length, 'events');
            }
        } catch (error) {
            console.warn('Failed to flush offline analytics:', error);
        }
    }

    // Utility methods
    getScrollDepth() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
        return documentHeight > 0 ? Math.round((scrollTop / documentHeight) * 100) : 100;
    }

    // A/B Testing support
    getExperimentVariant(experimentName) {
        const storageKey = `experiment_${experimentName}`;
        let variant = localStorage.getItem(storageKey);
        
        if (!variant) {
            // Simple A/B split
            variant = Math.random() < 0.5 ? 'A' : 'B';
            localStorage.setItem(storageKey, variant);
            
            this.track('experiment_assigned', {
                experimentName,
                variant
            });
        }
        
        return variant;
    }

    // Conversion tracking
    trackConversion(conversionType, value = null) {
        this.track('conversion', {
            type: conversionType,
            value: value
        });
    }

    // Custom dimensions
    setCustomDimension(key, value) {
        this.customDimensions = this.customDimensions || {};
        this.customDimensions[key] = value;
    }

    // User properties
    setUserProperty(key, value) {
        this.track('user_property_set', {
            property: key,
            value: value
        });
    }

    // Funnel tracking
    trackFunnelStep(funnelName, stepName, stepNumber) {
        this.track('funnel_step', {
            funnelName,
            stepName,
            stepNumber
        });
    }

    // Heat map data collection
    collectHeatmapData() {
        const clicks = [];
        document.addEventListener('click', (event) => {
            clicks.push({
                x: event.clientX,
                y: event.clientY,
                timestamp: Date.now(),
                element: event.target.tagName.toLowerCase()
            });
            
            // Send heatmap data periodically
            if (clicks.length >= 50) {
                this.track('heatmap_data', { clicks: clicks.splice(0, 50) });
            }
        });
    }
}

// Initialize analytics
let analyticsManager;
document.addEventListener('DOMContentLoaded', () => {
    analyticsManager = new AnalyticsManager();
    
    // Make available globally for manual tracking
    window.analytics = {
        track: (event, properties) => analyticsManager.trackEvent(event, properties),
        trackEventView: (slug) => analyticsManager.trackEventView(slug),
        trackEventShare: (slug, method) => analyticsManager.trackEventShare(slug, method),
        trackEventFavorite: (slug, action) => analyticsManager.trackEventFavorite(slug, action),
        trackFilter: (type, value) => analyticsManager.trackFilter(type, value),
        trackSearch: (query, count) => analyticsManager.trackSearch(query, count),
        trackAuth: (action, method) => analyticsManager.trackAuth(action, method),
        trackPWA: (action) => analyticsManager.trackPWA(action),
        trackConversion: (type, value) => analyticsManager.trackConversion(type, value),
        setUserProperty: (key, value) => analyticsManager.setUserProperty(key, value),
        getExperiment: (name) => analyticsManager.getExperimentVariant(name)
    };
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalyticsManager;
}
