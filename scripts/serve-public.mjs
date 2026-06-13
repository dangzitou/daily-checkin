import { createReadStream, existsSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import http from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = normalize(join(fileURLToPath(import.meta.url), '..', '..', 'apps', 'web', 'dist'));
const port = Number(process.env.PUBLIC_PORT ?? 18080);
const apiTarget = process.env.API_TARGET ?? 'http://127.0.0.1:3000';

const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.webmanifest', 'application/manifest+json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.ico', 'image/x-icon']
]);

function proxyApi(request, response) {
  const target = new URL(request.url ?? '/', apiTarget);
  const proxy = http.request(
    target,
    {
      method: request.method,
      headers: {
        ...request.headers,
        host: target.host
      }
    },
    (upstream) => {
      response.writeHead(upstream.statusCode ?? 502, upstream.headers);
      upstream.pipe(response);
    }
  );

  proxy.on('error', () => {
    response.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify({ message: 'API 服务不可用' }));
  });

  request.pipe(proxy);
}

async function serveStatic(request, response) {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
  const rawPath = decodeURIComponent(url.pathname);
  const safePath = normalize(rawPath).replace(/^(\.\.[/\\])+/, '');
  let filePath = join(root, safePath);

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    filePath = join(root, 'index.html');
  }

  if (!existsSync(filePath)) {
    response.writeHead(404);
    response.end('Not found');
    return;
  }

  const type = contentTypes.get(extname(filePath)) ?? 'application/octet-stream';
  response.writeHead(200, { 'Content-Type': type });

  if (filePath.endsWith('index.html')) {
    response.end(await readFile(filePath));
    return;
  }

  createReadStream(filePath).pipe(response);
}

const server = http.createServer((request, response) => {
  if ((request.url ?? '').startsWith('/api/')) {
    proxyApi(request, response);
    return;
  }

  void serveStatic(request, response);
});

server.listen(port, '0.0.0.0', () => {
  console.log(`daily-checkin public server listening on http://0.0.0.0:${port}`);
});
