export const resources = [
    'Meeting Room 1',
    'Meeting Room 2',
    'Projector',
    'Camera Kit',
    'Demo Laptop'
];

export class BookingValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'BookingValidationError';
        this.code = 'INVALID_INPUT';
    }
}

export class BookingConflictError extends Error {
    constructor(message) {
        super(message);
        this.name = 'BookingConflictError';
        this.code = 'BOOKING_CONFLICT';
    }
}

export function validateBookingInput(input, now = new Date()) {
    const requiredFields = ['resource', 'date', 'startTime', 'endTime', 'person', 'purpose'];

    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new BookingValidationError('Request body must be a JSON object.');
    }

    const invalidField = requiredFields.find((field) => typeof input[field] !== 'string');
    if (invalidField) {
        throw new BookingValidationError(`${invalidField} must be a text value.`);
    }

    const missing = requiredFields.find((field) => !input[field].trim());
    if (missing) {
        throw new BookingValidationError('All fields are required.');
    }

    if (!resources.includes(input.resource)) {
        throw new BookingValidationError('Invalid resource.');
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || !isValidDate(input.date)) {
        throw new BookingValidationError('Enter a valid date.');
    }

    if (input.date < getOfficeDate(now)) {
        throw new BookingValidationError('Booking date cannot be in the past.');
    }

    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.startTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.endTime)) {
        throw new BookingValidationError('Enter valid start and end times.');
    }

    if (toMinutes(input.endTime) <= toMinutes(input.startTime)) {
        throw new BookingValidationError('End time must be later than start time.');
    }
}

export function findConflict(candidate, bookings) {
    const candidateStart = toMinutes(candidate.startTime);
    const candidateEnd = toMinutes(candidate.endTime);

    return bookings.find((booking) => {
        if (booking.status !== 'confirmed' || booking.resource !== candidate.resource || booking.date !== candidate.date) {
            return false;
        }

        const bookingStart = toMinutes(booking.startTime);
        const bookingEnd = toMinutes(booking.endTime);
        return candidateStart < bookingEnd && bookingStart < candidateEnd;
    });
}

export function createBooking(input, bookings, now = new Date()) {
    validateBookingInput(input, now);
    const conflict = findConflict(input, bookings);

    if (conflict) {
        throw new BookingConflictError(`Booking clash: ${conflict.resource} is already booked from ${conflict.startTime} to ${conflict.endTime}.`);
    }

    return {
        id: crypto.randomUUID(),
        resource: input.resource,
        date: input.date,
        startTime: input.startTime,
        endTime: input.endTime,
        person: input.person.trim(),
        purpose: input.purpose.trim(),
        status: 'confirmed',
        createdAt: now.toISOString()
    };
}

export function toMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

export function isPastBookingDate(value, now = new Date()) {
    return value < getOfficeDate(now);
}

function getOfficeDate(now) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Colombo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(now);
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return `${values.year}-${values.month}-${values.day}`;
}

function isValidDate(value) {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
