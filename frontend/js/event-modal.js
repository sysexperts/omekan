// Event Detail Modal System
class EventModal {
    constructor() {
        this.modal = null;
        this.currentEvent = null;
        this.favorites = this.loadFavorites();
        this.init();
    }

    init() {
        this.createModal();
        this.setupEventListeners();
    }

    createModal() {
        const modalHTML = `
            <div id="event-modal" class="event-modal" style="display: none;">
                <div class="modal-backdrop" onclick="eventModal.close()"></div>
                <div class="modal-container">
                    <div class="modal-header">
                        <button class="modal-close" onclick="eventModal.close()">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div class="modal-content">
                        <div class="event-hero">
                            <div class="event-image-container">
                                <img id="modal-event-image" src="" alt="" class="event-hero-image">
                                <div class="event-hero-overlay">
                                    <div class="event-hero-content">
                                        <h1 id="modal-event-title" class="event-hero-title"></h1>
                                        <div class="event-hero-meta">
                                            <div class="event-date-time">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                                </svg>
                                                <span id="modal-event-datetime"></span>
                                            </div>
                                            <div class="event-location" id="modal-event-location-container" style="display: none;">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                                    <circle cx="12" cy="10" r="3"></circle>
                                                </svg>
                                                <span id="modal-event-location"></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="modal-body">
                            <div class="event-actions">
                                <button id="favorite-btn" class="action-btn favorite-btn" onclick="eventModal.toggleFavorite()">
                                    <svg class="heart-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                    </svg>
                                    <span class="favorite-text">Favorit</span>
                                </button>
                                
                                <button class="action-btn share-btn" onclick="eventModal.shareEvent()">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <circle cx="18" cy="5" r="3"></circle>
                                        <circle cx="6" cy="12" r="3"></circle>
                                        <circle cx="18" cy="19" r="3"></circle>
                                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                                    </svg>
                                    Teilen
                                </button>
                                
                                <button class="action-btn calendar-btn" onclick="eventModal.addToCalendar()">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                        <line x1="8" y1="14" x2="16" y2="14"></line>
                                        <line x1="12" y1="18" x2="12" y2="18"></line>
                                    </svg>
                                    Kalender
                                </button>
                            </div>

                            <div class="event-details">
                                <div class="event-description-section">
                                    <h3>Beschreibung</h3>
                                    <p id="modal-event-description" class="event-description-text"></p>
                                </div>

                                <div class="event-tags-section">
                                    <h3>Tags</h3>
                                    <div id="modal-event-tags" class="event-tags-list"></div>
                                </div>

                                <div class="event-artists-section" id="modal-artists-section" style="display: none;">
                                    <h3>Künstler</h3>
                                    <div id="modal-event-artists" class="event-artists-list"></div>
                                </div>

                                <div class="event-info-grid">
                                    <div class="info-item">
                                        <h4>Veranstalter</h4>
                                        <p id="modal-event-organizer">-</p>
                                    </div>
                                    <div class="info-item">
                                        <h4>Event-ID</h4>
                                        <p id="modal-event-id">-</p>
                                    </div>
                                </div>
                            </div>

                            <div class="event-cta">
                                <button id="modal-event-cta" class="cta-button" onclick="eventModal.openEventLink()">
                                    Event besuchen
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M7 17l9.2-9.2M17 17V7H7"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('event-modal');
    }

    setupEventListeners() {
        // ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display !== 'none') {
                this.close();
            }
        });

        // Prevent modal close when clicking inside modal content
        const modalContainer = this.modal.querySelector('.modal-container');
        modalContainer.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    async open(eventSlug) {
        try {
            // Show loading state
            this.modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';

            // Fetch event details
            const response = await fetch(`http://localhost/api/events/${eventSlug}`);
            const data = await response.json();

            if (data.status === 'success') {
                this.currentEvent = data.data;
                this.populateModal(this.currentEvent);
            } else {
                throw new Error('Event not found');
            }
        } catch (error) {
            console.error('Error loading event:', error);
            this.showError('Event konnte nicht geladen werden');
        }
    }

    populateModal(event) {
        // Basic info
        document.getElementById('modal-event-title').textContent = event.title || event.slug;
        document.getElementById('modal-event-description').textContent = event.description || 'Keine Beschreibung verfügbar';
        document.getElementById('modal-event-id').textContent = event.slug;

        // Image
        const imageUrl = event.image_path || '/frontend/images/default-event.svg';
        document.getElementById('modal-event-image').src = imageUrl;

        // Date and time
        if (event.start_datetime) {
            const eventDate = new Date(event.start_datetime);
            const formattedDate = eventDate.toLocaleDateString('de-DE', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            const formattedTime = eventDate.toLocaleTimeString('de-DE', {
                hour: '2-digit',
                minute: '2-digit'
            });
            document.getElementById('modal-event-datetime').textContent = `${formattedDate} um ${formattedTime}`;
        }

        // Location
        if (event.location_name) {
            document.getElementById('modal-event-location').textContent = event.location_name;
            document.getElementById('modal-event-location-container').style.display = 'flex';
        } else {
            document.getElementById('modal-event-location-container').style.display = 'none';
        }

        // Tags (Communities and Categories)
        const tagsContainer = document.getElementById('modal-event-tags');
        tagsContainer.innerHTML = '';
        
        if (event.communities) {
            event.communities.forEach(community => {
                const tag = document.createElement('span');
                tag.className = 'event-tag community';
                tag.textContent = `${community.flag_emoji || ''} ${community.name}`.trim();
                tagsContainer.appendChild(tag);
            });
        }

        if (event.categories) {
            event.categories.forEach(category => {
                const tag = document.createElement('span');
                tag.className = 'event-tag category';
                tag.textContent = category.name;
                tagsContainer.appendChild(tag);
            });
        }

        // Artists
        if (event.artists && event.artists.length > 0) {
            const artistsContainer = document.getElementById('modal-event-artists');
            artistsContainer.innerHTML = '';
            
            event.artists.forEach(artist => {
                const artistElement = document.createElement('div');
                artistElement.className = 'artist-item';
                artistElement.innerHTML = `
                    <div class="artist-info">
                        <h4>${artist.name}</h4>
                        ${artist.spotify_id ? `<a href="https://open.spotify.com/artist/${artist.spotify_id}" target="_blank" class="spotify-link">Spotify</a>` : ''}
                    </div>
                `;
                artistsContainer.appendChild(artistElement);
            });
            
            document.getElementById('modal-artists-section').style.display = 'block';
        } else {
            document.getElementById('modal-artists-section').style.display = 'none';
        }

        // Favorite button state
        this.updateFavoriteButton();

        // CTA Button
        const ctaButton = document.getElementById('modal-event-cta');
        if (event.affiliate_url) {
            ctaButton.textContent = 'Tickets kaufen';
            ctaButton.onclick = () => window.open(event.affiliate_url, '_blank');
        } else {
            ctaButton.textContent = 'Event Details';
            ctaButton.onclick = () => this.openEventLink();
        }
    }

    close() {
        this.modal.style.display = 'none';
        document.body.style.overflow = '';
        this.currentEvent = null;
    }

    toggleFavorite() {
        if (!this.currentEvent) return;

        const eventId = this.currentEvent.id;
        const isFavorite = this.favorites.includes(eventId);

        if (isFavorite) {
            this.favorites = this.favorites.filter(id => id !== eventId);
        } else {
            this.favorites.push(eventId);
        }

        this.saveFavorites();
        this.updateFavoriteButton();
        
        // Show toast notification
        this.showToast(isFavorite ? 'Aus Favoriten entfernt' : 'Zu Favoriten hinzugefügt');
    }

    updateFavoriteButton() {
        if (!this.currentEvent) return;

        const favoriteBtn = document.getElementById('favorite-btn');
        const heartIcon = favoriteBtn.querySelector('.heart-icon');
        const favoriteText = favoriteBtn.querySelector('.favorite-text');
        
        const isFavorite = this.favorites.includes(this.currentEvent.id);
        
        if (isFavorite) {
            favoriteBtn.classList.add('active');
            heartIcon.style.fill = 'currentColor';
            favoriteText.textContent = 'Favorit ✓';
        } else {
            favoriteBtn.classList.remove('active');
            heartIcon.style.fill = 'none';
            favoriteText.textContent = 'Favorit';
        }
    }

    async shareEvent() {
        if (!this.currentEvent) return;

        const shareData = {
            title: this.currentEvent.title || this.currentEvent.slug,
            text: this.currentEvent.description || 'Schau dir dieses Event an!',
            url: `${window.location.origin}/frontend/event-detail.html?slug=${this.currentEvent.slug}`
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                // Fallback: Copy to clipboard
                await navigator.clipboard.writeText(shareData.url);
                this.showToast('Link in Zwischenablage kopiert');
            }
        } catch (error) {
            console.error('Error sharing:', error);
            this.showToast('Fehler beim Teilen');
        }
    }

    addToCalendar() {
        if (!this.currentEvent || !this.currentEvent.start_datetime) return;

        const startDate = new Date(this.currentEvent.start_datetime);
        const endDate = this.currentEvent.end_datetime ? new Date(this.currentEvent.end_datetime) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // +2 hours default

        const formatDate = (date) => {
            return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        };

        const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(this.currentEvent.title || this.currentEvent.slug)}&dates=${formatDate(startDate)}/${formatDate(endDate)}&details=${encodeURIComponent(this.currentEvent.description || '')}&location=${encodeURIComponent(this.currentEvent.location_name || '')}`;

        window.open(calendarUrl, '_blank');
    }

    openEventLink() {
        if (!this.currentEvent) return;
        
        if (this.currentEvent.affiliate_url) {
            window.open(this.currentEvent.affiliate_url, '_blank');
        } else {
            window.open(`/frontend/event-detail.html?slug=${this.currentEvent.slug}`, '_blank');
        }
    }

    loadFavorites() {
        try {
            const favorites = localStorage.getItem('omekan_favorites');
            return favorites ? JSON.parse(favorites) : [];
        } catch (error) {
            console.error('Error loading favorites:', error);
            return [];
        }
    }

    saveFavorites() {
        try {
            localStorage.setItem('omekan_favorites', JSON.stringify(this.favorites));
        } catch (error) {
            console.error('Error saving favorites:', error);
        }
    }

    showToast(message) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        document.body.appendChild(toast);

        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);

        // Hide and remove toast
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }

    showError(message) {
        const modalContent = this.modal.querySelector('.modal-content');
        modalContent.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h3>Fehler</h3>
                <p>${message}</p>
                <button onclick="eventModal.close()" class="btn-primary">Schließen</button>
            </div>
        `;
    }
}

// Initialize global event modal
let eventModal;
document.addEventListener('DOMContentLoaded', () => {
    eventModal = new EventModal();
});

// Global function to open modal
function openEventModal(eventSlug) {
    if (eventModal) {
        eventModal.open(eventSlug);
    }
}
