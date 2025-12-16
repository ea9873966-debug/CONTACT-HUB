// Initialize contacts array from localStorage or empty array
let contacts = JSON.parse(localStorage.getItem('contacts')) || [];
let currentFilter = 'all';
let editingContactId = null;

// DOM Elements
const totalCountEl = document.getElementById('totalCount');
const favoritesCountEl = document.getElementById('favoritesCount');
const emergencyCountEl = document.getElementById('emergencyCount');
const allContactsCountEl = document.getElementById('allContactsCount');
const contactsListEl = document.getElementById('contactsList');
const favoritesListEl = document.getElementById('favoritesList');
const emergencyListEl = document.getElementById('emergencyList');
const addContactBtn = document.getElementById('addContactBtn');
const searchInput = document.getElementById('searchInput');
const contactModal = document.getElementById('contactModal');
const closeModalBtn = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const contactForm = document.getElementById('contactForm');
const modalTitle = document.getElementById('modalTitle');
const contactNameInput = document.getElementById('contactName');
const contactPhoneInput = document.getElementById('contactPhone');
const contactEmailInput = document.getElementById('contactEmail');
const contactAddressInput = document.getElementById('contactAddress');
const contactGroupSelect = document.getElementById('contactGroup');
const contactNotesInput = document.getElementById('contactNotes');
const contactPhotoInput = document.getElementById('contactPhoto');
const changePhotoBtn = document.getElementById('changePhotoBtn');
const modalAvatar = document.getElementById('modalAvatar');
const isFavoriteCheckbox = document.getElementById('isFavorite');
const isEmergencyCheckbox = document.getElementById('isEmergency');
const nameError = document.getElementById('nameError');
const phoneError = document.getElementById('phoneError');
const emailError = document.getElementById('emailError');

// Set current year in footer
document.getElementById('currentYear').textContent = new Date().getFullYear();

// Update statistics
function updateStats() {
    const total = contacts.length;
    const favorites = contacts.filter(c => c.isFavorite).length;
    const emergency = contacts.filter(c => c.isEmergency).length;
    
    totalCountEl.textContent = total;
    favoritesCountEl.textContent = favorites;
    emergencyCountEl.textContent = emergency;
    allContactsCountEl.textContent = total;
}

// Generate a unique ID for contacts
function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

// Validate name (only letters and spaces, 2-50 chars)
function validateName(name) {
    const nameRegex = /^[a-zA-Z\s]{2,50}$/;
    return nameRegex.test(name);
}

// Validate Egyptian phone number
function validatePhone(phone) {
    const phoneRegex = /^(?:\+20|0)?1[0-9]{9}$/;
    return phoneRegex.test(phone);
}

// Validate email (optional field allowed empty)
function validateEmail(email) {
    if (!email) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Filter contacts based on search term
function filterContacts(searchTerm) {
    if (!searchTerm) return contacts;
    
    const term = searchTerm.toLowerCase();
    return contacts.filter(contact => 
        contact.name.toLowerCase().includes(term) ||
        contact.phone.includes(term) ||
        (contact.email && contact.email.toLowerCase().includes(term)) ||
        (contact.address && contact.address.toLowerCase().includes(term)) ||
        (contact.group && contact.group.toLowerCase().includes(term))
    );
}

// Helper: convert file to dataURL (Promise)
function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Set avatar preview in modal (src can be null)
function setModalAvatar(src) {
    if (src) {
        modalAvatar.innerHTML = `<img src="${src}" alt="avatar">`;
    } else {
        modalAvatar.innerHTML = `<i class="fas fa-user"></i>`;
    }
}

// Render contacts
function renderContacts() {
    const searchTerm = searchInput.value.trim();
    const filteredContacts = filterContacts(searchTerm);
    
    // Clear the contacts list
    contactsListEl.innerHTML = '';
    
    if (filteredContacts.length === 0) {
        // Show empty state
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <div class="empty-icon">
                <i class="fas fa-address-book"></i>
            </div>
            <h3 class="empty-title">No contacts found</h3>
            <p class="empty-text">${searchTerm ? 'No contacts match your search' : 'Click "Add Contact" to get started'}</p>
        `;
        contactsListEl.appendChild(emptyState);
    } else {
        // Render each contact
        filteredContacts.forEach(contact => {
            const contactEl = createContactElement(contact);
            contactsListEl.appendChild(contactEl);
        });
    }
    
    // Render favorites sidebar
    renderFavorites();
    
    // Render emergency sidebar
    renderEmergency();
    
    // Update stats
    updateStats();
}

// Create a contact element
function createContactElement(contact) {
    const contactEl = document.createElement('div');
    contactEl.className = 'contact-item';
    contactEl.dataset.id = contact.id;
    
    // Get first letter of name for avatar
    const firstLetter = contact.name.charAt(0).toUpperCase();
    
    // Determine avatar color based on first letter
    const avatarColors = [
        '#6366f1', '#ef4444', '#10b981', '#f59e0b', 
        '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
    ];
    const colorIndex = firstLetter.charCodeAt(0) % avatarColors.length;
    const avatarColor = avatarColors[colorIndex];
    
    const avatarHtml = contact.photo
        ? `<div class="contact-avatar"><img src="${contact.photo}" alt="${contact.name}"></div>`
        : `<div class="contact-avatar" style="background: linear-gradient(135deg, ${avatarColor}, ${avatarColor}dd)">${firstLetter}</div>`;
    
    contactEl.innerHTML = `
        <div class="contact-info">
            ${avatarHtml}
            <div class="contact-details">
                <h4 class="contact-name">${contact.name}</h4>
                <div class="contact-meta">
                    <div class="contact-phone">
                        <i class="fas fa-phone-alt"></i> ${contact.phone}
                    </div>
                    <div class="contact-email">
                        <i class="fas fa-envelope"></i> ${contact.email || ''}</div>
                </div>
                ${contact.address ? `<div style="color:var(--secondary);font-size:0.9rem;margin-top:6px;">${contact.address}</div>` : ''}
            </div>
        </div>
        <div class="contact-actions">
            <button class="action-btn favorite-btn ${contact.isFavorite ? 'active' : ''}" title="${contact.isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                <i class="${contact.isFavorite ? 'fas' : 'far'} fa-star"></i>
            </button>
            <button class="action-btn emergency-btn ${contact.isEmergency ? 'active' : ''}" title="${contact.isEmergency ? 'Remove from emergency' : 'Mark as emergency'}">
                <i class="fas fa-phone-alt"></i>
            </button>
            <button class="action-btn edit-btn" title="Edit contact">
                <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn delete-btn" title="Delete contact">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    // If avatar contains img tag, ensure image fits
    const imgEl = contactEl.querySelector('.contact-avatar img');
    if (imgEl) {
        imgEl.style.width = '100%';
        imgEl.style.height = '100%';
        imgEl.style.objectFit = 'cover';
        imgEl.style.borderRadius = '12px';
    }
    
    // Add event listeners to action buttons
    const favoriteBtn = contactEl.querySelector('.favorite-btn');
    const emergencyBtn = contactEl.querySelector('.emergency-btn');
    const editBtn = contactEl.querySelector('.edit-btn');
    const deleteBtn = contactEl.querySelector('.delete-btn');
    
    favoriteBtn.addEventListener('click', () => toggleFavorite(contact.id));
    emergencyBtn.addEventListener('click', () => toggleEmergency(contact.id));
    editBtn.addEventListener('click', () => editContact(contact.id));
    deleteBtn.addEventListener('click', () => deleteContact(contact.id));
    
    return contactEl;
}

// Render favorites sidebar
function renderFavorites() {
    const favoriteContacts = contacts.filter(c => c.isFavorite);
    
    // Clear the favorites list
    favoritesListEl.innerHTML = '';
    
    if (favoriteContacts.length === 0) {
        // Show empty state
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `<p class="empty-text">No favorites yet.</p>`;
        favoritesListEl.appendChild(emptyState);
    } else {
        favoriteContacts.slice(0, 5).forEach(contact => {
            const contactEl = document.createElement('div');
            contactEl.className = 'side-contact-item';
            
            const avatarHtml = contact.photo
                ? `<div class="side-contact-avatar"><img src="${contact.photo}" alt="${contact.name}"></div>`
                : `<div class="side-contact-avatar">${contact.name.charAt(0).toUpperCase()}</div>`;
            
            contactEl.innerHTML = `
                ${avatarHtml}
                <div class="side-contact-info">
                    <div class="side-contact-name">${contact.name}</div>
                    <div class="side-contact-phone">${contact.phone}</div>
                </div>
            `;
            const img = contactEl.querySelector('.side-contact-avatar img');
            if (img) { img.style.width='100%'; img.style.height='100%'; img.style.objectFit='cover'; img.style.borderRadius='8px'; }
            favoritesListEl.appendChild(contactEl);
        });
    }
}

// Render emergency sidebar
function renderEmergency() {
    const emergencyContacts = contacts.filter(c => c.isEmergency);
    
    // Clear the emergency list
    emergencyListEl.innerHTML = '';
    
    if (emergencyContacts.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `<p class="empty-text">No emergency contacts.</p>`;
        emergencyListEl.appendChild(emptyState);
    } else {
        emergencyContacts.slice(0, 5).forEach(contact => {
            const contactEl = document.createElement('div');
            contactEl.className = 'side-contact-item';
            
            const avatarHtml = contact.photo
                ? `<div class="side-contact-avatar"><img src="${contact.photo}" alt="${contact.name}"></div>`
                : `<div class="side-contact-avatar">${contact.name.charAt(0).toUpperCase()}</div>`;
            
            contactEl.innerHTML = `
                ${avatarHtml}
                <div class="side-contact-info">
                    <div class="side-contact-name">${contact.name}</div>
                    <div class="side-contact-phone">${contact.phone}</div>
                </div>
            `;
            const img = contactEl.querySelector('.side-contact-avatar img');
            if (img) { img.style.width='100%'; img.style.height='100%'; img.style.objectFit='cover'; img.style.borderRadius='8px'; }
            emergencyListEl.appendChild(contactEl);
        });
    }
}

// Toggle favorite status
function toggleFavorite(contactId) {
    const contactIndex = contacts.findIndex(c => c.id === contactId);
    if (contactIndex !== -1) {
        contacts[contactIndex].isFavorite = !contacts[contactIndex].isFavorite;
        saveContacts();
        renderContacts();
    }
}

// Toggle emergency status
function toggleEmergency(contactId) {
    const contactIndex = contacts.findIndex(c => c.id === contactId);
    if (contactIndex !== -1) {
        contacts[contactIndex].isEmergency = !contacts[contactIndex].isEmergency;
        saveContacts();
        renderContacts();
    }
}

// Edit contact
function editContact(contactId) {
    const contact = contacts.find(c => c.id === contactId);
    if (contact) {
        editingContactId = contactId;
        modalTitle.textContent = 'Edit Contact';
        contactNameInput.value = contact.name;
        contactPhoneInput.value = contact.phone;
        contactEmailInput.value = contact.email || '';
        contactAddressInput.value = contact.address || '';
        contactGroupSelect.value = contact.group || '';
        contactNotesInput.value = contact.notes || '';
        isFavoriteCheckbox.checked = contact.isFavorite;
        isEmergencyCheckbox.checked = contact.isEmergency;
        setModalAvatar(contact.photo || null);
        openModal();
    }
}

// Delete contact
function deleteContact(contactId) {
    if (confirm('Are you sure you want to delete this contact?')) {
        contacts = contacts.filter(c => c.id !== contactId);
        saveContacts();
        renderContacts();
    }
}

// Save contacts to localStorage
function saveContacts() {
    localStorage.setItem('contacts', JSON.stringify(contacts));
}

// Open modal
function openModal() {
    contactModal.style.display = 'flex';
    // Clear any previous error messages
    nameError.style.display = 'none';
    phoneError.style.display = 'none';
    emailError.style.display = 'none';
}

// Close modal
function closeModal() {
    contactModal.style.display = 'none';
    contactForm.reset();
    editingContactId = null;
    modalTitle.textContent = 'Add New Contact';
    setModalAvatar(null);
}

// Form validation
function validateForm() {
    let isValid = true;
    const name = contactNameInput.value.trim();
    const phone = contactPhoneInput.value.trim();
    const email = contactEmailInput.value.trim();
    
    // Validate name
    if (!validateName(name)) {
        nameError.style.display = 'block';
        isValid = false;
    } else {
        nameError.style.display = 'none';
    }
    
    // Validate phone
    if (!validatePhone(phone)) {
        phoneError.style.display = 'block';
        isValid = false;
    } else {
        phoneError.style.display = 'none';
    }
    
    // Validate email
    if (!validateEmail(email)) {
        emailError.style.display = 'block';
        isValid = false;
    } else {
        emailError.style.display = 'none';
    }
    
    return isValid;
}

// Handle change photo button and preview
changePhotoBtn.addEventListener('click', () => contactPhotoInput.click());
contactPhotoInput.addEventListener('change', async () => {
    const file = contactPhotoInput.files[0];
    if (file) {
        try {
            const dataUrl = await fileToDataUrl(file);
            setModalAvatar(dataUrl);
        } catch (err) {
            console.error('Error reading image', err);
        }
    }
});

// Form submission
contactForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!validateForm()) {
        return;
    }
    
    const name = contactNameInput.value.trim();
    const phone = contactPhoneInput.value.trim();
    const email = contactEmailInput.value.trim();
    const address = contactAddressInput.value.trim();
    const group = contactGroupSelect.value;
    const notes = contactNotesInput.value.trim();
    const isFavorite = isFavoriteCheckbox.checked;
    const isEmergency = isEmergencyCheckbox.checked;
    
    // Determine photo: if user selected a file, use its dataURL; otherwise keep existing when editing
    let photoData = null;
    const file = contactPhotoInput.files[0];
    if (file) {
        try {
            photoData = await fileToDataUrl(file);
        } catch(err) {
            console.error('Error loading photo', err);
        }
    }
    
    if (editingContactId) {
        // Update existing contact
        const contactIndex = contacts.findIndex(c => c.id === editingContactId);
        if (contactIndex !== -1) {
            contacts[contactIndex].name = name;
            contacts[contactIndex].phone = phone;
            contacts[contactIndex].email = email;
            contacts[contactIndex].address = address;
            contacts[contactIndex].group = group;
            contacts[contactIndex].notes = notes;
            contacts[contactIndex].isFavorite = isFavorite;
            contacts[contactIndex].isEmergency = isEmergency;
            if (photoData) contacts[contactIndex].photo = photoData;
        }
    } else {
        // Add new contact
        const newContact = {
            id: generateId(),
            name,
            phone,
            email,
            address,
            group,
            notes,
            isFavorite,
            isEmergency,
            photo: photoData || null
        };
        contacts.push(newContact);
    }
    
    saveContacts();
    renderContacts();
    closeModal();
});

// Event Listeners
addContactBtn.addEventListener('click', () => {
    contactForm.reset();
    editingContactId = null;
    modalTitle.textContent = 'Add New Contact';
    setModalAvatar(null);
    openModal();
});
closeModalBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);
searchInput.addEventListener('input', renderContacts);

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === contactModal) {
        closeModal();
    }
});

// Initialize the app
function init() {
    renderContacts();
}

// Start the application
init();