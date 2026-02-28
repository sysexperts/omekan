const API_BASE_URL = 'http://localhost/api';

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');
    
    if (!slug) {
        document.getElementById('event-content').innerHTML = '<p>Event nicht gefunden</p>';
        return;
    }
    
    await loadEventDetail(slug);
});

async function loadEventDetail(slug) {
    try {
        const response = await fetch(`${API_BASE_URL}/events/${slug}`);
        const data = await response.json();
        
        if (data.status === 'success' && data.data) {
            displayEventDetail(data.data);
        } else {
            document.getElementById('event-content').innerHTML = '<p>Event nicht gefunden</p>';
        }
    } catch (error) {
        console.error('Error loading event:', error);
        document.getElementById('event-content').innerHTML = '<p>Fehler beim Laden des Events</p>';
    }
}

function displayEventDetail(event) {
    // Hero Media
    const heroMedia = document.getElementById('hero-media');
    if (event.hero_video_path) {
        heroMedia.innerHTML = `<video src="${event.hero_video_path}" autoplay muted loop></video>`;
    } else if (event.image_path) {
        heroMedia.innerHTML = `<img src="${event.image_path}" alt="${event.title}">`;
    }
    
    // Main Content
    const content = document.getElementById('event-content');
    let html = `
        <h1>${event.title}</h1>
        
        <div class="event-meta">
            <div class="meta-item">
                <span class="meta-icon">📍</span>
                <span>${event.location_name || 'Ort wird bekannt gegeben'}</span>
            </div>
            <div class="meta-item">
                <span class="meta-icon">👤</span>
                <span>${event.organizer_name || 'Veranstalter'}</span>
            </div>
        </div>
    `;
    
    if (event.description) {
        html += `<div class="event-description">${event.description}</div>`;
    }
    
    // Termine
    if (event.occurrences && event.occurrences.length > 0) {
        html += '<div class="event-section"><h2>📅 Termine</h2><ul class="event-occurrences">';
        event.occurrences.forEach(occ => {
            const cancelled = occ.is_cancelled ? ' <span class="cancelled">✖ Abgesagt</span>' : '';
            html += `
                <li>
                    <span class="occurrence-icon">🗓️</span>
                    <div>
                        <strong>${formatDate(occ.start_datetime)}</strong><br>
                        ${formatTime(occ.start_datetime)} - ${formatTime(occ.end_datetime)}${cancelled}
                    </div>
                </li>
            `;
        });
        html += '</ul></div>';
    }
    
    // Künstler
    if (event.artists && event.artists.length > 0) {
        html += '<div class="event-section"><h2>🎤 Künstler</h2><div class="event-artists">';
        event.artists.forEach(artist => {
            html += `
                <div class="artist-card">
                    ${artist.image_path ? `<img src="${artist.image_path}" alt="${artist.name}" class="artist-image">` : '<div class="artist-image" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem;">🎵</div>'}
                    <h3>${artist.name}</h3>
                    ${artist.spotify_id ? `<a href="https://open.spotify.com/artist/${artist.spotify_id}" target="_blank" class="spotify-link">🎵 Auf Spotify</a>` : ''}
                </div>
            `;
        });
        html += '</div></div>';
    }
    
    // Tags
    html += '<div class="event-tags">';
    if (event.communities && event.communities.length > 0) {
        event.communities.forEach(c => {
            html += `<span class="tag community-tag">${c.name}</span>`;
        });
    }
    if (event.categories && event.categories.length > 0) {
        event.categories.forEach(c => {
            html += `<span class="tag category-tag">${c.name}</span>`;
        });
    }
    html += '</div>';
    
    content.innerHTML = html;
    
    // Sidebar
    const sidebar = document.getElementById('event-sidebar-content');
    let sidebarHtml = '<div class="sidebar-card">';
    
    // Datum & Zeit
    if (event.occurrences && event.occurrences.length > 0) {
        const firstOcc = event.occurrences[0];
        sidebarHtml += `
            <div class="sidebar-info">
                <div class="sidebar-info-item">
                    <span class="sidebar-info-icon">📅</span>
                    <div class="sidebar-info-content">
                        <div class="sidebar-info-label">Datum</div>
                        <div class="sidebar-info-value">${formatDate(firstOcc.start_datetime)}</div>
                    </div>
                </div>
                <div class="sidebar-info-item">
                    <span class="sidebar-info-icon">🕐</span>
                    <div class="sidebar-info-content">
                        <div class="sidebar-info-label">Uhrzeit</div>
                        <div class="sidebar-info-value">${formatTime(firstOcc.start_datetime)} - ${formatTime(firstOcc.end_datetime)}</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Location
    if (event.location_name) {
        sidebarHtml += `
            <div class="sidebar-info-item" style="margin-top: 1rem;">
                <span class="sidebar-info-icon">📍</span>
                <div class="sidebar-info-content">
                    <div class="sidebar-info-label">Ort</div>
                    <div class="sidebar-info-value">${event.location_name}</div>
                </div>
            </div>
        `;
    }
    
    // Tickets Button
    if (event.affiliate_url) {
        sidebarHtml += `<a href="${event.affiliate_url}" target="_blank" class="btn-tickets">🎟️ Tickets kaufen</a>`;
    }
    
    sidebarHtml += '</div>';
    sidebar.innerHTML = sidebarHtml;
}

function formatDate(datetime) {
    if (!datetime) return '';
    const date = new Date(datetime);
    return date.toLocaleDateString('de-DE', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
    });
}

function formatTime(datetime) {
    if (!datetime) return '';
    const date = new Date(datetime);
    return date.toLocaleTimeString('de-DE', { 
        hour: '2-digit',
        minute: '2-digit'
    });
}

