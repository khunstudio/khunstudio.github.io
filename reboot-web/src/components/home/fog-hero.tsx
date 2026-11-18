"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Photo } from "@/components/photo";

const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
const POS = { x: 0.55, y: 0.4 }; // 사진이 잘릴 때 남길 위치 = 거울 속 얼굴

/**
 * 첫 화면. 스크롤을 내리면 거울의 김이 얼굴부터 바깥으로 걷힌다.
 * 화면은 고정(sticky)되고, 김이 다 걷히면 '오늘, 부팅 완료'.
 * 캔버스는 장식(aria-hidden), 사진의 대체 텍스트는 <Photo>가 맡는다.
 */
export function FogHero() {
  const sec = useRef<HTMLElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const [p, setP] = useState(0);

  // 김 한 장을 미리 그려 둔다: 흐린 사진 + 차가운 막 + 물방울
  useEffect(() => {
    const c = cv.current!;
    const img = new Image();
    img.src = `${base}/images/fogmirror${innerWidth < 900 ? "-sm" : ""}.webp`;
    const paint = () => {
      if (!img.width) return;
      const r = c.getBoundingClientRect();
      const dpr = Math.min(2, devicePixelRatio || 1);
      const w = (c.width = Math.round(r.width * dpr)), h = (c.height = Math.round(r.height * dpr));
      const f = c.getContext("2d")!;
      const s = Math.max(w / img.width, h / img.height);
      const iw = img.width * s, ih = img.height * s;
      f.filter = `blur(${Math.round(16 * dpr)}px) saturate(.5) brightness(1.08)`;
      f.drawImage(img, (w - iw) * POS.x, (h - ih) * POS.y, iw, ih);
      f.filter = "none";
      const g = f.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "rgba(232,237,240,.86)");
      g.addColorStop(1, "rgba(214,221,226,.74)");
      f.fillStyle = g; f.fillRect(0, 0, w, h);
      let seed = 11;
      const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      for (let i = 0; i < 320; i++) {
        const rr = (0.6 + rnd() * 2.8) * dpr;
        f.beginPath(); f.arc(rnd() * w, rnd() * h, rr, 0, Math.PI * 2);
        f.fillStyle = `rgba(255,255,255,${0.25 + rnd() * 0.4})`; f.fill();
      }
    };
    img.onload = paint;
    if (img.complete) paint();
    const ro = new ResizeObserver(paint);
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

  // 스크롤 진행도 0 → 1
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setP(1); return; }
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = sec.current!.getBoundingClientRect();
        const span = r.height - innerHeight;
        setP(Math.min(1, Math.max(0, -r.top / (span || 1))));
      });
    };
    on();
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, []);

  const done = p >= 0.92;
  useEffect(() => {
    if (done) document.documentElement.dataset.booted = "1";
    else delete document.documentElement.dataset.booted;
  }, [done]);

  // 얼굴에서 바깥으로 걷히는 구멍 + 끝무렵 전체가 옅어짐
  const k = Math.min(1, p / 0.85);
  const hole = 6 + k * 120;
  const fade = 1 - Math.max(0, (p - 0.7) / 0.25);
  const mask = `radial-gradient(circle at ${POS.x * 100}% ${POS.y * 100}%, transparent ${hole}%, #000 ${hole + 18}%)`;
  const pct = Math.round(Math.min(1, p / 0.92) * 100);

  return (
    <section ref={sec} className="fh">
      <div className="fh-pin">
        <div className="wrap fh-grid">
          <div className="fh-copy">
            <p className="t-k">06:00 · MEN&apos;S SELF-CARE</p>
            <h1 className="t-xxl mt-5 fh-title">
              남자 관리, 뭐부터 할지<br />30초면 알려드려요<span className="colon hero-colon">.</span>
            </h1>
            <p className="t-sub mt-6 max-w-[34rem]">
              입대 전 · 복무 중 · 전역 후, 지금 나에게 맞는 세안 · 보습 · 자외선 차단 순서를 받고 매일 체크하세요.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/start/" className="btn btn-primary">30초 체크 시작</Link>
              <Link href="/care/" className="btn btn-soft">가이드 먼저 보기</Link>
            </div>
          </div>
          <div className="fh-photo">
            <div className="absolute inset-0">
              <Photo name="fogmirror" alt="김 서린 욕실 거울을 바라보는 흰 티셔츠 차림의 짧은 머리 남자" sizes="large" priority position={`${POS.x * 100}% ${POS.y * 100}%`} className="h-full" />
            </div>
            <canvas ref={cv} aria-hidden="true" className="fh-fog" style={{ opacity: fade, WebkitMaskImage: mask, maskImage: mask }} />
            <div className="fog-chip" data-done={done || undefined} aria-hidden="true">
              {done ? (<><span className="fog-chip__dot" />오늘, 부팅 완료</>) : (
                <>
                  <span className="fog-chip__label">스크롤해서 김 걷기</span>
                  <span className="fog-chip__bar"><i style={{ width: `${pct}%` }} /></span>
                  <span className="tabular-nums">{pct}%</span>
                </>
              )}
            </div>
          </div>
        </div>
        <p className="fh-hint" data-hide={p > 0.04 || undefined} aria-hidden="true">스크롤 ↓</p>
      </div>
    </section>
  );
}
