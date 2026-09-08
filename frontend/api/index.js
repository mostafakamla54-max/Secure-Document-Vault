const TUNNEL = process.env.BACKEND_URL || 'https://secure-vault-api-production.up.railway.app';

const SKIP = new Set([
  'host', 'connection', 'content-length', 'accept-encoding', 'transfer-encoding', 'expect',
]);

const denylist = (key) => key.toLowerCase().startsWith('x-vercel') || SKIP.has(key.toLowerCase());

async function proxyUpstream(req) {
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

  const attempt = async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    try {
      const upstream = await fetch(TUNNEL + (req.url || ''), {
        method: req.method,
        headers,
        redirect: 'manual',
        body: ['GET', 'HEAD'].includes(req.method) ? undefined : rawBody,
        signal: controller.signal,
      });
      const body = Buffer.from(await upstream.arrayBuffer());
      return { instance: upstream, body };
    } finally {
      clearTimeout(timer);
    }
  };

  try {
    return await attempt();
  } catch (err) {
    await new Promise((r) => setTimeout(r, 700));
    return attempt();
  }
}

module.exports = async function handler(req, res) {
  try {
    const { instance: upstream, body } = await proxyUpstream(req);
    res.status(upstream.status);
    for (const [key, value] of upstream.headers) {
      const lower = key.toLowerCase();
      if (['content-encoding', 'transfer-encoding', 'connection', 'server', 'via']
        .includes(lower) || lower.startsWith('x-railway') || lower.startsWith('x-hikari')) continue;
      res.setHeader(key, value);
    }
    res.setHeader('Cache-Control', 'no-store');
    res.end(body);
  } catch (err) {
    res.status(502).setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ success: false, message: 'لا يمكن الاتصال بالخادم حالياً، يرجى المحاولة بعد قليل' }));
  }
};