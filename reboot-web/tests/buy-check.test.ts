import assert from "node:assert/strict";
import test from "node:test";
import { getIngredient } from "../src/content/ingredients.ts";
import { evaluateBuyCheck, searchIngredientsOffline, toChoseong } from "../src/lib/buy-check.ts";
import { buildRoutine, dayKey } from "../src/lib/engine.ts";
import type { CheckAnswers, Store } from "../src/lib/types.ts";

const basicAnswers: CheckAnswers = {
  mode: "service",
  interests: ["skin"],
  experience: "new",
  minutes: 5,
  concerns: ["oily"],
  goal: "start",
};

test("toChoseong 및 오프라인 초성 검색은 성분명과 예시 브랜드를 정확히 찾는다", () => {
  assert.equal(toChoseong("레티놀"), "ㄹㅌㄴ");
  assert.equal(toChoseong("에스트라"), "ㅇㅅㅌㄹ");

  const retinolHits = searchIngredientsOffline("ㄹㅌㄴ");
  assert.ok(retinolHits.some((h) => h.ingredient.slug === "retinol"));

  const aesturaHits = searchIngredientsOffline("ㅇㅅㅌㄹ");
  assert.ok(aesturaHits.some((h) => h.ingredient.slug === "ceramide"));
  assert.ok(aesturaHits[0].matchedProducts.some((p) => p.brand === "에스트라"));
});

test("처방 성분과 과장 주의 성분은 항상 HOLD(보류 권장)로 판정한다", () => {
  const rx = getIngredient("retinoids-rx")!;
  const pdrn = getIngredient("pdrn-topical")!;
  assert.equal(evaluateBuyCheck(rx, null).verdict, "HOLD");
  assert.equal(evaluateBuyCheck(pdrn, null).verdict, "HOLD");
});

test("오늘 컨디션에 따가움·예민이 켜져 있으면 레티놀은 HOLD로 판정한다", () => {
  const today = new Date("2026-11-26T12:00:00+09:00");
  const key = dayKey(today);
  const store: Store = {
    version: 1,
    skin: { type: "oily", sensitive: false, at: today.toISOString() },
    routine: { items: buildRoutine(basicAnswers), situation: "default", createdAt: today.toISOString(), updatedAt: today.toISOString() },
    records: { [key]: { planned: [], done: [], conditions: ["sensitive_flare"] } },
    modeHistory: [],
  };
  const res = evaluateBuyCheck(getIngredient("retinol")!, store, today);
  assert.equal(res.verdict, "HOLD");
});

test("지성 피부 기본 3단계 루틴에서 나이아신아마이드는 FIT, 이미 있는 선크림은 OVERLAP으로 판정한다", () => {
  const today = new Date("2026-11-26T12:00:00+09:00");
  const store: Store = {
    version: 1,
    skin: { type: "oily", sensitive: false, at: today.toISOString() },
    routine: { items: buildRoutine(basicAnswers), situation: "default", createdAt: today.toISOString(), updatedAt: today.toISOString() },
    records: {},
    modeHistory: [],
  };
  assert.equal(evaluateBuyCheck(getIngredient("niacinamide")!, store, today).verdict, "FIT");
  assert.equal(evaluateBuyCheck(getIngredient("organic-filters")!, store, today).verdict, "OVERLAP");
});
