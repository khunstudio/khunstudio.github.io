import {
  ShaderMount,
  liquidMetalFragmentShader,
  toProcessedLiquidMetal,
  getShaderColorFromString,
  ShaderFitOptions,
  LiquidMetalShapes,
} from './vendor/paper-shaders/index.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// 인트로가 끝나 로고가 완성되면 alive가 되고, 그때부터 심장이 뜁니다.
const vital = { alive: false, flash: 0 };

const clamp01 = (t) => Math.max(0, Math.min(1, t));
const ease = (p, [a, b]) => { const t = clamp01((p - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

const loadImage = (url) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });

// ─────────────────────────────────────────────
// 리퀴드 메탈 로고
// ─────────────────────────────────────────────
// 여기 숫자만 바꾸면 로고 느낌이 달라집니다. 한 번에 하나씩만 바꿔 보세요.
const LOGO = {
  src: 'assets/logo.png', // 흰 배경이든 투명 배경이든 검은 로고면 됩니다
  pad: 0.06,              // 로고 둘레 여백 (칸 대비)
  speed: 0.6,             // 흐르는 속도 (0 = 정지)
  repetition: 2,          // 줄무늬 밀도 (1–10)
  softness: 0.1,          // 색 경계 부드러움 (0–1)
  distortion: 0.07,       // 무늬 일렁임 (0–1)
  contour: 0.4,           // 가장자리 굴절 세기 (0–1)
  shiftRed: 0.3,          // 붉은 번짐 (-1–1)
  shiftBlue: 0.3,         // 푸른 번짐 (-1–1)
  angle: 70,              // 흐르는 방향 (도)
  scale: 1,
  colorBack: '#00000000', // 투명: 페이지 배경이 그대로 보입니다
  colorTint: '#dcffee',   // 살짝 그린이 도는 크롬 (진하게 하면 로고가 어두워집니다)
};

// 로고를 size×size 정사각형 가운데에 그리고, 잉크(검은 부분)만 남긴 픽셀을 돌려줍니다.
// 리퀴드 메탈과 픽셀 인트로가 같은 함수를 써서 두 로고가 정확히 겹칩니다.
function drawLogoInk(img, size, box = size) {
  const fit = (box * (1 - LOGO.pad * 2)) / Math.max(img.naturalWidth, img.naturalHeight);
  const w = img.naturalWidth * fit;
  const h = img.naturalHeight * fit;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
  const px = ctx.getImageData(0, 0, size, size);
  const d = px.data;
  for (let i = 0; i < d.length; i += 4) {
    const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    const ink = d[i + 3] > 127 && lum < 128;
    d[i] = d[i + 1] = d[i + 2] = 0;
    d[i + 3] = ink ? 255 : 0;
  }
  ctx.putImageData(px, 0, 0);
  return { canvas, data: d };
}

async function mountLogo(img) {
  const el = document.getElementById('logo');
  if (!el) return;
  try {
    const { canvas } = drawLogoInk(img, 1400);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    const { pngBlob } = await toProcessedLiquidMetal(new File([blob], 'logo.png', { type: 'image/png' }));
    const image = await loadImage(URL.createObjectURL(pngBlob));

    const mount = new ShaderMount(
      el,
      liquidMetalFragmentShader,
      {
        u_colorBack: getShaderColorFromString(LOGO.colorBack),
        u_colorTint: getShaderColorFromString(LOGO.colorTint),
        u_image: image,
        u_isImage: true,
        u_shape: LiquidMetalShapes.none,
        u_repetition: LOGO.repetition,
        u_softness: LOGO.softness,
        u_distortion: LOGO.distortion,
        u_contour: LOGO.contour,
        u_shiftRed: LOGO.shiftRed,
        u_shiftBlue: LOGO.shiftBlue,
        u_angle: LOGO.angle,
        u_fit: ShaderFitOptions.contain,
        u_scale: LOGO.scale,
        u_rotation: 0,
        u_offsetX: 0,
        u_offsetY: 0,
        u_originX: 0.5,
        u_originY: 0.5,
        u_worldWidth: 0,
        u_worldHeight: 0,
      },
      undefined,
      reduceMotion.matches ? 0 : LOGO.speed,
      0,
      2,
      1600 * 1600, // 휴대폰에서 무겁지 않도록 그리는 픽셀 수를 제한
      ['u_image'],
    );

    // "움직임 줄이기"를 켠 사람에게는 멈춘 금속 로고만 보여 줍니다.
    reduceMotion.addEventListener('change', (e) => mount.setSpeed(e.matches ? 0 : LOGO.speed));
    el.classList.add('is-live');
  } catch (err) {
    // WebGL을 못 쓰는 기기에서는 정적 로고가 그대로 남습니다.
    console.warn('리퀴드 로고를 띄우지 못했습니다:', err);
  }
}

// ─────────────────────────────────────────────
// 심전도(ECG) 선 — 픽셀 단위로 찍습니다
// ─────────────────────────────────────────────
const ECG = {
  speed: 190,     // 초당 이동 픽셀
  beat: 300,      // 박동 한 번의 가로 길이(px)
  height: 0.16,   // 화면 높이 대비 R파 높이
  dot: 3,         // 픽셀 한 칸 크기(px)
  color: '#3dffa2',
};

// PQRST 파형: [중심, 폭, 높이]
const WAVES = [[0.2, 0.035, 0.1], [0.37, 0.012, -0.14], [0.4, 0.012, 1], [0.435, 0.014, -0.28], [0.64, 0.06, 0.24]];
const wave = (p) => WAVES.reduce((y, [c, w, a]) => y + a * Math.exp(-(((p - c) / w) ** 2)), 0);

function mountEcg() {
  const canvas = document.getElementById('ecg');
  const mark = document.querySelector('.hero__mark');
  if (!canvas || !mark) return;
  const ctx = canvas.getContext('2d');
  const bpmEl = document.getElementById('bpm');
  const D = ECG.dot;

  let w = 0, h = 0, base = 0, x = 0, dist = 0, last = 0, beats = 0, amp = 0, prevY = 0, visible = true;

  const yAt = (d, a) => Math.round((base - wave((d / ECG.beat) % 1) * h * ECG.height * a) / D) * D;

  function plot(px, y) {
    ctx.fillRect(px, Math.min(y, prevY), D, Math.abs(y - prevY) + D);
    prevY = y;
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = ECG.color;
    ctx.shadowColor = ECG.color;
    ctx.shadowBlur = 10;
    // 선이 로고 칸의 한가운데를 지나가게 맞춥니다
    const m = mark.getBoundingClientRect(), c = canvas.getBoundingClientRect();
    base = m.top - c.top + m.height / 2;
    x = 0;
    prevY = yAt(dist, amp);
    if (reduceMotion.matches) {
      ctx.clearRect(0, 0, w, h);
      prevY = yAt(0, 1);
      for (let px = 0; px <= w; px += D) plot(px, yAt(px, 1));
      if (bpmEl) bpmEl.textContent = '072';
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    if (!last) last = now;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!visible) return;

    // 살아나기 전엔 평평한 선, 살아나면 박동이 서서히 커집니다.
    amp += ((vital.alive ? 1 : 0) - amp) * Math.min(1, dt * 2.5);
    const target = x + ECG.speed * dt;

    ctx.clearRect(x, 0, target - x + 40, h); // 커서 앞쪽을 지워 쓸고 가는 느낌을 냅니다
    for (let px = Math.ceil(x / D) * D; px < target; px += D) plot(px, yAt(dist + (px - x), amp));

    dist += target - x;
    x = target;
    if (x > w) { x = 0; prevY = yAt(dist, amp); }

    const n = Math.floor(dist / ECG.beat);
    if (n !== beats) {
      beats = n;
      if (bpmEl) bpmEl.textContent = amp > 0.5 ? String(70 + Math.floor(Math.random() * 5)).padStart(3, '0') : '---';
    }
  }

  new ResizeObserver(resize).observe(canvas);
  if (reduceMotion.matches) return;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
  requestAnimationFrame(frame);
}

// ─────────────────────────────────────────────
// 인트로 모션 (스크롤 연동, 픽셀 매트릭스)
// ─────────────────────────────────────────────
// 큰 원 → 작아짐 → 둘로 갈라지며 눈동자 → 늘어나며 놀람 → 회전하며 외곽선만 → 로고로 변형 → 금속으로 선명해짐
// 각 구간의 [시작, 끝]은 전체 스크롤(0–1) 중 어디서 일어나는지입니다.
const INTRO = {
  shrink: [0.0, 0.14],
  split: [0.14, 0.3],
  stretch: [0.3, 0.44],
  spin: [0.44, 0.66],
  morph: [0.64, 0.86],     // 외곽선이 로고 모양으로 변형
  resolve: [0.88, 0.97],   // 픽셀이 흩어지며 금속 로고로
  spins: 1,                // 회전 바퀴 수
  startSize: 1.5,          // 처음 원 크기 (로고 칸 대비 배율)
  grid: 132,               // 픽셀 칸 수 (가로·세로). 줄이면 더 굵은 픽셀
  dead: [96, 116, 104],    // 살아나기 전 색
  live: [61, 255, 162],    // 살아난 색
};

// 화면 좌표: 로고 칸이 -200…200, 픽셀 무대는 그 두 배인 -400…400 입니다.
const STAGE = 800;

// 타원까지의 거리(근사). 음수면 안쪽.
function sdEllipse(x, y, rx, ry) {
  const k1 = Math.hypot(x / rx, y / ry);
  const k2 = Math.hypot(x / (rx * rx), y / (ry * ry));
  return k2 > 0 ? (k1 * (k1 - 1)) / k2 : -Math.min(rx, ry);
}

// 1차원 거리 변환 (Felzenszwalb). f: 0 = 도형, 큰 수 = 빈 곳
function edt1d(f, n, out, v, z) {
  let k = 0;
  v[0] = 0; z[0] = -1e20; z[1] = 1e20;
  for (let q = 1; q < n; q++) {
    let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) { k--; s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
    k++; v[k] = q; z[k] = s; z[k + 1] = 1e20;
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++;
    out[q] = (q - v[k]) * (q - v[k]) + f[v[k]];
  }
}

function edt2d(mask, n, feature) {
  const g = new Float64Array(n * n);
  const f = new Float64Array(n), out = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
  for (let x = 0; x < n; x++) {
    for (let y = 0; y < n; y++) f[y] = mask[y * n + x] === feature ? 0 : 1e20;
    edt1d(f, n, out, v, z);
    for (let y = 0; y < n; y++) g[y * n + x] = out[y];
  }
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) f[x] = g[y * n + x];
    edt1d(f, n, out, v, z);
    for (let x = 0; x < n; x++) g[y * n + x] = Math.sqrt(out[x]);
  }
  return g;
}

// 로고 이미지에서 "로고까지의 거리" 지도를 만듭니다. 이걸로 외곽선이 로고로 자연스럽게 변형됩니다.
function buildLogoField(img, cells) {
  const n = cells * 4;
  const { data } = drawLogoInk(img, n, n / 2);
  const mask = new Uint8Array(n * n);
  for (let i = 0; i < mask.length; i++) mask[i] = data[i * 4 + 3] ? 1 : 0;
  const outside = edt2d(mask, n, 1), inside = edt2d(mask, n, 0);
  const unit = STAGE / n;
  const field = new Float32Array(cells * cells);
  for (let j = 0; j < cells; j++) {
    for (let i = 0; i < cells; i++) {
      const k = (j * 4 + 2) * n + i * 4 + 2;
      field[j * cells + i] = (outside[k] - inside[k]) * unit;
    }
  }
  return field;
}

const hash = (i, j, t) => (((i * 73856093) ^ (j * 19349663) ^ (t * 83492791)) >>> 0) % 1000 / 1000;

// 인트로 6단계: 도형 하나하나가 소생의 한 단계입니다. "소생은 눈을 뜨는 것에서 시작한다."
// from = 이 단계가 시작되는 스크롤 위치
const STEPS = [
  { from: 0,                 en: 'FLATLINE',  status: 'NO SIGNAL',      log: '> SCANNING BRAND … NO PULSE' },
  { from: 0.04,              en: 'DIAGNOSE',  status: 'DIAGNOSING',     log: '> ISOLATING THE ESSENCE' },
  { from: INTRO.split[0],    en: 'EYES OPEN', status: 'PUPIL RESPONSE', log: '> PUPIL RESPONSE: POSITIVE' },
  { from: INTRO.stretch[0],  en: 'SHOCK',     status: 'AWAKE',          log: '> SHIFT THE VIEW' },
  { from: INTRO.spin[0],     en: 'RE:VIBE',   status: 'CHARGING',       log: '> RE:VIBE — CHARGING' },
  { from: INTRO.morph[1],    en: 'REVIVED',   status: 'REVIVED',        log: '> REVIVED.' },
];

// 한 장면을 픽셀로 그립니다.
// cells = 가로·세로 픽셀 칸 수, view = 화면에 담는 범위(±view)
function paintFrame(ctx, size, cells, view, p, logoField, o = {}) {
  const { now = 0, tick = 0, flash = 0, lookX = 0, lookY = 0, scan = true } = o;
  const G = INTRO.grid, U = STAGE / G;
  const unit = (view * 2) / cells;

  const shrink = ease(p, INTRO.shrink);
  const split = ease(p, INTRO.split);
  const stretch = ease(p, INTRO.stretch);
  const spin = ease(p, INTRO.spin);
  const morph = ease(p, INTRO.morph);
  const resolve = ease(p, INTRO.resolve);
  const hollow = ease(p, [INTRO.spin[0] + 0.02, INTRO.spin[1] - 0.04]);
  const energy = ease(p, [INTRO.split[0], INTRO.morph[1]]);

  const rx = lerp(120 * INTRO.startSize, 60, shrink) - 4 * stretch;
  const ry = lerp(140 * INTRO.startSize, 70, shrink) + 38 * stretch;
  const gap = 62 * split + 6 * stretch - 14 * spin; // 회전하면서 로고의 두 고리 위치로 모입니다
  const tilt = (50 * stretch * Math.PI) / 180;
  const turn = (-360 * INTRO.spins * spin * Math.PI) / 180;
  // 눈동자: 톡 튀어나오고(오버슛), 늘어날 때 한 번 커졌다가(놀람), 회전이 시작되면 사라집니다.
  const pop = split < 1 ? split * (1 + 0.6 * Math.sin(split * Math.PI)) : 1;
  const pupil = pop * (1 + 0.35 * Math.sin(stretch * Math.PI)) * (1 - ease(p, [INTRO.spin[0], INTRO.spin[0] + 0.05]));
  const prx = 20 * pupil, pry = 27 * pupil * (1 + 0.25 * stretch), pcy = ry * 0.37 + lookY;
  const wall = hollow > 0 ? lerp(80, 9, hollow) : 1e6; // 외곽선 두께: 회전이 시작되면 안쪽부터 비워 갑니다

  const cosT = Math.cos(turn), sinT = Math.sin(turn), cosE = Math.cos(tilt), sinE = Math.sin(tilt);
  const halo = 10 + 16 * energy + 40 * flash;
  const scanY = scan ? ((now / 1000) * 260) % (STAGE * 1.6) - STAGE * 0.8 : 1e6;
  const dropout = (1 - energy) * 0.16;
  const logoAt = (x, y) => {
    const i = Math.floor((x + STAGE / 2) / U), j = Math.floor((y + STAGE / 2) / U);
    return i < 0 || j < 0 || i >= G || j >= G ? 999 : logoField[j * G + i] - 2;
  };

  const c = INTRO.dead.map((v, k) => Math.round(lerp(lerp(v, INTRO.live[k], energy), 235, flash * 0.8)));
  const cell = size / cells;
  const gapPx = cell > 4 ? 1 : 0.5;

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;

  for (let j = 0; j < cells; j++) {
    const y0 = (j + 0.5) * unit - view;
    for (let i = 0; i < cells; i++) {
      const x0 = (i + 0.5) * unit - view;
      let d;
      if (morph >= 1) {
        d = logoAt(x0, y0);
      } else {
        // 쌍 전체 회전을 되돌린 좌표
        const x = x0 * cosT + y0 * sinT, y = -x0 * sinT + y0 * cosT;
        d = 1e9;
        for (let s = -1; s <= 1; s += 2) {
          const dx = x - s * gap;
          const lx = dx * cosE + y * sinE, ly = -dx * sinE + y * cosE;
          let e = sdEllipse(lx, ly, rx, ry);
          if (pupil > 0.02) e = Math.max(e, -sdEllipse(lx - lookX, ly - pcy, prx, pry));
          if (e < d) d = e;
        }
        d = Math.max(d, -(d + wall));
        if (morph > 0) d = lerp(d, logoAt(x0, y0), morph);
      }

      if (d > halo) continue;
      const h = hash(i, j, 0);
      if (resolve > 0 && h < resolve) continue;

      if (d <= 0) {
        if (dropout > 0 && hash(i, j, tick) < dropout) continue;
        const glow = Math.exp(-(((y0 - scanY) / 46) ** 2));
        ctx.globalAlpha = Math.min(1, 0.72 + 0.28 * energy + 0.4 * glow) * (0.82 + 0.18 * h);
        ctx.fillRect(i * cell, j * cell, cell - gapPx, cell - gapPx);
      } else {
        // 도형 둘레의 잔광: 작은 점
        const a = (1 - d / halo) ** 2 * (0.12 + 0.4 * energy + flash);
        if (a < 0.03 || hash(i, j, tick) > 0.55 + a) continue;
        ctx.globalAlpha = Math.min(1, a);
        const s = cell * 0.36;
        ctx.fillRect(i * cell + (cell - s) / 2, j * cell + (cell - s) / 2, s, s);
      }
    }
  }
  ctx.globalAlpha = 1;
  return { resolve, spin };
}

function mountIntro(img) {
  const intro = document.getElementById('intro');
  const canvas = document.getElementById('morph');
  if (!intro || !canvas) return;
  const hero = intro.querySelector('.hero');
  const mark = hero.querySelector('.hero__mark');
  const statusEl = document.getElementById('status');
  const logEl = document.getElementById('log');
  const stepEl = document.getElementById('step');

  const logoField = buildLogoField(img, INTRO.grid);

  if (reduceMotion.matches) {
    vital.alive = true;
    document.documentElement.dataset.alive = '1';
    return;
  }

  const ctx = canvas.getContext('2d');
  intro.classList.add('is-scrolly');
  let size = 0, lastP = -1, lastTick = -1, last = 0, visible = true, cleared = false, logText = '', stepNow = -1;
  const pointer = { x: 0, y: 0, seen: false };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    size = canvas.clientWidth;
    canvas.width = canvas.height = Math.round(size * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    lastP = -1;
  }

  // 눈동자가 보는 방향: 마우스를 따라가고(눈맞춤), 마우스가 없으면 천천히 두리번거립니다.
  function look(now) {
    if (!pointer.seen) return [Math.sin(now / 900) * 7, Math.cos(now / 1300) * 4];
    const r = mark.getBoundingClientRect();
    const dx = pointer.x - (r.left + r.width / 2), dy = pointer.y - (r.top + r.height / 2);
    const len = Math.hypot(dx, dy) || 1, reach = Math.min(1, len / 240);
    return [(dx / len) * 13 * reach, (dy / len) * 9 * reach];
  }

  function setStep(n, spin) {
    const s = STEPS[n];
    const log = n === 0 && lastP < 0.01 ? '> SCROLL TO REVIVE ↓' : n === 4 ? `${s.log} ${String(Math.round(spin * 100)).padStart(3, '0')}%` : s.log;
    if (logEl && log !== logText) { logText = log; logEl.textContent = log; }
    if (n === stepNow) return;
    stepNow = n;
    if (statusEl) statusEl.textContent = s.status;
    if (stepEl) {
      stepEl.querySelector('.hero__step-no').textContent = `0${n + 1} / 06  ${'■'.repeat(n + 1)}${'□'.repeat(5 - n)}`;
      stepEl.querySelector('.hero__step-en').textContent = s.en;
    }
  }

  function draw(p, now, tick) {
    const [lookX, lookY] = look(now);
    const { resolve, spin } = paintFrame(ctx, size, INTRO.grid, STAGE / 2, p, logoField, { now, tick, flash: vital.flash, lookX, lookY });

    hero.style.setProperty('--logo', resolve);
    hero.style.setProperty('--reveal', ease(p, [INTRO.resolve[0] + 0.03, 1]));

    const alive = p >= INTRO.morph[1];
    if (alive && !vital.alive) vital.flash = 1; // 제세동: 로고가 완성되는 순간 번쩍
    vital.alive = alive;
    document.documentElement.dataset.alive = alive ? '1' : '0'; // 아래 바이탈 모니터(vital.js)가 읽습니다

    let n = 0;
    while (n < STEPS.length - 1 && p >= STEPS[n + 1].from) n++;
    setStep(n, spin);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!visible || !size) return;
    vital.flash *= Math.exp(-dt * 3);
    if (vital.flash < 0.01) vital.flash = 0;

    const p = clamp01(-intro.getBoundingClientRect().top / (intro.offsetHeight - window.innerHeight));
    const tick = Math.floor(now / 80);
    const done = p >= INTRO.resolve[1];
    if (done && cleared && p === lastP) return; // 끝난 뒤엔 쉬게 둡니다
    if (p === lastP && tick === lastTick && !vital.flash) return;
    lastP = p; lastTick = tick; cleared = done;
    draw(p, now, tick);
  }

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse') { pointer.x = e.clientX; pointer.y = e.clientY; pointer.seen = true; }
  }, { passive: true });
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(hero);
  requestAnimationFrame(frame);
}

loadImage(LOGO.src).then((img) => {
  mountIntro(img);
  mountLogo(img);
});
mountEcg();
