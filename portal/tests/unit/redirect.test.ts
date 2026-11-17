import { test } from "node:test";
import assert from "node:assert/strict";
import { redirectTarget } from "../../src/redirect.ts";

test("REDIRECT_TO が空なら転送しない", () => {
  assert.equal(redirectTarget("https://ai.todokede.jp/", ""), null);
  assert.equal(redirectTarget("https://ai.todokede.jp/", undefined), null);
});

test("どのパスも REDIRECT_TO へ転送し、クエリを引き継ぐ", () => {
  const to = "https://todokede.jp/";
  assert.equal(redirectTarget("https://ai.todokede.jp/", to), "https://todokede.jp/");
  assert.equal(redirectTarget("https://ai.todokede.jp/robots.txt", to), "https://todokede.jp/");
  assert.equal(
    redirectTarget("https://ai.todokede.jp/?utm_source=x&utm_medium=social", to),
    "https://todokede.jp/?utm_source=x&utm_medium=social",
  );
});

test("転送先のホストは REDIRECT_TO から変わらない", () => {
  assert.equal(new URL(redirectTarget("https://ai.todokede.jp//evil.example/?a=1", "https://todokede.jp/")!).host, "todokede.jp");
});
