import { TEMPLATES, type Template } from "./templates.ts";
import type { Area, CheckAnswers, DayRecord, RoutineItem, Situation, Store } from "./types.ts";

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
  "serum-step": 25, "noon-sunscreen": 46, "hair-style": 58, "walk": 52,
  "active-pm": 25, "soothing-pad": 33, "device-care": 34, "outfit-prep": 45, "bodyweight": 8, "plan-tomorrow": 62, "read-10": 63,
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

/** 영역별 시간 가중치. 운동은 한 번에 시간이 많이 들어서 크게 잡는다. */
const AREA_WEIGHT: Record<Area, number> = { skin: 1, body: 4, style: 1, life: 1 };

/** 하루 시간을 고른 영역에 나눈다. 피부 기본(세안 · 보습 · 자외선 차단)은 항상 먼저. */
export function allocate(a: CheckAnswers): Record<Area, number> {
  const core = TEMPLATES.filter((t) => t.core).reduce((n, t) => n + t.minutes, 0);
  const rest = Math.max(0, a.minutes - core);
  const areas: Area[] = a.interests.length ? a.interests : ["skin"];
  const wsum = areas.reduce((n, x) => n + AREA_WEIGHT[x], 0);
  const out: Record<Area, number> = { skin: 0, body: 0, style: 0, life: 0 };
  for (const x of areas) out[x] = (rest * AREA_WEIGHT[x]) / wsum;
  out.skin += core;
  return out;
}

/** 체크 응답으로 루틴을 만든다. 기본 항목 + 영역별 시간 안의 추가 항목 + 상황별 항목. */
export function buildRoutine(a: CheckAnswers): RoutineItem[] {
  const pool = TEMPLATES.filter((t) => eligible(t, a));
  const core = pool.filter((t) => t.core);
  const situational = pool.filter((t) => t.situations);
  const extras = pool
    .filter((t) => !t.core && !t.situations)
    // 처음 시작하는 사람은 짧은 시간을 골랐을 때 2분 이상 걸리는 항목을 넣지 않는다
    .filter((t) => !(a.experience === "new" && a.minutes < 30 && t.minutes >= 2))
    .sort((x, y) => score(y, a) - score(x, a));

  const coreMin = core.reduce((n, t) => n + t.minutes, 0);
  const alloc = allocate(a);
  const areaLeft: Record<Area, number> = { ...alloc, skin: alloc.skin - coreMin };
  let total = a.minutes - coreMin;
  const picked: Template[] = [];
  // 1차: 각 영역에 배정된 시간 안에서
  for (const t of extras) {
    if (t.minutes <= areaLeft[t.area] + 1e-9 && t.minutes <= total + 1e-9) {
      picked.push(t); areaLeft[t.area] -= t.minutes; total -= t.minutes;
    }
  }
  // 2차: 남은 시간을 점수 순으로 채운다 (고민 · 모드로 들어온 항목 포함)
  for (const t of extras) {
    if (picked.includes(t)) continue;
    if (t.minutes <= total + 1e-9) { picked.push(t); total -= t.minutes; }
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

/** 오늘의 계획만 현재 루틴과 맞춘다. 지난 기록과 숨겨진 완료 항목은 보존한다. */
export function syncTodayPlan(store: Store, today = new Date()): Store {
  const key = dayKey(today);
  const record = store.records[key];
  if (!store.routine || !record) return store;
  const planned = visibleItems(store.routine.items, store.routine.situation).map((i) => i.id);
  return { ...store, records: { ...store.records, [key]: { ...record, planned } } };
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

// ── D+ 카운트 ──
// 루틴을 처음 만든 날이 D+1. 한국식 날짜 세기(사귄 날 · 금연 D+)와 같다.
export const MILESTONES = [
  { d: 1, ko: "부팅" },
  { d: 7, ko: "적응" },
  { d: 30, ko: "습관" },
  { d: 100, ko: "리부트 완료" },
] as const;

export function dPlus(store: Store, today = new Date()): number {
  const c = store.profile?.createdAt;
  if (!c) return 0;
  const start = new Date(c);
  start.setHours(12, 0, 0, 0);
  const t = new Date(today);
  t.setHours(12, 0, 0, 0);
  return Math.max(1, Math.round((t.getTime() - start.getTime()) / 86400000) + 1);
}

/** 지금 단계와 다음 단계 (D+100 이후면 next는 없음) */
export function milestone(d: number) {
  const current = [...MILESTONES].reverse().find((m) => d >= m.d) ?? MILESTONES[0];
  const next = MILESTONES.find((m) => m.d > d);
  return { current, next, left: next ? next.d - d : 0 };
}
