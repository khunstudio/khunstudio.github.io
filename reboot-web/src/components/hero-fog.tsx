"use client";

import { useEffect, useRef, useState } from "react";

const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
const DONE_AT = 0.55; // 이만큼 닦으면 '부팅 완료'
const BRUSH = 0.11; // 브러시 반지름 = 짧은 변의 비율

/**
 * 새벽 6시, 김 서린 거울. 사진 위를 문지르면 김이 닦인다.
 * 손을 떼면 김이 아주 천천히 다시 낀다. 절반 넘게 닦으면 '오늘, 부팅 완료'.
 * 사진 자체(alt 포함)는 아래 <Photo>가 그대로 맡고, 캔버스는 장식이라 aria-hidden.
 */
export function HeroFog() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [pct, setPct] = useState(0);
  const [done, setDone] = useState(false);
  const [touched, setTouched] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext("2d")!;
    const fog = document.createElement("canvas");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, dpr = 1, raf = 0, ready = false, last: { x: number; y: number } | null = null;
    let lastWipe = 0, lastMeasure = 0, auto = true;
    const img = new Image();
    img.src = `${base}/images/wash${innerWidth < 900 ? "-sm" : ""}.webp`;

    const paintFog = () => {
      fog.width = w; fog.height = h;
      const f = fog.getContext("2d")!;
      // 사진을 cover(62% 50%)로 맞춰 흐리게 깔고, 그 위에 차가운 김
      const s = Math.max(w / img.width, h / img.height);
      const iw = img.width * s, ih = img.height * s;
      f.filter = `blur(${Math.round(18 * dpr)}px) saturate(.6)`;
      f.drawImage(img, (w - iw) * 0.62, (h - ih) * 0.5, iw, ih);
      f.filter = "none";
      const g = f.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "rgba(226,232,236,.80)");
      g.addColorStop(1, "rgba(206,214,220,.70)");
      f.fillStyle = g; f.fillRect(0, 0, w, h);
      // 맺힌 물방울 (고정 시드로 매번 같은 자리)
      let seed = 7;
      const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      for (let i = 0; i < 260; i++) {
        const r = (0.6 + rnd() * 2.6) * dpr;
        f.beginPath(); f.arc(rnd() * w, rnd() * h, r, 0, Math.PI * 2);
        f.fillStyle = `rgba(255,255,255,${0.25 + rnd() * 0.35})`; f.fill();
      }
    };

    const resize = () => {
      const r = cv.getBoundingClientRect();
      dpr = Math.min(2, devicePixelRatio || 1);
      w = cv.width = Math.round(r.width * dpr);
      h = cv.height = Math.round(r.height * dpr);
      if (!img.complete || !img.width) return;
      paintFog();
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.drawImage(fog, 0, 0);
      ready = true;
    };

    const wipe = (x: number, y: number) => {
      if (!ready) return;
      const rad = Math.min(w, h) * BRUSH;
      const from = last ?? { x, y };
      const dist = Math.hypot(x - from.x, y - from.y);
      const steps = Math.max(1, Math.ceil(dist / (rad * 0.25)));
      ctx.globalCompositeOperation = "destination-out";
      ctx.globalAlpha = 1;
      for (let i = 1; i <= steps; i++) {
        const px = from.x + ((x - from.x) * i) / steps, py = from.y + ((y - from.y) * i) / steps;
        const gr = ctx.createRadialGradient(px, py, rad * 0.35, px, py, rad);
        gr.addColorStop(0, "rgba(0,0,0,1)"); gr.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(px, py, rad, 0, Math.PI * 2); ctx.fill();
      }
      last = { x, y };
      lastWipe = performance.now();
    };

    const measure = () => {
      const sw = 48, sh = Math.max(1, Math.round((48 * h) / w));
      const t = document.createElement("canvas"); t.width = sw; t.height = sh;
      const tc = t.getContext("2d")!; tc.drawImage(cv, 0, 0, sw, sh);
      const d = tc.getImageData(0, 0, sw, sh).data;
      let clear = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i] < 90) clear++;
      const p = clear / (sw * sh);
      setPct(Math.round(p * 100));
      if (p >= DONE_AT && !doneRef.current) {
        doneRef.current = true; setDone(true);
        document.documentElement.dataset.booted = "1";
      }
    };

    // 첫 방문 힌트: 손가락이 한 번 쓱 닦고 지나간다 (사용자가 먼저 만지면 취소)
    const hint = (t0: number) => {
      const run = (now: number) => {
        if (!auto) return;
        const k = Math.min(1, (now - t0) / 1100);
        const e = 1 - Math.pow(1 - k, 3);
        wipe(w * (0.42 + 0.34 * e), h * (0.38 + 0.12 * Math.sin(e * Math.PI)));
        if (k < 1) requestAnimationFrame(run); else { last = null; auto = false; }
      };
      requestAnimationFrame(run);
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!ready) return;
      // 2.5초 이상 손을 떼면 김이 아주 천천히 다시 낀다 (완료 후엔 멈춤)
      if (!reduced && !doneRef.current && now - lastWipe > 2500) {
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 0.006;
        ctx.drawImage(fog, 0, 0);
      }
      if (now - lastMeasure > 250) { lastMeasure = now; measure(); }
    };

    const pt = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      return { x: (e.clientX - r.left) * dpr, y: (e.clientY - r.top) * dpr };
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.buttons === 0) return;
      if (auto) { auto = false; last = null; }
      setTouched(true);
      const p = pt(e); wipe(p.x, p.y);
    };
    const leave = () => { last = null; };

    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      resize();
      if (!reduced) setTimeout(() => hint(performance.now()), 700);
    };
    img.onload = start;
    if (img.complete && img.width) start();
    const ro = new ResizeObserver(() => { resize(); });
    ro.observe(cv);
    cv.addEventListener("pointermove", move);
    cv.addEventListener("pointerdown", move);
    cv.addEventListener("pointerleave", leave);
    cv.addEventListener("pointerup", leave);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); auto = false;
      delete document.documentElement.dataset.booted;
      cv.removeEventListener("pointermove", move); cv.removeEventListener("pointerdown", move);
      cv.removeEventListener("pointerleave", leave); cv.removeEventListener("pointerup", leave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <canvas ref={ref} aria-hidden="true" className="fog-canvas" data-done={done || undefined} />
      <div className="fog-chip" data-done={done || undefined} aria-live="polite">
        {done ? (
          <>
            <span className="fog-chip__dot" aria-hidden="true" />
            오늘, 부팅 완료
          </>
        ) : (
          <>
            <span className="fog-chip__label">{touched ? "김 닦는 중" : "문질러서 김 닦기"}</span>
            <span className="fog-chip__bar" aria-hidden="true"><i style={{ width: `${Math.min(100, (pct / (DONE_AT * 100)) * 100)}%` }} /></span>
            <span className="tabular-nums">{Math.min(100, Math.round((pct / (DONE_AT * 100)) * 100))}%</span>
          </>
        )}
      </div>
    </>
  );
}
