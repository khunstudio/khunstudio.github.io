"use client";

import Link from "next/link";
import { useState } from "react";
import { evaluateBuyCheck, searchIngredientsOffline, type Verdict } from "@/lib/buy-check";
import { useStore } from "@/lib/store";
import { ProductPicks } from "./product-picks";

const QUICK_PICKS = ["판테놀", "나이아신아마이드", "세라마이드", "레티놀", "살리실산", "스피큘", "PDRN"];

const VERDICT_STYLE: Record<Verdict, string> = {
  FIT: "border-ink bg-paper",
  OVERLAP: "border-line bg-paper",
  CAUTION: "border-ink/50 bg-paper",
  HOLD: "border-ink bg-paper",
};

export function BuyChecker() {
  const s = useStore();
  const [q, setQ] = useState("");
  const hits = searchIngredientsOffline(q);

  return (
    <section className="mt-10 rounded-[16px] border border-line p-5 md:p-6" aria-label="사도 돼? 성분 · 루틴 중복 판정기">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="eyebrow !text-[11px]">BUY CHECK · 오프라인 초성 검색</p>
        <span className="small">내 기기 루틴으로만 판정 · 서버 전송 없음</span>
      </div>
      <h2 className="h3 mt-1.5">이 성분, 지금 사도 될까?</h2>
      <p className="small mt-1">
        성분명 · 브랜드 · 초성(예: <b>ㄹㅌㄴ</b>, <b>ㅅㄹㅁㅇㄷ</b>, <b>ㅇㅅㅌㄹ</b>)으로 찾으면 내 피부 타입과 현재 루틴 기준으로 중복·자극 여부를 먼저 알려드려요.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <label className="sr-only" htmlFor="buy-check-q">성분 또는 제품 초성 검색</label>
        <input
          id="buy-check-q"
          type="search"
          className="field flex-1 min-w-[220px]"
          placeholder="예: ㄹㅌㄴ, ㄷㅌㅈ, 판테놀, 나이아신아마이드, BHA"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {q && (
          <button type="button" className="btn btn-ghost !min-h-11" onClick={() => setQ("")}>지우기</button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="자주 찾는 성분">
        {QUICK_PICKS.map((word) => (
          <button key={word} type="button" className="chip" aria-pressed={q === word} onClick={() => setQ(q === word ? "" : word)}>
            {word}
          </button>
        ))}
      </div>

      {q.trim() !== "" && (
        <div className="mt-6 grid gap-4">
          {hits.length === 0 ? (
            <p className="small">
              일치하는 성분이나 예시 제품이 없어요. 성분표 앞쪽 5줄에 적힌 핵심 성분 이름(예: 판테놀, 세라마이드, 살리실산)으로 다시 검색해 보세요.
            </p>
          ) : (
            hits.slice(0, 6).map(({ ingredient: ing, matchedProducts }) => {
              const res = evaluateBuyCheck(ing, s);
              return (
                <article key={ing.slug} className={`rounded-[12px] border p-4 fade-in ${VERDICT_STYLE[res.verdict]}`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <span className="badge">{res.label}</span>
                      <span className="badge badge-draft ml-1.5">{ing.level}</span>
                      <h3 className="mt-2 text-[17px] font-bold tracking-tight">{ing.ko}</h3>
                      <p className="small">{ing.en}</p>
                    </div>
                    <Link href={`/ingredients/${ing.slug}/`} className="small link">성분 사전 보기 →</Link>
                  </div>

                  <p className="mt-3 text-[14.5px] font-semibold text-ink">{res.headline}</p>
                  <ul className="mt-1.5 grid gap-1 text-[13.5px] leading-relaxed text-[#3d3d3a]">
                    {res.reasons.map((r) => <li key={r}>· {r}</li>)}
                  </ul>

                  {res.needsProfileHint && (
                    <p className="small mt-3">
                      <Link href="/skin/" className="link">피부 타입 체크</Link>나 <Link href="/start/" className="link">30초 루틴 체크</Link>를 해 두면 내 루틴 중복까지 함께 판정해 드려요.
                    </p>
                  )}

                  {matchedProducts.length > 0 && res.verdict !== "HOLD" && (
                    <div className="mt-4 border-t border-line pt-3">
                      <p className="small mb-2 font-semibold !text-ink">이 성분의 예시 제품 (순위 아님)</p>
                      <ProductPicks items={matchedProducts.slice(0, 2)} />
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      )}
    </section>
  );
}
