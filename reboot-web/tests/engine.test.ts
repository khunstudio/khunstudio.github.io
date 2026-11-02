import { test } from "node:test";
import assert from "node:assert/strict";
import { buildRoutine, completion, firstActions, recommendedGuides, streak, visibleItems, dayKey, shiftDays } from "../src/lib/engine.ts";
import { TEMPLATES } from "../src/lib/templates.ts";
import type { CheckAnswers, Store } from "../src/lib/types.ts";

const base: CheckAnswers = { mode: "service", interests: ["skin"], experience: "sometimes", minutes: 5, concerns: ["shave"], goal: "start" };
const daily = (a: CheckAnswers) => visibleItems(buildRoutine(a), "default").reduce((n, i) => n + i.minutes, 0);

test("하루 루틴은 선택한 시간 예산을 넘지 않는다", () => {
  for (const minutes of [3, 5, 10] as const) {
    for (const mode of ["prepare", "service", "next", "everyday"] as const) {
      const a = { ...base, minutes, mode, interests: ["skin", "body", "style", "life"] as CheckAnswers["interests"], concerns: ["shave", "dryness", "sweat", "outdoor"] as CheckAnswers["concerns"] };
      assert.ok(daily(a) <= minutes + 1e-9, `${mode} ${minutes}분: ${daily(a)}`);
    }
  }
});

test("세안 · 보습 · 자외선 차단은 항상 포함된다", () => {
  const ids = buildRoutine({ ...base, minutes: 3, interests: [], concerns: [] }).map((i) => i.id);
  for (const id of ["am-cleanse", "am-moisturize", "am-sunscreen", "pm-cleanse", "pm-moisturize"]) assert.ok(ids.includes(id), id);
});

test("고민을 고르면 관련 항목이 들어간다", () => {
  const ids = buildRoutine(base).map((i) => i.id);
  assert.ok(ids.includes("shave-after"));
});

test("입대 준비 항목은 입대 준비 모드에만 나온다", () => {
  assert.ok(buildRoutine({ ...base, mode: "prepare" }).some((i) => i.id === "enlist-checklist"));
  assert.ok(!buildRoutine({ ...base, mode: "everyday" }).some((i) => i.id === "enlist-checklist"));
});

test("상황별 항목은 해당 상황에서만 보인다", () => {
  const items = buildRoutine(base);
  assert.ok(visibleItems(items, "active").some((i) => i.id === "sunscreen-reapply"));
  assert.ok(!visibleItems(items, "default").some((i) => i.id === "sunscreen-reapply"));
});

test("첫 행동은 3개", () => {
  const items = buildRoutine(base);
  assert.equal(firstActions(items, base).length, 3);
});

test("모드별 대표 가이드가 먼저 나온다", () => {
  assert.equal(recommendedGuides({ ...base, mode: "service" })[0], "px");
  assert.equal(recommendedGuides({ ...base, mode: "next" })[0], "next-chapter");
});

test("완료율과 연속 기록", () => {
  const today = new Date(2026, 10, 3, 12);
  const store: Store = { version: 1, records: {}, modeHistory: [] };
  store.records[dayKey(today)] = { planned: ["a", "b"], done: ["a"] };
  store.records[dayKey(shiftDays(today, -1))] = { planned: ["a"], done: ["a"] };
  store.records[dayKey(shiftDays(today, -3))] = { planned: ["a"], done: ["a"] };
  assert.equal(completion(store.records[dayKey(today)]), 0.5);
  assert.equal(streak(store, today), 2);
});

test("루틴 문구에 진단 · 치료 표현이 없다", () => {
  const banned = /진단|처방|치료|완치|여드름|시술|약물/;
  for (const t of TEMPLATES) assert.ok(!banned.test(t.title + t.why + t.how), t.id);
});

test("면도 전 단계가 면도 후 단계보다 먼저 나온다", () => {
  const ids = buildRoutine(base).map((i) => i.id);
  assert.ok(ids.indexOf("shave-prep") < ids.indexOf("shave-after"));
  assert.ok(ids.indexOf("am-cleanse") < ids.indexOf("am-sunscreen"));
});
