import { test } from "node:test";
import assert from "node:assert/strict";
import { actions, getStore } from "../src/lib/store.ts";
import { completion, dayKey, shiftDays } from "../src/lib/engine.ts";
import type { CheckAnswers } from "../src/lib/types.ts";

test("실제 저장 액션: 편집·상황 전환·재생성 후 오늘 계획과 기록을 맞추고 과거 기록은 보존", () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const memory = new Map<string, string>();
  const past = dayKey(shiftDays(new Date(), -1));
  const historical = { planned: ["old"], done: ["old"] };
  memory.set("reboot:v1", JSON.stringify({ version: 1, records: { [past]: historical }, modeHistory: [] }));
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => memory.set(key, value),
    removeItem: (key: string) => memory.delete(key),
  } });
  try {
    const answers: CheckAnswers = { mode: "everyday", interests: ["skin"], minutes: 3, experience: "new", concerns: [], goal: "start" };
    actions.saveCheck(answers);
    assert.equal(getStore().records[dayKey()], undefined, "생성만으로 실천 기록을 만들지 않는다");
    actions.toggleDone("am-cleanse");
    assert.equal(completion(getStore().records[dayKey()]), 1 / 5);
    actions.toggleEnabled("pm-moisturize");
    assert.equal(completion(getStore().records[dayKey()]), 1 / 4, "제외 즉시 MY 완료율도 갱신");
    actions.toggleEnabled("pm-moisturize");
    assert.equal(completion(getStore().records[dayKey()]), 1 / 5);
    actions.setSituation("active");
    actions.toggleDone("sunscreen-reapply");
    actions.setSituation("default");
    assert.equal(completion(getStore().records[dayKey()]), 1 / 5);
    actions.setSituation("active");
    assert.ok(getStore().records[dayKey()].done.includes("sunscreen-reapply"), "숨겨진 완료 기록을 보존");
    actions.setMode("next");
    actions.saveCheck({ ...answers, mode: "next" });
    assert.deepEqual(getStore().records[past], historical);
    assert.equal(getStore().profile?.mode, "next");
    assert.deepEqual(JSON.parse(memory.get("reboot:v1")!).records, getStore().records, "저장된 값도 일치");
    actions.clearRecords();
    assert.deepEqual(getStore().records, {});
    assert.ok(getStore().routine, "기록 삭제 시 루틴 유지");
    actions.clearAll();
    assert.equal(getStore().profile, undefined);
    assert.equal(getStore().routine, undefined);
  } finally {
    if (descriptor) Object.defineProperty(globalThis, "localStorage", descriptor);
    else Reflect.deleteProperty(globalThis, "localStorage");
  }
});
