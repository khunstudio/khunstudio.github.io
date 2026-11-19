"use client";

import Link from "next/link";
import { useState } from "react";
import { INGREDIENTS } from "@/content/ingredients";
import { SENSITIVE_NOTE, SKIN_PROFILES, SKIN_QUESTIONS, scoreSkin, type SkinTypeKey } from "@/lib/skintype";
import { actions, useStore } from "@/lib/store";

export function SkinTest() {
  const s = useStore();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [step, setStep] = useState(0);
  const [retake, setRetake] = useState(false);
  const [added, setAdded] = useState<string[]>([]);

  const saved = s?.skin;
  const showResult = saved && !retake;

  if (!s) return <div className="wrap-narrow py-14 small">불러오는 중…</div>;

  if (showResult) {
    const p = SKIN_PROFILES[saved.type as SkinTypeKey];
    const ings = [...p.ingredients, ...(saved.sensitive ? SENSITIVE_NOTE.ingredients : [])]
      .filter((v, i, a) => a.indexOf(v) === i)
      .map((slug) => INGREDIENTS.find((x) => x.slug === slug)!)
      .filter(Boolean);
    return (
      <div className="wrap-narrow py-10 md:py-14">
        <p className="eyebrow">SKIN TYPE · 셀프 체크 결과</p>
        <h1 className="mt-3 text-[40px] font-bold leading-tight tracking-tight sm:text-[52px]">
          {p.ko}<span className="colon">{saved.sensitive ? " + 예민" : "."}</span>
        </h1>
        <p className="lead mt-4">{p.one}</p>
        <div className="notice mt-6"><p>생활 습관으로 보는 셀프 체크예요. 진단이 아니고, 계절 · 환경에 따라 달라질 수 있어요. 붉은 기 · 통증 · 반복되는 트러블이 있다면 피부과 상담이 먼저예요.</p></div>

        <section className="mt-10">
          <h2 className="sec-head h3">이런 특징이 있어요</h2>
          <ul className="mt-3 grid gap-1.5 text-[15px]">{p.traits.map((t) => <li key={t}>· {t}</li>)}</ul>
        </section>

        <section className="mt-10">
          <h2 className="sec-head h3">이렇게 고르세요</h2>
          <div className="mt-4 grid gap-3">
            {p.products.map((x) => (
              <div key={x.step} className="card grid grid-cols-[72px_1fr] gap-4 p-4">
                <p className="display text-[18px]">{x.step}</p>
                <div>
                  <p className="font-bold">{x.pick}</p>
                  <p className="small mt-1">{x.why}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="small mt-3">자외선 차단제: {p.sunscreen} <Link href="/care/sunscreen-types/" className="link">무기 · 유기 · 혼합자차 차이</Link></p>
          <p className="small mt-1">여성용으로 나온 제품도 성분과 제형이 맞으면 그대로 써도 돼요. 포장이 아니라 뒷면 성분표로 고르세요.</p>
        </section>

        <section className="mt-10">
          <h2 className="sec-head h3">맞는 성분</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {ings.map((i) => (
              <li key={i.slug}>
                <Link href={`/ingredients/${i.slug}/`} className="card card-link block h-full p-4">
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-bold">{i.ko}</span>
                    <span className="badge badge-draft">{i.level}</span>
                  </span>
                  <span className="small mt-1 block">{i.role}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {saved.sensitive && (
          <section className="mt-10 rounded-[16px] bg-sand p-5">
            <h2 className="h3">{SENSITIVE_NOTE.title}</h2>
            <ul className="mt-3 grid gap-1.5 text-[15px]">{SENSITIVE_NOTE.points.map((t) => <li key={t}>· {t}</li>)}</ul>
          </section>
        )}

        <section className="mt-10">
          <h2 className="sec-head h3">피하면 좋은 것</h2>
          <ul className="mt-3 grid gap-1.5 text-[15px]">{p.avoid.map((t) => <li key={t}>· {t}</li>)}</ul>
        </section>

        <section className="mt-10 band-ink rounded-[16px] p-6">
          <p className="eyebrow">ADD TO ROUTINE</p>
          <p className="h3 mt-2">내 루틴에 바로 넣기</p>
          {s.routine ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {p.addons.map((x) => (
                <button
                  key={x.title} type="button" className="chip !border-white/30 !bg-transparent !text-white"
                  disabled={added.includes(x.title)}
                  onClick={() => { actions.addCustom({ title: x.title, slot: x.slot, minutes: x.minutes }); setAdded([...added, x.title]); }}
                >
                  {added.includes(x.title) ? "✓ " : "+ "}{x.title} · {x.slot === "am" ? "아침" : "저녁"}
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-[14px] text-ink-mute">먼저 30초 체크로 기본 루틴을 만들면 여기서 바로 추가할 수 있어요. <Link href="/start/" className="link !text-white">30초 체크</Link></p>
          )}
          {s.routine && <Link href="/routine/" className="link mt-4 inline-block text-[14px] !text-white">루틴에서 확인하기 →</Link>}
        </section>

        <div className="mt-8 flex flex-wrap gap-2">
          <button type="button" className="btn btn-line" onClick={() => { setRetake(true); setStep(0); setAnswers({}); }}>다시 체크하기</button>
          <Link href="/ingredients/" className="btn btn-ghost">성분 사전 전체 보기</Link>
        </div>
      </div>
    );
  }

  const q = SKIN_QUESTIONS[step];
  const pick = (i: number) => {
    const next = { ...answers, [q.id]: i };
    setAnswers(next);
    if (step < SKIN_QUESTIONS.length - 1) setStep(step + 1);
    else {
      const r = scoreSkin(next);
      actions.setSkin({ type: r.type, sensitive: r.sensitive, at: r.at });
      setRetake(false);
      window.scrollTo({ top: 0 });
    }
  };

  return (
    <div className="wrap-narrow py-10 md:py-14">
      <p className="eyebrow">SKIN TYPE · {step + 1} / {SKIN_QUESTIONS.length}</p>
      <div className="bar mt-3"><i style={{ width: `${((step) / SKIN_QUESTIONS.length) * 100}%` }} /></div>
      <h1 className="mt-8 text-[26px] font-bold leading-snug tracking-tight sm:text-[32px]">{q.q}</h1>
      {q.hint && <p className="small mt-2">{q.hint}</p>}
      <ul className="mt-6 grid gap-2">
        {q.options.map((o, i) => (
          <li key={o.label}>
            <button type="button" className="card card-link w-full p-4 text-left text-[16px] font-semibold" aria-pressed={answers[q.id] === i} onClick={() => pick(i)}>
              {o.label}
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex justify-between">
        <button type="button" className="btn btn-ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>← 이전</button>
        {saved && <button type="button" className="btn btn-ghost" onClick={() => setRetake(false)}>지난 결과 보기</button>}
      </div>
      <p className="small mt-8">진단이 아닌 생활 셀프 체크예요. 결과는 이 브라우저에만 저장돼요.</p>
    </div>
  );
}
