import { fetchBounded, jsonError, HttpError, softRateLimit } from './_http.js';
export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); throw new HttpError(405, 'Méthode non autorisée.'); }
    softRateLimit('image:' + (req.headers['x-forwarded-for'] ?? 'unknown'), { maximum: 240 });
    const response = await fetchBounded(String(req.query?.url ?? ''), { hosts: ['cards.duels.ink'], maximum: 8 * 1024 * 1024, timeout: 10000 });
    if (!response.ok) throw new HttpError(502, 'Image distante indisponible.');
    const type = response.headers.get('content-type')?.split(';')[0]?.toLowerCase();
    if (!['image/png','image/jpeg','image/webp','image/avif','image/gif'].includes(type)) throw new HttpError(502, 'Ce contenu n’est pas une image autorisée.');
    res.statusCode = 200;
    res.setHeader('Content-Type', type);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; sandbox");
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.end(Buffer.from(response.bytes));
  } catch (error) { return jsonError(res, error); }
}
