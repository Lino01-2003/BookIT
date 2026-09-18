import { escapeHtml, getOfficeDate, requestJson } from './shared.js';

const form = document.querySelector('#booking-form');
const dateInput = document.querySelector('#date');
const resourceSelect = document.querySelector('#resource');
const message = document.querySelector('#form-message');
const selectedResource = new URLSearchParams(window.location.search).get('resource');

async function loadResources() {
    const resources = await requestJson('/api/resources');
    resourceSelect.innerHTML = resources.map((resource) => `<option value="${escapeHtml(resource)}">${escapeHtml(resource)}</option>`).join('');
    if (resources.includes(selectedResource)) resourceSelect.value = selectedResource;
}

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    message.className = 'message';
    message.textContent = '';

    try {
        updateDateInputConstraints();
        if (dateInput.value < dateInput.min) {
            throw new Error('Booking date cannot be in the past.');
        }
        await requestJson('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(Object.fromEntries(new FormData(form).entries()))
        });
        message.className = 'message success';
        message.textContent = 'Booking created. View it on the dashboard.';
        form.reset();
        updateDateInputConstraints();
        dateInput.value = dateInput.min;
    } catch (error) {
        message.textContent = error.message;
    }
});

function updateDateInputConstraints() {
    dateInput.min = getOfficeDate();
}

dateInput.addEventListener('focus', updateDateInputConstraints);
document.addEventListener('visibilitychange', updateDateInputConstraints);
updateDateInputConstraints();
dateInput.value = dateInput.min;
await loadResources();
