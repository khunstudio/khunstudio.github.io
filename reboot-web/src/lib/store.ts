"use client";

import { useSyncExternalStore } from "react";
import { buildRoutine, dayKey, syncTodayPlan, visibleItems } from "./engine.ts";
import type { Anchor, CheckAnswers, LifeGoal, Mode, Profile, Routine, RoutineItem, SkinRecord, Slot, Situation, Store } from "./types.ts";

// 저장 어댑터: 지금은 localStorage. 계정을 도입하면 이 파일의 read/write만 서버 동기화로 교체한다.
const KEY = "reboot:v1";
const EMPTY: Store = { version: 1, records: {}, modeHistory: [] };

let cache: Store | null = null;
const listeners = new Set<() => void>();

function read(): Store {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Store) : null;
    cache = parsed && parsed.version === 1 ? { ...EMPTY, ...parsed } : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

export const CHANGED_KEY = "reboot:changed";

function write(next: Store, opts: { fromSync?: boolean } = {}) {
  next = syncTodayPlan(next);
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
    // 계정 백업용: 이 기기에서 마지막으로 바뀐 시각 (서버에서 내려받은 건 제외)
    if (!opts.fromSync) localStorage.setItem(CHANGED_KEY, new Date().toISOString());
  } catch {
    /* 저장 불가 환경(시크릿 모드 등): 이번 방문 동안만 유지 */
  }
  listeners.forEach((l) => l());
  changeHooks.forEach((h) => { if (!opts.fromSync) h(); });
}

const changeHooks = new Set<() => void>();
/** 이 기기에서 기록이 바뀔 때마다 (계정 백업 예약용) */
export function onLocalChange(h: () => void) { changeHooks.add(h); return () => { changeHooks.delete(h); }; }

/** 계정에서 내려받은 기록으로 통째로 바꾼다 */
export function replaceStore(next: Store) {
  if (!next || next.version !== 1) return;
  write({ ...EMPTY, ...next }, { fromSync: true });
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) { cache = null; l(); }
  };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(l); window.removeEventListener("storage", onStorage); };
}

/** 서버 렌더 중에는 null → 화면은 "불러오는 중" 상태를 그린다. */
export function useStore(): Store | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

export function getStore(): Store {
  return read();
}

const now = () => new Date().toISOString();

export const actions = {
  setMode(mode: Mode) {
    const s = read();
    const profile = s.profile ? { ...s.profile, mode, updatedAt: now() } : undefined;
    write({ ...s, profile, modeHistory: [...s.modeHistory, { mode, at: now() }] });
  },

  /** 체크 결과를 프로필과 루틴으로 저장한다. 기존 기록은 지우지 않는다. */
  saveCheck(a: CheckAnswers, opts: { keepRoutine?: boolean } = {}) {
    const s = read();
    const t = now();
    const profile = { ...a, nickname: s.profile?.nickname, createdAt: s.profile?.createdAt ?? t, updatedAt: t };
    const routine: Routine =
      opts.keepRoutine && s.routine
        ? s.routine
        : {
            // 직접 추가한 항목은 다시 체크해도 남긴다
            items: [...buildRoutine(a), ...(s.routine?.items.filter((i) => i.templateId === "custom") ?? [])],
            situation: s.routine?.situation ?? "default",
            createdAt: t,
            updatedAt: t,
          };
    const modeHistory = s.profile?.mode === a.mode ? s.modeHistory : [...s.modeHistory, { mode: a.mode, at: t }];
    write({ ...s, profile, routine, modeHistory });
  },

  setSituation(situation: Situation) {
    const s = read();
    if (!s.routine) return;
    write({ ...s, routine: { ...s.routine, situation, updatedAt: now() } });
  },

  toggleEnabled(id: string) {
    const s = read();
    if (!s.routine) return;
    const items = s.routine.items.map((i) => (i.id === id ? { ...i, enabled: !i.enabled } : i));
    write({ ...s, routine: { ...s.routine, items, updatedAt: now() } });
  },

  /** 오늘 항목 체크/해제. planned는 지금 보이는 항목으로 갱신한다. */
  toggleDone(id: string) {
    const s = read();
    if (!s.routine) return;
    const key = dayKey();
    const planned = visibleItems(s.routine.items, s.routine.situation).map((i) => i.id);
    const prev = s.records[key]?.done ?? [];
    const done = prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id];
    write({ ...s, records: { ...s.records, [key]: { planned, done } } });
  },

  /** 내가 직접 정한 항목을 루틴에 추가한다 (예: 아침 비타민 C) */
  addCustom(input: { title: string; slot: Slot; minutes?: number; why?: string; guide?: string }) {
    const s = read();
    if (!s.routine) return;
    const title = input.title.trim().slice(0, 40);
    if (!title) return;
    if (s.routine.items.some((i) => i.templateId === "custom" && i.title === title && i.slot === input.slot)) return;
    const item: RoutineItem = {
      id: `custom-${Date.now().toString(36)}`,
      templateId: "custom",
      title,
      slot: input.slot,
      area: "skin",
      minutes: input.minutes ?? 1,
      why: input.why ?? "내가 직접 추가한 항목이에요.",
      how: "정한 순서대로, 매일 같은 시간에.",
      enabled: true,
      guide: input.guide,
    };
    write({ ...s, routine: { ...s.routine, items: [...s.routine.items, item], updatedAt: now() } });
  },

  removeCustom(id: string) {
    const s = read();
    if (!s.routine) return;
    const items = s.routine.items.filter((i) => !(i.id === id && i.templateId === "custom"));
    write({ ...s, routine: { ...s.routine, items, updatedAt: now() } });
  },

  setAnchor(anchor: Anchor | undefined) {
    const s = read();
    write({ ...s, anchor });
  },

  addGoal(goal: LifeGoal) {
    const s = read();
    const goals = s.goals ?? [];
    if (goals.some((g) => g.title === goal.title && !g.done)) return;
    write({ ...s, goals: [...goals, goal] });
  },

  toggleGoal(id: string) {
    const s = read();
    const goals = (s.goals ?? []).map((g) => (g.id === id ? { ...g, done: !g.done, doneAt: !g.done ? now() : undefined } : g));
    write({ ...s, goals });
  },

  toggleCheckpoint(goalId: string, cpId: string) {
    const s = read();
    const goals = (s.goals ?? []).map((g) =>
      g.id === goalId ? { ...g, checkpoints: g.checkpoints?.map((c) => (c.id === cpId ? { ...c, done: !c.done } : c)) } : g,
    );
    write({ ...s, goals });
  },

  removeGoal(id: string) {
    const s = read();
    write({ ...s, goals: (s.goals ?? []).filter((g) => g.id !== id) });
  },

  setSkin(skin: SkinRecord) {
    const s = read();
    write({ ...s, skin });
  },

  /** 나이대 · 지금 생활 · 관심사만 바꾼다. rebuild면 루틴도 다시 구성 (직접 추가한 항목은 유지) */
  setPersona(me: { age?: Profile["age"]; status?: Profile["status"]; focus?: Profile["focus"] }, rebuild = false) {
    const s = read();
    if (!s.profile) return;
    const next = { ...s.profile, ...me, updatedAt: now() };
    if (rebuild) { actions.saveCheck(next); return; }
    write({ ...s, profile: next });
  },

  setNickname(nickname: string) {
    const s = read();
    if (!s.profile) return;
    write({ ...s, profile: { ...s.profile, nickname: nickname.slice(0, 12) || undefined, updatedAt: now() } });
  },

  clearRecords() {
    const s = read();
    write({ ...s, records: {} });
  },

  clearAll() {
    try { localStorage.removeItem(KEY); } catch { /* noop */ }
    write({ ...EMPTY, records: {}, modeHistory: [] });
  },
};
