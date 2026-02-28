const API_BASE_URL = 'http://localhost/api';

let occurrenceCounter = 0;
let eventId = null;

document.addEventListener('DOMContentLoaded', async () => {
    if (!initAdminSidebar('events')) return;

    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Event-ID aus URL holen
    const urlParams = new URLSearchParams(window.location.search);
    eventId = urlParams.get('id');
    
    if (!eventId) {
        alert('Keine Event-ID angegeben!');
        window.location.href = 'events.html';
        return;
    }

    await loadCommunities();
    await loadCategories();
    await loadArtists();
    await loadEventData(eventId);

    document.getElementById('event-form').addEventListener('submit', handleSubmit);
    
    // Promoted Checkbox Handler
    document.getElementById('is_promoted').addEventListener('change', (e) => {
        document.getElementById('hero-video-group').style.display = e.target.checked ? 'block' : 'none';
        updatePreview();
    });
    
    // Live-Vorschau Event Listener
    setupLivePreview();
});

async function loadEventData(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/events/${id}`);
        const data = await response.json();
        
        if (data.status === 'success' && data.data) {
            fillFormWithEventData(data.data);
        } else {
            alert('Event nicht gefunden!');
            window.location.href = 'events.html';
        }
    } catch (error) {
        console.error('Error loading event:', error);
        alert('Fehler beim Laden des Events');
    }
}

function fillFormWithEventData(event) {
    // Basis-Felder (nur die, die existieren)
    const titleField = document.getElementById('title');
    if (titleField) titleField.value = event.title || '';
    
    const locationField = document.getElementById('location_name');
    if (locationField) locationField.value = event.location_name || '';
    
    const descriptionField = document.getElementById('description');
    if (descriptionField) descriptionField.value = event.description || '';
    
    const affiliateField = document.getElementById('affiliate_url');
    if (affiliateField) affiliateField.value = event.affiliate_url || '';
    
    const heroVideoField = document.getElementById('hero_video_path');
    if (heroVideoField) heroVideoField.value = event.hero_video_path || '';
    
    // Promoted Checkbox
    const promotedCheckbox = document.getElementById('is_promoted');
    if (promotedCheckbox) {
        promotedCheckbox.checked = event.is_promoted == 1;
        const heroVideoGroup = document.getElementById('hero-video-group');
        if (heroVideoGroup) {
            heroVideoGroup.style.display = event.is_promoted == 1 ? 'block' : 'none';
        }
    }
    
    // Communities
    if (event.communities && event.communities.length > 0) {
        event.communities.forEach(community => {
            const checkbox = document.querySelector(`input[name="community_ids"][value="${community.id}"]`);
            if (checkbox) checkbox.checked = true;
        });
    }
    
    // Categories
    if (event.categories && event.categories.length > 0) {
        event.categories.forEach(category => {
            const checkbox = document.querySelector(`input[name="category_ids"][value="${category.id}"]`);
            if (checkbox) checkbox.checked = true;
        });
    }
    
    // Artists
    if (event.artists && event.artists.length > 0) {
        const artistsSelect = document.getElementById('artists-select');
        if (artistsSelect) {
            event.artists.forEach(artist => {
                const option = artistsSelect.querySelector(`option[value="${artist.id}"]`);
                if (option) option.selected = true;
            });
        }
    }
    
    // Bild-Vorschau
    const previewImage = document.getElementById('preview-image');
    if (previewImage && event.image_path) {
        previewImage.innerHTML = `<img src="${event.image_path}" alt="Event Bild" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;">`;
    }
    
    // Vorschau aktualisieren
    if (typeof updatePreview === 'function') {
        updatePreview();
    }
}

function setupLivePreview() {
    // Alle Formular-Felder überwachen
    const fields = ['title', 'description', 'location_name', 'start_date', 'start_time', 'end_date', 'end_time', 'hero_video_path'];
    
    fields.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) {
            element.addEventListener('input', updatePreview);
            element.addEventListener('change', updatePreview);
        }
    });
    
    // File-Upload überwachen
    const imageFile = document.getElementById('image_file');
    if (imageFile) {
        imageFile.addEventListener('change', handleImagePreview);
    }
    
    // Checkboxen überwachen
    document.getElementById('artists-select').addEventListener('change', updatePreview);
}

function handleImagePreview(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const previewImage = document.getElementById('preview-image');
            previewImage.innerHTML = `<img src="${event.target.result}" alt="Event" style="width: 100%; height: 100%; object-fit: cover;">`;
        };
        reader.readAsDataURL(file);
    }
}

function updatePreview() {
    // Titel
    const title = document.getElementById('title').value || 'Event-Titel';
    document.getElementById('preview-title').textContent = title;
    
    // Ort
    const location = document.getElementById('location_name').value || 'Ort';
    document.getElementById('preview-location').textContent = `📍 ${location}`;
    
    // Datum
    const startDate = document.getElementById('start_date').value;
    const startTime = document.getElementById('start_time').value;
    let dateText = '📅 Datum';
    
    if (startDate && startTime) {
        const date = new Date(`${startDate}T${startTime}`);
        dateText = `📅 ${date.toLocaleDateString('de-DE', { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })}`;
    } else if (startDate) {
        const date = new Date(startDate);
        dateText = `📅 ${date.toLocaleDateString('de-DE', { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric'
        })}`;
    }
    
    document.getElementById('preview-date').textContent = dateText;
    
    // Beschreibung
    const description = document.getElementById('description').value;
    const descEl = document.getElementById('preview-description');
    if (description) {
        descEl.textContent = description.substring(0, 150) + (description.length > 150 ? '...' : '');
        descEl.style.display = 'block';
    } else {
        descEl.style.display = 'none';
    }
    
    // Bild/Video
    const isPromoted = document.getElementById('is_promoted').checked;
    const videoPath = document.getElementById('hero_video_path').value;
    const previewImage = document.getElementById('preview-image');
    
    if (isPromoted && videoPath) {
        previewImage.innerHTML = `<video src="${videoPath}" autoplay muted loop style="width: 100%; height: 100%; object-fit: cover;"></video>`;
    }
    // Bild-Vorschau wird von handleImagePreview gesetzt
    
    // Tags (Communities, Categories, Artists)
    updatePreviewTags();
    
    // Weitere Termine
    updatePreviewOccurrences();
}

function updatePreviewTags() {
    const tagsContainer = document.getElementById('preview-tags');
    tagsContainer.innerHTML = '';
    
    // Communities
    const selectedCommunities = Array.from(document.querySelectorAll('input[name="community_ids"]:checked'));
    selectedCommunities.forEach(cb => {
        const label = cb.parentElement.textContent.trim();
        const tag = document.createElement('span');
        tag.className = 'preview-tag community';
        tag.textContent = label;
        tagsContainer.appendChild(tag);
    });
    
    // Categories
    const selectedCategories = Array.from(document.querySelectorAll('input[name="category_ids"]:checked'));
    selectedCategories.forEach(cb => {
        const label = cb.parentElement.textContent.trim();
        const tag = document.createElement('span');
        tag.className = 'preview-tag category';
        tag.textContent = label;
        tagsContainer.appendChild(tag);
    });
    
    // Artists
    const selectedArtists = Array.from(document.getElementById('artists-select').selectedOptions);
    selectedArtists.forEach(option => {
        const tag = document.createElement('span');
        tag.className = 'preview-tag artist';
        tag.textContent = option.textContent;
        tagsContainer.appendChild(tag);
    });
}

function updatePreviewOccurrences() {
    const occurrencesList = document.getElementById('preview-occurrences-list');
    const occurrencesContainer = document.getElementById('preview-occurrences');
    
    const additionalOccurrences = document.querySelectorAll('.occurrence-item');
    
    if (additionalOccurrences.length > 0) {
        occurrencesContainer.style.display = 'block';
        occurrencesList.innerHTML = '';
        
        additionalOccurrences.forEach((occ, index) => {
            const startDate = occ.querySelector(`input[name^="occ_start_date"]`).value;
            const startTime = occ.querySelector(`input[name^="occ_start_time"]`).value;
            
            if (startDate && startTime) {
                const date = new Date(`${startDate}T${startTime}`);
                const dateText = date.toLocaleDateString('de-DE', { 
                    weekday: 'short', 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                const occDiv = document.createElement('div');
                occDiv.className = 'preview-occurrence';
                occDiv.textContent = `📅 ${dateText}`;
                occurrencesList.appendChild(occDiv);
            }
        });
    } else {
        occurrencesContainer.style.display = 'none';
    }
}

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
                label.innerHTML = `
                    <input type="checkbox" name="community_ids" value="${community.id}">
                    ${community.name}
                `;
                const checkbox = label.querySelector('input');
                checkbox.addEventListener('change', updatePreview);
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
                label.innerHTML = `
                    <input type="checkbox" name="category_ids" value="${category.id}">
                    ${category.name}
                `;
                const checkbox = label.querySelector('input');
                checkbox.addEventListener('change', updatePreview);
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
        <button type="button" onclick="removeOccurrence(${occurrenceCounter})" class="btn-remove-occurrence">Termin entfernen</button>
    `;
    
    // Event Listener für Vorschau
    const inputs = occurrenceDiv.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', updatePreview);
        input.addEventListener('change', updatePreview);
    });
    
    occurrencesList.appendChild(occurrenceDiv);
    updatePreview();
}

function removeOccurrence(id) {
    const occurrenceDiv = document.getElementById(`occurrence-${id}`);
    if (occurrenceDiv) {
        occurrenceDiv.remove();
        updatePreview();
    }
}

async function handleSubmit(e) {
    e.preventDefault();
    
    const user = JSON.parse(localStorage.getItem('user'));
    const formData = new FormData(e.target);
    
    // 1. Bild hochladen falls vorhanden
    let imagePath = null;
    const imageFile = document.getElementById('image_file').files[0];
    
    if (imageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('image', imageFile);
        
        try {
            const uploadResponse = await fetch(`${API_BASE_URL}/upload/event-image`, {
                method: 'POST',
                body: uploadFormData
            });
            
            const uploadData = await uploadResponse.json();
            
            if (uploadResponse.ok) {
                imagePath = uploadData.data.path;
            } else {
                alert('Fehler beim Hochladen des Bildes: ' + uploadData.message);
                return;
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Fehler beim Hochladen des Bildes');
            return;
        }
    }
    
    // 2. Event-Daten sammeln
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
        organizer_id: 1, // Fallback auf 1
        slug: slug,
        title: title,
        description: formData.get('description') || null,
        location_name: formData.get('location_name') || '',
        start_datetime: `${startDate} ${startTime}:00`,
        end_datetime: `${endDate} ${endTime}:00`,
        affiliate_url: formData.get('affiliate_url') || null,
        image_path: imagePath,
        is_promoted: document.getElementById('is_promoted').checked,
        hero_video_path: document.getElementById('is_promoted').checked ? formData.get('hero_video_path') : null,
        artist_ids: artistIds,
        community_ids: communityIds,
        category_ids: categoryIds,
        language: 'de'
    };
    
    // 3. Zusätzliche Occurrences sammeln
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

    // 4. Event aktualisieren
    try {
        const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventData)
        });
        
        // Prüfen ob Response JSON ist
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Server returned non-JSON response:', text);
            alert('❌ Server-Fehler: Keine JSON-Antwort erhalten.\nBitte Browser-Konsole prüfen.');
            return;
        }
        
        const data = await response.json();
        
        if (response.ok) {
            alert('✅ Event erfolgreich aktualisiert!');
            window.location.href = 'events.html';
        } else {
            alert('❌ Fehler beim Aktualisieren des Events:\n' + (data.message || 'Unbekannter Fehler'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Verbindungsfehler:\n' + error.message + '\n\nBitte Browser-Konsole prüfen.');
    }
}
