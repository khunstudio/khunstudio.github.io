"use client";

import { useState } from "react";
import { Stage, Phone, Bar, Check, Meter, Roll, type Act } from "@/kit";
import "./routine-demo.css";

// 홈 'HOW IT WORKS' 옆의 화면 시연 (실제 데이터 아님).
// 이야기: 아침 루틴 세 줄을 차례로 체크 → 오늘 충전 0 → 33 → 67 → 100%
// → 이번 주 기록에 오늘 점이 켜지고 6/7 → 7/7. 결과를 띄운 채로 멈춘다.
// 진짜 글자: D+12 · 아침, 오늘의 루틴, 오늘 충전, %, 세안, 보습, 자외선 차단, 이번 주, n/7.

type S = { done: number; lit: boolean };
const START: S = { done: 0, lit: false };
const STEPS = [
  { n: "01", t: "세안", sub: 40 },
  { n: "02", t: "보습", sub: 56 },
  { n: "03", t: "자외선 차단", sub: 48 },
];
const REST = { wide: { x: 400, y: 470 }, compact: { x: 330, y: 480 } };

const script = async (a: Act<S>) => {
  await a.wait(900);
  for (let i = 0; i < STEPS.length; i++) {
    a.mark(`check-${i + 1}`);
    await a.click(`step-${i}`);
    a.put({ done: i + 1 });
    await a.wait(i < 2 ? 650 : 700);
  }
  a.mark("payoff");
  a.put({ lit: true });
  await a.move(a.layout === "compact" ? REST.compact : REST.wide);
  await a.wait(600);
};

export function RoutineDemo() {
  const [run, setRun] = useState(0);
  return (
    <figure className="relative">
      <RoutineStage key={run} />
      <figcaption className="mt-3 flex items-center justify-center gap-3 text-[12px] text-mute">
        <span>화면 예시</span>
        <button type="button" onClick={() => setRun((n) => n + 1)} className="link !text-[12px]">다시 보기</button>
      </figcaption>
    </figure>
  );
}

function RoutineStage() {
  return (
    <Stage<S>
      width={440}
      height={540}
      compact={{ below: 440, width: 358, height: 500 }}
      initial={START}
      poster={{ done: 3, lit: true }}
      play="once"
      script={script}
      cursor={{ at: REST, style: "touch", ripple: true }}
      accent="#ff5a1f"
      className="rb-demo"
    >
      {(s, _rect, layout) => {
        const pct = Math.round((s.done / STEPS.length) * 100);
        return (
          <Phone width={layout === "compact" ? 300 : 316} time="6:02" className="rb-phone">
            <div className="rb-screen">
              <div className="rb-head">
                <div>
                  <div className="rb-eyebrow">D+12 · 아침</div>
                  <div className="rb-title">오늘의 루틴</div>
                </div>
                <div className="rb-charge">
                  <div className="rb-charge__label">오늘 충전</div>
                  <div className="rb-charge__num">
                    <Roll delay={220}>{String(pct)}</Roll>
                    <span className="rb-charge__unit">%</span>
                  </div>
                </div>
              </div>
              <Meter value={pct / 100} className="rb-meter" />

              <div className="rb-list">
                {STEPS.map((st, i) => (
                  <div key={st.n} className="rb-row" data-done={i < s.done || undefined} data-target={`step-${i}`}>
                    <span className="rb-row__n">{st.n}</span>
                    <span className="rb-row__body">
                      <span className="rb-row__t">{st.t}</span>
                      <Bar w={st.sub} h={6} r={3} tone={2} />
                    </span>
                    <Check on={i < s.done} size={26} className="rb-row__check" />
                  </div>
                ))}
                <div className="rb-row rb-row--patch">
                  <span className="rb-row__n">+</span>
                  <span className="rb-row__body">
                    <Bar w={96} h={8} r={4} tone={3} />
                    <Bar w={44} h={6} r={3} tone={2} />
                  </span>
                  <span className="rb-row__ghost" />
                </div>
              </div>

              <div className="rb-week">
                <div className="rb-week__head">
                  <span className="rb-week__label">이번 주</span>
                  <span className="rb-week__count"><Roll>{s.lit ? "7" : "6"}</Roll><span className="rb-week__of">/7</span></span>
                </div>
                <div className="rb-week__dots">
                  {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                    <span key={d} className="rb-dot" data-past={d < 6 || undefined} data-today={d === 6 || undefined} data-lit={(d === 6 && s.lit) || undefined} />
                  ))}
                </div>
              </div>
            </div>
          </Phone>
        );
      }}
    </Stage>
  );
}
