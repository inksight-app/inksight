import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

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

export function encryptToken(token) {
  const clean = cleanDuelinkToken(token);
  if (!clean) throw new Error('Token Duel.ink manquant.');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getSecret(), iv);
  const encrypted = Buffer.concat([cipher.update(clean, 'utf8'), cipher.final()]);
  return {
    v: 1,
    alg: 'aes-256-gcm',
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    data: encrypted.toString('base64'),
  };
}

export function decryptToken(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('Token chiffré indisponible.');
  const iv = Buffer.from(payload.iv || '', 'base64');
  const tag = Buffer.from(payload.tag || '', 'base64');
  const data = Buffer.from(payload.data || '', 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', getSecret(), iv);
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
    global: { headers: auth ? { Authorization: auth } : {} },
  });
}

export async function getRequestUser(req) {
  const client = supabaseForRequest(req);
  const { data, error } = await client.auth.getUser();
  if (error || !data?.user) {
    const err = new Error('Connexion InkSight requise.');
    err.code = 'AUTH_REQUIRED';
    throw err;
  }
  return { client, user: data.user };
}

export async function getSavedDuelinkToken(req) {
  const { client, user } = await getRequestUser(req);
  const { data, error } = await client
    .from('duelink_connections')
    .select('encrypted_token,token_hint,expires_at,last_sync_at,updated_at')
    .eq('user_id', user.id)
    .eq('provider', 'duelink')
    .maybeSingle();
  if (error) throw error;
  if (!data?.encrypted_token) return { token: '', connection: null, client, user };
  return { token: decryptToken(data.encrypted_token), connection: data, client, user };
}

export async function resolveDuelinkToken(req, body = {}) {
  const direct = cleanDuelinkToken(body.token);
  if (direct) return { token: direct, source: 'request' };
  const saved = await getSavedDuelinkToken(req);
  if (!saved.token) {
    const err = new Error('Token Duel.ink manquant. Collez un token ou mémorisez-le sur votre compte.');
    err.code = 'TOKEN_MISSING';
    throw err;
  }
  return { token: saved.token, source: 'saved', connection: saved.connection };
}
