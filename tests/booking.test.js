import test from 'node:test';
import assert from 'node:assert/strict';
import { createBooking } from '../src/booking.js';

const baseBooking = {
    resource: 'Meeting Room 1',
    date: '2026-09-16',
    startTime: '09:00',
    endTime: '10:00',
    person: 'Ada Lovelace',
    purpose: 'Planning'
};

test('overlapping confirmed bookings are rejected', () => {
    const existing = { ...baseBooking, id: 'existing', status: 'confirmed' };

    assert.throws(
        () => createBooking({ ...baseBooking, startTime: '09:30', endTime: '10:30' }, [existing]),
        /already booked from 09:00 to 10:00/
    );
});

test('back-to-back bookings are allowed', () => {
    const existing = { ...baseBooking, id: 'existing', status: 'confirmed' };

    assert.doesNotThrow(() => createBooking({ ...baseBooking, startTime: '10:00', endTime: '11:00' }, [existing]));
});

test('invalid time range is rejected', () => {
    assert.throws(
        () => createBooking({ ...baseBooking, startTime: '14:00', endTime: '13:00' }, []),
        /End time must be later than start time/
    );
});

test('cancelled bookings do not block a new booking', () => {
    const cancelled = { ...baseBooking, id: 'cancelled', status: 'cancelled' };

    assert.doesNotThrow(() => createBooking(baseBooking, [cancelled]));
});

test('same-time bookings on different resources are allowed', () => {
    const existing = { ...baseBooking, id: 'existing', status: 'confirmed' };

    assert.doesNotThrow(() => createBooking({ ...baseBooking, resource: 'Meeting Room 2' }, [existing]));
});

test('same-time bookings on different dates are allowed', () => {
    const existing = { ...baseBooking, id: 'existing', status: 'confirmed' };

    assert.doesNotThrow(() => createBooking({ ...baseBooking, date: '2026-09-17' }, [existing]));
});

test('missing and invalid input are rejected', () => {
    assert.throws(
        () => createBooking({ ...baseBooking, purpose: '' }, []),
        /All fields are required/
    );
    assert.throws(
        () => createBooking({ ...baseBooking, resource: 'Unknown Resource' }, []),
        /Invalid resource/
    );
    assert.throws(
        () => createBooking({ ...baseBooking, date: '2026-02-30' }, []),
        /Enter a valid date/
    );
    assert.throws(
        () => createBooking({ ...baseBooking, startTime: 'invalid' }, []),
        /Enter valid start and end times/
    );
});
