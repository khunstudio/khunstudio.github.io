"use client";

import { useSyncExternalStore } from "react";
import { buildRoutine, dayKey, visibleItems } from "./engine.ts";
import type { CheckAnswers, Mode, Routine, Situation, Store } from "./types.ts";

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

function write(next: Store) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* 저장 불가 환경(시크릿 모드 등): 이번 방문 동안만 유지 */
  }
  listeners.forEach((l) => l());
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
        : { items: buildRoutine(a), situation: s.routine?.situation ?? "default", createdAt: t, updatedAt: t };
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
