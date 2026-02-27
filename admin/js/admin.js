const API_BASE_URL = 'http://localhost/api';

document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    if (user.role !== 'admin') {
        alert('Nur Admins haben Zugriff');
        window.location.href = 'login.html';
        return;
    }
    
    console.log('Admin dashboard loaded for:', user.name);
});
