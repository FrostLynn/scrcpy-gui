import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as adb from './adb.js';
import * as scrcpy from './scrcpy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  });
  res.end(JSON.stringify(data));
}

function sendError(res, statusCode, message) {
  sendJson(res, statusCode, { error: message });
}

async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

// Server-Sent Events subscribers
const sseClients = new Set();

function broadcastSse(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

scrcpy.sessionEvents.on('log', (payload) => broadcastSse('session_log', payload));
scrcpy.sessionEvents.on('start', (payload) => broadcastSse('session_start', payload));
scrcpy.sessionEvents.on('status', (payload) => broadcastSse('session_status', payload));

export async function requestHandler(req, res) {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // CORS headers for local network tooling
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // SSE Stream
  if (pathname === '/api/events' && method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    res.write('event: connected\ndata: {"status":"connected"}\n\n');
    sseClients.add(res);
    req.on('close', () => sseClients.delete(res));
    return;
  }

  // API Routes
  if (pathname.startsWith('/api/')) {
    try {
      if (pathname === '/api/system' && method === 'GET') {
        const [adbStatus, scrcpyStatus] = await Promise.all([
          adb.checkAdb(),
          scrcpy.checkScrcpy()
        ]);
        return sendJson(res, 200, {
          adb: adbStatus,
          scrcpy: scrcpyStatus,
          platform: process.platform,
          nodeVersion: process.version
        });
      }

      if (pathname === '/api/devices' && method === 'GET') {
        const devices = await adb.listDevices();
        return sendJson(res, 200, { devices });
      }

      if (pathname === '/api/devices/connect' && method === 'POST') {
        const body = await parseBody(req);
        if (!body.ip) return sendError(res, 400, 'IP address is required');
        const result = await adb.connectTcp(body.ip, body.port || 5555);
        return sendJson(res, 200, result);
      }

      if (pathname === '/api/devices/disconnect' && method === 'POST') {
        const body = await parseBody(req);
        if (!body.target) return sendError(res, 400, 'Target IP:port is required');
        const result = await adb.disconnectTcp(body.target);
        return sendJson(res, 200, result);
      }

      const deviceDetailsMatch = pathname.match(/^\/api\/devices\/([^/]+)\/details$/);
      if (deviceDetailsMatch && method === 'GET') {
        const serial = decodeURIComponent(deviceDetailsMatch[1]);
        const [details, ip] = await Promise.all([
          adb.getDeviceDetails(serial).catch(() => ({})),
          adb.getDeviceIp(serial).catch(() => null)
        ]);
        return sendJson(res, 200, { ...details, wifiIp: ip });
      }

      const tcpipMatch = pathname.match(/^\/api\/devices\/([^/]+)\/tcpip$/);
      if (tcpipMatch && method === 'POST') {
        const serial = decodeURIComponent(tcpipMatch[1]);
        const body = await parseBody(req);
        const result = await adb.enableTcpip(serial, body.port || 5555);
        return sendJson(res, 200, result);
      }

      const rebootMatch = pathname.match(/^\/api\/devices\/([^/]+)\/reboot$/);
      if (rebootMatch && method === 'POST') {
        const serial = decodeURIComponent(rebootMatch[1]);
        const body = await parseBody(req);
        const result = await adb.rebootDevice(serial, body.mode);
        return sendJson(res, 200, result);
      }

      const keyeventMatch = pathname.match(/^\/api\/devices\/([^/]+)\/keyevent$/);
      if (keyeventMatch && method === 'POST') {
        const serial = decodeURIComponent(keyeventMatch[1]);
        const body = await parseBody(req);
        const result = await adb.sendKeyEvent(serial, body.keycode);
        return sendJson(res, 200, result);
      }

      const screenshotMatch = pathname.match(/^\/api\/devices\/([^/]+)\/screenshot$/);
      if (screenshotMatch && method === 'GET') {
        const serial = decodeURIComponent(screenshotMatch[1]);
        const imageBuffer = await adb.captureScreenshot(serial);
        res.writeHead(200, {
          'Content-Type': 'image/png',
          'Content-Length': imageBuffer.length,
          'Content-Disposition': `inline; filename="screenshot_${serial}_${Date.now()}.png"`
        });
        res.end(imageBuffer);
        return;
      }

      if (pathname === '/api/sessions' && method === 'GET') {
        const sessions = scrcpy.listSessions();
        return sendJson(res, 200, { sessions });
      }

      if (pathname === '/api/sessions/start' && method === 'POST') {
        const body = await parseBody(req);
        const session = scrcpy.startSession(body);
        return sendJson(res, 201, session);
      }

      const stopSessionMatch = pathname.match(/^\/api\/sessions\/([^/]+)\/stop$/);
      if (stopSessionMatch && method === 'POST') {
        const id = decodeURIComponent(stopSessionMatch[1]);
        const result = scrcpy.stopSession(id);
        return sendJson(res, 200, result);
      }

      const getSessionMatch = pathname.match(/^\/api\/sessions\/([^/]+)$/);
      if (getSessionMatch && method === 'GET') {
        const id = decodeURIComponent(getSessionMatch[1]);
        const session = scrcpy.getSession(id);
        if (!session) return sendError(res, 404, 'Session not found');
        return sendJson(res, 200, session);
      }

      return sendError(res, 404, 'Endpoint not found');
    } catch (err) {
      return sendError(res, 500, err.message || 'Internal server error');
    }
  }

  // Static file serving
  let relPath = pathname === '/' ? 'index.html' : pathname.slice(1);
  // Prevent directory traversal
  const safePath = path.normalize(relPath).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, safePath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    return sendError(res, 403, 'Access denied');
  }

  try {
    const stats = await fs.promises.stat(filePath);
    if (!stats.isFile()) {
      return sendError(res, 404, 'File not found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': 'public, max-age=3600'
    });

    fs.createReadStream(filePath).pipe(res);
  } catch {
    sendError(res, 404, 'File not found');
  }
}

export function createServer() {
  return http.createServer(requestHandler);
}

// ponytail: direct node CLI runner; PORT environment variable override.
if (process.argv[1] === __filename) {
  const PORT = Number.parseInt(process.env.PORT, 10) || 5050;
  const server = createServer();
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`scrcpy-gui control console running at http://localhost:${PORT}`);
  });
}
