import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequestHandler } from '../server.js';

const baseBooking = {
    resource: 'Meeting Room 1',
    date: '2026-09-17',
    startTime: '09:00',
    endTime: '10:00',
    person: 'Ada Lovelace',
    purpose: 'Planning'
};

async function withTestServer(testBody, initialBookings = []) {
    const directory = await mkdtemp(join(tmpdir(), 'bookit-test-'));
    const storagePath = join(directory, 'bookings.json');
    await writeFile(storagePath, `${JSON.stringify(initialBookings)}\n`);
    const server = createServer(createRequestHandler(storagePath));
    await new Promise((resolve) => server.listen(0, resolve));
    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}`;

    try {
        await testBody({
            request: (path, options) => fetch(`${baseUrl}${path}`, options),
            readBookings: async () => JSON.parse(await readFile(storagePath, 'utf8')),
            storagePath
        });
    } finally {
        await new Promise((resolve) => server.close(resolve));
        await rm(directory, { recursive: true, force: true });
    }
}

function createRequest(booking = {}) {
    return {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...baseBooking, ...booking })
    };
}

async function responseJson(response) {
    return { status: response.status, body: await response.json() };
}

test('simultaneous overlapping bookings produce exactly one success', async () => {
    await withTestServer(async ({ request, readBookings }) => {
        const responses = await Promise.all([
            request('/api/bookings', createRequest({ person: 'First' })),
            request('/api/bookings', createRequest({ person: 'Second' }))
        ]);
        const results = await Promise.all(responses.map(responseJson));
        const bookings = await readBookings();

        assert.equal(results.filter((result) => result.status === 201).length, 1);
        assert.equal(results.filter((result) => result.status === 409).length, 1);
        assert.equal(bookings.length, 1);
    });
});

test('simultaneous non-conflicting bookings are both saved', async () => {
    await withTestServer(async ({ request, readBookings }) => {
        const responses = await Promise.all([
            request('/api/bookings', createRequest({ startTime: '09:00', endTime: '10:00' })),
            request('/api/bookings', createRequest({ startTime: '10:00', endTime: '11:00' }))
        ]);
        const results = await Promise.all(responses.map(responseJson));
        const bookings = await readBookings();

        assert.deepEqual(results.map((result) => result.status).sort(), [201, 201]);
        assert.equal(bookings.length, 2);
    });
});

test('cancellation persists and releases the slot', async () => {
    await withTestServer(async ({ request, readBookings }) => {
        const created = await responseJson(await request('/api/bookings', createRequest()));
        const cancelled = await responseJson(await request(`/api/bookings/${created.body.id}/cancel`, { method: 'POST' }));
        const replacement = await responseJson(await request('/api/bookings', createRequest({ person: 'Replacement' })));
        const bookings = await readBookings();

        assert.equal(created.status, 201);
        assert.equal(cancelled.status, 200);
        assert.equal(cancelled.body.status, 'cancelled');
        assert.equal(replacement.status, 201);
        assert.equal(bookings.filter((booking) => booking.status === 'cancelled').length, 1);
        assert.equal(bookings.filter((booking) => booking.status === 'confirmed').length, 1);
    });
});

test('invalid input returns 400 and does not block a later valid operation', async () => {
    await withTestServer(async ({ request, readBookings }) => {
        const invalid = await responseJson(await request('/api/bookings', {
            ...createRequest(),
            body: JSON.stringify([])
        }));
        const malformed = await responseJson(await request('/api/bookings', {
            ...createRequest(),
            body: '{not json'
        }));
        const valid = await responseJson(await request('/api/bookings', createRequest()));
        const bookings = await readBookings();

        assert.equal(invalid.status, 400);
        assert.match(invalid.body.error, /JSON object/);
        const nullBody = await responseJson(await request('/api/bookings', {
            ...createRequest(),
            body: 'null'
        }));
        assert.equal(malformed.status, 400);
        assert.match(malformed.body.error, /valid JSON/);
        assert.equal(nullBody.status, 400);
        assert.match(nullBody.body.error, /JSON object/);
        assert.equal(valid.status, 201);
        assert.equal(bookings.length, 1);
    });
});

test('missing cancellation returns 404 and storage errors return 500 without touching real data', async () => {
    await withTestServer(async ({ request, readBookings, storagePath }) => {
        const missing = await responseJson(await request('/api/bookings/missing-id/cancel', { method: 'POST' }));
        const invalidField = await responseJson(await request('/api/bookings', createRequest({ purpose: 42 })));
        const bookings = await readBookings();

        assert.equal(missing.status, 404);
        assert.equal(invalidField.status, 400);
        assert.match(invalidField.body.error, /purpose must be a text value/);
        assert.deepEqual(bookings, []);

        await rm(storagePath);
        await mkdir(storagePath);
        const storageFailure = await responseJson(await request('/api/bookings', createRequest()));
        assert.equal(storageFailure.status, 500);
        assert.equal(storageFailure.body.error, 'Booking storage is temporarily unavailable.');
        assert.doesNotMatch(storageFailure.body.error, /bookit|tmp|F:\\|storagePath/i);
    });
});
