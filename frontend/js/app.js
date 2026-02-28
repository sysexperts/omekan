const API_BASE_URL = 'http://localhost/api';

document.addEventListener('DOMContentLoaded', async () => {
    await loadEvents();
});

async function loadEvents() {
    try {
        const response = await fetch(`${API_BASE_URL}/events`);
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
        eventCard.innerHTML = `
            <h3>${event.slug}</h3>
            <p>Event-ID: ${event.id}</p>
            <p>Erstellt: ${new Date(event.created_at).toLocaleDateString('de-DE')}</p>
            ${event.affiliate_url ? `<a href="${event.affiliate_url}" target="_blank">Tickets</a>` : ''}
        `;
        eventList.appendChild(eventCard);
    });
}
