import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { readFile, rename, rm, writeFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BookingConflictError, BookingValidationError, createBooking, isPastBookingDate, resources } from './src/booking.js';

const root = fileURLToPath(new URL('.', import.meta.url));
const dataPath = join(root, 'data', 'bookings.json');
const publicPath = join(root, 'public');
const preferredPort = Number(process.env.PORT) || 3000;

class StorageError extends Error {
    constructor(message, cause) {
        super(message, { cause });
        this.name = 'StorageError';
    }
}

async function loadBookings(storagePath = dataPath) {
    try {
        const contents = await readFile(storagePath, 'utf8');
        const bookings = JSON.parse(contents);
        if (!Array.isArray(bookings)) throw new Error('Booking data must be an array.');
        return bookings;
    } catch (error) {
        if (error.code === 'ENOENT') return [];
        throw new StorageError('Unable to read booking data.', error);
    }
}

export async function saveBookings(bookings, storagePath = dataPath, replaceFile = rename) {
    const temporaryPath = `${storagePath}.${process.pid}.${randomUUID()}.tmp`;
    try {
        await writeFile(temporaryPath, `${JSON.stringify(bookings, null, 2)}\n`, 'utf8');
        await replaceFile(temporaryPath, storagePath);
    } catch (error) {
        await rm(temporaryPath, { force: true }).catch(() => { });
        throw new StorageError('Unable to save booking data.', error);
    }
}

function sendJson(response, status, body) {
    response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify(body));
}

async function readJson(request) {
    let body = '';
    for await (const chunk of request) body += chunk;
    try {
        return JSON.parse(body || '{}');
    } catch {
        throw new BookingValidationError('Request body must contain valid JSON.');
    }
}

function createMutationQueue() {
    let tail = Promise.resolve();
    return (operation) => {
        const result = tail.then(operation);
        tail = result.catch(() => { });
        return result;
    };
}

async function handleApi(request, response, pathname, storagePath, enqueueMutation) {
    if (request.method === 'GET' && pathname === '/api/resources') {
        return sendJson(response, 200, resources);
    }

    if (request.method === 'GET' && pathname === '/api/bookings') {
        const date = new URL(request.url, `http://${request.headers.host}`).searchParams.get('date');
        const bookings = await loadBookings(storagePath);
        const filtered = date ? bookings.filter((booking) => booking.date === date) : bookings;
        filtered.sort((a, b) => a.startTime.localeCompare(b.startTime));
        return sendJson(response, 200, filtered);
    }

    if (request.method === 'POST' && pathname === '/api/bookings') {
        const input = await readJson(request);
        const booking = await enqueueMutation(async () => {
            const bookings = await loadBookings(storagePath);
            const createdBooking = createBooking(input, bookings);
            bookings.push(createdBooking);
            await saveBookings(bookings, storagePath);
            return createdBooking;
        });
        return sendJson(response, 201, booking);
    }

    const cancelMatch = pathname.match(/^\/api\/bookings\/([^/]+)\/cancel$/);
    if (request.method === 'POST' && cancelMatch) {
        const booking = await enqueueMutation(async () => {
            const bookings = await loadBookings(storagePath);
            const foundBooking = bookings.find((item) => item.id === cancelMatch[1]);

            if (!foundBooking) {
                const error = new Error('Booking not found.');
                error.code = 'BOOKING_NOT_FOUND';
                throw error;
            }
            if (foundBooking.status !== 'confirmed') {
                throw new BookingValidationError('Only confirmed bookings can be cancelled.');
            }
            if (isPastBookingDate(foundBooking.date)) {
                throw new BookingValidationError('Past bookings cannot be cancelled.');
            }

            foundBooking.status = 'cancelled';
            await saveBookings(bookings, storagePath);
            return foundBooking;
        });
        return sendJson(response, 200, booking);
    }

    sendJson(response, 404, { error: 'API route not found.' });
}

async function serveStatic(response, pathname) {
    const requestedPath = pathname === '/' ? '/index.html' : pathname;
    const filePath = normalize(join(publicPath, requestedPath));
    if (!filePath.startsWith(publicPath)) {
        response.writeHead(403);
        return response.end('Forbidden');
    }

    try {
        const content = await readFile(filePath);
        const contentTypes = { '.css': 'text/css', '.js': 'text/javascript', '.html': 'text/html' };
        response.writeHead(200, { 'Content-Type': `${contentTypes[extname(filePath)] || 'application/octet-stream'}; charset=utf-8` });
        response.end(content);
    } catch {
        response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('Not found');
    }
}

export function createRequestHandler(storagePath = dataPath) {
    const enqueueMutation = createMutationQueue();
    return async (request, response) => {
        const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;

        try {
            if (pathname.startsWith('/api/')) await handleApi(request, response, pathname, storagePath, enqueueMutation);
            else await serveStatic(response, pathname);
        } catch (error) {
            let status = 500;
            let message = 'Request failed.';
            if (error instanceof BookingValidationError) {
                status = 400;
                message = error.message;
            } else if (error instanceof BookingConflictError) {
                status = 409;
                message = error.message;
            } else if (error.code === 'BOOKING_NOT_FOUND') {
                status = 404;
                message = error.message;
            } else if (error instanceof StorageError) {
                message = 'Booking storage is temporarily unavailable.';
            }
            if (status === 500) console.error(error);
            sendJson(response, status, { error: message });
        }
    }
}

export function startServer(port) {
    const server = createServer(createRequestHandler());
    server.once('error', (error) => {
        if (error.code === 'EADDRINUSE' && !process.env.PORT) {
            console.log(`Port ${port} is busy. Trying port ${port + 1}...`);
            server.close(() => startServer(port + 1));
            return;
        }

        if (error.code === 'EADDRINUSE') {
            console.error(`Port ${port} is already in use. Close the other app or run with a different PORT.`);
            process.exitCode = 1;
            return;
        }

        console.error(error);
        process.exitCode = 1;
    });

    server.listen(port, () => {
        console.log(`BookIt is running at http://localhost:${port}`);
    });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) startServer(preferredPort);
