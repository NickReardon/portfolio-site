import assert from "node:assert/strict";
import test from "node:test";
import { onRequest } from "../functions/robots.txt.js";

test("production robots allows indexing without noindex", async () => {
  const response = await onRequest({
    request: new Request("https://nick-reardon.com/robots.txt"),
  });
  assert.match(await response.text(), /Allow: \//u);
  assert.equal(response.headers.get("X-Robots-Tag"), null);
});

test("non-production robots blocks indexing", async () => {
  const response = await onRequest({
    request: new Request("https://staging.nick-reardon.com/robots.txt"),
  });
  assert.match(await response.text(), /Disallow: \//u);
  assert.equal(response.headers.get("X-Robots-Tag"), "noindex, nofollow");
});
