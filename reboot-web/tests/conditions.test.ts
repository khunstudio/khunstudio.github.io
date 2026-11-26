import assert from "node:assert/strict";
import test from "node:test";
import { classifyActiveGroups, evaluateConditions } from "../src/lib/conditions.ts";
import { buildRoutine, completion, dayKey, plannedItems, syncTodayPlan } from "../src/lib/engine.ts";
import type { CheckAnswers, RoutineItem, Store } from "../src/lib/types.ts";

const sampleAnswers: CheckAnswers = {
  mode: "service",
  interests: ["skin", "body"],
  experience: "steady",
  minutes: 30,
  concerns: ["acne", "pores", "shave", "outdoor"],
  goal: "keep",
};

test("야외활동 + 면도 선택 시 레티놀/각질(active-pm)은 PAUSE되고 진정·보습이 강조된다", () => {
  const items = buildRoutine(sampleAnswers);
  const customRetinol: RoutineItem = {
    id: "custom-retinol",
    templateId: "custom",
    title: "레티놀 (주 2~3회)",
    slot: "pm",
    area: "skin",
    minutes: 0.5,
    why: "내가 추가한 항목",
    how: "소량",
    enabled: true,
  };
  const all = [...items, customRetinol];
  const adj = evaluateConditions(["outdoor_uv", "shaved"], all);

  assert.equal(adj.tone, "soothing");
  assert.equal(adj.showDermNotice, false);
  assert.ok(adj.pausedItemIds.includes("active-pm"), "active-pm은 오늘 쉬기 대상이어야 한다");
  assert.ok(adj.pausedItemIds.includes("custom-retinol"), "사용자 추가 레티놀도 오늘 쉬기 대상이어야 한다");
  assert.ok(adj.emphasizedItemIds.includes("pm-moisturize"), "저녁 보습은 강조 대상이어야 한다");
  assert.ok(adj.pauseReasons["active-pm"].includes("야외 · 햇빛 많음"));
  assert.ok(adj.pauseReasons["active-pm"].includes("면도함"));
});

test("따가움·예민(sensitive_flare) 선택 시 모든 자극 성분과 디바이스가 PAUSE되고 피부과 상담 안내가 켜진다", () => {
  const items = buildRoutine({ ...sampleAnswers, interests: ["skin"] });
  const customVitC: RoutineItem = {
    id: "custom-vitc",
    templateId: "custom",
    title: "비타민 C 세럼",
    slot: "am",
    area: "skin",
    minutes: 0.5,
    why: "톤 관리",
    how: "아침",
    enabled: true,
  };
  const deviceItem: RoutineItem = {
    id: "device-care",
    templateId: "device-care",
    title: "뷰티 디바이스 (LED · 갈바닉 등)",
    slot: "pm",
    area: "skin",
    minutes: 10,
    why: "기초 루틴 위에 더하는 선택 항목",
    how: "설명서대로",
    enabled: true,
  };
  const adj = evaluateConditions(["sweat_workout", "sensitive_flare"], [...items, customVitC, deviceItem]);

  assert.equal(adj.tone, "minimal");
  assert.equal(adj.showDermNotice, true);
  assert.ok(adj.pausedItemIds.includes("active-pm"));
  assert.ok(adj.pausedItemIds.includes("custom-vitc"));
  assert.ok(adj.pausedItemIds.includes("device-care"));
  assert.ok(!adj.pausedItemIds.includes("pm-moisturize"), "기초 보습은 쉬지 않는다");
});

test("syncTodayPlan은 오늘 쉬기 항목을 planned에서 제외하고 태그 해제 시 복구한다", () => {
  const items = buildRoutine(sampleAnswers);
  const today = new Date("2026-11-26T12:00:00+09:00");
  const key = dayKey(today);

  const fullPlanned = plannedItems(items, "default").map((i) => i.id);
  const pausedPlanned = plannedItems(items, "default", ["outdoor_uv"]).map((i) => i.id);
  assert.ok(fullPlanned.includes("active-pm"));
  assert.ok(!pausedPlanned.includes("active-pm"));

  const store: Store = {
    version: 1,
    routine: { items, situation: "default", createdAt: today.toISOString(), updatedAt: today.toISOString() },
    records: { [key]: { planned: fullPlanned, done: [], conditions: ["outdoor_uv"] } },
    modeHistory: [],
  };

  const synced = syncTodayPlan(store, today);
  assert.ok(!synced.records[key].planned.includes("active-pm"));
  assert.equal(completion(synced.records[key]), 0, "컨디션 태그만 눌러서는 완료율이 올라가지 않는다");

  const cleared = syncTodayPlan(
    { ...synced, records: { [key]: { ...synced.records[key], conditions: [] } } },
    today,
  );
  assert.ok(cleared.records[key].planned.includes("active-pm"), "태그 해제 시 planned에 다시 포함된다");
});

test("classifyActiveGroups는 커스텀 BHA/스피큘/레티놀 항목을 정확히 분류한다", () => {
  const mk = (title: string): RoutineItem => ({
    id: "c", templateId: "custom", title, slot: "pm", area: "skin", minutes: 1, why: "", how: "", enabled: true,
  });
  assert.deepEqual(classifyActiveGroups(mk("BHA 토너")), ["acid"]);
  assert.deepEqual(classifyActiveGroups(mk("스피큘 세럼")), ["scrub"]);
  assert.deepEqual(classifyActiveGroups(mk("레티날 크림")), ["retinoid"]);
});
