// F-28 の実機確認に使う検査（scripts/f28-check.mjs）そのものの単体テスト。名古屋だけに置く（gen-city.py は都市版に入れない）
import { test } from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error JavaScript のモジュール（型はない）
import { check, checkScreen } from "../../scripts/f28-check.mjs";
import { stripEchoes } from "../../src/client/echo.ts";

const OK_END = "最終的な要否は、所轄の消防署でご確認ください。";

test("根拠条文を後ろに付けた言い切り・「〜する必要があります」・句点のない行も数える", () => {
  for (const s of [
    "消防法第8条により、防火管理者の選任が必要です（令第1条の2）。",
    "防火管理者の選任が必要です（消防法第8条）（令第1条の2）。",
    "使用開始の7日前までに届出をする必要があります。",
    "防火対象物使用開始届が必要です",
    "消火器の設置は不要です。",
    "誘導灯の設置は必要ありません。",
  ])
    assert.equal(check(`${s}\n${OK_END}`).bare, 1, s);
});

test("目安・原則・所轄・場合・確認の付いた結論は数えない", () => {
  for (const s of [
    "延べ80㎡の飲食店にあたるため、消火器が必要になる目安です（消防法施行令第10条）。",
    "原則として屋内消火栓設備が必要です（令第11条）。",
    "収容人員が30人以上の場合は、防火管理者の選任が必要です。",
    "要否は所轄の消防署でご確認いただく必要があります。",
  ])
    assert.equal(check(`${s}\n${OK_END}`).bare, 0, s);
});

test("強い語は「必ず」「確実に」「断定します」を数え、「断定できません」は数えない", () => {
  assert.equal(check(`必ず届け出てください。${OK_END}`).strong, 1);
  assert.equal(check(`確実に必要です。${OK_END}`).strong, 1);
  assert.equal(check(`要否は断定できませんが、目安をお伝えします。${OK_END}`).strong, 0);
  assert.equal(check(`この内容で断定します。${OK_END}`).strong, 1);
});

test("所轄の消防署での確認の文がなければ数え、料金を数える", () => {
  assert.equal(check("消火器が必要になる目安です。").noCheck, 1);
  assert.equal(check(`消火器が必要になる目安です。${OK_END}`).noCheck, 0);
  assert.equal(check(`費用は5,000円ほどです。${OK_END}`).price, 1);
});

test("画面の文（回答の下のボタンと重なる文を除いた後）でも数える", () => {
  const actions = { buttons: [{ kind: "link", label: "届出書類を自分で作る", href: "https://docs.todokede.jp/" }] };
  const answer = "消火器が必要になる目安です（令第10条）。\n\n最終的な判断は所轄の消防署が行います。";
  // API の文には所轄の消防署が入っているが、画面ではこの文が消える
  assert.equal(check(answer).noCheck, 0);
  assert.equal(checkScreen(answer, actions, stripEchoes).noCheck, 1);
  assert.equal(checkScreen(`消火器が必要になる目安です。\n\n${OK_END}`, actions, stripEchoes).noCheck, 0);
});
