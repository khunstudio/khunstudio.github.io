"use client";

import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

// CREW 데이터 계층. 정적 사이트라 브라우저에서 Supabase에 바로 붙는다.
// 키는 공개용(publishable) 키만 쓴다. 권한은 DB의 RLS가 지킨다 (supabase/crew.sql).

import { CREW_SUPABASE_PUBLISHABLE_KEY, CREW_SUPABASE_URL } from "./crew-config";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || CREW_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || CREW_SUPABASE_PUBLISHABLE_KEY;

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
  images?: string[]; edited_at?: string | null;
  profiles?: { nickname: string } | null;
}
export interface Answer {
  id: string; post_id: string; author: string; body: string; hidden: boolean; helpful_count: number; created_at: string;
  edited_at?: string | null;
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
  if (m.includes("bad_image_path") || m.includes("images") || m.includes("Bucket not found")) return "사진 기능을 준비 중이에요. 사진 없이 올리거나 잠시 후 다시 시도해 주세요.";
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

/** 저장소에 올린 사진의 공개 주소 */
export const imageUrl = (path: string) => `${SB_URL}/storage/v1/object/public/crew/${path}`;

export const MAX_IMAGES = 4;

/** 사진을 1600px 이하로 줄이고 다시 저장한다. 다시 저장하면서 위치 정보(EXIF GPS 등)가 사라진다. */
export async function shrinkImage(file: File): Promise<{ blob: Blob; ext: "webp" | "jpg" }> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  c.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
  bmp.close?.();
  const toBlob = (type: string) => new Promise<Blob | null>((res) => c.toBlob(res, type, 0.82));
  const webp = await toBlob("image/webp");
  if (webp && webp.type === "image/webp") return { blob: webp, ext: "webp" };
  const jpg = await toBlob("image/jpeg");
  if (!jpg) throw new Error("사진을 처리하지 못했어요.");
  return { blob: jpg, ext: "jpg" };
}

/** 내 폴더에 사진을 올리고 저장 경로를 돌려준다 */
export async function uploadImage(userId: string, file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("사진 파일만 올릴 수 있어요.");
  const { blob, ext } = await shrinkImage(file);
  if (blob.size > 5 * 1024 * 1024) throw new Error("사진이 너무 커요.");
  const id = crypto.randomUUID().replace(/-/g, "");
  const path = `${userId}/${id}.${ext}`;
  const { error } = await sb().storage.from("crew").upload(path, blob, { contentType: blob.type, upsert: false });
  if (error) throw error;
  return path;
}

export async function removeImages(paths: string[]) {
  if (paths.length) await sb().storage.from("crew").remove(paths);
}

/** 계정 즉시 삭제: 내 사진 파일을 먼저 지우고, 계정(과 연결된 글 · 답 · 백업)을 지운 뒤 로그아웃 */
export async function deleteMyAccount() {
  const { data: u } = await sb().auth.getUser();
  if (!u.user) throw new Error("로그인이 필요해요.");
  const store = sb().storage.from("crew");
  for (let i = 0; i < 20; i++) {
    const { data: files } = await store.list(u.user.id, { limit: 100 });
    if (!files?.length) break;
    await store.remove(files.map((f) => `${u.user!.id}/${f.name}`));
    if (files.length < 100) break;
  }
  const { error } = await sb().rpc("delete_my_account");
  if (error) throw error;
  await sb().auth.signOut();
}
