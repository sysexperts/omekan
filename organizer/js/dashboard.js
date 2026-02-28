const API_BASE_URL = 'http://localhost/api';

document.addEventListener('DOMContentLoaded', async () => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    if (user.role !== 'organizer' && user.role !== 'admin') {
        alert('Kein Zugriff');
        window.location.href = 'login.html';
        return;
    }
    
    document.getElementById('user-name').textContent = user.name;
    
    await loadStats();
});

async function loadStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/events`);
        const data = await response.json();
        
        if (data.status === 'success') {
            document.getElementById('event-count').textContent = data.data.length;
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function logout() {
    localStorage.removeItem('user');
}
