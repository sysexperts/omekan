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
    
    await loadCommunities();
    
    document.getElementById('community-form').addEventListener('submit', handleSubmit);
});

async function loadCommunities() {
    try {
        const response = await fetch(`${API_BASE_URL}/communities`);
        const data = await response.json();
        
        if (data.status === 'success') {
            displayCommunities(data.data);
        } else {
            document.getElementById('communities-list').innerHTML = '<p>Fehler beim Laden</p>';
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('communities-list').innerHTML = '<p>Verbindungsfehler</p>';
    }
}

function displayCommunities(communities) {
    const list = document.getElementById('communities-list');
    
    if (communities.length === 0) {
        list.innerHTML = '<p>Keine Communities gefunden</p>';
        return;
    }
    
    list.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Flagge</th>
                    <th>Name</th>
                    <th>Slug</th>
                    <th>Vorschaubild</th>
                    <th>Status</th>
                    <th>Aktionen</th>
                </tr>
            </thead>
            <tbody>
                ${communities.map(com => `
                    <tr>
                        <td>${com.id}</td>
                        <td style="font-size: 1.5rem;">${com.flag_icon || '-'}</td>
                        <td>${com.name}</td>
                        <td>${com.slug}</td>
                        <td>${com.preview_image ? `<img src="${com.preview_image}" style="max-width: 50px; height: auto;">` : '-'}</td>
                        <td><span style="padding: 0.25rem 0.5rem; background: ${com.is_active ? '#27ae60' : '#95a5a6'}; color: white; border-radius: 4px; font-size: 0.85rem;">${com.is_active ? 'Aktiv' : 'Inaktiv'}</span></td>
                        <td>
                            <button onclick="editCommunity(${com.id})" style="padding: 0.5rem 1rem; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 0.5rem;">Bearbeiten</button>
                            <button onclick="deleteCommunity(${com.id})" style="padding: 0.5rem 1rem; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;">Löschen</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function showCreateModal() {
    document.getElementById('modal-title').textContent = 'Community erstellen';
    document.getElementById('community-form').reset();
    document.getElementById('community-id').value = '';
    document.getElementById('is_active').checked = true;
    document.getElementById('community-modal').style.display = 'flex';
}

async function editCommunity(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/communities`);
        const data = await response.json();
        
        if (data.status === 'success') {
            const community = data.data.find(c => c.id === id);
            if (community) {
                document.getElementById('modal-title').textContent = 'Community bearbeiten';
                document.getElementById('community-id').value = community.id;
                document.getElementById('name').value = community.name;
                document.getElementById('slug').value = community.slug;
                document.getElementById('flag_icon').value = community.flag_icon || '';
                document.getElementById('preview_image').value = community.preview_image || '';
                document.getElementById('is_active').checked = community.is_active;
                document.getElementById('community-modal').style.display = 'flex';
            }
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Fehler beim Laden der Community');
    }
}

async function deleteCommunity(id) {
    if (!confirm('Community wirklich löschen?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/communities/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Community gelöscht');
            await loadCommunities();
        } else {
            alert(data.message || 'Fehler beim Löschen');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Verbindungsfehler');
    }
}

async function handleSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('community-id').value;
    const communityData = {
        name: document.getElementById('name').value,
        slug: document.getElementById('slug').value,
        flag_icon: document.getElementById('flag_icon').value || null,
        preview_image: document.getElementById('preview_image').value || null,
        is_active: document.getElementById('is_active').checked
    };
    
    try {
        const url = id ? `${API_BASE_URL}/communities/${id}` : `${API_BASE_URL}/communities`;
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(communityData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert(data.message);
            closeModal();
            await loadCommunities();
        } else {
            alert(data.message || 'Fehler beim Speichern');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Verbindungsfehler');
    }
}

function closeModal() {
    document.getElementById('community-modal').style.display = 'none';
}

function logout() {
    localStorage.removeItem('user');
}
