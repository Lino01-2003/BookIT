const resourceList = document.querySelector('#resource-list');

async function loadResources() {
    const response = await fetch('/api/resources');
    const resources = await response.json();
    resourceList.innerHTML = resources.map((resource, index) => `
        <article class="resource-card">
            <div class="resource-card-meta">
                <span class="resource-number">0${index + 1}</span>
                <span class="resource-icon" aria-hidden="true">${getResourceIcon(resource)}</span>
            </div>
            <div class="resource-card-content">
                <p class="eyebrow">${getResourceType(resource)}</p>
                <h2>${escapeHtml(resource)}</h2>
                <p class="resource-description">${getResourceDescription(resource)}</p>
            </div>
            <a class="button-link" href="/booking.html?resource=${encodeURIComponent(resource)}">Book Now <span aria-hidden="true">&#8594;</span></a>
        </article>
    `).join('');
}

function getResourceType(resource) {
    return resource.startsWith('Meeting Room') ? 'Meeting Room' : 'Equipment';
}

function getResourceDescription(resource) {
    if (resource.startsWith('Meeting Room')) {
        return 'For team meetings and discussions.';
    }

    const descriptions = {
        Projector: 'For presentations and shared viewing.',
        'Camera Kit': 'For photography and video recording.',
        'Demo Laptop': 'For demonstrations and presentations.'
    };

    return descriptions[resource] || 'For shared office use.';
}

function getResourceIcon(resource) {
    const icons = {
        meeting: '<svg viewBox="0 0 24 24" focusable="false"><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="M3 10h18M8 5v14M16 5v14"></path></svg>',
        Projector: '<svg viewBox="0 0 24 24" focusable="false"><path d="M4 7h16v8H4zM8 15v3M16 15v3M7 7V5h10v2"></path><circle cx="17" cy="11" r="1"></circle></svg>',
        'Camera Kit': '<svg viewBox="0 0 24 24" focusable="false"><path d="M4 8h4l1.5-2h5L16 8h4v10H4z"></path><circle cx="12" cy="13" r="3"></circle></svg>',
        'Demo Laptop': '<svg viewBox="0 0 24 24" focusable="false"><rect x="5" y="4" width="14" height="11" rx="1"></rect><path d="M3 18h18M8 18l1 2h6l1-2"></path></svg>'
    };

    return icons[resource] || icons.meeting;
}

function escapeHtml(value) {
    return String(value).replace(/[&<>\"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#039;' }[character]));
}

loadResources().catch(() => {
    resourceList.innerHTML = '<p class="message">Unable to load resources. Please refresh the page.</p>';
});
