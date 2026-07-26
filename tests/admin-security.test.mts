import assert from "node:assert/strict";
import { test } from "node:test";
import { hashPassword, verifyPassword } from "../lib/admin/password";
import { createSession, verifySession } from "../lib/admin/session";
import { canonicalizeAdminPath, sanitizeAdminNext } from "../lib/admin/redirect";
import {
  createLoginLimitRepository,
  hashLoginSource,
  isLoginAllowed,
} from "../lib/admin/rate-limit";

const NOW = new Date("2026-07-26T12:00:00.000Z");

test("scrypt password hash verifies only the correct password", async () => {
  const encoded = await hashPassword("correct horse battery staple", {
    salt: Buffer.alloc(16, 7),
  });
  assert.equal(await verifyPassword("correct horse battery staple", encoded), true);
  assert.equal(await verifyPassword("wrong", encoded), false);
  assert.equal(await verifyPassword("correct horse battery staple", "malformed"), false);
});

test("signed admin session rejects tampering and expiry", () => {
  const secret = "s".repeat(43);
  const token = createSession(secret, NOW);
  assert.equal(verifySession(token, secret, NOW)?.role, "admin");
  assert.equal(
    verifySession(token, secret, new Date(NOW.getTime() + 11 * 60 * 60 * 1000))?.role,
    "admin",
  );
  assert.equal(verifySession(`${token}x`, secret, NOW), null);
  assert.equal(
    verifySession(token, secret, new Date(NOW.getTime() + 13 * 60 * 60 * 1000)),
    null,
  );
  assert.equal(verifySession(token, "x".repeat(43), NOW), null);
});

test("session helpers fail closed when secrets are missing or too short", () => {
  assert.throws(() => createSession("short", NOW));
  assert.equal(verifySession("anything", "short", NOW), null);
});

test("admin next allows only the canonical internal dashboard", () => {
  assert.equal(sanitizeAdminNext("/admin/ai-visits"), "/admin/ai-visits");
  for (const value of [
    null,
    "",
    "//evil.example",
    "https://evil.example/admin/ai-visits",
    "/admin/ai-visits%00",
    "\\\\evil.example",
    "/admin/other",
  ]) {
    assert.equal(sanitizeAdminNext(value), "/admin/ai-visits");
  }
});

test("only approved malformed admin URLs are canonicalized", () => {
  for (const value of [
    "/admin/ai-visits%22",
    '/admin/ai-visits"',
    "/admin/ai-visit",
  ]) {
    assert.equal(canonicalizeAdminPath(value), "/admin/ai-visits");
  }
  assert.equal(canonicalizeAdminPath("/admin/anything"), null);
  assert.equal(canonicalizeAdminPath("/admin/ai-visits"), null);
});

test("login source uses stable short HMAC without exposing raw IP", () => {
  const first = hashLoginSource("203.0.113.42", "h".repeat(32));
  const second = hashLoginSource("203.0.113.42", "h".repeat(32));
  assert.equal(first, second);
  assert.match(first, /^[a-f0-9]{16}$/);
  assert.doesNotMatch(first, /203|113|42/);
  assert.throws(() => hashLoginSource("203.0.113.42", "short"));
});

test("login limiter allows fewer than five active failures", async () => {
  const repository = {
    getActiveFailureCount: async () => 4,
  };
  assert.equal(await isLoginAllowed("source", NOW, repository), true);
});

test("login limiter blocks five active failures", async () => {
  const repository = {
    getActiveFailureCount: async () => 5,
  };
  assert.equal(await isLoginAllowed("source", NOW, repository), false);
});

test("local file mode uses an in-memory login limiter without a database", async () => {
  const repository = createLoginLimitRepository({
    NODE_ENV: "development",
    AI_VISIT_STORAGE: "file",
  });
  assert.equal(await repository.getActiveFailureCount("source", NOW), 0);
  for (let index = 0; index < 5; index += 1) {
    await repository.recordFailure("source", NOW);
  }
  assert.equal(await repository.getActiveFailureCount("source", NOW), 5);
  await repository.clear("source");
  assert.equal(await repository.getActiveFailureCount("source", NOW), 0);
});
