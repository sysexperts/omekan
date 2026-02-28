const API_BASE_URL = 'http://localhost/api';

let occurrenceCounter = 0;

document.addEventListener('DOMContentLoaded', async () => {
    if (!initAdminSidebar('create-event')) return;

    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    await loadCommunities();
    await loadCategories();
    await loadArtists();

    document.getElementById('event-form').addEventListener('submit', handleSubmit);
    
    // Promoted Checkbox Handler
    document.getElementById('is_promoted').addEventListener('change', (e) => {
        document.getElementById('hero-video-group').style.display = e.target.checked ? 'block' : 'none';
    });
});

async function loadArtists() {
    try {
        const response = await fetch(`${API_BASE_URL}/artists`);
        const data = await response.json();
        
        const select = document.getElementById('artists-select');
        
        if (data.status === 'success' && data.data) {
            data.data.forEach(artist => {
                const option = document.createElement('option');
                option.value = artist.id;
                option.textContent = artist.name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading artists:', error);
    }
}

async function loadCommunities() {
    try {
        const response = await fetch(`${API_BASE_URL}/communities`);
        const data = await response.json();
        
        const communitiesDiv = document.getElementById('communities-list');
        
        if (data.status === 'success' && data.data) {
            data.data.forEach(community => {
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
    } catch (error) {
        console.error('Error loading communities:', error);
    }
}

async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        const data = await response.json();
        
        const categoriesDiv = document.getElementById('categories-list');
        
        if (data.status === 'success' && data.data) {
            data.data.forEach(category => {
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
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

function addOccurrence() {
    occurrenceCounter++;
    const occurrencesList = document.getElementById('occurrences-list');
    
    const occurrenceDiv = document.createElement('div');
    occurrenceDiv.className = 'occurrence-item';
    occurrenceDiv.style.border = '1px solid #ddd';
    occurrenceDiv.style.padding = '1rem';
    occurrenceDiv.style.marginBottom = '1rem';
    occurrenceDiv.style.borderRadius = '4px';
    occurrenceDiv.id = `occurrence-${occurrenceCounter}`;
    
    occurrenceDiv.innerHTML = `
        <h4>Termin ${occurrenceCounter + 1}</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div>
                <label>Start-Datum *</label>
                <input type="date" name="occ_start_date_${occurrenceCounter}" required>
            </div>
            <div>
                <label>Start-Uhrzeit *</label>
                <input type="time" name="occ_start_time_${occurrenceCounter}" required>
            </div>
            <div>
                <label>End-Datum</label>
                <input type="date" name="occ_end_date_${occurrenceCounter}">
            </div>
            <div>
                <label>End-Uhrzeit</label>
                <input type="time" name="occ_end_time_${occurrenceCounter}">
            </div>
        </div>
        <button type="button" onclick="removeOccurrence(${occurrenceCounter})" style="margin-top: 0.5rem; background: #e74c3c; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">Termin entfernen</button>
    `;
    
    occurrencesList.appendChild(occurrenceDiv);
}

function removeOccurrence(id) {
    const occurrenceDiv = document.getElementById(`occurrence-${id}`);
    if (occurrenceDiv) {
        occurrenceDiv.remove();
    }
}

async function handleSubmit(e) {
    e.preventDefault();
    
    const user = JSON.parse(localStorage.getItem('user'));
    const formData = new FormData(e.target);
    
    const communityIds = Array.from(document.querySelectorAll('input[name="community_ids"]:checked'))
        .map(cb => parseInt(cb.value));
    
    const categoryIds = Array.from(document.querySelectorAll('input[name="category_ids"]:checked'))
        .map(cb => parseInt(cb.value));
    
    const artistIds = Array.from(document.getElementById('artists-select').selectedOptions)
        .map(option => parseInt(option.value));
    
    const startDate = formData.get('start_date');
    const startTime = formData.get('start_time');
    const endDate = formData.get('end_date') || startDate;
    const endTime = formData.get('end_time') || startTime;
    
    const title = formData.get('title');
    const slug = title.toLowerCase()
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    
    const eventData = {
        organizer_id: user.organizer_id || 1,
        slug: slug,
        title: title,
        description: formData.get('description') || null,
        location_name: formData.get('location_name') || '',
        start_datetime: `${startDate} ${startTime}:00`,
        end_datetime: `${endDate} ${endTime}:00`,
        affiliate_url: formData.get('affiliate_url') || null,
        image_path: formData.get('image_path') || null,
        is_promoted: document.getElementById('is_promoted').checked,
        hero_video_path: document.getElementById('is_promoted').checked ? formData.get('hero_video_path') : null,
        artist_ids: artistIds,
        community_ids: communityIds,
        category_ids: categoryIds,
        language: 'de'
    };
    
    // Zusätzliche Occurrences sammeln
    const additionalOccurrences = [];
    for (let i = 1; i <= occurrenceCounter; i++) {
        const occStartDate = formData.get(`occ_start_date_${i}`);
        const occStartTime = formData.get(`occ_start_time_${i}`);
        const occEndDate = formData.get(`occ_end_date_${i}`) || occStartDate;
        const occEndTime = formData.get(`occ_end_time_${i}`) || occStartTime;
        
        if (occStartDate && occStartTime) {
            additionalOccurrences.push({
                start_datetime: `${occStartDate} ${occStartTime}:00`,
                end_datetime: `${occEndDate} ${occEndTime}:00`
            });
        }
    }
    
    if (additionalOccurrences.length > 0) {
        eventData.additional_occurrences = additionalOccurrences;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/events/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Event erfolgreich erstellt!');
            window.location.href = 'events.html';
        } else {
            alert(data.message || 'Fehler beim Erstellen des Events');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Verbindungsfehler');
    }
}
