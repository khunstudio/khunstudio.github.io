"use client";

import { CHANGED_KEY, getStore, onLocalChange, replaceStore } from "./store";
import { sb } from "./crew";
import type { Store } from "./types";

// MY 기록 백업 · 동기화. 사용자가 켰을 때만 동작한다 (기기마다 따로 켬).
// 규칙: 마지막 동기화 이후 한쪽만 바뀌었으면 그쪽을 따르고, 둘 다 바뀌었으면 더 최근 것을 남긴다.

const ON_KEY = "reboot:sync";
const SYNCED_KEY = "reboot:synced"; // 마지막으로 맞춘 서버 시각

const ls = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* noop */ } },
  del: (k: string) => { try { localStorage.removeItem(k); } catch { /* noop */ } },
};

export const syncEnabled = () => ls.get(ON_KEY) === "1";
export const lastSynced = () => ls.get(SYNCED_KEY);
const hasLocalData = (s: Store) => Boolean(s.profile || Object.keys(s.records).length || s.goals?.length);

export async function serverCopy(): Promise<{ data: Store; updated_at: string } | null> {
  const { data, error } = await sb().from("user_data").select("data, updated_at").maybeSingle();
  if (error) throw error;
  return data as { data: Store; updated_at: string } | null;
}

export async function push(): Promise<string> {
  const { data: u } = await sb().auth.getUser();
  if (!u.user) throw new Error("로그인이 필요해요.");
  const { data, error } = await sb().from("user_data").upsert({ user_id: u.user.id, data: getStore() }, { onConflict: "user_id" }).select("updated_at").single();
  if (error) throw error;
  ls.set(SYNCED_KEY, data.updated_at);
  return data.updated_at;
}

export function pull(remote: { data: Store; updated_at: string }) {
  replaceStore(remote.data);
  ls.set(SYNCED_KEY, remote.updated_at);
}

/** 처음 켤 때: 양쪽에 다 기록이 있으면 사용자가 고르게 한다 */
export async function firstEnableState(): Promise<"empty-server" | "empty-local" | "both" | "none"> {
  const remote = await serverCopy();
  const local = hasLocalData(getStore());
  if (!remote) return local ? "empty-server" : "none";
  return local ? "both" : "empty-local";
}

export async function enable(choice: "local" | "server") {
  ls.set(ON_KEY, "1");
  if (choice === "server") { const r = await serverCopy(); if (r) pull(r); else await push(); }
  else await push();
}

export function disable() { ls.del(ON_KEY); ls.del(SYNCED_KEY); }

/** 켜져 있을 때 한 번 맞추기 */
export async function syncNow(): Promise<"pushed" | "pulled" | "same"> {
  const remote = await serverCopy();
  // 서버 시각(+00:00)과 브라우저 시각(Z)은 문자열 형식이 달라서 숫자로 바꿔 비교한다
  const t = (v: string | null | undefined) => (v ? Date.parse(v) || 0 : 0);
  const synced = t(ls.get(SYNCED_KEY));
  const changed = t(ls.get(CHANGED_KEY));
  if (!remote) { await push(); return "pushed"; }
  const server = t(remote.updated_at);
  const serverChanged = server > synced;
  const localChanged = changed > synced;
  if (serverChanged && (!localChanged || server > changed)) { pull(remote); return "pulled"; }
  if (localChanged) { await push(); return "pushed"; }
  return "same";
}

let timer: ReturnType<typeof setTimeout> | null = null;
let started = false;
/** 로그인 + 켜짐 상태에서: 기록이 바뀌면 3초 뒤 백업, 탭으로 돌아오면 한 번 맞추기 */
export function startAutoSync(onStatus?: (s: string) => void) {
  if (started) return () => {};
  started = true;
  const off = onLocalChange(() => {
    if (!syncEnabled()) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { push().then(() => onStatus?.("saved")).catch(() => onStatus?.("error")); }, 3000);
  });
  const onVis = () => { if (document.visibilityState === "visible" && syncEnabled()) syncNow().then((r) => onStatus?.(r)).catch(() => onStatus?.("error")); };
  document.addEventListener("visibilitychange", onVis);
  if (syncEnabled()) syncNow().then((r) => onStatus?.(r)).catch(() => onStatus?.("error"));
  return () => { off(); document.removeEventListener("visibilitychange", onVis); started = false; };
}
