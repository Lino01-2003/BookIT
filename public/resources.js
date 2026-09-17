const resourceList = document.querySelector('#resource-list');

async function loadResources() {
    const response = await fetch('/api/resources');
    const resources = await response.json();
    resourceList.innerHTML = resources.map((resource, index) => `
        <article class="resource-card">
            <span class="resource-number">0${index + 1}</span>
            <div>
                <p class="eyebrow">Available resource</p>
                <h2>${escapeHtml(resource)}</h2>
                <p class="resource-description">Book this shared office resource for your next session.</p>
            </div>
            <a class="button-link" href="/booking.html?resource=${encodeURIComponent(resource)}">Book Now</a>
        </article>
    `).join('');
}

function escapeHtml(value) {
    return String(value).replace(/[&<>\"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#039;' }[character]));
}

loadResources().catch(() => {
    resourceList.innerHTML = '<p class="message">Unable to load resources. Please refresh the page.</p>';
});
