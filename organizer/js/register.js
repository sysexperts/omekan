const API_BASE_URL = 'http://localhost/api';

document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const registerData = {
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        website: formData.get('website') || null
    };

    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(registerData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert(data.message);
            localStorage.setItem('user', JSON.stringify(data.data));
            window.location.href = 'dashboard.html';
        } else {
            alert(data.message || 'Registrierung fehlgeschlagen');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Verbindungsfehler');
    }
});
