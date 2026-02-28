const API_BASE_URL = 'http://localhost/api';

document.addEventListener('DOMContentLoaded', async () => {
    if (!initAdminSidebar('dashboard')) return;
    
    await loadStats();
});

async function loadStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/stats`);
        const data = await response.json();
        
        if (data.status === 'success') {
            const stats = data.data;
            document.getElementById('total-users').textContent = stats.total_users || 0;
            document.getElementById('total-organizers').textContent = stats.total_organizers || 0;
            document.getElementById('total-events').textContent = stats.total_events || 0;
            document.getElementById('pending-reviews').textContent = 0;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        document.getElementById('total-users').textContent = 'Error';
        document.getElementById('total-organizers').textContent = 'Error';
        document.getElementById('total-events').textContent = 'Error';
        document.getElementById('pending-reviews').textContent = 'Error';
    }
}
