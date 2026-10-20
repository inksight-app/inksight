/** Local, template-based commentary. No model or external AI call. */
import { json, jsonError, readJsonBody, checkOrigin, softRateLimit, HttpError } from './_http.js';
import { generateLocalCoachCommentary, COACH_ENTRY_COUNT } from '../src/lorcana/commentary.js';
export { generateLocalCoachCommentary } from '../src/lorcana/commentary.js';

export default async function handler(req, res) {
  try {
    checkOrigin(req);
    if (req.method === 'GET') return json(res, 200, { ok: true, name: 'Inksight local coach', entries: COACH_ENTRY_COUNT });
    if (req.method !== 'POST') { res.setHeader('Allow','GET,POST'); throw new HttpError(405,'Méthode non autorisée.'); }
    softRateLimit(`coach:${req.headers['x-forwarded-for'] ?? 'unknown'}`);
    const body = await readJsonBody(req, 16384);
    const commentary = generateLocalCoachCommentary(body);
    return json(res, 200, commentary);
  } catch (error) {
    return jsonError(res, error);
  }
}
