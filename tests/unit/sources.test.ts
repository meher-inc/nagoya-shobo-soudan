// Run: node --experimental-strip-types --test tests/unit/
// 根拠の台帳（src/watch/sources.ts）が notes.md・src/rules のコメントと食い違っていないか。名古屋のリポジトリだけ
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

test("src/watch/sources.ts が最新（notes.md や src/rules に URL を足したら node scripts/build-sources.mjs）", () => {
  const r = spawnSync(process.execPath, [new URL("../../scripts/build-sources.mjs", import.meta.url).pathname, "--check"], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
});
