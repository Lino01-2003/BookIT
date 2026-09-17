export const resources = [
    'Meeting Room 1',
    'Meeting Room 2',
    'Projector',
    'Camera Kit',
    'Demo Laptop'
];

export function validateBookingInput(input) {
    const requiredFields = ['resource', 'date', 'startTime', 'endTime', 'person', 'purpose'];
    const missing = requiredFields.find((field) => !String(input[field] ?? '').trim());

    if (missing) {
        throw new Error('All fields are required.');
    }

    if (!resources.includes(input.resource)) {
        throw new Error('Invalid resource.');
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
        throw new Error('Enter a valid date.');
    }

    if (!isValidDate(input.date)) {
        throw new Error('Enter a valid date.');
    }

    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.startTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.endTime)) {
        throw new Error('Enter valid start and end times.');
    }

    if (toMinutes(input.endTime) <= toMinutes(input.startTime)) {
        throw new Error('End time must be later than start time.');
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

export function createBooking(input, bookings) {
    validateBookingInput(input);
    const conflict = findConflict(input, bookings);

    if (conflict) {
        throw new Error(`Booking clash: ${conflict.resource} is already booked from ${conflict.startTime} to ${conflict.endTime}.`);
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
        createdAt: new Date().toISOString()
    };
}

export function toMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

function isValidDate(value) {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
