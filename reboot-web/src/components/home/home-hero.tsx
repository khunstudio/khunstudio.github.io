"use client";

import Link from "next/link";
import { useEffect, useRef, type CSSProperties } from "react";

// 메인 히어로: 스크롤로 진행되는 한 편의 장면.
// 1) 흰 큐브(지금)와 오렌지 큐브(다음)가 3D로 유기적으로 떠다니고
// 2) 음영이 빠지며 평면 실루엣(사선 육각형)이 되고 → 위아래로 쌓여 사선 콜론
// 3) 정면으로 돌아 사각형 콜론 → 흰 큐브가 오렌지로 물들고 → RE · BOOT가 들어와 RE:BOOT.

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const out = (t: number) => 1 - Math.pow(1 - t, 3);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type V3 = [number, number, number];
const VERTS: V3[] = [
  [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], // 앞(z=-1, 화면 쪽)
  [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1], // 뒤
];
// 면: 꼭짓점 인덱스 + 법선
const FACES: { v: number[]; n: V3 }[] = [
  { v: [0, 1, 2, 3], n: [0, 0, -1] },
  { v: [5, 4, 7, 6], n: [0, 0, 1] },
  { v: [4, 0, 3, 7], n: [-1, 0, 0] },
  { v: [1, 5, 6, 2], n: [1, 0, 0] },
  { v: [4, 5, 1, 0], n: [0, -1, 0] },
  { v: [3, 2, 6, 7], n: [0, 1, 0] },
];
const LIGHT: V3 = (() => { const l: V3 = [-0.4, -0.6, -0.7]; const m = Math.hypot(...l); return [l[0] / m, l[1] / m, l[2] / m]; })();

function rotate([x, y, z]: V3, rx: number, ry: number, rz: number): V3 {
  let c = Math.cos(rx), s = Math.sin(rx);
  [y, z] = [y * c - z * s, y * s + z * c];
  c = Math.cos(ry); s = Math.sin(ry);
  [x, z] = [x * c + z * s, -x * s + z * c];
  c = Math.cos(rz); s = Math.sin(rz);
  [x, y] = [x * c - y * s, x * s + y * c];
  return [x, y, z];
}

interface CubeState {
  x: number; y: number; // 화면 중심 좌표(px)
  half: number; // 한 변의 절반(px)
  rx: number; ry: number; rz: number;
  k: number; // 사선 깊이(0=정면 사각형, 1=사선 육각형)
  persp: number; // 원근 정도(1=3D, 0=평행)
  shade: number; // 음영(1=입체, 0=평면 실루엣)
  base: [number, number, number];
  dye?: number; // 오렌지로 물드는 정도(0~1)
  glow: number;
}

const WHITE: [number, number, number] = [242, 242, 240];
const ORANGE: [number, number, number] = [255, 90, 31];

function drawCube(g: CanvasRenderingContext2D, c: CubeState) {
  const O = 0.7071;
  const pts = VERTS.map((v) => {
    const [x, y, z] = rotate(v, c.rx, c.ry, c.rz);
    const sc = lerp(1, 4.2 / (4.2 + z), c.persp);
    // 사선 투영: 깊이(z)를 오른쪽 위로 밀어낸다. 육각형 전체가 가운데 오도록 보정
    const ox = c.k * z * O;
    const oy = -c.k * z * O;
    return { X: c.x + (x * sc + ox) * c.half, Y: c.y + (y * sc + oy) * c.half, z };
  });
  const faces = FACES.map((f) => {
    const n = rotate(f.n, c.rx, c.ry, c.rz);
    const depth = f.v.reduce((s, i) => s + pts[i].z, 0) / 4;
    return { f, n, depth };
  }).sort((a, b) => b.depth - a.depth);

  const paths: Path2D[] = [];
  g.save();
  if (c.glow > 0) { g.shadowColor = `rgba(255,90,31,${0.55 * c.glow})`; g.shadowBlur = c.half * 1.6 * c.glow; }
  // 뒤에서 앞으로 칠한다(볼록한 큐브라 이것만으로 가림이 맞다)
  for (const { f, n } of faces) {
    const lam = Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
    const light = lerp(1, 0.5 + 0.55 * lam, c.shade);
    const col = c.base.map((v) => Math.round(v * light));
    const p = new Path2D();
    f.v.forEach((i, j) => (j ? p.lineTo(pts[i].X, pts[i].Y) : p.moveTo(pts[i].X, pts[i].Y)));
    p.closePath();
    paths.push(p);
    g.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`;
    g.fill(p);
    // 면 사이 틈이 보이지 않게 같은 색 얇은 선
    g.strokeStyle = g.fillStyle; g.lineWidth = 0.75; g.stroke(p);
  }
  g.restore();

  // 물들기: 위(오렌지 큐브와 맞닿은 쪽)에서부터 번지듯
  if (c.dye && c.dye > 0) {
    g.save();
    const top = c.y - c.half * 1.15;
    const R = c.half * 4.2 * c.dye;
    const grd = g.createRadialGradient(c.x, top, 0, c.x, top, Math.max(1, R));
    grd.addColorStop(0, "rgba(255,90,31,1)");
    grd.addColorStop(0.72, "rgba(255,90,31,1)");
    grd.addColorStop(1, "rgba(255,90,31,0)");
    g.fillStyle = grd;
    // 면마다 칠한다 (정면일 때 앞 · 뒤 면이 겹쳐 하나의 클립 경로로는 상쇄되기 때문)
    for (const p of paths) g.fill(p);
    g.restore();
  }
}

export function HomeHero() {
  const sec = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const cvs = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = stage.current!;
    const root = sec.current!;
    const canvas = cvs.current!;
    const g = canvas.getContext("2d")!;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, visible = true, sp = -1, W = 0, H = 0, dpr = 1;
    const t0 = performance.now();

    const resize = () => {
      dpr = Math.min(2, devicePixelRatio || 1);
      W = el.clientWidth; H = el.clientHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    };

    const render = (p: number, time: number) => {
      const small = W < 720;
      const F = Math.min(small ? W * 0.2 : W * 0.15, 220);
      const fin = F * 0.17; // 최종 콜론 사각형 한 변
      const gap = F * 0.12;
      const cy = -H * 0.06;

      const tMove = ease(seg(p, 0.06, 0.46)); // 가까워짐
      const tFlat = ease(seg(p, 0.26, 0.46)); // 음영 · 원근이 빠지며 평면 실루엣
      const tAlign = ease(seg(p, 0.18, 0.46)); // 자유 회전 → 정렬
      const tStack = ease(seg(p, 0.46, 0.58)); // 위아래로 쌓여 사선 콜론
      const tFront = ease(seg(p, 0.58, 0.68)); // 정면으로 → 사각형
      const tDye = out(seg(p, 0.64, 0.76)); // 흰 큐브가 오렌지로 물듦
      const tWord = out(seg(p, 0.72, 0.84));
      const tCopy = out(seg(p, 0.84, 0.95));

      const reW = (el.querySelector(".sh-re") as HTMLElement | null)?.offsetWidth ?? 0;
      const bootW = (el.querySelector(".sh-boot") as HTMLElement | null)?.offsetWidth ?? 0;
      const shift = ((bootW - reW) / 2) * tWord;

      // 크기: 시작은 크게, 쌓일 때 최종 크기로
      const start = Math.min(W, H) * (small ? 0.085 : 0.075);
      const half = lerp(lerp(start, start * 0.85, tMove), fin / 2, tStack);
      const k = lerp(0, 1, tFlat) * (1 - tFront);
      const sep = lerp(half * 2 * (1 + k) + gap, fin + gap, tFront); // 위(다음) · 아래(지금) 중심 간격
      const cx0 = W / 2 - shift, cy0 = H / 2 + cy;

      // 출발 위치(화면 비율) → 마주보는 중간 지점 → 콜론
      const ax0 = W / 2 - W * (small ? 0.24 : 0.28), ay0 = H / 2 + H * (small ? 0.26 : 0.17);
      const bx0 = W / 2 + W * (small ? 0.24 : 0.28), by0 = H / 2 - H * (small ? 0.26 : 0.2);
      const bob = (1 - tAlign);
      const ts = (time - t0) / 1000;
      const axm = lerp(ax0, W / 2 - half * 3.2, tMove) + Math.sin(ts * 0.9) * 10 * bob;
      const aym = lerp(ay0, H / 2 + half * 2.4, tMove) + Math.cos(ts * 0.7) * 12 * bob;
      const bxm = lerp(bx0, W / 2 + half * 3.2, tMove) + Math.sin(ts * 0.8 + 2) * 10 * bob;
      const bym = lerp(by0, H / 2 - half * 2.4, tMove) + Math.cos(ts * 0.6 + 1) * 12 * bob;

      const A: CubeState = {
        x: lerp(axm, cx0, tStack), y: lerp(aym, cy0 + sep / 2, tStack), half,
        rx: (0.62 + Math.sin(ts * 0.5) * 0.35 + p * 2.2) * (1 - tAlign),
        ry: (-0.78 + ts * 0.45 + p * 3.1) * (1 - tAlign),
        rz: (0.18 + Math.cos(ts * 0.4) * 0.2) * (1 - tAlign),
        k, persp: 1 - tFlat, shade: 1 - tFlat, base: WHITE, dye: tDye,
        glow: tDye * (1 - tCopy * 0.4),
      };
      const B: CubeState = {
        x: lerp(bxm, cx0, tStack), y: lerp(bym, cy0 - sep / 2, tStack), half,
        rx: (-0.55 + Math.cos(ts * 0.45) * 0.35 - p * 2.4) * (1 - tAlign),
        ry: (0.9 - ts * 0.4 - p * 2.8) * (1 - tAlign),
        rz: (-0.2 + Math.sin(ts * 0.35) * 0.2) * (1 - tAlign),
        k, persp: 1 - tFlat, shade: 1 - tFlat, base: ORANGE,
        glow: Math.max(tFlat * 0.6, tDye) * (1 - tCopy * 0.4),
      };

      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      drawCube(g, A);
      drawCube(g, B);

      const s = el.style;
      s.setProperty("--glow", `${0.12 + 0.88 * Math.max(tFlat * 0.5, tDye) * (1 - tCopy * 0.4)}`);
      const tIntro = seg(p, 0.03, 0.2);
      s.setProperty("--intro-o", `${1 - tIntro}`);
      s.setProperty("--intro-y", `${-tIntro * 60}px`);
      s.setProperty("--intro-b", `${tIntro * 8}px`);
      s.setProperty("--m1", `${seg(p, 0.2, 0.27) * (1 - seg(p, 0.42, 0.48))}`);
      s.setProperty("--m2", `${seg(p, 0.5, 0.55) * (1 - seg(p, 0.62, 0.67))}`);
      s.setProperty("--m3", `${seg(p, 0.66, 0.7) * (1 - seg(p, 0.74, 0.78))}`);
      s.setProperty("--F", `${F}px`);
      s.setProperty("--cy", `${cy}px`);
      s.setProperty("--fin", `${fin}px`);
      s.setProperty("--word", `${tWord}`);
      s.setProperty("--shift", `${-shift}px`);
      s.setProperty("--re-x", `${lerp(-W * 0.3, 0, tWord)}px`);
      s.setProperty("--boot-x", `${lerp(W * 0.3, 0, tWord)}px`);
      s.setProperty("--copy", `${tCopy}`);
      s.setProperty("--copy-y", `${(1 - tCopy) * 24}px`);
      s.setProperty("--hint", `${1 - seg(p, 0.02, 0.08)}`);
      s.setProperty("--bar", `${p}`);
      el.dataset.done = p > 0.9 ? "1" : "";
      if (p > 0.8) document.documentElement.dataset.booted = "1"; else delete document.documentElement.dataset.booted;
    };

    const target = () => {
      const r = root.getBoundingClientRect();
      return clamp(-r.top / ((r.height - innerHeight) || 1));
    };

    const loop = (time: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible) return;
      const tp = reduced ? 1 : target();
      // 스크롤을 살짝 따라오게 해서 부드럽게
      sp = sp < 0 ? tp : sp + (tp - sp) * 0.14;
      if (Math.abs(tp - sp) < 0.0004) sp = tp;
      render(sp, reduced ? t0 : time);
    };

    resize();
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: "100px" });
    io.observe(root);
    addEventListener("resize", resize);
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); io.disconnect(); removeEventListener("resize", resize); };
  }, []);

  return (
    <section ref={sec} className="sh" aria-labelledby="sh-title">
      <div ref={stage} className="sh-pin">
        <div className="sh-grid" aria-hidden="true" />
        <div className="sh-glow" aria-hidden="true" />
        <canvas ref={cvs} className="sh-canvas" aria-hidden="true" />

        {/* 인트로 카피 */}
        <div className="sh-intro">
          <p className="sh-kicker">RE:BOOT YOURSELF.</p>
          <h1 id="sh-title" className="sh-title">지금의 나와,<br />다음의 나 사이<span className="colon">:</span></h1>
          <p className="sh-sub">지금의 나를 지우지 않고, 다음의 나를 켜는 일.</p>
        </div>

        {/* 중간 문장 */}
        <p className="sh-mid" style={{ opacity: "var(--m1)" } as CSSProperties} aria-hidden="true">제각각 떠다니던 지금과 다음.</p>
        <p className="sh-mid" style={{ opacity: "var(--m2)" } as CSSProperties} aria-hidden="true">한 줄로 서는 순간,</p>
        <p className="sh-mid" style={{ opacity: "var(--m3)" } as CSSProperties} aria-hidden="true">지금의 나에게도 불이 켜져요.</p>

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
