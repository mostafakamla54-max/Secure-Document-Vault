const TUNNEL = 'https://heater-relying-culture-portfolio.trycloudflare.com';

const SKIP = new Set([
  'host', 'connection', 'content-length', 'accept-encoding', 'transfer-encoding', 'expect',
]);

const denylist = (key) => key.toLowerCase().startsWith('x-vercel') || SKIP.has(key.toLowerCase());

module.exports = async function handler(req, res) {
  try {
    const rawBody = await new Promise((resolve) => {
      const chunks = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', () => resolve(Buffer.alloc(0)));
    });

    const headers = {};
    for (const key of Object.keys(req.headers)) {
      if (denylist(key)) continue;
      headers[key] = req.headers[key];
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    const upstream = await fetch(TUNNEL + (req.url || ''), {
      method: req.method,
      headers,
      redirect: 'manual',
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : rawBody,
      signal: controller.signal,
    });
    clearTimeout(timer);

    const body = Buffer.from(await upstream.arrayBuffer());
    res.status(upstream.status);
    for (const [key, value] of upstream.headers) {
      const lower = key.toLowerCase();
      if (['content-encoding', 'transfer-encoding', 'connection'].includes(lower)) continue;
      res.setHeader(key, value);
    }
    res.end(body);
  } catch (err) {
    res.status(502).setHeader('content-type', 'text/plain');
    res.end('proxy_err ' + (err && err.message ? err.message : String(err)));
  }
};