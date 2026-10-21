import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CITIES, cityUrl, guessCity } from "../../src/cities.ts";

test("都道府県コードから公開済みの都市を推定する", () => {
  assert.equal(guessCity("JP", "23"), "nagoya");
  assert.equal(guessCity("JP", "JP-13"), "tokyo");
  assert.equal(guessCity("JP", "1"), "sapporo");
  assert.equal(guessCity("JP", "14"), "");
  assert.equal(guessCity("US", "23"), "");
  assert.equal(guessCity(undefined, undefined), "");
});

test("都市の slug と都道府県コードは重複しない", () => {
  assert.equal(new Set(CITIES.map((c) => c.slug)).size, CITIES.length);
  assert.equal(new Set(CITIES.map((c) => c.region)).size, CITIES.length);
  for (const c of CITIES) assert.match(cityUrl(c.slug), /^https:\/\/[a-z]+\.todokede\.jp\/$/);
});

test("入口は都市を選ぶだけで、入力欄を置かない", () => {
  const html = readFileSync("public/index.html", "utf8");
  assert.doesNotMatch(html, /<(textarea|input|form)[\s>]/);
  assert.match(html, /<h1[^>]*>どの地域の<wbr \/>消防の届出を<wbr \/>調べますか<\/h1>/);
  assert.doesNotMatch(html, /—/);
});

test("主色は白背景でコントラスト比4.5以上", () => {
  const css = readFileSync("public/styles.css", "utf8");
  const hex = css.match(/--accent: (#[0-9a-f]{6})/)![1];
  const lum = (h: string) => {
    const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  assert.ok(1.05 / (lum(hex) + 0.05) >= 4.5);
});
