"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { buildRoutine, firstActions, recommendedGuides } from "@/lib/engine";
import { AREAS, GOALS, MINUTES, MODES } from "@/lib/labels";
import { actions, getStore } from "@/lib/store";
import { track } from "@/lib/analytics";
import { getGuide } from "@/content/guides";
import type { CheckAnswers } from "@/lib/types";
import { DRAFT_KEY } from "../check-flow";

export function ResultView() {
  const router = useRouter();
  const [a, setA] = useState<CheckAnswers | null | undefined>(undefined);
  const [hasRecords, setHasRecords] = useState(false);

  useEffect(() => {
    let v: CheckAnswers | null = null;
    try { const raw = sessionStorage.getItem(DRAFT_KEY); v = raw ? JSON.parse(raw) : null; } catch { /* noop */ }
    const s = getStore();
    if (!v && s.profile) v = s.profile;
    setA(v);
    setHasRecords(Object.keys(s.records).length > 0);
  }, []);

  const items = useMemo(() => (a ? buildRoutine(a) : []), [a]);
  if (a === undefined) return <div className="wrap-narrow py-14 small">불러오는 중…</div>;
  if (a === null) {
    return (
      <div className="wrap-narrow py-14">
        <h1 className="h2">아직 체크한 내용이 없어요</h1>
        <p className="lead mt-3">6개 질문에 답하면 시작할 루틴을 만들어 드려요.</p>
        <Link href="/check/" className="btn btn-primary mt-6">30초 체크 하기</Link>
      </div>
    );
  }

  const daily = items.filter((i) => !i.situations);
  const first = firstActions(items, a);
  const guides = recommendedGuides(a).map(getGuide).filter(Boolean);
  const total = daily.reduce((n, i) => n + i.minutes, 0);

  function save() {
    actions.saveCheck(a!);
    try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* noop */ }
    track("routine_save", { mode: a!.mode, minutes: a!.minutes });
    router.push("/routine/");
  }

  return (
    <div className="fade-in">
      <section className="band-ink">
        <div className="wrap-narrow py-10 md:py-14">
          <p className="eyebrow">YOUR STARTING POINT</p>
          <h1 className="h1 mt-3">하루 {total % 1 ? total.toFixed(1) : total}분,<br />이렇게 시작해 봐요.</h1>
          <ul className="mt-6 flex flex-wrap gap-2 text-[13px]">
            {[MODES[a.mode].ko, ...a.interests.map((i) => AREAS[i].ko), MINUTES[a.minutes], GOALS[a.goal]].map((t) => (
              <li key={t} className="rounded-full border border-ink-line px-3 py-1 text-ink-mute">{t}</li>
            ))}
          </ul>
        </div>
      </section>

      <div className="wrap-narrow py-10">
        <h2 className="sec-head h3">지금 바로 할 3가지</h2>
        <ol className="grid gap-3">
          {first.map((it, n) => (
            <li key={it.id} className="card flex gap-4 p-5">
              <span className="display text-[34px] text-signal">{n + 1}</span>
              <div>
                <p className="font-bold">{it.title}</p>
                <p className="small mt-1">{it.how}</p>
              </div>
            </li>
          ))}
        </ol>

        <h2 className="sec-head h3 mt-12">추천 루틴 미리보기</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {(["am", "pm"] as const).map((slot) => (
            <div key={slot} className="card p-5">
              <p className="eyebrow">{slot === "am" ? "MORNING · 아침" : "NIGHT · 저녁"}</p>
              <ul className="mt-3 grid gap-2.5">
                {daily.filter((i) => i.slot === slot).map((i) => (
                  <li key={i.id} className="flex items-baseline justify-between gap-3 text-[15px]">
                    <span>{i.title}</span>
                    <span className="small tabular-nums">{i.minutes < 1 ? "30초" : `${i.minutes}분`}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="small mt-3">야외활동·외출 같은 상황별 항목은 루틴 화면에서 상황을 바꾸면 보여요. 항목은 언제든 빼거나 다시 넣을 수 있어요.</p>

        <div className="mt-8 grid gap-2">
          <button type="button" className="btn btn-primary btn-block" onClick={save}>이 루틴으로 시작하기</button>
          <Link href="/check/" className="btn btn-ghost">다시 체크하기</Link>
        </div>
        {hasRecords && <p className="small mt-2 text-center">새 루틴으로 바꿔도 지금까지의 기록은 그대로 남아요.</p>}

        {guides.length > 0 && (
          <>
            <h2 className="sec-head h3 mt-14">먼저 읽어 볼 가이드</h2>
            <ul className="grid gap-3">
              {guides.map((g) => (
                <li key={g!.slug}>
                  <Link href={`/care/${g!.slug}/`} className="card card-link block p-5">
                    <p className="eyebrow !text-[11px]">{g!.kicker}</p>
                    <p className="mt-1 font-bold">{g!.title}</p>
                    <p className="small mt-1">{g!.summary}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="notice mt-10">
          <p>이 결과는 답변을 바탕으로 한 생활 관리 제안이며 피부 상태를 진단하지 않아요. 불편함이 계속되면 의료기관에 상담해 주세요.</p>
        </div>
      </div>
    </div>
  );
}
