"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Photo } from "@/components/photo";

const POS = { x: 0.55, y: 0.4 }; // 사진이 잘릴 때 남길 위치 = 거울 속 얼굴

/**
 * 첫 화면. 스크롤을 내리면 거울의 김이 얼굴부터 바깥으로 걷힌다.
 * 화면은 고정(sticky)되고, 김이 다 걷히면 '오늘, 부팅 완료'.
 * 캔버스는 장식(aria-hidden), 사진의 대체 텍스트는 <Photo>가 맡는다.
 */
export function FogHero() {
  const sec = useRef<HTMLElement>(null);
  const [p, setP] = useState(0);

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

  // 김이 걷히는 느낌: 화면 전체의 블러와 뿌연 막이 함께 서서히 빠진다
  const k = Math.min(1, p / 0.9);
  const e = 1 - Math.pow(1 - k, 2); // 처음엔 빨리, 끝은 천천히
  const blur = 22 * (1 - e);
  const haze = 0.62 * (1 - e);
  const smoke = 1 - Math.min(1, k * 1.15);
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
              <div className="fh-img" style={{ filter: blur > 0.2 ? `blur(${blur.toFixed(1)}px) saturate(${(0.6 + 0.4 * e).toFixed(2)})` : undefined }}>
              <Photo name="fogmirror" alt="김 서린 욕실 거울을 바라보는 흰 티셔츠 차림의 짧은 머리 남자" sizes="large" priority position={`${POS.x * 100}% ${POS.y * 100}%`} className="h-full" />
              </div>
            </div>
            <div className="fh-haze" aria-hidden="true" style={{ opacity: haze }} />
            {/* 연기: 프랙탈 노이즈 두 겹이 서로 다른 속도로 흘러간다 */}
            <div className="fh-smoke fh-smoke--a" aria-hidden="true" style={{ opacity: smoke, transform: `translate3d(${(-p * 6).toFixed(2)}%, ${(-p * 10).toFixed(2)}%, 0)` }} />
            <div className="fh-smoke fh-smoke--b" aria-hidden="true" style={{ opacity: smoke * 0.8, transform: `translate3d(${(p * 5).toFixed(2)}%, ${(-p * 16).toFixed(2)}%, 0)` }} />
            {/* 필름 그레인: 김이 걷혀도 아주 옅게 남는다 */}
            <div className="fh-grain" aria-hidden="true" style={{ opacity: 0.12 + 0.28 * (1 - e) }} />
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
