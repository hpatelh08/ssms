const http = require('http');
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, 'dist');
const port = Number(process.env.PORT || 3102);

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.map': 'application/json; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function send(res, statusCode, body, headers = {}) {
  res.writeHead(statusCode, { 'Content-Type': 'text/plain; charset=utf-8', ...headers });
  res.end(body);
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      send(res, 404, 'Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(data);
  });
}

http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  let filePath = path.join(rootDir, urlPath);

  if (urlPath === '/' || urlPath === '') {
    filePath = path.join(rootDir, 'index.html');
  }

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isDirectory()) {
      serveFile(res, path.join(filePath, 'index.html'));
      return;
    }

    if (!err && stat.isFile()) {
      serveFile(res, filePath);
      return;
    }

    serveFile(res, path.join(rootDir, 'index.html'));
  });
}).listen(port, '127.0.0.1', () => {
  console.log(`Student portal preview running at http://127.0.0.1:${port}`);
});
