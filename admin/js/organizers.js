const API_BASE_URL = 'http://localhost/api';

document.addEventListener('DOMContentLoaded', async () => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    if (user.role !== 'admin') {
        alert('Nur Admins haben Zugriff auf diesen Bereich');
        window.location.href = 'login.html';
        return;
    }
    
    document.getElementById('user-name').textContent = user.name;
    
    await loadOrganizers();
});

async function loadOrganizers() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/organizers`);
        const data = await response.json();
        
        if (data.status === 'success') {
            displayOrganizers(data.data);
        } else {
            document.getElementById('organizers-list').innerHTML = '<p>Fehler beim Laden der Veranstalter</p>';
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('organizers-list').innerHTML = '<p>Verbindungsfehler</p>';
    }
}

function displayOrganizers(organizers) {
    const organizersList = document.getElementById('organizers-list');
    
    if (organizers.length === 0) {
        organizersList.innerHTML = '<p>Keine Veranstalter gefunden</p>';
        return;
    }
    
    organizersList.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Display Name</th>
                    <th>User</th>
                    <th>E-Mail</th>
                    <th>Website</th>
                    <th>Partner</th>
                    <th>Token</th>
                </tr>
            </thead>
            <tbody>
                ${organizers.map(org => `
                    <tr>
                        <td>${org.id}</td>
                        <td>${org.display_name}</td>
                        <td>${org.user_name || 'N/A'}</td>
                        <td>${org.user_email || 'N/A'}</td>
                        <td>${org.website ? `<a href="${org.website}" target="_blank">Link</a>` : '-'}</td>
                        <td>${org.is_partner ? 'Ja' : 'Nein'}</td>
                        <td>${org.token_balance}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function logout() {
    localStorage.removeItem('user');
}
