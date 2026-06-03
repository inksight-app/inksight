// Proxy d'image (origine identique) pour permettre le détourage IA côté client :
// le CDN des cartes n'envoie pas d'en-têtes CORS, ce qui bloque fetch()/canvas.
// On relaie l'image depuis une liste blanche d'hôtes, avec CORS permissif.
const ALLOWED_HOSTS = ['cards.duels.ink'];

export default async function handler(req, res) {
  const url = req.query && req.query.url ? String(req.query.url) : '';
  let parsed;
  try { parsed = new URL(url); } catch { res.statusCode = 400; res.end('URL invalide'); return; }
  if (parsed.protocol !== 'https:' || !ALLOWED_HOSTS.includes(parsed.hostname)) {
    res.statusCode = 400; res.end('Hôte non autorisé'); return;
  }
  try {
    const upstream = await fetch(parsed.toString());
    if (!upstream.ok) { res.statusCode = upstream.status; res.end('Image indisponible'); return; }
    const buffer = Buffer.from(await upstream.arrayBuffer());
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'image/webp');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.statusCode = 200;
    res.end(buffer);
  } catch {
    res.statusCode = 502; res.end('Erreur proxy');
  }
}
