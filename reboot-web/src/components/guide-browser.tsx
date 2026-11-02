"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { GUIDES, type Guide } from "@/content/guides";
import { AREAS, AREA_ORDER } from "@/lib/labels";
import type { Area } from "@/lib/types";

export function GuideCard({ g }: { g: Guide }) {
  return (
    <Link href={`/care/${g.slug}/`} className="card card-link flex h-full flex-col p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="eyebrow !text-[11px]">{g.kicker}</p>
        <p className="small !text-[12px]">{g.read}분</p>
      </div>
      <p className="mt-2 text-[17px] font-bold leading-snug tracking-tight">{g.title}</p>
      <p className="small mt-2 line-clamp-2">{g.summary}</p>
    </Link>
  );
}

export function GuideBrowser({ initialArea }: { initialArea?: Area }) {
  const [area, setArea] = useState<Area | "all">(initialArea ?? "all");
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    const k = q.trim().toLowerCase();
    return GUIDES.filter((g) => (area === "all" || g.area === area) && (!k || (g.title + g.summary + g.kicker + g.sections.map((s) => s.h + (s.p ?? []).join("") + (s.list ?? []).join("") + (s.steps ?? []).join("")).join("")).toLowerCase().includes(k)));
  }, [area, q]);

  return (
    <div>
      <label className="relative block">
        <span className="sr-only">가이드 검색</span>
        <input
          id="guide-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="면도, 자외선, 전역 후…"
          className="h-12 w-full rounded-full border-[1.5px] border-line bg-white pl-12 pr-4 text-[16px] outline-none focus:border-ink"
        />
        <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-mute" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" strokeLinecap="round" /></svg>
      </label>
      <div className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1" role="group" aria-label="영역">
        <button type="button" className="chip" aria-pressed={area === "all"} onClick={() => setArea("all")}>전체</button>
        {AREA_ORDER.map((a) => (
          <button key={a} type="button" className="chip" aria-pressed={area === a} onClick={() => setArea(a)}>{AREAS[a].en} · {AREAS[a].ko}</button>
        ))}
      </div>
      {list.length ? (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((g) => <li key={g.slug}><GuideCard g={g} /></li>)}
        </ul>
      ) : (
        <p className="small mt-8">&lsquo;{q}&rsquo;에 맞는 가이드가 아직 없어요. 다른 단어로 찾아보세요.</p>
      )}
    </div>
  );
}
