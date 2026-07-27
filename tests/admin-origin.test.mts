import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildSameOriginUrl,
  isSameOriginRequest,
} from "../lib/admin/request-origin";

test("accepts a browser origin matching the external host behind a proxy", () => {
  const headers = new Headers({
    origin: "https://example.com",
    host: "internal.local:3000",
    "x-forwarded-host": "example.com",
    "x-forwarded-proto": "https",
  });
  assert.equal(isSameOriginRequest(headers, "http://internal.local:3000/api/admin/login"), true);
});

test("accepts a direct local origin matching Host", () => {
  const headers = new Headers({
    origin: "http://127.0.0.1:3200",
    host: "127.0.0.1:3200",
  });
  assert.equal(isSameOriginRequest(headers, "http://localhost:3000/api/admin/login"), true);
});

test("rejects missing, cross-site and protocol-mismatched origins", () => {
  assert.equal(isSameOriginRequest(new Headers({ host: "example.com" }), "https://example.com"), false);
  assert.equal(
    isSameOriginRequest(
      new Headers({ origin: "https://evil.example", host: "example.com" }),
      "https://example.com",
    ),
    false,
  );
  assert.equal(
    isSameOriginRequest(
      new Headers({ origin: "http://example.com", host: "example.com", "x-forwarded-proto": "https" }),
      "http://internal.local",
    ),
    false,
  );
});

test("builds redirects from the verified browser origin instead of an internal URL", () => {
  const headers = new Headers({
    origin: "http://127.0.0.1:3200",
    host: "127.0.0.1:3200",
  });
  assert.equal(
    buildSameOriginUrl(
      "/admin/ai-visits",
      headers,
      "http://localhost:3000/api/admin/login",
    )?.href,
    "http://127.0.0.1:3200/admin/ai-visits",
  );
});
