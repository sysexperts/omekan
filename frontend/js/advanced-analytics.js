// Advanced Analytics Dashboard
class AdvancedAnalytics {
    constructor() {
        this.apiBaseUrl = 'http://localhost/api';
        this.charts = {};
        this.realTimeData = {};
        this.websocket = null;
        this.init();
    }

    async init() {
        await this.loadAnalyticsData();
        this.setupRealTimeUpdates();
        this.renderDashboard();
        this.setupEventListeners();
    }

    async loadAnalyticsData() {
        try {
            const [
                eventsResponse,
                performanceResponse,
                userBehaviorResponse,
                conversionResponse
            ] = await Promise.all([
                fetch(`${this.apiBaseUrl}/analytics/events-summary`),
                fetch(`${this.apiBaseUrl}/analytics/performance`),
                fetch(`${this.apiBaseUrl}/analytics/user-behavior`),
                fetch(`${this.apiBaseUrl}/analytics/conversions`)
            ]);

            this.analyticsData = {
                events: await this.safeJsonParse(eventsResponse),
                performance: await this.safeJsonParse(performanceResponse),
                userBehavior: await this.safeJsonParse(userBehaviorResponse),
                conversions: await this.safeJsonParse(conversionResponse)
            };

        } catch (error) {
            console.error('Error loading analytics data:', error);
            this.analyticsData = this.getMockAnalyticsData();
        }
    }

    async safeJsonParse(response) {
        try {
            if (response.ok) {
                return await response.json();
            }
            return { status: 'error', data: [] };
        } catch (error) {
            return { status: 'error', data: [] };
        }
    }

    getMockAnalyticsData() {
        const now = new Date();
        const last30Days = Array.from({ length: 30 }, (_, i) => {
            const date = new Date(now);
            date.setDate(date.getDate() - (29 - i));
            return {
                date: date.toISOString().split('T')[0],
                pageViews: Math.floor(Math.random() * 1000) + 500,
                uniqueVisitors: Math.floor(Math.random() * 300) + 200,
                eventViews: Math.floor(Math.random() * 200) + 100,
                conversions: Math.floor(Math.random() * 20) + 5
            };
        });

        return {
            events: {
                status: 'success',
                data: {
                    totalPageViews: 25000,
                    uniqueVisitors: 8500,
                    eventViews: 12000,
                    averageSessionDuration: 245,
                    bounceRate: 0.35,
                    dailyStats: last30Days
                }
            },
            performance: {
                status: 'success',
                data: {
                    averageLoadTime: 1250,
                    averageFCP: 800,
                    averageLCP: 1800,
                    averageFID: 45,
                    averageCLS: 0.08,
                    performanceScore: 92
                }
            },
            userBehavior: {
                status: 'success',
                data: {
                    topPages: [
                        { page: '/frontend/events.html', views: 15000, avgTime: 180 },
                        { page: '/frontend/event-detail.html', views: 8000, avgTime: 120 },
                        { page: '/admin/dashboard.html', views: 2000, avgTime: 300 }
                    ],
                    topEvents: [
                        { title: 'Summer Festival 2026', views: 2500, favorites: 450 },
                        { title: 'Jazz Night Downtown', views: 1800, favorites: 320 },
                        { title: 'Tech Conference 2026', views: 1500, favorites: 280 }
                    ],
                    deviceTypes: [
                        { type: 'Mobile', percentage: 65 },
                        { type: 'Desktop', percentage: 30 },
                        { type: 'Tablet', percentage: 5 }
                    ]
                }
            },
            conversions: {
                status: 'success',
                data: {
                    totalConversions: 1250,
                    conversionRate: 0.048,
                    topConversions: [
                        { type: 'event_favorite', count: 800 },
                        { type: 'event_share', count: 300 },
                        { type: 'user_registration', count: 150 }
                    ]
                }
            }
        };
    }

    renderDashboard() {
        this.renderOverviewStats();
        this.renderTrafficChart();
        this.renderPerformanceMetrics();
        this.renderUserBehavior();
        this.renderConversionFunnel();
        this.renderRealTimeStats();
    }

    renderOverviewStats() {
        const statsContainer = document.getElementById('analytics-overview');
        if (!statsContainer) return;

        const data = this.analyticsData.events.data;
        
        const statsHTML = `
            <div class="analytics-stats-grid">
                <div class="stat-card primary">
                    <div class="stat-icon">📊</div>
                    <div class="stat-content">
                        <div class="stat-value">${this.formatNumber(data.totalPageViews)}</div>
                        <div class="stat-label">Seitenaufrufe</div>
                        <div class="stat-change positive">+12.5% vs. letzter Monat</div>
                    </div>
                </div>
                
                <div class="stat-card success">
                    <div class="stat-icon">👥</div>
                    <div class="stat-content">
                        <div class="stat-value">${this.formatNumber(data.uniqueVisitors)}</div>
                        <div class="stat-label">Unique Visitors</div>
                        <div class="stat-change positive">+8.3% vs. letzter Monat</div>
                    </div>
                </div>
                
                <div class="stat-card warning">
                    <div class="stat-icon">🎭</div>
                    <div class="stat-content">
                        <div class="stat-value">${this.formatNumber(data.eventViews)}</div>
                        <div class="stat-label">Event Views</div>
                        <div class="stat-change positive">+15.7% vs. letzter Monat</div>
                    </div>
                </div>
                
                <div class="stat-card info">
                    <div class="stat-icon">⏱️</div>
                    <div class="stat-content">
                        <div class="stat-value">${this.formatDuration(data.averageSessionDuration)}</div>
                        <div class="stat-label">Avg. Session</div>
                        <div class="stat-change neutral">${(data.bounceRate * 100).toFixed(1)}% Bounce Rate</div>
                    </div>
                </div>
            </div>
        `;

        statsContainer.innerHTML = statsHTML;
    }

    renderTrafficChart() {
        const chartContainer = document.getElementById('traffic-chart');
        if (!chartContainer) return;

        const data = this.analyticsData.events.data.dailyStats;
        
        // Simple ASCII chart for now (would use Chart.js in production)
        const chartHTML = `
            <div class="chart-container">
                <div class="chart-header">
                    <h3>Traffic Verlauf (30 Tage)</h3>
                    <div class="chart-legend">
                        <span class="legend-item primary">Seitenaufrufe</span>
                        <span class="legend-item success">Unique Visitors</span>
                    </div>
                </div>
                <div class="chart-placeholder">
                    <canvas id="traffic-canvas" width="800" height="300"></canvas>
                    <div class="chart-fallback">
                        📈 Traffic Chart (Chart.js Integration geplant)
                        <br>Durchschnitt: ${this.formatNumber(data.reduce((sum, day) => sum + day.pageViews, 0) / data.length)} Seitenaufrufe/Tag
                    </div>
                </div>
            </div>
        `;

        chartContainer.innerHTML = chartHTML;
    }

    renderPerformanceMetrics() {
        const container = document.getElementById('performance-metrics');
        if (!container) return;

        const data = this.analyticsData.performance.data;
        
        const metricsHTML = `
            <div class="performance-grid">
                <div class="metric-card">
                    <div class="metric-header">
                        <h4>Core Web Vitals</h4>
                        <div class="metric-score ${this.getPerformanceRating(data.performanceScore)}">
                            ${data.performanceScore}/100
                        </div>
                    </div>
                    <div class="metric-details">
                        <div class="metric-item">
                            <span class="metric-name">LCP</span>
                            <span class="metric-value ${this.getLCPRating(data.averageLCP)}">${data.averageLCP}ms</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-name">FID</span>
                            <span class="metric-value ${this.getFIDRating(data.averageFID)}">${data.averageFID}ms</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-name">CLS</span>
                            <span class="metric-value ${this.getCLSRating(data.averageCLS)}">${data.averageCLS}</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-name">FCP</span>
                            <span class="metric-value ${this.getFCPRating(data.averageFCP)}">${data.averageFCP}ms</span>
                        </div>
                    </div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-header">
                        <h4>Load Performance</h4>
                        <div class="metric-trend positive">↗ +5.2%</div>
                    </div>
                    <div class="metric-chart">
                        <div class="load-time-bar">
                            <div class="load-segment dns" style="width: 15%;" title="DNS: 150ms"></div>
                            <div class="load-segment connect" style="width: 20%;" title="Connect: 200ms"></div>
                            <div class="load-segment request" style="width: 25%;" title="Request: 300ms"></div>
                            <div class="load-segment response" style="width: 40%;" title="Response: 600ms"></div>
                        </div>
                        <div class="load-time-total">Total: ${data.averageLoadTime}ms</div>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = metricsHTML;
    }

    renderUserBehavior() {
        const container = document.getElementById('user-behavior');
        if (!container) return;

        const data = this.analyticsData.userBehavior.data;
        
        const behaviorHTML = `
            <div class="behavior-grid">
                <div class="behavior-card">
                    <h4>Top Seiten</h4>
                    <div class="page-list">
                        ${data.topPages.map(page => `
                            <div class="page-item">
                                <div class="page-info">
                                    <div class="page-name">${page.page}</div>
                                    <div class="page-stats">${this.formatNumber(page.views)} Views • ${page.avgTime}s Avg.</div>
                                </div>
                                <div class="page-bar">
                                    <div class="page-bar-fill" style="width: ${(page.views / data.topPages[0].views) * 100}%"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="behavior-card">
                    <h4>Beliebte Events</h4>
                    <div class="event-list">
                        ${data.topEvents.map(event => `
                            <div class="event-item">
                                <div class="event-info">
                                    <div class="event-name">${event.title}</div>
                                    <div class="event-stats">${this.formatNumber(event.views)} Views • ${event.favorites} ❤️</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="behavior-card">
                    <h4>Geräte-Verteilung</h4>
                    <div class="device-chart">
                        ${data.deviceTypes.map(device => `
                            <div class="device-item">
                                <div class="device-label">${device.type}</div>
                                <div class="device-bar">
                                    <div class="device-bar-fill" style="width: ${device.percentage}%"></div>
                                </div>
                                <div class="device-percentage">${device.percentage}%</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = behaviorHTML;
    }

    renderConversionFunnel() {
        const container = document.getElementById('conversion-funnel');
        if (!container) return;

        const data = this.analyticsData.conversions.data;
        
        const funnelHTML = `
            <div class="funnel-container">
                <div class="funnel-header">
                    <h4>Conversion Funnel</h4>
                    <div class="funnel-rate">${(data.conversionRate * 100).toFixed(1)}% Rate</div>
                </div>
                <div class="funnel-steps">
                    <div class="funnel-step" style="width: 100%;">
                        <div class="step-label">Seitenbesuche</div>
                        <div class="step-value">26,000</div>
                    </div>
                    <div class="funnel-step" style="width: 80%;">
                        <div class="step-label">Event Views</div>
                        <div class="step-value">20,800</div>
                    </div>
                    <div class="funnel-step" style="width: 45%;">
                        <div class="step-label">Event Details</div>
                        <div class="step-value">11,700</div>
                    </div>
                    <div class="funnel-step" style="width: 15%;">
                        <div class="step-label">Favoriten</div>
                        <div class="step-value">3,900</div>
                    </div>
                    <div class="funnel-step" style="width: 5%;">
                        <div class="step-label">Conversions</div>
                        <div class="step-value">${this.formatNumber(data.totalConversions)}</div>
                    </div>
                </div>
                
                <div class="conversion-types">
                    <h5>Top Conversions</h5>
                    ${data.topConversions.map(conversion => `
                        <div class="conversion-item">
                            <span class="conversion-type">${this.formatConversionType(conversion.type)}</span>
                            <span class="conversion-count">${this.formatNumber(conversion.count)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        container.innerHTML = funnelHTML;
    }

    renderRealTimeStats() {
        const container = document.getElementById('realtime-stats');
        if (!container) return;

        const realtimeHTML = `
            <div class="realtime-container">
                <div class="realtime-header">
                    <h4>Real-Time Aktivität</h4>
                    <div class="realtime-indicator">
                        <div class="pulse-dot"></div>
                        Live
                    </div>
                </div>
                
                <div class="realtime-metrics">
                    <div class="realtime-metric">
                        <div class="metric-value" id="active-users">0</div>
                        <div class="metric-label">Aktive Nutzer</div>
                    </div>
                    <div class="realtime-metric">
                        <div class="metric-value" id="page-views-minute">0</div>
                        <div class="metric-label">Views/Min</div>
                    </div>
                    <div class="realtime-metric">
                        <div class="metric-value" id="events-viewed">0</div>
                        <div class="metric-label">Events angesehen</div>
                    </div>
                </div>
                
                <div class="realtime-activity">
                    <h5>Letzte Aktivitäten</h5>
                    <div id="activity-feed" class="activity-feed"></div>
                </div>
            </div>
        `;

        container.innerHTML = realtimeHTML;
        this.startRealTimeUpdates();
    }

    setupRealTimeUpdates() {
        // Simulate real-time updates (would use WebSocket in production)
        setInterval(() => {
            this.updateRealTimeStats();
        }, 5000);
    }

    updateRealTimeStats() {
        // Simulate real-time data
        const activeUsers = Math.floor(Math.random() * 50) + 10;
        const pageViewsPerMinute = Math.floor(Math.random() * 20) + 5;
        const eventsViewed = Math.floor(Math.random() * 10) + 2;

        const activeUsersEl = document.getElementById('active-users');
        const pageViewsEl = document.getElementById('page-views-minute');
        const eventsViewedEl = document.getElementById('events-viewed');

        if (activeUsersEl) activeUsersEl.textContent = activeUsers;
        if (pageViewsEl) pageViewsEl.textContent = pageViewsPerMinute;
        if (eventsViewedEl) eventsViewedEl.textContent = eventsViewed;

        // Update activity feed
        this.updateActivityFeed();
    }

    updateActivityFeed() {
        const feedContainer = document.getElementById('activity-feed');
        if (!feedContainer) return;

        const activities = [
            'Nutzer hat "Summer Festival" favorisiert',
            'Neuer Nutzer registriert aus Berlin',
            'Event "Jazz Night" wurde geteilt',
            'Admin hat neues Event erstellt',
            'Nutzer hat nach "Konzert" gesucht'
        ];

        const randomActivity = activities[Math.floor(Math.random() * activities.length)];
        const timestamp = new Date().toLocaleTimeString('de-DE');

        const activityHTML = `
            <div class="activity-item new">
                <div class="activity-time">${timestamp}</div>
                <div class="activity-text">${randomActivity}</div>
            </div>
        `;

        feedContainer.insertAdjacentHTML('afterbegin', activityHTML);

        // Keep only last 10 activities
        const items = feedContainer.querySelectorAll('.activity-item');
        if (items.length > 10) {
            items[items.length - 1].remove();
        }

        // Remove 'new' class after animation
        setTimeout(() => {
            const newItem = feedContainer.querySelector('.activity-item.new');
            if (newItem) newItem.classList.remove('new');
        }, 1000);
    }

    setupEventListeners() {
        // Date range selector
        const dateRangeSelect = document.getElementById('analytics-date-range');
        if (dateRangeSelect) {
            dateRangeSelect.addEventListener('change', (e) => {
                this.loadAnalyticsData(e.target.value);
            });
        }

        // Export functionality
        const exportBtn = document.getElementById('export-analytics');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportAnalyticsData();
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('refresh-analytics');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadAnalyticsData();
            });
        }
    }

    startRealTimeUpdates() {
        // Start real-time activity simulation
        this.updateRealTimeStats();
    }

    // Utility methods
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    formatConversionType(type) {
        const types = {
            'event_favorite': 'Event Favorit',
            'event_share': 'Event Teilen',
            'user_registration': 'Registrierung',
            'event_view': 'Event Ansicht',
            'search_performed': 'Suche'
        };
        return types[type] || type;
    }

    getPerformanceRating(score) {
        if (score >= 90) return 'excellent';
        if (score >= 70) return 'good';
        if (score >= 50) return 'needs-improvement';
        return 'poor';
    }

    getLCPRating(lcp) {
        if (lcp <= 2500) return 'good';
        if (lcp <= 4000) return 'needs-improvement';
        return 'poor';
    }

    getFIDRating(fid) {
        if (fid <= 100) return 'good';
        if (fid <= 300) return 'needs-improvement';
        return 'poor';
    }

    getCLSRating(cls) {
        if (cls <= 0.1) return 'good';
        if (cls <= 0.25) return 'needs-improvement';
        return 'poor';
    }

    getFCPRating(fcp) {
        if (fcp <= 1800) return 'good';
        if (fcp <= 3000) return 'needs-improvement';
        return 'poor';
    }

    // Export functionality
    exportAnalyticsData() {
        const data = {
            exportDate: new Date().toISOString(),
            overview: this.analyticsData.events.data,
            performance: this.analyticsData.performance.data,
            userBehavior: this.analyticsData.userBehavior.data,
            conversions: this.analyticsData.conversions.data
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `omekan-analytics-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // A/B Testing results
    renderABTestResults() {
        const container = document.getElementById('ab-test-results');
        if (!container) return;

        const mockABTests = [
            {
                name: 'Hero Section Layout',
                variants: [
                    { name: 'Original', conversions: 245, visitors: 5000, rate: 4.9 },
                    { name: 'New Design', conversions: 289, visitors: 5000, rate: 5.78 }
                ],
                status: 'running',
                confidence: 95
            },
            {
                name: 'Event Card Design',
                variants: [
                    { name: 'Card A', conversions: 156, visitors: 3000, rate: 5.2 },
                    { name: 'Card B', conversions: 178, visitors: 3000, rate: 5.93 }
                ],
                status: 'completed',
                confidence: 87
            }
        ];

        const abTestHTML = `
            <div class="ab-test-container">
                <div class="ab-test-header">
                    <h4>A/B Test Ergebnisse</h4>
                </div>
                ${mockABTests.map(test => `
                    <div class="ab-test-item">
                        <div class="test-header">
                            <h5>${test.name}</h5>
                            <span class="test-status ${test.status}">${test.status}</span>
                        </div>
                        <div class="test-variants">
                            ${test.variants.map(variant => `
                                <div class="variant-item">
                                    <div class="variant-name">${variant.name}</div>
                                    <div class="variant-stats">
                                        <span class="conversion-rate">${variant.rate}%</span>
                                        <span class="conversion-count">${variant.conversions}/${this.formatNumber(variant.visitors)}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="test-confidence">Confidence: ${test.confidence}%</div>
                    </div>
                `).join('')}
            </div>
        `;

        container.innerHTML = abTestHTML;
    }
}

// Initialize Advanced Analytics
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('analytics-overview')) {
        new AdvancedAnalytics();
    }
});

// Export for global access
window.AdvancedAnalytics = AdvancedAnalytics;
