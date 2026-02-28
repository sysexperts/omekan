const API_BASE_URL = 'http://localhost/api';

document.addEventListener('DOMContentLoaded', async () => {
    if (!initAdminSidebar('events')) return;

    await loadEvents();
});

async function loadEvents() {
    try {
        const response = await fetch(`${API_BASE_URL}/events`);
        const data = await response.json();
        
        if (data.status === 'success') {
            displayEvents(data.data);
        } else {
            document.getElementById('events-list').innerHTML = '<p>Keine Events gefunden</p>';
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('events-list').innerHTML = '<p>Fehler beim Laden</p>';
    }
}

function displayEvents(events) {
    const eventsList = document.getElementById('events-list');
    
    if (events.length === 0) {
        eventsList.innerHTML = '<p>Noch keine Events erstellt. <a href="create-event.html">Erstes Event erstellen</a></p>';
        return;
    }
    
    eventsList.innerHTML = '<table style="width: 100%; border-collapse: collapse;">' +
        '<thead><tr>' +
        '<th style="text-align: left; padding: 0.5rem; border-bottom: 2px solid #ddd;">ID</th>' +
        '<th style="text-align: left; padding: 0.5rem; border-bottom: 2px solid #ddd;">Slug</th>' +
        '<th style="text-align: left; padding: 0.5rem; border-bottom: 2px solid #ddd;">Promoted</th>' +
        '<th style="text-align: left; padding: 0.5rem; border-bottom: 2px solid #ddd;">Erstellt</th>' +
        '</tr></thead><tbody>' +
        events.map(event => `
            <tr>
                <td style="padding: 0.5rem; border-bottom: 1px solid #eee;">${event.id}</td>
                <td style="padding: 0.5rem; border-bottom: 1px solid #eee;">${event.slug}</td>
                <td style="padding: 0.5rem; border-bottom: 1px solid #eee;">${event.is_promoted ? 'Ja' : 'Nein'}</td>
                <td style="padding: 0.5rem; border-bottom: 1px solid #eee;">${new Date(event.created_at).toLocaleDateString('de-DE')}</td>
            </tr>
        `).join('') +
        '</tbody></table>';
}

function logout() {
    localStorage.removeItem('user');
}
