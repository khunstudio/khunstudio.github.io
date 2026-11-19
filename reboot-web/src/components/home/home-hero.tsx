"use client";

import Link from "next/link";
import { useState, type CSSProperties, type PointerEvent } from "react";

const WORDS = [
  "시작은, 지금의 나를 인정하는 것에서.",
  "작은 움직임이, 나를 돌보는 습관으로.",
  "나를 만드는 일은 계속된다.",
];

export function HomeHero() {
  const [position, setPosition] = useState(0);
  const p = position / 100;
  const phase = position < 30 ? 0 : position < 75 ? 1 : 2;

  function move(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    setPosition(Math.round(Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) * 100));
  }

  return (
    <section className="brand-hero" aria-labelledby="brand-hero-title" style={{ "--journey": p } as CSSProperties}>
      <div className="wrap brand-hero-grid">
        <div className="brand-hero-copy">
          <p className="brand-hero-kicker">RE:BOOT YOURSELF.</p>
          <h1 id="brand-hero-title">지금의 나와,<br />다음의 나 사이<span>:</span></h1>
          <p className="brand-hero-description">지금의 나를 지우지 않고,<br />다음의 나를 켜는 일.</p>
          <p className="brand-hero-context">군 생활부터 일상까지 이어지는 자기관리.</p>
        </div>

        <div className="brand-hero-experience">
          <div
            className="brand-hero-stage"
            aria-hidden="true"
            onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); move(event); }}
            onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) move(event); }}
            onPointerUp={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) { move(event); event.currentTarget.releasePointerCapture(event.pointerId); } }}
            onPointerCancel={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
          >
            <span className="brand-hero-stage-label">THE SPACE BETWEEN.</span>
            <span className="brand-hero-now">지금</span>
            <span className="brand-hero-next">다음</span>
            <svg className="brand-hero-connection" width="100%" height="100%">
              <line x1={`${18 + 32 * p}%`} y1={`${68 - 34 * p}%`} x2={`${82 - 32 * p}%`} y2={`${28 + 38 * p}%`} />
            </svg>
            <span className="brand-hero-point brand-hero-point-now" />
            <span className="brand-hero-point brand-hero-point-next" />
            <span className="brand-hero-stage-word">{phase === 2 ? "다시, 나답게." : "변화는 그 사이에서."}</span>
          </div>

          <div className="brand-hero-control">
            <label htmlFor="brand-journey">두 점 사이를 움직여 보세요</label>
            <input id="brand-journey" type="range" min="0" max="100" value={position} onChange={(event) => setPosition(Number(event.target.value))} aria-valuetext={WORDS[phase]} aria-describedby="brand-journey-help" />
            <p id="brand-journey-help">드래그하거나 방향키로 움직여 보세요.</p>
          </div>
        </div>
      </div>

      <div className="wrap brand-hero-bottom">
        <p className="brand-hero-story" aria-live="polite">{WORDS[phase]}</p>
        <Link href="/start/" className="brand-hero-start">나의 루틴 시작하기</Link>
      </div>
    </section>
  );
}
