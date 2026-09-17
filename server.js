import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createBooking, findConflict, resources } from './src/booking.js';

const root = fileURLToPath(new URL('.', import.meta.url));
const dataPath = join(root, 'data', 'bookings.json');
const publicPath = join(root, 'public');
const preferredPort = Number(process.env.PORT) || 3000;

async function loadBookings() {
    return JSON.parse(await readFile(dataPath, 'utf8'));
}

async function saveBookings(bookings) {
    await writeFile(dataPath, `${JSON.stringify(bookings, null, 2)}\n`);
}

function sendJson(response, status, body) {
    response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify(body));
}

async function readJson(request) {
    let body = '';
    for await (const chunk of request) body += chunk;
    return JSON.parse(body || '{}');
}

async function handleApi(request, response, pathname) {
    if (request.method === 'GET' && pathname === '/api/resources') {
        return sendJson(response, 200, resources);
    }

    if (request.method === 'GET' && pathname === '/api/bookings') {
        const date = new URL(request.url, `http://${request.headers.host}`).searchParams.get('date');
        const bookings = await loadBookings();
        const filtered = date ? bookings.filter((booking) => booking.date === date) : bookings;
        filtered.sort((a, b) => a.startTime.localeCompare(b.startTime));
        return sendJson(response, 200, filtered);
    }

    if (request.method === 'POST' && pathname === '/api/bookings') {
        const input = await readJson(request);
        const bookings = await loadBookings();
        const booking = createBooking(input, bookings);
        bookings.push(booking);
        await saveBookings(bookings);
        return sendJson(response, 201, booking);
    }

    const cancelMatch = pathname.match(/^\/api\/bookings\/([^/]+)\/cancel$/);
    if (request.method === 'POST' && cancelMatch) {
        const bookings = await loadBookings();
        const booking = bookings.find((item) => item.id === cancelMatch[1]);

        if (!booking) return sendJson(response, 404, { error: 'Booking not found.' });
        if (booking.status !== 'confirmed') return sendJson(response, 400, { error: 'Only confirmed bookings can be cancelled.' });

        booking.status = 'cancelled';
        await saveBookings(bookings);
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

const requestHandler = async (request, response) => {
    const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;

    try {
        if (pathname.startsWith('/api/')) await handleApi(request, response, pathname);
        else await serveStatic(response, pathname);
    } catch (error) {
        const status = error instanceof SyntaxError ? 400 : 400;
        sendJson(response, status, { error: error.message || 'Request failed.' });
    }
};

function startServer(port) {
    const server = createServer(requestHandler);
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

startServer(preferredPort);
