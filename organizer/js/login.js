const API_BASE_URL = 'http://localhost/api';

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const loginData = {
        email: formData.get('email'),
        password: formData.get('password')
    };

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            if (data.data.role !== 'organizer' && data.data.role !== 'admin') {
                alert('Nur Veranstalter haben Zugriff auf diesen Bereich');
                return;
            }
            
            localStorage.setItem('user', JSON.stringify(data.data));
            window.location.href = 'dashboard.html';
        } else {
            alert(data.message || 'Login fehlgeschlagen');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Verbindungsfehler');
    }
});
