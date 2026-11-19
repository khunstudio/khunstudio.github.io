"use client";

import Link from "next/link";
import { useEffect, useRef, type CSSProperties } from "react";

// 메인 히어로: 스크롤로 진행되는 한 편의 장면.
// 지금(외곽선)과 다음(오렌지), 떨어진 두 점이 가까워지며 켜지고 → 위아래로 붙어 콜론이 되고
// → 양옆에서 RE와 BOOT가 들어와 RE:BOOT가 완성된다. 손으로 조작할 필요 없이 스크롤만.

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const out = (t: number) => 1 - Math.pow(1 - t, 3);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function HomeHero() {
  const sec = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = stage.current!;
    const root = sec.current!;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;

    const render = (p: number) => {
      const W = el.clientWidth, H = el.clientHeight;
      const small = W < 720;
      // 최종 워드마크 크기
      const F = Math.min(small ? W * 0.2 : W * 0.15, 220);
      const fin = F * 0.17; // 콜론 점 한 변
      const gap = F * 0.12; // 두 점 사이
      // 시작 위치 · 크기
      const start = Math.min(W, H) * (small ? 0.16 : 0.13);
      const ax0 = -W * (small ? 0.26 : 0.27), ay0 = H * (small ? 0.3 : 0.16);
      const bx0 = W * (small ? 0.26 : 0.27), by0 = -H * (small ? 0.3 : 0.18);
      // 콜론 위치 (워드마크 중심 기준, 약간 위)
      const cy = -H * 0.06;

      const tMove = ease(seg(p, 0.08, 0.5)); // 가까워짐
      const tLock = ease(seg(p, 0.5, 0.62)); // 콜론으로 정렬
      const tWord = out(seg(p, 0.64, 0.8)); // RE · BOOT 등장
      const tCopy = out(seg(p, 0.8, 0.94)); // 카피 · 버튼

      // 워드마크 전체가 가운데 오도록: (BOOT 폭 - RE 폭) / 2 만큼 왼쪽으로, RE · BOOT가 들어오는 동안 서서히
      const reW = (el.querySelector(".sh-re") as HTMLElement | null)?.offsetWidth ?? 0;
      const bootW = (el.querySelector(".sh-boot") as HTMLElement | null)?.offsetWidth ?? 0;
      const shift = ((bootW - reW) / 2) * tWord;
      const sizeMid = lerp(start, start * 0.9, tMove);
      const size = lerp(sizeMid, fin, tLock);
      // 가까워지는 중간 지점: 서로 대각선으로 마주봄
      const axm = lerp(ax0, -size * 0.6, tMove), aym = lerp(ay0, size * 0.75, tMove);
      const bxm = lerp(bx0, size * 0.6, tMove), bym = lerp(by0, -size * 0.75, tMove);
      // 콜론: 아래(지금) · 위(다음)
      const ax = lerp(axm, 0, tLock) - shift, ay = lerp(aym, cy + (fin + gap) / 2, tLock);
      const bx = lerp(bxm, 0, tLock) - shift, by = lerp(bym, cy - (fin + gap) / 2, tLock);
      const ar = lerp(lerp(-18, -6, tMove), 0, tLock);
      const br = lerp(lerp(22, 8, tMove), 0, tLock);
      const fill = seg(p, 0.3, 0.55); // '지금'이 켜진다

      const s = el.style;
      s.setProperty("--a", `translate(${ax}px, ${ay}px) rotate(${ar}deg)`);
      s.setProperty("--b", `translate(${bx}px, ${by}px) rotate(${br}deg)`);
      s.setProperty("--size", `${size}px`);
      s.setProperty("--fill", `${fill}`);
      s.setProperty("--glow", `${0.15 + 0.85 * Math.max(fill, tLock) * (1 - tCopy * 0.4)}`);
      s.setProperty("--line", `${(1 - tLock) * Math.min(1, seg(p, 0.06, 0.2))}`);
      const dx = bx - ax, dy = by - ay;
      s.setProperty("--l-len", `${Math.hypot(dx, dy)}px`);
      s.setProperty("--l-rot", `${Math.atan2(dy, dx)}rad`);
      s.setProperty("--l-pos", `translate(${W / 2 + ax}px, ${H / 2 + ay}px)`);
      // 인트로 카피: 위로 올라가며 사라짐
      const tIntro = seg(p, 0.04, 0.22);
      s.setProperty("--intro-o", `${1 - tIntro}`);
      s.setProperty("--intro-y", `${-tIntro * 60}px`);
      s.setProperty("--intro-b", `${tIntro * 8}px`);
      // 중간 문장
      const m1 = seg(p, 0.2, 0.28) * (1 - seg(p, 0.44, 0.52));
      const m2 = seg(p, 0.52, 0.58) * (1 - seg(p, 0.64, 0.7));
      s.setProperty("--m1", `${m1}`); s.setProperty("--m2", `${m2}`);
      s.setProperty("--labels", `${(1 - tMove) * (1 - tIntro * 0.3)}`);
      // 워드마크
      s.setProperty("--F", `${F}px`);
      s.setProperty("--cy", `${cy}px`);
      s.setProperty("--fin", `${fin}px`);
      s.setProperty("--word", `${tWord}`);
      s.setProperty("--shift", `${-shift}px`);
      s.setProperty("--re-x", `${lerp(-W * 0.35, 0, tWord)}px`);
      s.setProperty("--boot-x", `${lerp(W * 0.35, 0, tWord)}px`);
      s.setProperty("--copy", `${tCopy}`);
      s.setProperty("--copy-y", `${(1 - tCopy) * 24}px`);
      s.setProperty("--hint", `${1 - seg(p, 0.02, 0.08)}`);
      s.setProperty("--bar", `${p}`);
      el.dataset.done = p > 0.9 ? "1" : "";
      if (p > 0.8) document.documentElement.dataset.booted = "1"; else delete document.documentElement.dataset.booted;
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (reduced) return render(1);
        const r = root.getBoundingClientRect();
        const span = r.height - innerHeight;
        render(clamp(-r.top / (span || 1)));
      });
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => { removeEventListener("scroll", onScroll); removeEventListener("resize", onScroll); cancelAnimationFrame(raf); };
  }, []);

  return (
    <section ref={sec} className="sh" aria-labelledby="sh-title">
      <div ref={stage} className="sh-pin">
        <div className="sh-grid" aria-hidden="true" />
        <div className="sh-glow" aria-hidden="true" />
        <div className="sh-line" aria-hidden="true" />

        {/* 인트로 카피 */}
        <div className="sh-intro">
          <p className="sh-kicker">RE:BOOT YOURSELF.</p>
          <h1 id="sh-title" className="sh-title">지금의 나와,<br />다음의 나 사이<span className="colon">:</span></h1>
          <p className="sh-sub">지금의 나를 지우지 않고, 다음의 나를 켜는 일.</p>
        </div>

        {/* 두 점 */}
        <div className="sh-dot sh-dot--now" aria-hidden="true"><i /><span className="sh-tag">지금</span></div>
        <div className="sh-dot sh-dot--next" aria-hidden="true"><i /><span className="sh-tag">다음</span></div>

        {/* 중간 문장 */}
        <p className="sh-mid" style={{ opacity: "var(--m1)" } as CSSProperties} aria-hidden="true">변화는, 그 사이에서.</p>
        <p className="sh-mid" style={{ opacity: "var(--m2)" } as CSSProperties} aria-hidden="true">두 점이 이어지는 순간.</p>

        {/* 워드마크 */}
        <div className="sh-word" aria-hidden="true">
          <span className="sh-re">RE</span>
          <span className="sh-boot">BOOT</span>
        </div>

        {/* 마무리 카피 */}
        <div className="sh-final">
          <p className="sh-final-line">다시, 나답게.</p>
          <p className="sh-final-sub">입대 전부터 복무 중, 전역 후, 그다음 일상까지.<br className="hidden sm:block" /> 30초 체크로 오늘 할 순서를 받고 매일 기록하세요.</p>
          <div className="sh-cta">
            <Link href="/start/" className="btn btn-primary">30초 체크 시작</Link>
            <Link href="/skin/" className="btn sh-btn-line">피부 타입부터 보기</Link>
          </div>
        </div>

        <p className="sh-hint" aria-hidden="true">SCROLL<i /></p>
        <div className="sh-bar" aria-hidden="true"><i /></div>
      </div>
    </section>
  );
}
