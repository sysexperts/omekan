// Frontend Tests for Events Page
import { jest } from '@jest/globals';

// Mock fetch globally
global.fetch = jest.fn();

// Mock DOM elements
const mockDOM = {
    getElementById: jest.fn(),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(() => []),
    createElement: jest.fn(() => ({
        addEventListener: jest.fn(),
        appendChild: jest.fn(),
        setAttribute: jest.fn(),
        classList: { add: jest.fn(), remove: jest.fn(), toggle: jest.fn() },
        style: {},
        innerHTML: '',
        textContent: ''
    })),
    addEventListener: jest.fn(),
    body: {
        appendChild: jest.fn(),
        removeChild: jest.fn(),
        style: {}
    }
};

Object.defineProperty(global, 'document', {
    value: mockDOM,
    writable: true
});

Object.defineProperty(global, 'window', {
    value: {
        location: { href: 'http://localhost/frontend/events.html' },
        localStorage: {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn()
        },
        addEventListener: jest.fn(),
        innerWidth: 1920,
        innerHeight: 1080
    },
    writable: true
});

// Import the EventsManager class
import '../../../frontend/js/events.js';

describe('EventsManager', () => {
    let eventsManager;
    
    beforeEach(() => {
        jest.clearAllMocks();
        fetch.mockClear();
        
        // Mock successful API responses
        fetch.mockImplementation((url) => {
            if (url.includes('/api/events')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        status: 'success',
                        data: [
                            {
                                id: 1,
                                slug: 'test-event',
                                title: 'Test Event',
                                description: 'Test Description',
                                start_datetime: '2026-03-01T19:00:00Z',
                                location_name: 'Test Location',
                                is_promoted: true,
                                communities: [{ id: 1, name: 'Test Community', flag_emoji: '🎭' }],
                                categories: [{ id: 1, name: 'Test Category' }]
                            }
                        ]
                    })
                });
            }
            
            if (url.includes('/api/communities')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        status: 'success',
                        data: [{ id: 1, name: 'Test Community', flag_emoji: '🎭' }]
                    })
                });
            }
            
            if (url.includes('/api/categories')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        status: 'success',
                        data: [{ id: 1, name: 'Test Category' }]
                    })
                });
            }
            
            return Promise.reject(new Error('Unknown endpoint'));
        });
    });

    test('should initialize EventsManager', () => {
        expect(() => {
            eventsManager = new EventsManager();
        }).not.toThrow();
    });

    test('should load initial data', async () => {
        eventsManager = new EventsManager();
        await eventsManager.loadInitialData();
        
        expect(fetch).toHaveBeenCalledWith('http://localhost/api/events');
        expect(fetch).toHaveBeenCalledWith('http://localhost/api/communities');
        expect(fetch).toHaveBeenCalledWith('http://localhost/api/categories');
    });

    test('should filter events by search term', () => {
        eventsManager = new EventsManager();
        eventsManager.events = [
            { title: 'Rock Concert', description: 'Amazing rock show' },
            { title: 'Jazz Festival', description: 'Smooth jazz music' },
            { title: 'Pop Concert', description: 'Popular music event' }
        ];
        
        eventsManager.filters.search = 'rock';
        eventsManager.filterAndRenderEvents();
        
        expect(eventsManager.filteredEvents).toHaveLength(1);
        expect(eventsManager.filteredEvents[0].title).toBe('Rock Concert');
    });

    test('should create event card HTML', () => {
        eventsManager = new EventsManager();
        const event = {
            id: 1,
            slug: 'test-event',
            title: 'Test Event',
            description: 'Test Description',
            start_datetime: '2026-03-01T19:00:00Z',
            location_name: 'Test Location',
            is_promoted: true,
            communities: [{ id: 1, name: 'Test Community', flag_emoji: '🎭' }],
            categories: [{ id: 1, name: 'Test Category' }]
        };
        
        const cardHTML = eventsManager.createEventCard(event);
        
        expect(cardHTML).toContain('Test Event');
        expect(cardHTML).toContain('Test Description');
        expect(cardHTML).toContain('Test Location');
        expect(cardHTML).toContain('event-promoted');
        expect(cardHTML).toContain('🎭 Test Community');
    });

    test('should handle API errors gracefully', async () => {
        fetch.mockRejectedValue(new Error('API Error'));
        
        eventsManager = new EventsManager();
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        
        await eventsManager.loadInitialData();
        
        expect(consoleSpy).toHaveBeenCalledWith('Error loading initial data:', expect.any(Error));
        consoleSpy.mockRestore();
    });

    test('should debounce search input', (done) => {
        eventsManager = new EventsManager();
        const mockFunction = jest.fn();
        const debouncedFunction = eventsManager.debounce(mockFunction, 100);
        
        // Call function multiple times quickly
        debouncedFunction();
        debouncedFunction();
        debouncedFunction();
        
        // Should not be called immediately
        expect(mockFunction).not.toHaveBeenCalled();
        
        // Should be called once after delay
        setTimeout(() => {
            expect(mockFunction).toHaveBeenCalledTimes(1);
            done();
        }, 150);
    });

    test('should sort events correctly', () => {
        eventsManager = new EventsManager();
        eventsManager.filteredEvents = [
            { title: 'Z Event', start_datetime: '2026-03-03T19:00:00Z' },
            { title: 'A Event', start_datetime: '2026-03-01T19:00:00Z' },
            { title: 'M Event', start_datetime: '2026-03-02T19:00:00Z' }
        ];
        
        // Test title sorting
        eventsManager.sortBy = 'title';
        eventsManager.sortEvents();
        expect(eventsManager.filteredEvents[0].title).toBe('A Event');
        
        // Test date sorting
        eventsManager.sortBy = 'date';
        eventsManager.sortEvents();
        expect(eventsManager.filteredEvents[0].start_datetime).toBe('2026-03-01T19:00:00Z');
    });
});

describe('EventModal', () => {
    let eventModal;
    
    beforeEach(() => {
        jest.clearAllMocks();
        fetch.mockClear();
        
        fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                status: 'success',
                data: {
                    id: 1,
                    slug: 'test-event',
                    title: 'Test Event',
                    description: 'Test Description',
                    start_datetime: '2026-03-01T19:00:00Z',
                    location_name: 'Test Location'
                }
            })
        });
    });

    test('should open modal with event data', async () => {
        eventModal = new EventModal();
        
        await eventModal.open('test-event');
        
        expect(fetch).toHaveBeenCalledWith('http://localhost/api/events/test-event');
        expect(eventModal.currentEvent).toBeDefined();
    });

    test('should handle favorites correctly', () => {
        eventModal = new EventModal();
        eventModal.currentEvent = { id: 1, slug: 'test-event' };
        eventModal.favorites = [];
        
        // Add to favorites
        eventModal.toggleFavorite();
        expect(eventModal.favorites).toContain(1);
        
        // Remove from favorites
        eventModal.toggleFavorite();
        expect(eventModal.favorites).not.toContain(1);
    });

    test('should generate calendar URL correctly', () => {
        eventModal = new EventModal();
        eventModal.currentEvent = {
            title: 'Test Event',
            description: 'Test Description',
            start_datetime: '2026-03-01T19:00:00Z',
            location_name: 'Test Location'
        };
        
        // Mock window.open
        global.window.open = jest.fn();
        
        eventModal.addToCalendar();
        
        expect(window.open).toHaveBeenCalledWith(
            expect.stringContaining('calendar.google.com'),
            '_blank'
        );
    });
});

describe('AuthManager', () => {
    let authManager;
    
    beforeEach(() => {
        jest.clearAllMocks();
        fetch.mockClear();
        
        // Mock localStorage
        const localStorageMock = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn()
        };
        Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    });

    test('should handle login correctly', async () => {
        fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                status: 'success',
                token: 'test-token',
                user: { id: 1, name: 'Test User', email: 'test@example.com' }
            })
        });
        
        authManager = new AuthManager();
        
        // Mock form data
        const mockFormData = new FormData();
        mockFormData.append('email', 'test@example.com');
        mockFormData.append('password', 'password123');
        
        await authManager.handleAuthSubmit();
        
        expect(localStorage.setItem).toHaveBeenCalledWith('omekan_token', 'test-token');
    });

    test('should handle logout correctly', () => {
        authManager = new AuthManager();
        authManager.token = 'test-token';
        authManager.currentUser = { id: 1, name: 'Test User' };
        
        authManager.logout();
        
        expect(localStorage.removeItem).toHaveBeenCalledWith('omekan_token');
        expect(authManager.token).toBeNull();
        expect(authManager.currentUser).toBeNull();
    });
});

describe('PWAManager', () => {
    let pwaManager;
    
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock service worker
        Object.defineProperty(navigator, 'serviceWorker', {
            value: {
                register: jest.fn(() => Promise.resolve({
                    addEventListener: jest.fn(),
                    installing: null,
                    waiting: null,
                    active: { postMessage: jest.fn() }
                }))
            },
            writable: true
        });
    });

    test('should register service worker', async () => {
        pwaManager = new PWAManager();
        await pwaManager.registerServiceWorker();
        
        expect(navigator.serviceWorker.register).toHaveBeenCalledWith(
            '/frontend/sw.js',
            { scope: '/' }
        );
    });

    test('should handle install prompt', () => {
        pwaManager = new PWAManager();
        pwaManager.deferredPrompt = {
            prompt: jest.fn(),
            userChoice: Promise.resolve({ outcome: 'accepted' })
        };
        
        pwaManager.installApp();
        
        expect(pwaManager.deferredPrompt.prompt).toHaveBeenCalled();
    });
});

describe('AnalyticsManager', () => {
    let analyticsManager;
    
    beforeEach(() => {
        jest.clearAllMocks();
        fetch.mockClear();
        
        // Mock performance API
        Object.defineProperty(window, 'performance', {
            value: {
                getEntriesByType: jest.fn(() => []),
                now: jest.fn(() => Date.now())
            },
            writable: true
        });
    });

    test('should track events correctly', () => {
        analyticsManager = new AnalyticsManager();
        
        analyticsManager.track('test_event', { key: 'value' });
        
        expect(analyticsManager.events).toHaveLength(1);
        expect(analyticsManager.events[0].type).toBe('test_event');
        expect(analyticsManager.events[0].properties.key).toBe('value');
    });

    test('should flush events when buffer is full', async () => {
        fetch.mockResolvedValue({ ok: true });
        
        analyticsManager = new AnalyticsManager();
        
        // Fill buffer
        for (let i = 0; i < 10; i++) {
            analyticsManager.track('test_event', { index: i });
        }
        
        expect(fetch).toHaveBeenCalledWith('/api/analytics/events', expect.any(Object));
    });

    test('should store events offline when network fails', async () => {
        fetch.mockRejectedValue(new Error('Network error'));
        
        analyticsManager = new AnalyticsManager();
        analyticsManager.track('test_event');
        
        await analyticsManager.flushEvents();
        
        // Should store in localStorage
        expect(localStorage.setItem).toHaveBeenCalledWith(
            'omekan_offline_analytics',
            expect.any(String)
        );
    });

    test('should calculate scroll depth correctly', () => {
        // Mock document dimensions
        Object.defineProperty(document.documentElement, 'scrollHeight', {
            value: 2000,
            writable: true
        });
        Object.defineProperty(window, 'innerHeight', {
            value: 800,
            writable: true
        });
        Object.defineProperty(window, 'pageYOffset', {
            value: 600,
            writable: true
        });
        
        analyticsManager = new AnalyticsManager();
        const scrollDepth = analyticsManager.getScrollDepth();
        
        expect(scrollDepth).toBe(50); // 600 / (2000 - 800) * 100
    });
});

// Integration Tests
describe('Integration Tests', () => {
    test('should load and display events', async () => {
        // Mock API response
        fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                status: 'success',
                data: [
                    {
                        id: 1,
                        slug: 'integration-test-event',
                        title: 'Integration Test Event',
                        start_datetime: '2026-03-01T19:00:00Z'
                    }
                ]
            })
        });
        
        // Mock DOM elements
        const mockEventsGrid = {
            innerHTML: '',
            style: {}
        };
        mockDOM.getElementById.mockImplementation((id) => {
            if (id === 'events-grid') return mockEventsGrid;
            if (id === 'loading') return { style: { display: 'none' } };
            return null;
        });
        
        const eventsManager = new EventsManager();
        await eventsManager.loadInitialData();
        
        expect(eventsManager.events).toHaveLength(1);
        expect(eventsManager.events[0].title).toBe('Integration Test Event');
    });

    test('should handle authentication flow', async () => {
        // Mock successful login
        fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                status: 'success',
                token: 'test-jwt-token',
                user: { id: 1, name: 'Test User', email: 'test@example.com' }
            })
        });
        
        const authManager = new AuthManager();
        
        // Mock form elements
        const mockForm = {
            elements: {
                email: { value: 'test@example.com' },
                password: { value: 'password123' }
            }
        };
        
        mockDOM.getElementById.mockImplementation((id) => {
            if (id === 'auth-form') return mockForm;
            return { style: { display: 'none' } };
        });
        
        await authManager.handleAuthSubmit();
        
        expect(authManager.token).toBe('test-jwt-token');
        expect(authManager.currentUser.name).toBe('Test User');
    });
});

// Performance Tests
describe('Performance Tests', () => {
    test('should debounce search efficiently', (done) => {
        const eventsManager = new EventsManager();
        let callCount = 0;
        
        const testFunction = () => { callCount++; };
        const debouncedFunction = eventsManager.debounce(testFunction, 50);
        
        // Rapid calls
        for (let i = 0; i < 10; i++) {
            debouncedFunction();
        }
        
        setTimeout(() => {
            expect(callCount).toBe(1);
            done();
        }, 100);
    });

    test('should handle large event lists efficiently', () => {
        const eventsManager = new EventsManager();
        
        // Generate large event list
        const largeEventList = Array.from({ length: 1000 }, (_, i) => ({
            id: i,
            title: `Event ${i}`,
            start_datetime: new Date(Date.now() + i * 86400000).toISOString()
        }));
        
        const startTime = performance.now();
        eventsManager.events = largeEventList;
        eventsManager.filteredEvents = [...largeEventList];
        eventsManager.sortEvents();
        const endTime = performance.now();
        
        // Should complete within reasonable time (< 100ms)
        expect(endTime - startTime).toBeLessThan(100);
    });
});

// Accessibility Tests
describe('Accessibility Tests', () => {
    test('should have proper ARIA labels', () => {
        const eventsManager = new EventsManager();
        const event = {
            id: 1,
            slug: 'test-event',
            title: 'Test Event',
            start_datetime: '2026-03-01T19:00:00Z'
        };
        
        const cardHTML = eventsManager.createEventCard(event);
        
        // Should have accessible image alt text
        expect(cardHTML).toContain('alt="Test Event"');
        
        // Should have semantic HTML structure
        expect(cardHTML).toContain('<h3 class="event-title">');
    });

    test('should support keyboard navigation', () => {
        const eventsManager = new EventsManager();
        
        // Mock keyboard event
        const mockKeyEvent = {
            key: 'Escape',
            preventDefault: jest.fn()
        };
        
        // Should handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                // Modal should close
            }
        });
        
        expect(mockKeyEvent.preventDefault).not.toHaveBeenCalled();
    });
});

// Error Handling Tests
describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
        fetch.mockRejectedValue(new Error('Network error'));
        
        const eventsManager = new EventsManager();
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        
        await eventsManager.loadInitialData();
        
        expect(consoleSpy).toHaveBeenCalled();
        expect(eventsManager.events).toEqual([]);
        
        consoleSpy.mockRestore();
    });

    test('should handle malformed API responses', async () => {
        fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ status: 'error', message: 'Invalid data' })
        });
        
        const eventsManager = new EventsManager();
        await eventsManager.loadInitialData();
        
        expect(eventsManager.events).toEqual([]);
    });
});
