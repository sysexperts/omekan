const API_BASE_URL = 'http://localhost/api';

document.addEventListener('DOMContentLoaded', async () => {
    await loadEvents();
});

async function loadEvents() {
    try {
        const response = await fetch(`${API_BASE_URL}/events/list`);
        const data = await response.json();
        
        if (data.status === 'success' && data.data.length > 0) {
            displayEvents(data.data);
        } else {
            document.getElementById('event-list').innerHTML = '<p>Keine Events verfügbar</p>';
        }
    } catch (error) {
        console.error('Error loading events:', error);
        document.getElementById('event-list').innerHTML = '<p>Fehler beim Laden der Events</p>';
    }
}

function displayEvents(events) {
    const eventList = document.getElementById('event-list');
    eventList.innerHTML = '';
    
    events.forEach(event => {
        const eventCard = document.createElement('div');
        eventCard.className = 'event-card';
        eventCard.onclick = () => window.location.href = `event-detail.html?slug=${event.slug}`;
        
        let cardHTML = '';
        
        if (event.hero_video_path) {
            cardHTML += `<video src="${event.hero_video_path}" autoplay muted loop class="event-hero-video"></video>`;
        } else if (event.image_path) {
            cardHTML += `<img src="${event.image_path}" alt="${event.title}" class="event-image">`;
        }
        
        cardHTML += `
            <div class="event-card-content">
                <h3>${event.title}</h3>
                <p class="event-location">${event.location_name}</p>
                <p class="event-date">${formatDate(event.start_datetime)}</p>
                <div class="event-tags">
                    ${event.communities.map(c => `<span class="tag community-tag">${c.name}</span>`).join('')}
                    ${event.categories.map(c => `<span class="tag category-tag">${c.name}</span>`).join('')}
                </div>
            </div>
        `;
        
        eventCard.innerHTML = cardHTML;
        eventList.appendChild(eventCard);
    });
}

function formatDate(datetime) {
    if (!datetime) return 'Datum folgt';
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
