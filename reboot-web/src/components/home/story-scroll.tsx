"use client";

import { useEffect, useRef, useState } from "react";

const STEPS = [
  { k: "01 CHECK", t: "질문 6개면\n지금의 나를 알 수 있어요", d: "생활 단계, 관심 영역, 쓸 수 있는 시간. 30초면 끝나요." },
  { k: "02 ROUTINE", t: "오늘 할 일만\n순서대로 드려요", d: "아침 세안, 보습, 자외선 차단. 필수 3단계부터 시작해요." },
  { k: "03 RECORD", t: "체크한 날이\n쌓여서 보여요", d: "남은 날 말고 쌓인 날을 세요. 시작한 날이 D+1이에요." },
];

/** 토스식 고정 스크롤: 글과 폰은 붙어 있고, 스크롤에 따라 단계만 바뀐다. 화면은 예시. */
export function StoryScroll() {
  const [step, setStep] = useState(0);
  const marks = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => {
        if (en.isIntersecting) setStep(Number((en.target as HTMLElement).dataset.i));
      }),
      { rootMargin: "-50% 0px -50% 0px" },
    );
    marks.current.forEach((m) => m && io.observe(m));
    return () => io.disconnect();
  }, []);

  return (
    <section className="story" aria-label="RE:BOOT 사용 흐름">
      <div className="story-pin">
        <div className="wrap story-grid">
          <div className="story-copy">
            {STEPS.map((s, i) => (
              <div key={s.k} className="story-text" data-on={step === i || undefined} aria-hidden={step !== i}>
                <p className="story-k">{s.k}</p>
                <h2 className="t-xl mt-4 whitespace-pre-line">{s.t}</h2>
                <p className="t-sub mt-5">{s.d}</p>
              </div>
            ))}
            <ol className="story-dots" aria-hidden="true">
              {STEPS.map((s, i) => <li key={s.k} data-on={step === i || undefined} />)}
            </ol>
          </div>
          <figure className="phone" aria-label="화면 예시">
            <div className="phone-screen">
              <ScreenCheck on={step === 0} />
              <ScreenRoutine on={step === 1} />
              <ScreenRecord on={step === 2} />
            </div>
            <figcaption className="phone-cap">화면 예시</figcaption>
          </figure>
        </div>
      </div>
      {STEPS.map((s, i) => (
        <div key={s.k} className="story-mark" data-i={i} ref={(el) => { marks.current[i] = el; }} />
      ))}
    </section>
  );
}

function ScreenCheck({ on }: { on: boolean }) {
  const opts = ["입대 준비", "복무 중", "전역 후", "일반 자기관리"];
  return (
    <div className="scr" data-on={on || undefined}>
      <p className="scr-k">1 / 6</p>
      <p className="scr-t">지금 어느 시기인가요?</p>
      <ul className="scr-opts">
        {opts.map((o, i) => <li key={o} data-sel={i === 1 || undefined}>{o}</li>)}
      </ul>
      <span className="scr-btn">다음</span>
    </div>
  );
}

function ScreenRoutine({ on }: { on: boolean }) {
  const rows = [["01", "세안", true], ["02", "보습", true], ["03", "자외선 차단", false]] as const;
  return (
    <div className="scr" data-on={on || undefined}>
      <p className="scr-k">D+12 · 아침</p>
      <div className="flex items-end justify-between">
        <p className="scr-t">오늘의 루틴</p>
        <p className="scr-pct">67<small>%</small></p>
      </div>
      <div className="scr-bar"><i style={{ width: on ? "67%" : "0%" }} /></div>
      <ul className="scr-rows">
        {rows.map(([n, t, d]) => (
          <li key={n} data-done={d || undefined}><b>{n}</b><span>{t}</span><i /></li>
        ))}
      </ul>
    </div>
  );
}

function ScreenRecord({ on }: { on: boolean }) {
  return (
    <div className="scr" data-on={on || undefined}>
      <p className="scr-k">내 기록</p>
      <p className="scr-big">D<span className="colon">+</span>12</p>
      <p className="scr-sub">적응 · 습관까지 18일</p>
      <div className="scr-week">
        <p>이번 주 <b>7/7</b></p>
        <div>{[0, 1, 2, 3, 4, 5, 6].map((i) => <i key={i} data-today={i === 6 || undefined} />)}</div>
      </div>
    </div>
  );
}
