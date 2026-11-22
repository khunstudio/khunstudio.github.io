"use client";

import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

// CREW 데이터 계층. 정적 사이트라 브라우저에서 Supabase에 바로 붙는다.
// 키는 공개용(publishable) 키만 쓴다. 권한은 DB의 RLS가 지킨다 (supabase/crew.sql).

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const crewReady = Boolean(SB_URL && KEY);

let client: SupabaseClient | null = null;
export function sb(): SupabaseClient {
  if (!crewReady) throw new Error("CREW가 아직 연결되지 않았어요.");
  if (!client) client = createClient(SB_URL!, KEY!, { auth: { persistSession: true, detectSessionInUrl: true } });
  return client;
}

export type Stage = "prepare" | "service" | "next" | "everyday";
export type Topic = "skin" | "body" | "style" | "life" | "etc";
export type Kind = "ask" | "pass";

export const STAGES: Record<Stage, string> = { prepare: "입대 준비", service: "복무 중", next: "전역 후", everyday: "일상" };
export const TOPICS: Record<Topic, string> = { skin: "피부", body: "운동", style: "헤어 · 스타일", life: "생활", etc: "기타" };
export const KINDS: Record<Kind, { en: string; ko: string }> = { ask: { en: "ASK", ko: "질문" }, pass: { en: "PASS IT ON", ko: "경험 물려주기" } };

export interface Post {
  id: string; author: string; kind: Kind; stage: Stage; topic: Topic; title: string; body: string;
  solved: boolean; hidden: boolean; answer_count: number; created_at: string;
  profiles?: { nickname: string } | null;
}
export interface Answer {
  id: string; post_id: string; author: string; body: string; hidden: boolean; helpful_count: number; created_at: string;
  profiles?: { nickname: string } | null;
}

export const REPORT_REASONS = ["비하 · 괴롭힘", "개인정보 · 부대 · 위치 노출", "의료 · 약물 단정", "광고 · 스팸", "기타"];

/** 올리기 전에 막는 것: 전화번호, 이메일, 부대 위치를 특정하는 표현 */
export function privacyIssue(text: string): string | null {
  if (/01[016789][-\s.]?\d{3,4}[-\s.]?\d{4}/.test(text)) return "전화번호는 올릴 수 없어요.";
  if (/[\w.+-]+@[\w-]+\.[\w.]+/.test(text)) return "이메일 주소는 올릴 수 없어요.";
  if (/\d{2,4}\s*(사단|연대|대대|여단|부대)/.test(text)) return "소속 부대를 특정하는 정보는 올릴 수 없어요. (예: 00사단, 00연대)";
  return null;
}

export function friendlyError(e: unknown): string {
  const m = (e as { message?: string })?.message ?? String(e);
  if (m.includes("rate_limit")) return "짧은 시간에 너무 많이 올렸어요. 잠시 후 다시 올려 주세요.";
  if (m.includes("duplicate key") && m.includes("nickname")) return "이미 쓰는 닉네임이에요. 다른 걸로 골라 주세요.";
  if (m.includes("duplicate key")) return "이미 처리했어요.";
  if (m.includes("check constraint")) return "글자 수를 확인해 주세요.";
  if (m.includes("Failed to fetch")) return "연결이 불안정해요. 잠시 후 다시 시도해 주세요.";
  return "문제가 생겼어요. 잠시 후 다시 시도해 주세요.";
}

export function timeAgo(iso: string): string {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "방금";
  if (s < 3600) return `${Math.floor(s / 60)}분 전`;
  if (s < 86400) return `${Math.floor(s / 3600)}시간 전`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

/** 로그인 상태 + 닉네임 */
export function useCrewUser() {
  const [user, setUser] = useState<User | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [loading, setLoading] = useState(crewReady);

  useEffect(() => {
    if (!crewReady) return;
    let alive = true;
    const load = async (u: User | null) => {
      if (!alive) return;
      setUser(u);
      if (u) {
        const { data } = await sb().from("profiles").select("nickname").eq("id", u.id).maybeSingle();
        if (alive) setNickname(data?.nickname ?? null);
      } else setNickname(null);
      if (alive) setLoading(false);
    };
    sb().auth.getSession().then(({ data }) => load(data.session?.user ?? null));
    const { data: sub } = sb().auth.onAuthStateChange((_e, session) => { load(session?.user ?? null); });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);

  return { user, nickname, loading, setNickname };
}

export async function blockedIds(): Promise<string[]> {
  const { data } = await sb().from("blocks").select("blocked_id");
  return (data ?? []).map((r: { blocked_id: string }) => r.blocked_id);
}
