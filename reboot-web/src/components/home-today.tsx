"use client";

import Link from "next/link";
import { dayKey, dPlus, streak, visibleItems } from "@/lib/engine";
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
        <p className="display text-[22px] leading-none">D<span className="colon">+</span>{dPlus(s)}</p>
        <div className="flex min-w-[160px] flex-1 items-center gap-3">
          <span className="text-[13px] text-mute">오늘 충전</span>
          <div className="bar flex-1"><i style={{ width: `${pct}%` }} /></div>
          <span className="text-[14px] font-bold tabular-nums">{pct}%</span>
        </div>
        <p className="small">{MODES[s.profile.mode].ko} · {situationLabel(s.profile.mode, s.routine.situation)}{st > 0 ? ` · ${st}일 연속` : ""}</p>
        <Link href="/routine/" className="btn btn-dark !min-h-10 !px-4 !text-[14px]">{pct === 100 ? "기록 보기" : "이어서 하기"}</Link>
      </div>
    </section>
  );
}
