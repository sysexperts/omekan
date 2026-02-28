// Modern Events Page JavaScript
class EventsManager {
    constructor() {
        this.apiBaseUrl = 'http://localhost/api';
        this.events = [];
        this.filteredEvents = [];
        this.currentPage = 1;
        this.eventsPerPage = 12;
        this.currentView = 'grid';
        this.filters = {
            community: '',
            category: '',
            date: '',
            search: ''
        };
        this.sortBy = 'date';
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadInitialData();
        this.renderEvents();
    }

    setupEventListeners() {
        // Search functionality
        const heroSearch = document.getElementById('hero-search');
        if (heroSearch) {
            heroSearch.addEventListener('input', this.debounce((e) => {
                this.filters.search = e.target.value;
                this.filterAndRenderEvents();
            }, 300));
        }

        // Filter controls
        const filterCommunity = document.getElementById('filter-community');
        const filterCategory = document.getElementById('filter-category');
        const filterDate = document.getElementById('filter-date');
        const sortEvents = document.getElementById('sort-events');

        if (filterCommunity) {
            filterCommunity.addEventListener('change', (e) => {
                this.filters.community = e.target.value;
                this.filterAndRenderEvents();
            });
        }

        if (filterCategory) {
            filterCategory.addEventListener('change', (e) => {
                this.filters.category = e.target.value;
                this.filterAndRenderEvents();
            });
        }

        if (filterDate) {
            filterDate.addEventListener('change', (e) => {
                this.filters.date = e.target.value;
                this.filterAndRenderEvents();
            });
        }

        if (sortEvents) {
            sortEvents.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.filterAndRenderEvents();
            });
        }

        // View toggle
        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                viewButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentView = e.target.dataset.view;
                this.updateViewMode();
            });
        });

        // Clear filters
        const clearFilters = document.getElementById('clear-filters');
        if (clearFilters) {
            clearFilters.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }

        // Load more
        const loadMore = document.getElementById('load-more');
        if (loadMore) {
            loadMore.addEventListener('click', () => {
                this.loadMoreEvents();
            });
        }

        // Infinite scroll
        window.addEventListener('scroll', this.debounce(() => {
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000) {
                this.loadMoreEvents();
            }
        }, 200));
    }

    async loadInitialData() {
        try {
            this.showLoading();
            
            // Load events, communities, and categories in parallel
            const [eventsResponse, communitiesResponse, categoriesResponse] = await Promise.all([
                fetch(`${this.apiBaseUrl}/events`),
                fetch(`${this.apiBaseUrl}/communities`),
                fetch(`${this.apiBaseUrl}/categories`)
            ]);

            const eventsData = await eventsResponse.json();
            const communitiesData = await communitiesResponse.json();
            const categoriesData = await categoriesResponse.json();

            if (eventsData.status === 'success') {
                this.events = eventsData.data || [];
                this.filteredEvents = [...this.events];
            }

            // Populate filter dropdowns
            this.populateFilterDropdowns(
                communitiesData.status === 'success' ? communitiesData.data : [],
                categoriesData.status === 'success' ? categoriesData.data : []
            );

            // Load promoted events
            await this.loadPromotedEvents();

        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showError('Fehler beim Laden der Events');
        } finally {
            this.hideLoading();
        }
    }

    async loadPromotedEvents() {
        try {
            const promotedEvents = this.events.filter(event => event.is_promoted);
            this.renderPromotedEvents(promotedEvents);
        } catch (error) {
            console.error('Error loading promoted events:', error);
        }
    }

    populateFilterDropdowns(communities, categories) {
        const communitySelect = document.getElementById('filter-community');
        const categorySelect = document.getElementById('filter-category');

        if (communitySelect && communities) {
            communities.forEach(community => {
                const option = document.createElement('option');
                option.value = community.id;
                option.textContent = `${community.flag_emoji || ''} ${community.name}`.trim();
                communitySelect.appendChild(option);
            });
        }

        if (categorySelect && categories) {
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categorySelect.appendChild(option);
            });
        }
    }

    filterAndRenderEvents() {
        this.filteredEvents = this.events.filter(event => {
            // Search filter
            if (this.filters.search) {
                const searchTerm = this.filters.search.toLowerCase();
                const matchesSearch = 
                    event.title?.toLowerCase().includes(searchTerm) ||
                    event.description?.toLowerCase().includes(searchTerm) ||
                    event.location_name?.toLowerCase().includes(searchTerm);
                if (!matchesSearch) return false;
            }

            // Community filter
            if (this.filters.community) {
                const hasMatchingCommunity = event.communities?.some(
                    community => community.id == this.filters.community
                );
                if (!hasMatchingCommunity) return false;
            }

            // Category filter
            if (this.filters.category) {
                const hasMatchingCategory = event.categories?.some(
                    category => category.id == this.filters.category
                );
                if (!hasMatchingCategory) return false;
            }

            // Date filter
            if (this.filters.date) {
                const eventDate = new Date(event.start_datetime);
                const filterDate = new Date(this.filters.date);
                if (eventDate.toDateString() !== filterDate.toDateString()) return false;
            }

            return true;
        });

        // Sort events
        this.sortEvents();
        
        // Reset pagination
        this.currentPage = 1;
        
        // Render filtered events
        this.renderEvents();
    }

    sortEvents() {
        this.filteredEvents.sort((a, b) => {
            switch (this.sortBy) {
                case 'title':
                    return (a.title || '').localeCompare(b.title || '');
                case 'location':
                    return (a.location_name || '').localeCompare(b.location_name || '');
                case 'date':
                default:
                    return new Date(a.start_datetime) - new Date(b.start_datetime);
            }
        });
    }

    renderEvents() {
        const eventsGrid = document.getElementById('events-grid');
        const noEventsDiv = document.getElementById('no-events');
        
        if (!eventsGrid) return;

        if (this.filteredEvents.length === 0) {
            eventsGrid.innerHTML = '';
            if (noEventsDiv) noEventsDiv.style.display = 'block';
            return;
        }

        if (noEventsDiv) noEventsDiv.style.display = 'none';

        const eventsToShow = this.filteredEvents.slice(0, this.currentPage * this.eventsPerPage);
        eventsGrid.innerHTML = eventsToShow.map(event => this.createEventCard(event)).join('');

        // Update load more button
        this.updateLoadMoreButton();
    }

    renderPromotedEvents(promotedEvents) {
        const promotedGrid = document.getElementById('promoted-events');
        if (!promotedGrid || promotedEvents.length === 0) return;

        promotedGrid.innerHTML = promotedEvents.slice(0, 3).map(event => 
            this.createPromotedEventCard(event)
        ).join('');
    }

    createEventCard(event) {
        const eventDate = new Date(event.start_datetime);
        const formattedDate = eventDate.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        const formattedTime = eventDate.toLocaleTimeString('de-DE', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const imageUrl = event.image_path ? event.image_path : '/frontend/images/default-event.svg';
        const communities = event.communities || [];
        const categories = event.categories || [];

        return `
            <div class="event-card" onclick="window.open('/frontend/event-detail.html?slug=${event.slug}', '_blank')">
                <div class="event-image">
                    <img src="${imageUrl}" alt="${event.title}" onerror="this.src='/frontend/images/default-event.svg'">
                    ${event.is_promoted ? '<div class="event-promoted">Featured</div>' : ''}
                </div>
                <div class="event-content">
                    <h3 class="event-title">${event.title || event.slug}</h3>
                    ${event.description ? `<p class="event-description">${event.description}</p>` : ''}
                    
                    <div class="event-meta">
                        <div class="event-meta-item">
                            <svg class="event-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            ${formattedDate} um ${formattedTime}
                        </div>
                        ${event.location_name ? `
                            <div class="event-meta-item">
                                <svg class="event-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                    <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                                ${event.location_name}
                            </div>
                        ` : ''}
                    </div>

                    <div class="event-tags">
                        ${communities.map(community => 
                            `<span class="event-tag community">${community.flag_emoji || ''} ${community.name}</span>`
                        ).join('')}
                        ${categories.map(category => 
                            `<span class="event-tag category">${category.name}</span>`
                        ).join('')}
                    </div>

                    <div class="event-footer">
                        <span class="event-date">${formattedDate}</span>
                        <a href="/frontend/event-detail.html?slug=${event.slug}" class="event-link" onclick="event.stopPropagation()">
                            Details
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    createPromotedEventCard(event) {
        const eventDate = new Date(event.start_datetime);
        const formattedDate = eventDate.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });

        const imageUrl = event.image_path ? event.image_path : '/frontend/images/default-event.svg';

        return `
            <div class="promoted-card" onclick="window.open('/frontend/event-detail.html?slug=${event.slug}', '_blank')">
                <div class="promoted-image">
                    <img src="${imageUrl}" alt="${event.title}" onerror="this.src='/frontend/images/default-event.svg'">
                    <div class="promoted-overlay">
                        <div class="promoted-content">
                            <h3>${event.title || event.slug}</h3>
                            <p>${event.location_name || ''}</p>
                            <span class="promoted-date">${formattedDate}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    updateViewMode() {
        const eventsGrid = document.getElementById('events-grid');
        if (eventsGrid) {
            eventsGrid.className = this.currentView === 'list' ? 'events-grid list-view' : 'events-grid';
        }
    }

    loadMoreEvents() {
        const totalPages = Math.ceil(this.filteredEvents.length / this.eventsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.renderEvents();
        }
    }

    updateLoadMoreButton() {
        const loadMoreBtn = document.getElementById('load-more');
        if (loadMoreBtn) {
            const totalPages = Math.ceil(this.filteredEvents.length / this.eventsPerPage);
            loadMoreBtn.style.display = this.currentPage < totalPages ? 'block' : 'none';
        }
    }

    clearAllFilters() {
        this.filters = {
            community: '',
            category: '',
            date: '',
            search: ''
        };

        // Reset form elements
        const heroSearch = document.getElementById('hero-search');
        const filterCommunity = document.getElementById('filter-community');
        const filterCategory = document.getElementById('filter-category');
        const filterDate = document.getElementById('filter-date');
        const sortEvents = document.getElementById('sort-events');

        if (heroSearch) heroSearch.value = '';
        if (filterCommunity) filterCommunity.value = '';
        if (filterCategory) filterCategory.value = '';
        if (filterDate) filterDate.value = '';
        if (sortEvents) sortEvents.value = 'date';

        this.sortBy = 'date';
        this.filterAndRenderEvents();
    }

    showLoading() {
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = 'block';
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = 'none';
    }

    showError(message) {
        console.error(message);
        // You could add a toast notification here
        alert(message);
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Additional CSS for promoted cards
const promotedStyles = `
    .promoted-card {
        position: relative;
        border-radius: 16px;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.3s ease;
        height: 300px;
    }

    .promoted-card:hover {
        transform: scale(1.02);
    }

    .promoted-image {
        position: relative;
        width: 100%;
        height: 100%;
    }

    .promoted-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .promoted-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.8) 100%);
        display: flex;
        align-items: flex-end;
        padding: 2rem;
    }

    .promoted-content {
        color: white;
    }

    .promoted-content h3 {
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
    }

    .promoted-content p {
        opacity: 0.9;
        margin-bottom: 0.5rem;
    }

    .promoted-date {
        background: rgba(255, 255, 255, 0.2);
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.875rem;
        font-weight: 500;
    }
`;

// Inject promoted styles
const styleSheet = document.createElement('style');
styleSheet.textContent = promotedStyles;
document.head.appendChild(styleSheet);

// Initialize the events manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new EventsManager();
});

// Add smooth scroll behavior for navigation
document.addEventListener('click', (e) => {
    if (e.target.matches('a[href^="#"]')) {
        e.preventDefault();
        const target = document.querySelector(e.target.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
});

// Add keyboard navigation support
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        // Clear search when ESC is pressed
        const heroSearch = document.getElementById('hero-search');
        if (heroSearch && document.activeElement === heroSearch) {
            heroSearch.value = '';
            heroSearch.dispatchEvent(new Event('input'));
        }
    }
});

// Add intersection observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe event cards for scroll animations
setTimeout(() => {
    document.querySelectorAll('.event-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
}, 100);
