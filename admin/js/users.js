const API_BASE_URL = 'http://localhost/api';

document.addEventListener('DOMContentLoaded', async () => {
    if (!initAdminSidebar('users')) return;
    
    await loadUsers();
});

async function loadUsers() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users`);
        const data = await response.json();
        
        if (data.status === 'success') {
            displayUsers(data.data);
        } else {
            document.getElementById('users-list').innerHTML = '<p>Fehler beim Laden der User</p>';
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('users-list').innerHTML = '<p>Verbindungsfehler</p>';
    }
}

function displayUsers(users) {
    const usersList = document.getElementById('users-list');
    
    if (users.length === 0) {
        usersList.innerHTML = '<p>Keine User gefunden</p>';
        return;
    }
    
    usersList.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>E-Mail</th>
                    <th>Rolle</th>
                </tr>
            </thead>
            <tbody>
                ${users.map(user => `
                    <tr>
                        <td>${user.id}</td>
                        <td>${user.name}</td>
                        <td>${user.email}</td>
                        <td><span style="padding: 0.25rem 0.5rem; background: ${user.role === 'admin' ? '#e74c3c' : '#3498db'}; color: white; border-radius: 4px; font-size: 0.85rem;">${user.role}</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}
