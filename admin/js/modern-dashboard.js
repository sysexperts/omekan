// Modern Admin Dashboard JavaScript
class AdminDashboard {
    constructor() {
        this.apiBaseUrl = 'http://localhost/api';
        this.stats = {};
        this.charts = {};
        this.activities = [];
        this.init();
    }

    async init() {
        this.setupSidebar();
        await this.loadDashboardData();
        this.renderStats();
        this.renderCharts();
        this.renderActivities();
        this.setupRealTimeUpdates();
    }

    setupSidebar() {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;

        const sidebarHTML = `
            <div class="sidebar-header">
                <div class="sidebar-logo">Omekan Admin</div>
            </div>
            <nav class="sidebar-nav">
                <div class="nav-section">
                    <div class="nav-section-title">Hauptmenü</div>
                    <a href="/admin/dashboard.html" class="nav-item active">
                        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="7" height="7"></rect>
                            <rect x="14" y="3" width="7" height="7"></rect>
                            <rect x="14" y="14" width="7" height="7"></rect>
                            <rect x="3" y="14" width="7" height="7"></rect>
                        </svg>
                        Dashboard
                    </a>
                    <a href="/admin/events.html" class="nav-item">
                        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        Events
                    </a>
                    <a href="/admin/communities.html" class="nav-item">
                        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        Communities
                    </a>
                    <a href="/admin/categories.html" class="nav-item">
                        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                        </svg>
                        Kategorien
                    </a>
                </div>
                <div class="nav-section">
                    <div class="nav-section-title">Verwaltung</div>
                    <a href="/admin/users.html" class="nav-item">
                        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        Benutzer
                    </a>
                    <a href="/admin/analytics.html" class="nav-item">
                        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 3v18h18"></path>
                            <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"></path>
                        </svg>
                        Analytics
                    </a>
                    <a href="/admin/settings.html" class="nav-item">
                        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                        </svg>
                        Einstellungen
                    </a>
                </div>
                <div class="nav-section">
                    <div class="nav-section-title">System</div>
                    <a href="/frontend/events.html" class="nav-item" target="_blank">
                        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15,3 21,3 21,9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                        Frontend ansehen
                    </a>
                </div>
            </nav>
        `;
        
        sidebar.innerHTML = sidebarHTML;
    }

    async loadDashboardData() {
        try {
            const [eventsResponse, communitiesResponse, categoriesResponse] = await Promise.all([
                fetch(`${this.apiBaseUrl}/events`),
                fetch(`${this.apiBaseUrl}/communities`),
                fetch(`${this.apiBaseUrl}/categories`)
            ]);

            const eventsData = await eventsResponse.json();
            const communitiesData = await communitiesResponse.json();
            const categoriesData = await categoriesResponse.json();

            // Calculate stats
            const events = eventsData.status === 'success' ? eventsData.data : [];
            const communities = communitiesData.status === 'success' ? communitiesData.data : [];
            const categories = categoriesData.status === 'success' ? categoriesData.data : [];

            this.stats = {
                totalEvents: events.length,
                activeEvents: events.filter(e => new Date(e.start_datetime) > new Date()).length,
                promotedEvents: events.filter(e => e.is_promoted).length,
                totalCommunities: communities.length,
                totalCategories: categories.length,
                eventsThisMonth: events.filter(e => {
                    const eventDate = new Date(e.start_datetime);
                    const now = new Date();
                    return eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear();
                }).length
            };

            // Generate mock activities
            this.activities = this.generateMockActivities(events);

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showError('Fehler beim Laden der Dashboard-Daten');
        }
    }

    renderStats() {
        const statsContainer = document.querySelector('.stats-grid');
        if (!statsContainer) return;

        const statsHTML = `
            <div class="stat-card">
                <div class="stat-header">
                    <div class="stat-title">Gesamt Events</div>
                    <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                </div>
                <div class="stat-value">${this.stats.totalEvents}</div>
                <div class="stat-change positive">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                        <polyline points="17 6 23 6 23 12"></polyline>
                    </svg>
                    +${Math.floor(Math.random() * 20 + 5)}% vs. letzter Monat
                </div>
            </div>

            <div class="stat-card success">
                <div class="stat-header">
                    <div class="stat-title">Aktive Events</div>
                    <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12,6 12,12 16,14"></polyline>
                    </svg>
                </div>
                <div class="stat-value">${this.stats.activeEvents}</div>
                <div class="stat-change positive">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                        <polyline points="17 6 23 6 23 12"></polyline>
                    </svg>
                    Kommende Events
                </div>
            </div>

            <div class="stat-card warning">
                <div class="stat-header">
                    <div class="stat-title">Featured Events</div>
                    <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                    </svg>
                </div>
                <div class="stat-value">${this.stats.promotedEvents}</div>
                <div class="stat-change neutral">
                    Promoted Events
                </div>
            </div>

            <div class="stat-card info">
                <div class="stat-header">
                    <div class="stat-title">Communities</div>
                    <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                </div>
                <div class="stat-value">${this.stats.totalCommunities}</div>
                <div class="stat-change positive">
                    Aktive Communities
                </div>
            </div>
        `;

        statsContainer.innerHTML = statsHTML;
    }

    renderCharts() {
        const chartsContainer = document.querySelector('.charts-grid');
        if (!chartsContainer) return;

        const chartsHTML = `
            <div class="chart-card">
                <div class="chart-header">
                    <div class="chart-title">Event Statistiken</div>
                    <div class="chart-filter">
                        <button class="filter-btn active">7T</button>
                        <button class="filter-btn">30T</button>
                        <button class="filter-btn">90T</button>
                    </div>
                </div>
                <div class="chart-placeholder">
                    📊 Event-Verlauf Chart (Integration mit Chart.js geplant)
                </div>
            </div>

            <div class="chart-card">
                <div class="chart-header">
                    <div class="chart-title">Top Communities</div>
                </div>
                <div class="chart-placeholder">
                    🥧 Community-Verteilung Chart
                </div>
            </div>
        `;

        chartsContainer.innerHTML = chartsHTML;

        // Setup chart filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                // Here you would update the chart data
            });
        });
    }

    renderActivities() {
        const activitiesContainer = document.querySelector('.activity-list');
        if (!activitiesContainer) return;

        const activitiesHTML = this.activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon ${activity.type}">
                    ${this.getActivityIcon(activity.type)}
                </div>
                <div class="activity-content">
                    <div class="activity-title">${activity.title}</div>
                    <div class="activity-description">${activity.description}</div>
                </div>
                <div class="activity-time">${activity.time}</div>
            </div>
        `).join('');

        activitiesContainer.innerHTML = activitiesHTML;
    }

    generateMockActivities(events) {
        const activities = [];
        const now = new Date();

        // Recent events
        events.slice(0, 3).forEach((event, index) => {
            activities.push({
                type: 'success',
                title: 'Neues Event erstellt',
                description: `"${event.title || event.slug}" wurde hinzugefügt`,
                time: `vor ${index + 1} Stunden`
            });
        });

        // System activities
        activities.push(
            {
                type: 'info',
                title: 'System Update',
                description: 'Dashboard wurde aktualisiert',
                time: 'vor 2 Stunden'
            },
            {
                type: 'warning',
                title: 'Backup erstellt',
                description: 'Automatisches Backup abgeschlossen',
                time: 'vor 6 Stunden'
            }
        );

        return activities.slice(0, 5);
    }

    getActivityIcon(type) {
        const icons = {
            success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20,6 9,17 4,12"></polyline></svg>',
            warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
            info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
            danger: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>'
        };
        return icons[type] || icons.info;
    }

    setupRealTimeUpdates() {
        // Simulate real-time updates every 30 seconds
        setInterval(() => {
            this.loadDashboardData().then(() => {
                this.renderStats();
            });
        }, 30000);
    }

    showError(message) {
        console.error(message);
        // You could add a toast notification here
    }
}

// Quick Actions Handler
class QuickActions {
    constructor() {
        this.setupQuickActions();
    }

    setupQuickActions() {
        const quickActionsContainer = document.querySelector('.quick-actions');
        if (!quickActionsContainer) return;

        const actionsHTML = `
            <a href="/admin/create-event.html" class="quick-action">
                <div class="quick-action-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                </div>
                <div class="quick-action-content">
                    <h3>Neues Event</h3>
                    <p>Event erstellen und veröffentlichen</p>
                </div>
            </a>

            <a href="/admin/events.html" class="quick-action">
                <div class="quick-action-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                </div>
                <div class="quick-action-content">
                    <h3>Events verwalten</h3>
                    <p>Bestehende Events bearbeiten</p>
                </div>
            </a>

            <a href="/admin/communities.html" class="quick-action">
                <div class="quick-action-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                </div>
                <div class="quick-action-content">
                    <h3>Communities</h3>
                    <p>Community-Einstellungen</p>
                </div>
            </a>

            <a href="/frontend/events.html" target="_blank" class="quick-action">
                <div class="quick-action-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15,3 21,3 21,9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                </div>
                <div class="quick-action-content">
                    <h3>Frontend</h3>
                    <p>Live-Seite ansehen</p>
                </div>
            </a>
        `;

        quickActionsContainer.innerHTML = actionsHTML;
    }
}

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
    new AdminDashboard();
    new QuickActions();
});

// Mobile Sidebar Toggle
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
}

// Add mobile menu button if needed
if (window.innerWidth <= 768) {
    const header = document.querySelector('.content-header');
    if (header) {
        const menuButton = document.createElement('button');
        menuButton.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
        `;
        menuButton.className = 'header-btn secondary';
        menuButton.onclick = toggleSidebar;
        header.insertBefore(menuButton, header.firstChild);
    }
}
