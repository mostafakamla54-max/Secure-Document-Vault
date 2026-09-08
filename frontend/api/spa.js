const fs = require('fs');
const path = require('path');

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-XSS-Protection': '1; mode=block',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-site',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://secure-vault-api-production.up.railway.app; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
};

const FALLBACK = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/><title>Secure Document Vault</title></head><body><noscript>You need to enable JavaScript to run this app.</noscript><div id="root"></div></body></html>`;

function readAppHtml() {
  try {
    const file = path.join(__dirname, 'app.html');
    if (fs.existsSync(file)) return fs.readFileSync(file, 'utf8');
  } catch (e) {
    /* ignore */
  }
  return FALLBACK;
}

module.exports = function handler(req, res) {
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.status(405).setHeader('content-type', 'text/plain; charset=utf-8');
    res.end('Method Not Allowed');
    return;
  }
  res.status(200);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    res.setHeader(key, value);
  }
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('content-type', 'text/html; charset=utf-8');
  res.end(readAppHtml());
};