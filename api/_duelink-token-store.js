import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { HttpError, checkOrigin, softRateLimit } from './_http.js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://htmsgnnqnmaqxuzlcsld.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0bXNnbm5xbm1hcXh1emxjc2xkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NjYyOTgsImV4cCI6MjA5NDU0MjI5OH0.NX9jDVkm8JL4ffH9f5GsH7BfNOO9MM1N6zKipULNvyI';

export function cleanDuelinkToken(value) {
  return String(value || '').trim().replace(/^Bearer\s+/i, '');
}

function getSecret() {
  const secret = process.env.DUELINK_TOKEN_SECRET || process.env.TOKEN_ENCRYPTION_SECRET || '';
  if (!secret || secret.length < 24) {
    const err = new Error('DUELINK_TOKEN_SECRET manquant ou trop court. Ajoutez une variable Vercel de 24+ caractères avant de mémoriser un token.');
    err.code = 'CONFIG_MISSING';
    throw err;
  }
  return crypto.createHash('sha256').update(secret).digest();
}

// Domain-separated signatures: never expose the encryption key or provider token.
export function duelinkSyncMac(value) {
  return crypto.createHmac('sha256', getSecret()).update('inksight-results-sync-v1\0').update(value).digest('base64url');
}

export function encryptToken(token, ownerId) {
  const clean = cleanDuelinkToken(token);
  if (!clean) throw new Error('Token Duels.ink manquant.');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getSecret(), iv);
  if (ownerId) cipher.setAAD(Buffer.from(`duelink:${ownerId}`));
  const encrypted = Buffer.concat([cipher.update(clean, 'utf8'), cipher.final()]);
  return {
    v: ownerId ? 2 : 1,
    alg: 'aes-256-gcm',
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    data: encrypted.toString('base64'),
  };
}

export function decryptToken(payload, ownerId) {
  if (!payload || typeof payload !== 'object') throw new Error('Token chiffré indisponible.');
  const iv = Buffer.from(payload.iv || '', 'base64');
  const tag = Buffer.from(payload.tag || '', 'base64');
  const data = Buffer.from(payload.data || '', 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', getSecret(), iv);
  if (payload.v === 2) {
    if (!ownerId) throw new Error('Propriétaire du jeton absent.');
    decipher.setAAD(Buffer.from(`duelink:${ownerId}`));
  } else if (payload.v !== 1) throw new Error('Version de chiffrement inconnue.');
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

export function tokenHint(token) {
  const clean = cleanDuelinkToken(token);
  if (!clean) return '';
  if (clean.length <= 10) return '••••';
  return `${clean.slice(0, 4)}…${clean.slice(-4)}`;
}

export function supabaseForRequest(req) {
  const auth = req.headers.authorization || req.headers.Authorization || '';
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: auth ? { Authorization: auth } : {}, fetch: (url, options) => fetch(url, { ...options, signal: AbortSignal.any([...(options?.signal ? [options.signal] : []), AbortSignal.timeout(10000)]) }) },
  });
}

export async function getRequestUser(req) {
  checkOrigin(req);
  const authorization = req.headers.authorization || req.headers.Authorization || '';
  if (!/^Bearer [A-Za-z0-9._~-]+$/.test(authorization) || authorization.length > 12000) throw new HttpError(401, 'Connexion Inksight requise.', 'AUTH_REQUIRED');
  const client = supabaseForRequest(req);
  const { data, error } = await client.auth.getUser();
  if (error || !data?.user) {
    const err = new Error('Connexion InkSight requise.');
    err.code = 'AUTH_REQUIRED';
    throw err;
  }
  softRateLimit(`api:${data.user.id}`, { maximum: 100 });
  return { client, user: data.user };
}

export async function getSavedDuelinkToken(req, authenticated) {
  const { client, user } = authenticated || await getRequestUser(req);
  const { data, error } = await client
    .from('duelink_connections')
    .select('encrypted_token,token_hint,expires_at,last_sync_at,updated_at,duels_user_id,results_sync_version')
    .eq('user_id', user.id)
    .eq('provider', 'duelink')
    .maybeSingle();
  if (error) throw new HttpError(503, 'Connexion Duels.ink indisponible.', 'LINK_UNAVAILABLE');
  if (!data?.encrypted_token) return { token: '', connection: null, client, user };
  if (data.expires_at && new Date(data.expires_at).getTime() <= Date.now()) throw new HttpError(401, 'La connexion Duels.ink a expiré. Reconnectez ce compte.', 'DUELS_RECONNECT');
  return { token: decryptToken(data.encrypted_token, user.id), connection: data, client, user };
}

export async function resolveDuelinkToken(req, body = {}) {
  const authenticated = await getRequestUser(req);
  const direct = cleanDuelinkToken(body.token);
  if (direct) {
    if (direct.length > 8192 || /[\r\n\x00-\x20]/.test(direct)) throw new HttpError(400, 'Format de jeton Duels.ink invalide.', 'TOKEN_INVALID');
    return { token: direct, source: 'request', ...authenticated };
  }
  const saved = await getSavedDuelinkToken(req, authenticated);
  if (!saved.token) {
    const err = new Error('Token Duels.ink manquant. Collez un token ou mémorisez-le sur votre compte.');
    err.code = 'TOKEN_MISSING';
    throw err;
  }
  return { ...saved, source: 'saved' };
}
