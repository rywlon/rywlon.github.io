import express from 'express';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

const COMPRESSIBLE_RE = /\.(html|css|js|svg|json)$/i;
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8'
};

// Lightweight native Brotli/Gzip middleware for text assets so HTML/CSS/JS arrive faster and kick off image fetches sooner
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  const urlPath = req.path === '/' ? '/index.html' : req.path;
  if (!COMPRESSIBLE_RE.test(urlPath)) return next();

  const ae = String(req.headers['accept-encoding'] || '');
  const encoding = ae.includes('br') ? 'br' : ae.includes('gzip') ? 'gzip' : null;
  if (!encoding) return next();

  const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
  const candidates = [
    path.join(__dirname, 'public', safePath),
    path.join(__dirname, safePath)
  ];
  const filePath = candidates.find((p) => {
    try { return fs.statSync(p).isFile(); } catch { return false; }
  });
  if (!filePath) return next();

  const ext = path.extname(filePath).toLowerCase();
  res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
  res.setHeader('Vary', 'Accept-Encoding');
  res.setHeader('Content-Encoding', encoding);
  if (ext === '.svg') {
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
  } else {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  }
  if (req.method === 'HEAD') return res.end();

  const stream = fs.createReadStream(filePath);
  const compressor = encoding === 'br'
    ? zlib.createBrotliCompress({ params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 } })
    : zlib.createGzip({ level: 6 });
  stream.on('error', () => res.status(500).end());
  stream.pipe(compressor).pipe(res);
});

const setStaticHeaders = (res, filePath) => {
  if (/\.(html|css|js)$/i.test(filePath)) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  } else if (/\.(webp|png|jpe?g|svg|woff2?|ico)$/i.test(filePath)) {
    const reqUrl = res.req?.originalUrl || '';
    if (/[?&]v=/.test(reqUrl)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    }
  }
};

app.use(express.static(path.join(__dirname, 'public'), {
  etag: true,
  lastModified: true,
  setHeaders: setStaticHeaders
}));

app.use(express.static(__dirname, {
  extensions: ['html'],
  etag: true,
  lastModified: true,
  setHeaders: setStaticHeaders
}));

app.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.sendFile(path.join(__dirname, 'index.html'));
});

const server = app.listen(PORT, HOST, () => {
  console.log(`Static portfolio server listening at http://${HOST}:${PORT}`);
});

const shutdown = () => {
  server.close(() => process.exit(0));
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
