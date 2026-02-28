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
    
    eventsList.innerHTML = `
        <div style="margin-bottom: 1rem;">
            <a href="create-event.html" class="btn" style="display: inline-block; padding: 0.75rem 1.5rem; background: #3498db; color: white; text-decoration: none; border-radius: 4px;">+ Neues Event erstellen</a>
        </div>
        <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <thead>
                <tr style="background: #f8f9fa;">
                    <th style="text-align: left; padding: 1rem; border-bottom: 2px solid #dee2e6;">Titel</th>
                    <th style="text-align: left; padding: 1rem; border-bottom: 2px solid #dee2e6;">Slug</th>
                    <th style="text-align: left; padding: 1rem; border-bottom: 2px solid #dee2e6;">Ort</th>
                    <th style="text-align: center; padding: 1rem; border-bottom: 2px solid #dee2e6;">Promoted</th>
                    <th style="text-align: right; padding: 1rem; border-bottom: 2px solid #dee2e6;">Aktionen</th>
                </tr>
            </thead>
            <tbody>
                ${events.map(event => `
                    <tr style="border-bottom: 1px solid #f0f0f0;">
                        <td style="padding: 1rem;">
                            <strong>${event.title || event.slug}</strong>
                        </td>
                        <td style="padding: 1rem; color: #6c757d;">${event.slug}</td>
                        <td style="padding: 1rem; color: #6c757d;">${event.location_name || '-'}</td>
                        <td style="padding: 1rem; text-align: center;">
                            ${event.is_promoted ? '<span style="background: #28a745; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem;">Ja</span>' : '<span style="background: #6c757d; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem;">Nein</span>'}
                        </td>
                        <td style="padding: 1rem; text-align: right;">
                            <a href="edit-event.html?id=${event.id}" class="btn-edit" style="display: inline-block; padding: 0.5rem 1rem; background: #ffc107; color: #000; text-decoration: none; border-radius: 4px; margin-right: 0.5rem; font-size: 0.9rem;">✏️ Bearbeiten</a>
                            <button onclick="deleteEvent(${event.id}, '${event.title || event.slug}')" class="btn-delete" style="padding: 0.5rem 1rem; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem;">🗑️ Löschen</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function deleteEvent(eventId, eventTitle) {
    if (!confirm(`Möchtest du das Event "${eventTitle}" wirklich löschen?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Event erfolgreich gelöscht!');
            await loadEvents();
        } else {
            alert('Fehler beim Löschen: ' + (data.message || 'Unbekannter Fehler'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Verbindungsfehler beim Löschen');
    }
}

function logout() {
    localStorage.removeItem('user');
}
