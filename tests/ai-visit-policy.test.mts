import assert from "node:assert/strict";
import { test } from "node:test";
import { isTrackablePublicRequest } from "../lib/ai-visits/request-policy";

for (const pathname of ["/", "/menu", "/menu/lamb-skewers", "/reviews"]) {
  test(`tracks public GET ${pathname}`, () => {
    assert.equal(isTrackablePublicRequest({ method: "GET", pathname }), true);
  });
}

for (const pathname of [
  "/admin",
  "/admin/ai-visits",
  "/api/health",
  "/_next/static/app.js",
  "/_next/image",
  "/favicon.ico",
  "/photo.jpg",
  "/clip.mp4",
  "/styles.css",
  "/script.js",
  "/font.woff2",
  "/uploads/menu",
  "/robots.txt",
  "/sitemap.xml",
  "/unknown",
  "/menu/photo.png",
]) {
  test(`does not track excluded path ${pathname}`, () => {
    assert.equal(isTrackablePublicRequest({ method: "GET", pathname }), false);
  });
}

test("only GET requests are tracked", () => {
  for (const method of ["HEAD", "POST", "PUT", "DELETE", "OPTIONS"]) {
    assert.equal(isTrackablePublicRequest({ method, pathname: "/" }), false);
  }
});
