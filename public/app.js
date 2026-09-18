import { escapeHtml, getOfficeDate, requestJson } from './shared.js';

const viewDate = document.querySelector('#view-date');
const bookingsElement = document.querySelector('#bookings');
const scheduleTitle = document.querySelector('#schedule-title');
const bookingCount = document.querySelector('#booking-count');

viewDate.value = getOfficeDate();

async function loadBookings() {
    const bookings = await requestJson(`/api/bookings?date=${encodeURIComponent(viewDate.value)}`);
    scheduleTitle.textContent = `Bookings for ${formatDate(viewDate.value)}`;
    bookingCount.textContent = bookings.length;
    bookingsElement.innerHTML = bookings.length ? bookings.map(renderBooking).join('') : '<p class="empty">Nothing booked for this day yet.</p>';
    bookingsElement.querySelectorAll('[data-cancel]').forEach((button) => button.addEventListener('click', cancelBooking));
}

function renderBooking(booking) {
    const cancelled = booking.status === 'cancelled';
    const past = booking.date < getOfficeDate();
    return `<article class="booking">
    <div class="booking-time">${booking.startTime}<br>${booking.endTime}</div>
    <div>
      <div class="booking-resource">${escapeHtml(booking.resource)}</div>
      <div class="booking-meta">${escapeHtml(booking.person)} · ${escapeHtml(booking.purpose)}</div>
    ${cancelled || past ? '' : `<button class="cancel" data-cancel="${booking.id}" type="button">Cancel booking</button>`}
    </div>
    <span class="status${cancelled ? ' cancelled' : ''}">${booking.status}</span>
  </article>`;
}

async function cancelBooking(event) {
    if (!window.confirm('Cancel this booking?')) return;
    try {
        await requestJson(`/api/bookings/${event.currentTarget.dataset.cancel}/cancel`, { method: 'POST' });
        await loadBookings();
    } catch (error) {
        window.alert(error.message);
    }
}

viewDate.addEventListener('change', () => {
    loadBookings();
});

function formatDate(value) {
    return new Intl.DateTimeFormat(undefined, { timeZone: 'Asia/Colombo', month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${value}T00:00:00+05:30`));
}

await loadBookings();
