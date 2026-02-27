const API_BASE_URL = 'http://localhost/api';

document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert(data.message || 'Registrierung erfolgreich!');
            localStorage.setItem('user', JSON.stringify(data.data));
            window.location.href = 'dashboard.html';
        } else {
            alert(data.message || 'Registrierung fehlgeschlagen');
        }
    } catch (error) {
        console.error('Register error:', error);
        alert('Verbindungsfehler');
    }
});
