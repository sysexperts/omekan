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
    const content = document.getElementById('event-content');
    
    let html = '';
    
    if (event.hero_video_path) {
        html += `<video src="${event.hero_video_path}" controls class="event-detail-video"></video>`;
    } else if (event.image_path) {
        html += `<img src="${event.image_path}" alt="${event.title}" class="event-detail-image">`;
    }
    
    html += `
        <h1>${event.title}</h1>
        <p class="event-location"><strong>Ort:</strong> ${event.location_name}</p>
        <p class="event-organizer"><strong>Veranstalter:</strong> ${event.organizer_name}</p>
    `;
    
    if (event.description) {
        html += `<div class="event-description"><p>${event.description}</p></div>`;
    }
    
    if (event.occurrences && event.occurrences.length > 0) {
        html += '<h2>Termine</h2><ul class="event-occurrences">';
        event.occurrences.forEach(occ => {
            const cancelled = occ.is_cancelled ? ' <span class="cancelled">(Abgesagt)</span>' : '';
            html += `
                <li>
                    ${formatDateTime(occ.start_datetime)} - ${formatDateTime(occ.end_datetime)}${cancelled}
                </li>
            `;
        });
        html += '</ul>';
    }
    
    if (event.artists && event.artists.length > 0) {
        html += '<h2>Künstler</h2><div class="event-artists">';
        event.artists.forEach(artist => {
            html += `
                <div class="artist-card">
                    ${artist.image_path ? `<img src="${artist.image_path}" alt="${artist.name}" class="artist-image">` : ''}
                    <h3>${artist.name}</h3>
                    ${artist.spotify_id ? `<a href="https://open.spotify.com/artist/${artist.spotify_id}" target="_blank" class="spotify-link">Auf Spotify anhören</a>` : ''}
                </div>
            `;
        });
        html += '</div>';
    }
    
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
    
    if (event.affiliate_url) {
        html += `<a href="${event.affiliate_url}" target="_blank" class="btn-tickets">Tickets kaufen</a>`;
    }
    
    content.innerHTML = html;
}

function formatDateTime(datetime) {
    if (!datetime) return '';
    const date = new Date(datetime);
    return date.toLocaleDateString('de-DE', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
