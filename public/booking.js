const form = document.querySelector('#booking-form');
const dateInput = document.querySelector('#date');
const resourceSelect = document.querySelector('#resource');
const message = document.querySelector('#form-message');
const today = getOfficeDate();
const selectedResource = new URLSearchParams(window.location.search).get('resource');

async function request(url, options) {
    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Request failed.');
    return data;
}

async function loadResources() {
    const resources = await request('/api/resources');
    resourceSelect.innerHTML = resources.map((resource) => `<option value="${escapeHtml(resource)}">${escapeHtml(resource)}</option>`).join('');
    if (resources.includes(selectedResource)) resourceSelect.value = selectedResource;
}

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    message.className = 'message';
    message.textContent = '';

    try {
        await request('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(Object.fromEntries(new FormData(form).entries()))
        });
        message.className = 'message success';
        message.textContent = 'Booking created. View it on the dashboard.';
        form.reset();
        dateInput.value = today;
    } catch (error) {
        message.textContent = error.message;
    }
});

function escapeHtml(value) {
    return String(value).replace(/[&<>\"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#039;' }[character]));
}

function getOfficeDate() {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return `${values.year}-${values.month}-${values.day}`;
}

dateInput.value = today;
await loadResources();
