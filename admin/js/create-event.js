const API_BASE_URL = 'http://localhost/api';

document.addEventListener('DOMContentLoaded', async () => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    await loadCommunities();
    await loadCategories();

    document.getElementById('event-form').addEventListener('submit', handleSubmit);
});

async function loadCommunities() {
    const communitiesDiv = document.getElementById('communities-list');
    const communities = [
        { id: 1, name: 'Türkisch' },
        { id: 2, name: 'Griechisch' },
        { id: 3, name: 'Allgemein' }
    ];

    communities.forEach(community => {
        const label = document.createElement('label');
        label.style.display = 'block';
        label.style.marginBottom = '0.5rem';
        label.innerHTML = `
            <input type="checkbox" name="community_ids" value="${community.id}">
            ${community.name}
        `;
        communitiesDiv.appendChild(label);
    });
}

async function loadCategories() {
    const categoriesDiv = document.getElementById('categories-list');
    const categories = [
        { id: 1, name: 'Konzert' },
        { id: 2, name: 'Festival' },
        { id: 3, name: 'Party' },
        { id: 4, name: 'Kultur' }
    ];

    categories.forEach(category => {
        const label = document.createElement('label');
        label.style.display = 'block';
        label.style.marginBottom = '0.5rem';
        label.innerHTML = `
            <input type="checkbox" name="category_ids" value="${category.id}">
            ${category.name}
        `;
        categoriesDiv.appendChild(label);
    });
}

async function handleSubmit(e) {
    e.preventDefault();
    
    const user = JSON.parse(localStorage.getItem('user'));
    const formData = new FormData(e.target);
    
    const communityIds = Array.from(document.querySelectorAll('input[name="community_ids"]:checked'))
        .map(cb => parseInt(cb.value));
    
    const categoryIds = Array.from(document.querySelectorAll('input[name="category_ids"]:checked'))
        .map(cb => parseInt(cb.value));
    
    const eventData = {
        user_id: user.id,
        title: formData.get('title'),
        description: formData.get('description'),
        location_name: formData.get('location_name'),
        start_datetime: formData.get('start_datetime').replace('T', ' ') + ':00',
        end_datetime: formData.get('end_datetime').replace('T', ' ') + ':00',
        affiliate_url: formData.get('affiliate_url') || null,
        community_ids: communityIds,
        category_ids: categoryIds
    };

    try {
        const response = await fetch(`${API_BASE_URL}/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Event erfolgreich erstellt!');
            window.location.href = 'dashboard.html';
        } else {
            alert(data.message || 'Fehler beim Erstellen des Events');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Verbindungsfehler');
    }
}
