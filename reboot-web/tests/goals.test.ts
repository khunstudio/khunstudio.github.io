import assert from "node:assert/strict";
import test from "node:test";
import { GROOMING_TEMPLATES, newTimelineGoal } from "../src/lib/goals.ts";

test("휴가 그루밍 타임라인은 D-14 · D-7 · D-3 · D-1 체크포인트를 역산 생성한다", () => {
  const today = new Date("2026-11-01T12:00:00+09:00");
  const goal = newTimelineGoal("leave", "2026-11-20", undefined, today);

  assert.equal(goal.date, "2026-11-20");
  assert.equal(goal.checkpoints?.length, 4);
  assert.deepEqual(
    goal.checkpoints?.map((c) => c.date),
    ["2026-11-06", "2026-11-13", "2026-11-17", "2026-11-19"],
  );
});

test("남은 기간이 짧은 경우 이미 지난 체크포인트는 제외한다", () => {
  const today = new Date("2026-11-15T12:00:00+09:00");
  const goal = newTimelineGoal("leave", "2026-11-20", undefined, today);

  // D-5이므로 D-14, D-7은 제외되고 D-3, D-1만 남아야 한다
  assert.equal(goal.checkpoints?.length, 2);
  assert.deepEqual(
    goal.checkpoints?.map((c) => c.date),
    ["2026-11-17", "2026-11-19"],
  );
});

test("그루밍 타임라인 문구에는 시술 권유나 의료 처방 표현이 없다", () => {
  const allText = Object.values(GROOMING_TEMPLATES)
    .flatMap((t) => [t.title, t.desc, ...t.steps.map((s) => s.label)])
    .join(" ");
  assert.ok(!/시술\s*받|압출|보톡스|필러|처방|치료하/.test(allText));
});
