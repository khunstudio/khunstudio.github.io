// KHUN studio 브랜드 심볼 모션 (Three.js)
// 인트로의 체계(FLATLINE → EYES OPEN → RE:VIBE)를 그대로 3D로 옮깁니다.
//  - CORE (FLATLINE): 0의 상태. 단단한 유리 겉과, 그 안에서 평평했다가 살아나는 픽셀 파동
//  - CORE 카드에서는 구 안에서 유리 심볼이 돕니다 (EYES OPEN은 상세 페이지의 픽셀 모션이 맡습니다)
//  - RE:VIBE: 실제 로고 윤곽선 여러 겹이 인피니트 심볼처럼 요동칩니다
// data-symbol="full | core | eyes | revibe" 인 요소마다 하나씩 그립니다. 화면에 보일 때만 움직입니다.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const BPM = 72;
const MINT = new THREE.Color(0x3dffa2);
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const base = new URL('.', import.meta.url);

// 심장 박동 (0~1): 한 박에 두 번 뛰는 모양
const beat = (t) => {
  const p = ((t * BPM) / 60) % 1;
  return Math.exp(-(((p - 0.06) / 0.035) ** 2)) + 0.55 * Math.exp(-(((p - 0.24) / 0.05) ** 2));
};
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

const uniforms = { uTime: { value: 0 }, uBeat: { value: 0 }, uLife: { value: 0 }, uPx: { value: 1 } };

// 무지개빛: 민트 → 라벤더 → 연한 하늘
const IRI = /* glsl */`
  uniform float uTime; uniform float uBeat; uniform float uLife; uniform float uPx;
  vec3 iri(vec3 p, float f) {
    float k = 0.5 + 0.5 * sin(p.y * 2.6 + p.x * 1.7 + uTime * 0.6 + f * 4.0);
    float m = 0.5 + 0.5 * sin(p.z * 3.1 - uTime * 0.4 + f * 2.0);
    return mix(mix(vec3(0.24, 1.0, 0.64), vec3(0.64, 0.56, 1.0), k), vec3(0.80, 0.94, 1.0), m * 0.55);
  }`;
const VERT = /* glsl */`
  varying vec3 vN; varying vec3 vV; varying vec3 vP;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); vP = position;
    gl_Position = projectionMatrix * mv;
  }`;

// 유리 같은 면 (로고, 막대): 가장자리가 밝고 가운데는 비칩니다
const glass = () => new THREE.ShaderMaterial({
  uniforms, vertexShader: VERT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  fragmentShader: IRI + /* glsl */`
    varying vec3 vN; varying vec3 vV; varying vec3 vP;
    void main() {
      float ndv = abs(dot(normalize(vN), normalize(vV)));
      float rim = 1.0 - ndv;
      vec3 c = iri(vP, rim) * (0.16 + 0.95 * pow(rim, 1.4)) + vec3(1.0) * pow(rim, 5.0) * 0.5;
      c *= 1.0 + 0.4 * uBeat;
      float a = 0.55 + 0.45 * rim;
      gl_FragColor = vec4(c * a, a);
    }`,
});

// 비눗방울 같은 구의 겉면
const bubble = () => new THREE.ShaderMaterial({
  uniforms, vertexShader: VERT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  fragmentShader: IRI + /* glsl */`
    varying vec3 vN; varying vec3 vV; varying vec3 vP;
    void main() {
      float rim = 1.0 - abs(dot(normalize(vN), normalize(vV)));
      vec3 c = iri(vP * 1.3, rim) * pow(rim, 2.2) + vec3(1.0) * pow(rim, 7.0) * 0.5;
      float a = 0.02 + 0.85 * pow(rim, 2.6);
      gl_FragColor = vec4(c * a, a);
    }`,
});

// 눈동자: 어두운 유리알 + 무지개빛 테두리 + 하이라이트
const pupilMat = () => new THREE.ShaderMaterial({
  uniforms, vertexShader: VERT,
  fragmentShader: IRI + /* glsl */`
    varying vec3 vN; varying vec3 vV; varying vec3 vP;
    void main() {
      vec3 n = normalize(vN);
      float ndv = abs(dot(n, normalize(vV)));
      float rim = 1.0 - ndv;
      vec3 c = vec3(0.01, 0.05, 0.035) + iri(vP * 4.0, rim) * pow(rim, 1.8) * 1.1;
      float spec = pow(max(dot(n, normalize(vec3(-0.45, 0.55, 0.7))), 0.0), 60.0);
      c += vec3(1.0) * spec * 0.9;
      gl_FragColor = vec4(c, 1.0);
    }`,
});

// 점(픽셀) 재질: 인트로의 픽셀 매트릭스와 같은 결
const dotMat = (vertex, color = MINT, size = 3) => new THREE.ShaderMaterial({
  uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: /* glsl */`
    uniform float uTime; uniform float uBeat; uniform float uLife; uniform float uPx;
    attribute float aSeed; varying float vA;
    ${vertex}
  `,
  fragmentShader: /* glsl */`
    varying float vA;
    void main() {
      vec2 q = abs(gl_PointCoord - 0.5);
      if (max(q.x, q.y) > 0.42) discard;   // 네모난 픽셀
      gl_FragColor = vec4(vec3(${color.r.toFixed(3)}, ${color.g.toFixed(3)}, ${color.b.toFixed(3)}) * vA, vA);
    }`,
  defines: { SIZE: size.toFixed(1) },
});

// ── CORE: 유리 구 + 안쪽 픽셀 파동 + 적도의 심전도
function core(r = 1) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.SphereGeometry(r, 96, 96), bubble()));

  // 구 안쪽 표면에 고르게 뿌린 픽셀. 평평하다가(FLATLINE) 박동과 함께 파동이 일어납니다.
  const N = 2600, pos = new Float32Array(N * 3), seed = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2, rr = Math.sqrt(1 - y * y), th = i * 2.399963;
    pos.set([Math.cos(th) * rr * r * 0.94, y * r * 0.94, Math.sin(th) * rr * r * 0.94], i * 3);
    seed[i] = Math.random();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  g.add(new THREE.Points(geo, dotMat(/* glsl */`
    void main() {
      vec3 p = position;
      float lat = asin(clamp(p.y / length(p), -1.0, 1.0));
      float lon = atan(p.z, p.x);
      float w = sin(lat * 9.0 - uTime * 2.2) * sin(lon * 3.0 + uTime * 0.7);
      p *= 1.0 + uLife * (0.06 * w + 0.05 * uBeat * sin(lat * 14.0 + uTime * 5.0));
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = SIZE * uPx * (3.2 / -mv.z);
      float flick = step(0.16 * (1.0 - uLife), fract(aSeed * 91.7 + floor(uTime * 12.0) * 0.137));
      vA = (0.16 + 0.5 * uLife * (0.5 + 0.5 * w) + 0.35 * uBeat * uLife) * flick;
    }`)));

  // 적도를 도는 심전도 (픽셀 점선). 평평한 선 → 박동
  const M = 720, rp = new Float32Array(M * 3), rs = new Float32Array(M);
  for (let i = 0; i < M; i++) { const a = (i / M) * Math.PI * 2; rp.set([Math.cos(a) * r * 1.02, 0, Math.sin(a) * r * 1.02], i * 3); rs[i] = i / M; }
  const rg = new THREE.BufferGeometry();
  rg.setAttribute('position', new THREE.BufferAttribute(rp, 3));
  rg.setAttribute('aSeed', new THREE.BufferAttribute(rs, 1));
  g.add(new THREE.Points(rg, dotMat(/* glsl */`
    float ecg(float p) {
      return 0.12 * exp(-pow((p - 0.2) / 0.035, 2.0)) - 0.16 * exp(-pow((p - 0.37) / 0.012, 2.0))
           + 1.0 * exp(-pow((p - 0.4) / 0.012, 2.0)) - 0.3 * exp(-pow((p - 0.435) / 0.014, 2.0))
           + 0.26 * exp(-pow((p - 0.64) / 0.06, 2.0));
    }
    void main() {
      vec3 p = position;
      float s = fract(aSeed * 3.0 - uTime * 0.35);
      p.y += ecg(s) * 0.32 * uLife;
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = SIZE * uPx * (3.2 / -mv.z);
      vA = 0.35 + 0.65 * uLife;
    }`, MINT, 3.4)));
  return g;
}

// ── EYES OPEN: 로고의 두 고리(ㅋ · ㅜㄴ)가 각자 빙글빙글 돌며 풀려 두 개의 눈이 됩니다
async function eyes() {
  const H = await fetch(new URL('assets/studiokhun/khun-halves.json?v=3', base)).then((r) => r.json());
  const g = new THREE.Group(), parts = [];
  for (const [k, spin] of [['b', 2], ['a', -1.5]]) {
    const shape = new THREE.Shape(H[k].map(([x, y]) => new THREE.Vector2(x, y)));
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.012, bevelSegments: 4, curveSegments: 4 });
    geo.computeBoundingBox();
    const home = geo.boundingBox.getCenter(new THREE.Vector3()); home.z = 0;
    geo.translate(-home.x, -home.y, -0.05); // 고리마다 자기 중심을 축으로 돕니다
    const ring = new THREE.Mesh(geo, glass());
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.15, 48, 48), pupilMat());
    const piece = new THREE.Group(); piece.add(ring, pupil);
    g.add(piece);
    parts.push({ piece, ring, pupil, home, spin, side: k === 'a' ? 1 : -1 });
  }
  g.userData.parts = parts;
  return g;
}
const CYCLE = 10; // 초: 로고 → 돌며 풀림 → 두 눈 → 두리번 → 돌며 다시 로고
function updateEyes(g, t) {
  const p = (t % CYCLE) / CYCLE;
  const open = smooth(0.1, 0.42, p) * (1 - smooth(0.76, 0.98, p)); // 0 = 로고, 1 = 두 눈
  const pop = smooth(0.4, 0.48, p) * (1 - smooth(0.72, 0.78, p));
  for (const { piece, ring, pupil, home, spin, side } of g.userData.parts) {
    const eye = new THREE.Vector3(side * 0.62, 0, 0);
    piece.position.lerpVectors(home, eye, open);
    piece.scale.setScalar(1 - 0.22 * open);
    // 풀릴 때와 돌아올 때 각자 다른 바퀴 수로 돌고, 눈일 때는 제자리에서 살짝 흔들립니다
    ring.rotation.z = spin * Math.PI * 2 * (p < 0.6 ? smooth(0.1, 0.42, p) : 1 - smooth(0.76, 0.98, p)) + 0.06 * Math.sin(t * 1.7 + side) * open;
    ring.rotation.y = 0.5 * Math.sin(Math.PI * open) * side;
    pupil.scale.setScalar(Math.max(0.001, pop * (1 + 0.25 * Math.sin(Math.min(pop, 1) * Math.PI))));
    pupil.position.set(0.05 * Math.sin(t * 1.3) * pop, 0.035 * Math.sin(t * 0.9 + 1) * pop, 0.08);
  }
  return open;
}

// ── RE:VIBE: 실제 로고 윤곽선 여러 겹이 인피니트 심볼처럼 요동칩니다 (+ 가운데 유리 로고)
async function revibe(mark, copies = 6, solid = true) {
  const g = new THREE.Group();
  const pts = mark.map(([x, y]) => new THREE.Vector3(x, y, 0));
  const curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal');
  const tube = new THREE.TubeGeometry(curve, 900, 0.006, 6, true);
  for (let i = 0; i < copies; i++) {
    const m = new THREE.ShaderMaterial({
      uniforms: { ...uniforms, uPhase: { value: i / copies } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */`
        uniform float uTime; uniform float uBeat; uniform float uPhase; varying vec3 vP; varying float vK;
        void main() {
          vec3 p = position;
          float ph = uPhase * 6.2831;
          // 8자를 그리며 흔들리는 진동
          p.z += 0.22 * sin(p.x * 2.4 + uTime * 1.1 + ph) * cos(p.y * 1.8 - uTime * 0.6);
          p.xy *= 1.0 + 0.07 * sin(uTime * 0.9 + ph) + 0.05 * uBeat * sin(ph * 3.0);
          p.y += 0.05 * sin(p.x * 5.0 + uTime * 2.0 + ph);
          vP = p; vK = uPhase;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: IRI + /* glsl */`
        varying vec3 vP; varying float vK;
        void main() { vec3 c = iri(vP, vK) * (0.32 + 0.3 * uBeat); gl_FragColor = vec4(c, 0.5); }`,
    });
    const line = new THREE.Mesh(tube, m);
    line.rotation.set((i - copies / 2) * 0.16, (i - copies / 2) * 0.22, 0);
    g.add(line);
  }
  if (solid) {
    const shape = new THREE.Shape(mark.map(([x, y]) => new THREE.Vector2(x, y)));
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.012, bevelSegments: 4, curveSegments: 4 });
    geo.translate(0, 0, -0.05);
    const m = glass(); m.fragmentShader = m.fragmentShader.replace('float a = 0.55 + 0.45 * rim;', 'float a = 0.06 + 0.5 * pow(rim, 1.5);');
    g.add(new THREE.Mesh(geo, m));
  }
  return g;
}

let markPoints = null;
const loadMark = () => (markPoints ||= fetch(new URL('assets/studiokhun/khun-mark.json?v=3', base)).then((r) => r.json()));

async function mount(el) {
  const mode = el.dataset.symbol || 'full';
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 1);
  el.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  cam.position.set(0, 0, mode === 'revibe' ? 4.6 : 4.4);

  const root = new THREE.Group(); scene.add(root);
  const P = {};
  if (mode === 'full' || mode === 'core') { P.core = core(1); root.add(P.core); }
  if (mode === 'eyes') { P.eyes = await eyes(); P.eyes.scale.setScalar(0.92); root.add(P.eyes); }
  if (mode === 'core') {
    // 단단한 코어 안에서 쿤의 유리 심볼이 돕니다
    P.inner = await revibe(await loadMark(), 0, true);
    P.inner.scale.setScalar(0.62);
    P.inner.traverse((o) => { if (o.isMesh) o.material = glass(); }); // 더 또렷한 유리
    root.add(P.inner);
  }
  if (mode === 'full' || mode === 'revibe') {
    const mark = await loadMark();
    P.revibe = await revibe(mark, mode === 'full' ? 5 : 7, mode === 'revibe');
    P.revibe.scale.setScalar(mode === 'full' ? 0.62 : 0.82);
    root.add(P.revibe);
  }

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, cam));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.6, 0.5, 0.2);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  let w = 0, h = 0, visible = false;
  const pointer = { x: 0, y: 0 };
  function resize() {
    w = el.clientWidth; h = el.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr); renderer.setSize(w, h, false);
    composer.setPixelRatio(dpr); composer.setSize(w, h);
    cam.aspect = w / h; cam.updateProjectionMatrix();
    render(performance.now());
  }
  function render(now) {
    const t = reduce ? 4.2 : now / 1000;
    const b = beat(t);
    // 0의 상태(평평함)와 살아남을 천천히 오갑니다. 눈동자가 나뉘면 살아납니다.
    let life = 0.5 + 0.5 * Math.sin(t * 0.35);
    if (P.eyes) life = updateEyes(P.eyes, t);
    if (mode === 'revibe') life = 1;
    uniforms.uTime.value = t; uniforms.uBeat.value = b; uniforms.uLife.value = life;
    uniforms.uPx.value = renderer.getPixelRatio() * (h / 500);

    root.position.y = Math.sin(t * 0.8) * 0.04;
    root.rotation.x += (pointer.y * 0.25 - root.rotation.x) * 0.05;
    root.rotation.y += (pointer.x * 0.35 + Math.sin(t * 0.2) * 0.25 - root.rotation.y) * 0.05;
    if (P.core) P.core.rotation.y = t * 0.12;
    if (P.inner) { P.inner.rotation.y = t * 0.6; P.inner.rotation.x = Math.sin(t * 0.5) * 0.25; }
    if (P.revibe) { P.revibe.rotation.y = Math.sin(t * 0.45) * 0.5; P.revibe.rotation.x = Math.sin(t * 0.3) * 0.2; }
    bloom.strength = (mode === 'revibe' ? 0.3 : 0.45) + 0.3 * b;
    composer.render();
  }
  const loop = (now) => { requestAnimationFrame(loop); if (visible && w) render(now); };

  new ResizeObserver(resize).observe(el);
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = ((e.clientY - r.top) / r.height) * 2 - 1;
  });
  el.addEventListener('pointerleave', () => { pointer.x = pointer.y = 0; });
  if (reduce) { visible = true; resize(); return; }
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: '100px' }).observe(el);
  requestAnimationFrame(loop);
}

document.querySelectorAll('[data-symbol]').forEach((el) => {
  mount(el).catch((err) => { console.warn('심볼을 그리지 못했습니다:', err); el.classList.add('is-fallback'); });
});
