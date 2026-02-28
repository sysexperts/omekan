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
    
    await loadCategories();
    
    document.getElementById('category-form').addEventListener('submit', handleSubmit);
});

async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        const data = await response.json();
        
        if (data.status === 'success') {
            displayCategories(data.data);
        } else {
            document.getElementById('categories-list').innerHTML = '<p>Fehler beim Laden</p>';
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('categories-list').innerHTML = '<p>Verbindungsfehler</p>';
    }
}

function displayCategories(categories) {
    const list = document.getElementById('categories-list');
    
    if (categories.length === 0) {
        list.innerHTML = '<p>Keine Kategorien gefunden</p>';
        return;
    }
    
    list.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Slug</th>
                    <th>Aktionen</th>
                </tr>
            </thead>
            <tbody>
                ${categories.map(cat => `
                    <tr>
                        <td>${cat.id}</td>
                        <td>${cat.name}</td>
                        <td>${cat.slug}</td>
                        <td>
                            <button onclick="editCategory(${cat.id})" style="padding: 0.5rem 1rem; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 0.5rem;">Bearbeiten</button>
                            <button onclick="deleteCategory(${cat.id})" style="padding: 0.5rem 1rem; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;">Löschen</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function showCreateModal() {
    document.getElementById('modal-title').textContent = 'Kategorie erstellen';
    document.getElementById('category-form').reset();
    document.getElementById('category-id').value = '';
    document.getElementById('category-modal').style.display = 'flex';
}

async function editCategory(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        const data = await response.json();
        
        if (data.status === 'success') {
            const category = data.data.find(c => c.id === id);
            if (category) {
                document.getElementById('modal-title').textContent = 'Kategorie bearbeiten';
                document.getElementById('category-id').value = category.id;
                document.getElementById('name').value = category.name;
                document.getElementById('slug').value = category.slug;
                document.getElementById('category-modal').style.display = 'flex';
            }
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Fehler beim Laden der Kategorie');
    }
}

async function deleteCategory(id) {
    if (!confirm('Kategorie wirklich löschen?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Kategorie gelöscht');
            await loadCategories();
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
    
    const id = document.getElementById('category-id').value;
    const categoryData = {
        name: document.getElementById('name').value,
        slug: document.getElementById('slug').value
    };
    
    try {
        const url = id ? `${API_BASE_URL}/categories/${id}` : `${API_BASE_URL}/categories`;
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(categoryData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert(data.message);
            closeModal();
            await loadCategories();
        } else {
            alert(data.message || 'Fehler beim Speichern');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Verbindungsfehler');
    }
}

function closeModal() {
    document.getElementById('category-modal').style.display = 'none';
}

function logout() {
    localStorage.removeItem('user');
}
