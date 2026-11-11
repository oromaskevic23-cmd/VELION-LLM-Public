// Project author and founding architect: Alexander Nikolaevich Romaskevich (RomaskevicH).
// Local development interface only; this is not an internet-facing production server.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { localChatServiceFromEnv } from './chat-service.mjs';
import { TASK_DRAFT_FORMAT } from './task-draft-schema.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), 'public');
const routes = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/app.mjs', ['app.mjs', 'text/javascript; charset=utf-8']],
  ['/answer-renderer.mjs', ['answer-renderer.mjs', 'text/javascript; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/manifest.webmanifest', ['manifest.webmanifest', 'application/manifest+json; charset=utf-8']],
  ['/app-icon-180.png', ['app-icon-180.png', 'image/png']],
  ['/app-icon-192.png', ['app-icon-192.png', 'image/png']],
  ['/app-icon-512.png', ['app-icon-512.png', 'image/png']],
]);
const MAX_BODY = 32768;
const reply = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
};
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0,
      tooLarge = false;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        tooLarge = true;
        chunks.length = 0;
      } else if (!tooLarge) chunks.push(chunk);
    });
    req.on('end', () => (tooLarge ? reject(Error('BODY_TOO_LARGE')) : resolve(Buffer.concat(chunks))));
    req.on('error', reject);
    req.on('aborted', () => reject(Error('REQUEST_ABORTED')));
  });
}

export function createAppServer({ localChatService = null } = {}) {
  const server = createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; manifest-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
    );
    let pathname;
    try {
      pathname = new URL(req.url, 'http://localhost').pathname;
    } catch {
      res.writeHead(400);
      res.end('Bad URL');
      return;
    }
    if (pathname === '/api/chat') {
      if (req.method !== 'POST') {
        res.writeHead(405, { Allow: 'POST' });
        res.end();
        return;
      }
      if (!localChatService) {
        req.resume();
        reply(res, 503, { code: 'CHAT_DISABLED' });
        return;
      }
      const addr = server.address(),
        remote = req.socket.remoteAddress;
      const authority = addr && typeof addr === 'object' ? '127.0.0.1:' + addr.port : '';
      if (
        !['127.0.0.1', '::ffff:127.0.0.1'].includes(remote) ||
        req.headers.host !== authority ||
        req.headers.origin !== 'http://' + authority
      ) {
        req.resume();
        reply(res, 403, { code: 'LOCAL_ORIGIN_REQUIRED' });
        return;
      }
      if (!localChatService.authenticate(req.headers.authorization)) {
        req.resume();
        reply(res, 401, { code: 'LOCAL_ACCESS_TOKEN_REQUIRED' });
        return;
      }
      if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(req.headers['content-type'] || '')) {
        req.resume();
        reply(res, 415, { code: 'JSON_REQUIRED' });
        return;
      }
      if (Number(req.headers['content-length']) > MAX_BODY) {
        req.resume();
        reply(res, 413, { code: 'BODY_TOO_LARGE' });
        return;
      }
      let input;
      try {
        input = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(await readBody(req)));
      } catch (cause) {
        reply(res, cause.message === 'BODY_TOO_LARGE' ? 413 : 400, {
          code: cause.message === 'BODY_TOO_LARGE' ? 'BODY_TOO_LARGE' : 'INVALID_JSON',
        });
        return;
      }
      if (
        !input ||
        typeof input !== 'object' ||
        Array.isArray(input) ||
        !['messages','messages|responseFormat'].includes(Object.keys(input).sort().join('|')) ||
        (input.responseFormat !== undefined && input.responseFormat !== TASK_DRAFT_FORMAT)
      ) {
        reply(res, 400, { code: 'INVALID_REQUEST' });
        return;
      }
      const controller = new AbortController();
      const cancel = () => {
        if (!res.writableEnded) controller.abort();
      };
      res.once('close', cancel);
      try {
        const result = await localChatService.chat(input.messages, { signal: controller.signal, responseFormat:input.responseFormat });
        if (!controller.signal.aborted) reply(res, 200, result);
      } catch (cause) {
        if (!controller.signal.aborted) {
          const code = cause?.code,
            status = ['CHAT_INVALID_MESSAGES','CHAT_FORMAT_INVALID'].includes(code) ? 400 :
              code === 'CHAT_FORMAT_DISABLED' ? 503 : code === 'CHAT_BUSY' ? 409 : 502;
          reply(res, status, {
            code: [
              'CHAT_INVALID_MESSAGES',
              'CHAT_FORMAT_INVALID',
              'CHAT_FORMAT_DISABLED',
              'CHAT_BUSY',
              'CHAT_MODEL_UNAVAILABLE',
              'CHAT_MODEL_HTTP_FAILED',
              'CHAT_MODEL_RESPONSE_INVALID',
              'CHAT_MODEL_RESPONSE_TOO_LARGE',
            ].includes(code)
              ? code
              : 'CHAT_FAILED',
          });
        }
      } finally {
        res.off('close', cancel);
      }
      return;
    }
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(405, { Allow: 'GET, HEAD' });
      res.end('Method not allowed');
      return;
    }
    const entry = routes.get(pathname);
    if (!entry) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    try {
      const content = await readFile(join(root, entry[0]));
      res.writeHead(200, { 'Content-Type': entry[1], 'Content-Length': content.length });
      res.end(req.method === 'HEAD' ? undefined : content);
    } catch {
      res.writeHead(500);
      res.end('Server error');
    }
  });
  server.headersTimeout = 10000;
  server.requestTimeout = 15000;
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const port = Number(process.env.PORT ?? 4174);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw TypeError('Invalid PORT');
  const backend = process.env.VELION_LOCAL_BACKEND ?? 'ollama';
  if (!['ollama', 'gguf', 'openjarvis'].includes(backend)) throw Error('CHAT_BACKEND_INVALID');
  let localChatService = null;
  if (process.env.IMPERIAL_CHAT_LOCAL_ONLY === 'YES') {
    if (backend === 'gguf') {
      const { ggufServiceFromEnv } = await import('./native-gguf/gguf-chat.mjs');
      localChatService = await ggufServiceFromEnv();
    } else if (backend === 'openjarvis') {
      const { openJarvisServiceFromEnv } = await import('./openjarvis-chat.mjs');
      localChatService = openJarvisServiceFromEnv();
    } else {
      localChatService = localChatServiceFromEnv();
    }
  }
  createAppServer({ localChatService }).listen(port, '127.0.0.1', () => {
    process.stdout.write('VELION local chat listening on http://127.0.0.1:' + port + '\n');
  });
}

