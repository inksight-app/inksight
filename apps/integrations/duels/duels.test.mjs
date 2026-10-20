import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes, createHash } from "node:crypto";
import {
  createDuelsOAuth,
  createDuelsReader,
  sealToken,
  openToken,
  LinkExpired,
  RateLimited,
} from "./duels.mjs";
function fixture() {
  const pending = new Map(),
    vault = new Map(),
    key = randomBytes(32);
  let exchanges = 0;
  let time = 10000;
  const config = {
    clientId: "test-app",
    clientSecret: "test-secret",
    redirectUri: "https://example.test/callback",
    tokenKey: key,
    now: () => time,
    pending: {
      put: async (k, v) => pending.set(k, v),
      consume: async (k, session, now) => {
        const v = pending.get(k);
        if (!v || v.sessionId !== session || v.expiresAt <= now) return null;
        pending.delete(k);
        return v;
      },
    },
    vault: { put: async (k, v) => vault.set(k, v) },
    fetchImpl: async (_, options) => {
      exchanges++;
      const body = options.body;
      assert.equal(body.get("client_secret"), "test-secret");
      assert.equal(body.get("code_verifier").length, 43);
      return Response.json({
        access_token: "private-test-token",
        expires_in: 3600,
        scope: "profile match_history:read replays:read",
        user: { id: "stable-id", name: "Name" },
      });
    },
  };
  return {
    api: createDuelsOAuth(config),
    pending,
    vault,
    key,
    exchanges: () => exchanges,
    advance: () => {
      time += 700000;
    },
  };
}
test("PKCE, session binding, one-use state, stable identity and encrypted token", async () => {
  const f = fixture();
  const url = new URL(
    await f.api.begin({ ownerId: "owner", sessionId: "session" }),
  );
  const state = url.searchParams.get("state");
  const entry = [...f.pending.values()][0];
  assert.equal(
    url.searchParams.get("code_challenge"),
    createHash("sha256").update(entry.verifier).digest("base64url"),
  );
  assert.ok(!url.href.includes("test-secret"));
  await assert.rejects(
    f.api.finish({ sessionId: "attacker", state, code: "code" }),
  );
  assert.equal(f.exchanges(), 0);
  const result = await f.api.finish({
    sessionId: "session",
    state,
    code: "code",
  });
  assert.deepEqual(result, { cancelled: false, duelsUserId: "stable-id" });
  assert.ok(!JSON.stringify(result).includes("private-test-token"));
  assert.equal(
    openToken(f.vault.get("owner").sealedToken, f.key, "owner"),
    "private-test-token",
  );
  await assert.rejects(
    f.api.finish({ sessionId: "session", state, code: "code" }),
  );
  assert.equal(f.exchanges(), 1);
});
test("expired and declined attempts never exchange a code", async () => {
  let f = fixture();
  let state = new URL(
    await f.api.begin({ ownerId: "owner", sessionId: "session" }),
  ).searchParams.get("state");
  f.advance();
  await assert.rejects(
    f.api.finish({ sessionId: "session", state, code: "code" }),
  );
  assert.equal(f.exchanges(), 0);
  f = fixture();
  state = new URL(
    await f.api.begin({ ownerId: "owner", sessionId: "session" }),
  ).searchParams.get("state");
  assert.deepEqual(
    await f.api.finish({ sessionId: "session", state, error: "access_denied" }),
    { cancelled: true },
  );
  assert.equal(f.exchanges(), 0);
});
test("token ciphertext is bound to its Inksight owner", () => {
  const key = randomBytes(32),
    sealed = sealToken("secret", key, "alice");
  assert.throws(() => openToken(sealed, key, "bob"));
});
test("history consumes opaque cursors without silently truncating at 1000", async () => {
  let calls = 0;
  const client = createDuelsReader({
    accessToken: "t",
    onUnauthorized: async () => {},
    fetchImpl: async (url) => {
      calls++;
      const p = new URL(url);
      if (calls === 1) {
        assert.equal(p.searchParams.get("limit"), "250");
        return Response.json({
          games: Array.from({ length: 250 }, (_, id) => ({ id })),
          next_cursor: "opaque|cursor + special",
        });
      }
      assert.equal(p.searchParams.get("cursor"), "opaque|cursor + special");
      return Response.json({ games: [{ id: 251 }], next_cursor: null });
    },
  });
  let total = 0;
  for await (const page of client.history()) total += page.length;
  assert.equal(total, 251);
  assert.equal(calls, 2);
});
test("401 breaks the link once, 429 reports retry time without loops", async () => {
  let broken = 0,
    calls = 0;
  const api = createDuelsReader({
    accessToken: "t",
    onUnauthorized: async () => {
      broken++;
    },
    fetchImpl: async () => {
      calls++;
      return new Response("", { status: 401 });
    },
  });
  await assert.rejects(api.profile(), LinkExpired);
  assert.equal(calls, 1);
  assert.equal(broken, 1);
  const limited = createDuelsReader({
    accessToken: "t",
    onUnauthorized: async () => {},
    fetchImpl: async () =>
      new Response("", { status: 429, headers: { "Retry-After": "37" } }),
  });
  await assert.rejects(
    limited.profile(),
    (e) => e instanceof RateLimited && e.retryAfterSeconds === 37,
  );
});
