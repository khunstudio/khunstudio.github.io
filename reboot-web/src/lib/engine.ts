import { TEMPLATES, type Template } from "./templates.ts";
import type { CheckAnswers, DayRecord, RoutineItem, Situation, Store } from "./types.ts";

// 규칙 기반 루틴 엔진. 순수 함수만 두어 테스트하기 쉽게 한다.

function score(t: Template, a: CheckAnswers): number {
  let s = t.base;
  if (t.concerns?.some((c) => a.concerns.includes(c))) s += 30;
  if (t.areas?.some((x) => a.interests.includes(x))) s += 20;
  if (t.modes?.includes(a.mode)) s += 20;
  return s;
}

function eligible(t: Template, a: CheckAnswers): boolean {
  if (t.modes && !t.modes.includes(a.mode)) return false;
  if (t.minMinutes && t.minMinutes > a.minutes) return false;
  if (t.core || t.situations) return true;
  const byArea = t.areas?.some((x) => a.interests.includes(x)) ?? false;
  const byConcern = t.concerns?.some((c) => a.concerns.includes(c)) ?? false;
  const byMode = t.modes?.includes(a.mode) ?? false;
  return byArea || byConcern || byMode;
}

// 실제로 하는 순서 (같은 시간대 안에서 이 값이 작은 것부터)
const SEQ: Record<string, number> = {
  "am-cleanse": 10, "shave-prep": 15, "shave-after": 20, "am-moisturize": 30, "am-sunscreen": 40, "sunscreen-reapply": 45,
  "stretch": 50, "water": 55, "mirror-check": 60, "out-grooming": 65, "out-clinic-note": 70,
  "pm-cleanse": 10, "after-active-rinse": 12, "sweat-rinse": 14, "pm-moisturize": 30, "dry-extra": 32, "lip-hand": 35,
  "hair-dry": 40, "workout-log": 50, "enlist-checklist": 55, "screen-off": 60, "reflect": 65,
};
const seq = (id: string) => SEQ[id] ?? 99;

function toItem(t: Template): RoutineItem {
  return {
    id: t.id,
    templateId: t.id,
    title: t.title,
    slot: t.slot,
    area: t.area,
    minutes: t.minutes,
    why: t.why,
    how: t.how,
    enabled: true,
    situations: t.situations,
    guide: t.guide,
  };
}

/** 체크 응답으로 루틴을 만든다. 기본 항목 + 시간 예산 안의 추가 항목 + 상황별 항목. */
export function buildRoutine(a: CheckAnswers): RoutineItem[] {
  const pool = TEMPLATES.filter((t) => eligible(t, a));
  const core = pool.filter((t) => t.core);
  const situational = pool.filter((t) => t.situations);
  const extras = pool
    .filter((t) => !t.core && !t.situations)
    .sort((x, y) => score(y, a) - score(x, a));

  let budget = a.minutes - core.reduce((n, t) => n + t.minutes, 0);
  const picked: Template[] = [];
  for (const t of extras) {
    // 처음 시작하는 사람에게는 2분 이상 걸리는 항목을 넣지 않는다
    if (a.experience === "new" && t.minutes >= 2) continue;
    if (t.minutes <= budget + 1e-9) {
      picked.push(t);
      budget -= t.minutes;
    }
  }
  const slot = (t: Template) => (t.slot === "am" ? 0 : 1);
  return [...core, ...picked, ...situational]
    .sort((x, y) => slot(x) - slot(y) || seq(x.id) - seq(y.id))
    .map(toItem);
}

/** 결과 화면의 "지금 시작할 행동 3가지" */
export function firstActions(items: RoutineItem[], a: CheckAnswers): RoutineItem[] {
  const byId = new Map(items.map((i) => [i.id, i]));
  const tpl = new Map(TEMPLATES.map((t) => [t.id, t]));
  const extras = items
    .filter((i) => !i.situations && !tpl.get(i.templateId)?.core)
    .sort((x, y) => score(tpl.get(y.templateId)!, a) - score(tpl.get(x.templateId)!, a));
  const ids = [extras[0]?.id, "am-sunscreen", "pm-cleanse", "am-moisturize"].filter(Boolean) as string[];
  return [...new Set(ids)].map((id) => byId.get(id)).filter(Boolean).slice(0, 3) as RoutineItem[];
}

/** 모드·관심사·고민에 맞는 가이드 slug (우선순위 순) */
export function recommendedGuides(a: CheckAnswers): string[] {
  const out: string[] = [];
  const add = (s: string) => { if (!out.includes(s)) out.push(s); };
  if (a.mode === "prepare") add("before-enlistment");
  if (a.mode === "service") add("px");
  if (a.mode === "next") add("next-chapter");
  add("skin-basics");
  if (a.concerns.includes("shave")) add("shaving");
  if (a.concerns.includes("outdoor")) add("outdoor-day");
  if (a.concerns.includes("sweat") || a.interests.includes("body")) add("workout-skin");
  if (a.interests.includes("style")) add("hair-growing");
  if (a.interests.includes("life")) add("sleep-reset");
  if (a.mode === "service") add("leave-prep");
  return out.slice(0, 4);
}

/** 현재 상황에서 보이는 활성 항목 */
export function visibleItems(items: RoutineItem[], situation: Situation): RoutineItem[] {
  return items.filter((i) => i.enabled && (!i.situations || i.situations.includes(situation)));
}

export function dayKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function shiftDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setHours(12, 0, 0, 0);
  x.setDate(x.getDate() + n);
  return x;
}

/** 완료율 = 완료 항목 / 계획 항목. 외모 변화와 무관한 실천 기록이다. */
export function completion(r?: DayRecord): number {
  if (!r || r.planned.length === 0) return 0;
  const done = r.done.filter((id) => r.planned.includes(id)).length;
  return done / r.planned.length;
}

export function recentDays(store: Store, days: number, today = new Date()) {
  return Array.from({ length: days }, (_, i) => {
    const d = shiftDays(today, i - (days - 1));
    const key = dayKey(d);
    return { key, date: d, ratio: completion(store.records[key]) };
  });
}

/** 하루라도 체크한 날이 이어진 일수 (오늘 미체크면 어제부터 센다) */
export function streak(store: Store, today = new Date()): number {
  let n = 0;
  let i = completion(store.records[dayKey(today)]) > 0 ? 0 : -1;
  for (; ; i--) {
    if (completion(store.records[dayKey(shiftDays(today, i))]) > 0) n++;
    else break;
    if (n > 3650) break;
  }
  return n;
}

export function activeDays(store: Store): number {
  return Object.values(store.records).filter((r) => completion(r) > 0).length;
}

export function toCSV(store: Store): string {
  const rows = [["date", "planned", "done", "completion"]];
  Object.keys(store.records).sort().forEach((k) => {
    const r = store.records[k];
    rows.push([k, String(r.planned.length), String(r.done.filter((d) => r.planned.includes(d)).length), completion(r).toFixed(2)]);
  });
  return rows.map((r) => r.join(",")).join("\n");
}
