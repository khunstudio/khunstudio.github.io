"use client";

import Link from "next/link";
import { Check } from "./chrome";
import { dayKey, streak, visibleItems } from "@/lib/engine";
import { MODES, situationLabel } from "@/lib/labels";
import { useStore } from "@/lib/store";

/** 돌아온 사용자에게만 보이는 오늘 요약 */
export function TodayStrip() {
  const s = useStore();
  if (!s?.routine || !s.profile) return null;
  const visible = visibleItems(s.routine.items, s.routine.situation);
  const done = (s.records[dayKey()]?.done ?? []).filter((id) => visible.some((v) => v.id === id)).length;
  const pct = visible.length ? Math.round((done / visible.length) * 100) : 0;
  const st = streak(s);
  return (
    <section className="border-b border-line bg-sand fade-in" aria-label="오늘 요약">
      <div className="wrap flex flex-wrap items-center gap-x-6 gap-y-3 py-4">
        <p className="eyebrow !text-ink">TODAY</p>
        <div className="flex min-w-[160px] flex-1 items-center gap-3">
          <div className="bar flex-1"><i style={{ width: `${pct}%` }} /></div>
          <span className="text-[14px] font-bold tabular-nums">{pct}%</span>
        </div>
        <p className="small">{MODES[s.profile.mode].ko} · {situationLabel(s.profile.mode, s.routine.situation)}{st > 0 ? ` · ${st}일 연속` : ""}</p>
        <Link href="/routine/" className="btn btn-dark !min-h-10 !px-4 !text-[14px]">{pct === 100 ? "기록 보기" : "이어서 하기"}</Link>
      </div>
    </section>
  );
}

/** 히어로 오른쪽의 화면 예시 (실제 데이터 아님) */
export function HeroPreview() {
  const rows = [
    { t: "아침 세안", m: "30초", d: true },
    { t: "보습제 바르기", m: "30초", d: true },
    { t: "자외선 차단제", m: "30초", d: false },
    { t: "면도 후 진정·보습", m: "30초", d: false },
  ];
  return (
    <figure className="relative mx-auto w-full max-w-[360px]">
      <div className="rounded-[20px] bg-paper p-5 text-ink shadow-[0_30px_60px_rgba(0,0,0,.35)]">
        <div className="flex items-end justify-between">
          <div>
            <p className="eyebrow !text-[10.5px]">TODAY · MORNING</p>
            <p className="mt-1 text-[20px] font-extrabold tracking-tight">오늘의 루틴</p>
          </div>
          <p className="display text-[44px] leading-none">50<span className="text-[18px] text-mute">%</span></p>
        </div>
        <div className="bar mt-3 !bg-line"><i style={{ width: "50%" }} /></div>
        <ul className="mt-2">
          {rows.map((r) => (
            <li key={r.t} className={`ritem !grid-cols-[28px_1fr_auto] !py-3 ${r.d ? "done" : ""}`}>
              <span className={`rcheck !h-7 !w-7 ${r.d ? "on" : ""}`} aria-hidden="true"><Check /></span>
              <span className="rtitle text-[15px] font-semibold">{r.t}</span>
              <span className="small !text-[12px]">{r.m}</span>
            </li>
          ))}
        </ul>
      </div>
      <figcaption className="mt-3 text-center text-[12px] text-ink-mute">화면 예시</figcaption>
    </figure>
  );
}
