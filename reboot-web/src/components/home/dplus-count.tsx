"use client";

import { useEffect, useRef, useState } from "react";

const STOPS = [
  { d: 1, ko: "부팅" },
  { d: 7, ko: "적응" },
  { d: 30, ko: "습관" },
  { d: 100, ko: "리부트 완료" },
];

/** 화면에 들어오면 D+1 → D+100까지 올라가며 이정표가 차례로 켜진다 (예시 연출) */
export function DPlusCount() {
  const ref = useRef<HTMLDivElement>(null);
  const [d, setD] = useState(1);
  useEffect(() => {
    const el = ref.current!;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setD(100); return; }
    let raf = 0;
    const io = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now(), dur = 2600;
      const tick = (now: number) => {
        const k = Math.min(1, (now - t0) / dur);
        const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        setD(Math.max(1, Math.round(1 + e * 99)));
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, []);
  const cur = [...STOPS].reverse().find((s) => d >= s.d)!;
  return (
    <div ref={ref} className="dp">
      <p className="dp-num" aria-label={`D+${d}`}>D<span className="colon">+</span><span className="tabular-nums">{d}</span></p>
      <p className="dp-stage">{cur.ko}</p>
      <ol className="dp-stops" aria-hidden="true">
        {STOPS.map((s) => (
          <li key={s.d} data-on={d >= s.d || undefined}>
            <i />
            <b>D+{s.d}</b>
            <span>{s.ko}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
