/** Server-only adapter. Do not import this module into the Expo app. */
import {
  randomBytes,
  createHash,
  createCipheriv,
  createDecipheriv,
} from "node:crypto";
const ORIGIN = "https://duels.ink";
export const SCOPES = ["profile", "match_history:read", "replays:read"];
export class LinkExpired extends Error {
  constructor() {
    super("Le compte duels.ink doit être reconnecté.");
    this.name = "LinkExpired";
  }
}
export class RateLimited extends Error {
  constructor(seconds) {
    super("Limite temporaire de duels.ink.");
    this.name = "RateLimited";
    this.retryAfterSeconds = seconds;
  }
}
const hash = (value) => createHash("sha256").update(value).digest("base64url");
function encryptionKey(key) {
  if (!(key instanceof Uint8Array) || key.length !== 32)
    throw new Error("Une clé serveur de 32 octets est requise.");
  return key;
}
export function sealToken(token, key, accountId) {
  encryptionKey(key);
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(accountId));
  const body = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), body]
    .map((v) => v.toString("base64url"))
    .join(".");
}
export function openToken(sealed, key, accountId) {
  encryptionKey(key);
  const parts = sealed.split(".");
  if (parts.length !== 3) throw new Error("Jeton chiffré invalide.");
  const [iv, tag, body] = parts.map((v) => Buffer.from(v, "base64url"));
  const cipher = createDecipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(accountId));
  cipher.setAuthTag(tag);
  return Buffer.concat([cipher.update(body), cipher.final()]).toString("utf8");
}
/**
 * pending.put(key, value) and pending.consume(key, authenticatedSessionId, now)
 * must be durable. consume atomically verifies session + expiry and deletes the record.
 * vault.put(ownerId, link) atomically replaces that owner's encrypted token.
 * The HTTP host must authenticate ownerId/sessionId; no client-supplied user-id header.
 */
export function createDuelsOAuth({
  clientId,
  clientSecret,
  redirectUri,
  tokenKey,
  pending,
  vault,
  fetchImpl = fetch,
  now = () => Date.now(),
}) {
  if (!clientId || !clientSecret)
    throw new Error("OAuth duels.ink non configuré.");
  encryptionKey(tokenKey);
  const callback = new URL(redirectUri);
  if (
    callback.hash ||
    callback.username ||
    callback.password ||
    !(
      callback.protocol === "https:" ||
      (callback.protocol === "http:" &&
        ["localhost", "127.0.0.1"].includes(callback.hostname))
    )
  )
    throw new Error("Callback OAuth HTTPS requis.");
  return {
    async begin({ ownerId, sessionId }) {
      if (!ownerId || !sessionId)
        throw new Error("Session Inksight authentifiée requise.");
      const state = randomBytes(32).toString("base64url"),
        verifier = randomBytes(32).toString("base64url");
      await pending.put(hash(state), {
        ownerId,
        sessionId,
        verifier,
        expiresAt: now() + 10 * 60 * 1000,
      });
      const url = new URL("/oauth/authorize", ORIGIN);
      Object.entries({
        response_type: "code",
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: SCOPES.join(" "),
        state,
        code_challenge: hash(verifier),
        code_challenge_method: "S256",
      }).forEach(([k, v]) => url.searchParams.set(k, v));
      return url.href;
    },
    async finish({ sessionId, state, code, error }) {
      if (
        !sessionId ||
        typeof state !== "string" ||
        state.length < 8 ||
        state.length > 512
      )
        throw new Error("État OAuth invalide.");
      const attempt = await pending.consume(hash(state), sessionId, now());
      if (
        !attempt ||
        attempt.sessionId !== sessionId ||
        attempt.expiresAt <= now()
      )
        throw new Error("Tentative OAuth expirée ou déjà utilisée.");
      if (error === "access_denied") return { cancelled: true };
      if (error || typeof code !== "string" || !code)
        throw new Error("Autorisation OAuth incomplète.");
      const response = await fetchImpl(`${ORIGIN}/api/oauth/token`, {
        method: "POST",
        redirect: "error",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          code_verifier: attempt.verifier,
          code,
        }),
      });
      if (response.status === 429)
        throw new RateLimited(
          Number(response.headers.get("Retry-After")) || 60,
        );
      if (!response.ok)
        throw new Error("Échange OAuth refusé. Recommence la connexion.");
      const token = await response.json();
      const scopes =
        typeof token.scope === "string" ? token.scope.split(/\s+/) : [];
      if (
        typeof token.access_token !== "string" ||
        !token.access_token ||
        typeof token.user?.id !== "string" ||
        !Number.isFinite(token.expires_in) ||
        token.expires_in <= 0 ||
        SCOPES.some((s) => !scopes.includes(s))
      )
        throw new Error("Réponse OAuth incomplète.");
      await vault.put(attempt.ownerId, {
        duelsUserId: token.user.id,
        displayName: typeof token.user.name === "string" ? token.user.name : "",
        sealedToken: sealToken(token.access_token, tokenKey, attempt.ownerId),
        expiresAt: now() + token.expires_in * 1000,
        scope: scopes,
      });
      // Long-lived Duels tokens never leave the server. The native handoff needs a separate one-use Inksight session.
      return { cancelled: false, duelsUserId: token.user.id };
    },
  };
}
/** Only the documented read endpoints. Caller owns pacing/jobs; no hidden retries. */
export function createDuelsReader({
  accessToken,
  onUnauthorized,
  fetchImpl = fetch,
}) {
  async function request(path, options = {}) {
    const response = await fetchImpl(`${ORIGIN}${path}`, {
      ...options,
      redirect: "error",
      headers: { Authorization: `Bearer ${accessToken}`, ...options.headers },
    });
    if (response.status === 401) {
      await onUnauthorized();
      throw new LinkExpired();
    }
    if (response.status === 429) {
      const raw = response.headers.get("Retry-After");
      const seconds = Number(raw);
      const date = Date.parse(raw ?? "");
      throw new RateLimited(
        Number.isFinite(seconds) && seconds > 0
          ? seconds
          : Number.isFinite(date)
            ? Math.max(1, Math.ceil((date - Date.now()) / 1000))
            : 60,
      );
    }
    if (!response.ok)
      throw new Error(`Lecture duels.ink refusée (${response.status}).`);
    return response.json();
  }
  return {
    profile: () => request("/api/me"),
    async *history({ cursor = null, from, queue } = {}) {
      const seen = new Set();
      do {
        const query = new URLSearchParams({ format: "json", limit: "250" });
        if (cursor) query.set("cursor", cursor);
        if (from) query.set("from", from);
        if (queue) query.set("queue", queue);
        const page = await request(`/api/me/match-history?${query}`);
        if (
          !Array.isArray(page.games) ||
          !(page.next_cursor === null || typeof page.next_cursor === "string")
        )
          throw new Error("Page d’historique invalide.");
        yield page.games;
        cursor = page.next_cursor;
        if (cursor) {
          if (seen.has(cursor)) throw new Error("Curseur d’historique répété.");
          seen.add(cursor);
        }
      } while (cursor);
    },
    replays: (ids) => {
      if (
        !Array.isArray(ids) ||
        ids.length > 1000 ||
        ids.some((id) => typeof id !== "string")
      )
        throw new Error("Lot de replays invalide.");
      return request("/api/me/bulk-replays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...new Set(ids)] }),
      });
    },
  };
}
