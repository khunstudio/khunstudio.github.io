// KHUN 심볼 모션그래픽 (Three.js)
// 로고의 두 고리(두 눈)를 유리 같은 무지개빛 획으로 세우고, 유리 구 안에서 천천히 돌게 합니다.
// 가운데 핵은 72 BPM으로 뜁니다. 화면에 보일 때만 그립니다.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const BPM = 72;
// 배경은 완전한 검정으로 지웁니다. (어두운 초록을 주면 후처리에서 색이 두 번 밝아져 회색으로 뜹니다)
const BG = 0x000000;
const MINT = new THREE.Color(0x3dffa2);
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// 심장 박동 곡선 (0~1): 한 박에 두 번 뛰는 모양
const beat = (t) => {
  const p = ((t * BPM) / 60) % 1;
  return Math.exp(-(((p - 0.06) / 0.035) ** 2)) + 0.55 * Math.exp(-(((p - 0.24) / 0.05) ** 2));
};

// 타원 호를 따라가는 곡선. 살짝 앞뒤로 비틀어서 입체감을 줍니다.
class Arc extends THREE.Curve {
  constructor({ cx, cy, rx, ry, tilt, a0, sweep, twist }) { super(); Object.assign(this, { cx, cy, rx, ry, tilt, a0, sweep, twist }); }
  getPoint(t, out = new THREE.Vector3()) {
    const a = this.a0 + this.sweep * t;
    const x = this.rx * Math.cos(a), y = this.ry * Math.sin(a);
    const c = Math.cos(this.tilt), s = Math.sin(this.tilt);
    return out.set(this.cx + x * c - y * s, this.cy + x * s + y * c, this.twist * Math.sin(a));
  }
}

// 붓으로 그은 것처럼 양끝이 가늘어지는 튜브
function stroke(arc, radius) {
  const seg = 260, rad = 24;
  const g = new THREE.TubeGeometry(arc, seg, radius, rad, false);
  const pos = g.attributes.position, center = new THREE.Vector3(), v = new THREE.Vector3();
  for (let i = 0; i <= seg; i++) {
    const t = i / seg;
    arc.getPoint(t, center);
    const k = 0.12 + 0.88 * Math.sin(Math.PI * t) ** 0.7;
    for (let j = 0; j <= rad; j++) {
      const idx = i * (rad + 1) + j;
      v.fromBufferAttribute(pos, idx).sub(center).multiplyScalar(k).add(center);
      pos.setXYZ(idx, v.x, v.y, v.z);
    }
  }
  g.computeVertexNormals();
  return g;
}

// 공통: 보는 각도(프레넬)와 위치에 따라 민트 → 라벤더 → 연한 하늘로 흐르는 무지개빛
const IRI = /* glsl */`
  uniform float uTime;
  vec3 iri(vec3 p, float f) {
    float k = 0.5 + 0.5 * sin(p.y * 2.6 + p.x * 1.7 + uTime * 0.6 + f * 4.0);
    float m = 0.5 + 0.5 * sin(p.z * 3.1 - uTime * 0.4 + f * 2.0);
    vec3 mint = vec3(0.24, 1.0, 0.64), lav = vec3(0.64, 0.56, 1.0), sky = vec3(0.80, 0.94, 1.0);
    return mix(mix(mint, lav, k), sky, m * 0.55);
  }`;
const VERT = /* glsl */`
  varying vec3 vN; varying vec3 vV; varying vec3 vP;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); vP = position;
    gl_Position = projectionMatrix * mv;
  }`;
const uniforms = { uTime: { value: 0 }, uBeat: { value: 0 } };

// 획(고리, 막대): 속이 찬 유리관처럼 가장자리가 밝고, 가운데에 하이라이트
const glass = (o = {}) => new THREE.ShaderMaterial({
  uniforms, vertexShader: VERT,
  fragmentShader: IRI + /* glsl */`
    uniform float uBeat;
    varying vec3 vN; varying vec3 vV; varying vec3 vP;
    void main() {
      float ndv = abs(dot(normalize(vN), normalize(vV)));
      float rim = 1.0 - ndv;
      vec3 c = iri(vP, rim) * (0.28 + 0.9 * pow(rim, 1.2));
      c += vec3(1.0) * pow(rim, 4.0) * 0.55;
      c += vec3(1.0) * pow(ndv, 30.0) * 0.45;
      c *= 1.0 + 0.35 * uBeat;
      gl_FragColor = vec4(c, 1.0);
    }`,
  ...o,
});

// 비눗방울 같은 구: 가운데는 비고 가장자리만 빛납니다
const bubble = (strength = 1) => new THREE.ShaderMaterial({
  uniforms, vertexShader: VERT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  fragmentShader: IRI + /* glsl */`
    varying vec3 vN; varying vec3 vV; varying vec3 vP;
    void main() {
      float rim = 1.0 - abs(dot(normalize(vN), normalize(vV)));
      vec3 c = iri(vP * 1.3, rim) * pow(rim, 2.2) + vec3(1.0) * pow(rim, 7.0) * 0.5;
      float a = (0.03 + 0.9 * pow(rim, 2.4)) * ${strength.toFixed(2)};
      gl_FragColor = vec4(c * a, a);
    }`,
});

// 안개 같은 속: 천천히 일렁이는 색
const haze = () => new THREE.ShaderMaterial({
  uniforms, vertexShader: VERT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  fragmentShader: IRI + /* glsl */`
    uniform float uBeat;
    varying vec3 vN; varying vec3 vV; varying vec3 vP;
    void main() {
      float ndv = abs(dot(normalize(vN), normalize(vV)));
      float swirl = 0.5 + 0.5 * sin(vP.x * 4.0 + sin(vP.y * 3.0 + uTime) * 2.0 + uTime * 0.7);
      vec3 c = iri(vP * 2.0, swirl) * (0.25 + 0.35 * swirl);
      float a = pow(ndv, 1.5) * (0.35 + 0.25 * uBeat);
      gl_FragColor = vec4(c * a, a);
    }`,
});

function twoEyes() {
  const g = new THREE.Group();
  const common = { rx: 0.66, ry: 0.36, tilt: (40 * Math.PI) / 180, sweep: (305 * Math.PI) / 180 };
  const a = new THREE.Mesh(stroke(new Arc({ ...common, cx: -0.3, cy: 0.03, a0: (205 * Math.PI) / 180, twist: 0.2 }), 0.075), glass());
  const b = new THREE.Mesh(stroke(new Arc({ ...common, cx: 0.3, cy: -0.03, a0: (25 * Math.PI) / 180, twist: -0.2 }), 0.075), glass());
  g.add(a, b);
  return g;
}

function core() {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.055, 32, 32), new THREE.MeshBasicMaterial({ color: 0xeafff4 }));
  const halo = new THREE.Mesh(new THREE.SphereGeometry(0.18, 32, 32), new THREE.MeshBasicMaterial({ color: MINT, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, depthWrite: false }));
  const g = new THREE.Group(); g.add(m, halo);
  g.userData = { m, halo };
  return g;
}

function sphereShell(r = 1.05) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.SphereGeometry(r, 96, 96), bubble(1)));
  const fog = new THREE.Mesh(new THREE.SphereGeometry(r * 0.9, 64, 64), haze());
  g.add(fog);
  g.userData.fog = fog;
  return g;
}

function pulse() {
  const g = new THREE.Group();
  const rod = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 1.5, 16, 32), glass());
  g.add(rod);
  const rings = [];
  for (let i = 0; i < 3; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.012, 16, 160), new THREE.MeshBasicMaterial({ color: MINT, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    r.rotation.x = Math.PI / 2.2;
    g.add(r); rings.push(r);
  }
  g.userData.rings = rings;
  return g;
}

function mount(el) {
  const mode = el.dataset.symbol || 'full';
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setClearColor(BG, 1);
  el.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  cam.position.set(0, 0, mode === 'full' ? 4.6 : 4.2);

  const root = new THREE.Group(); scene.add(root);
  const parts = {};
  if (mode === 'full') {
    parts.shell = sphereShell(); root.add(parts.shell);
    parts.eyes = twoEyes(); parts.eyes.scale.setScalar(0.92); root.add(parts.eyes);
    parts.core = core(); root.add(parts.core);
  } else if (mode === 'eyes') {
    parts.eyes = twoEyes(); parts.eyes.scale.setScalar(1.15); root.add(parts.eyes);
  } else if (mode === 'pulse') {
    parts.pulse = pulse(); root.add(parts.pulse);
  } else if (mode === 'sphere') {
    parts.shell = sphereShell(0.95); root.add(parts.shell);
    parts.inner = new THREE.Mesh(new THREE.SphereGeometry(0.7, 64, 64), haze());
    parts.inner.position.set(0.04, -0.04, -0.05);
    root.add(parts.inner);
  }

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, cam));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.6, 0.5, 0.28);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  let w = 0, h = 0, visible = false, raf = 0;
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
    const t = reduce ? 1.3 : now / 1000;
    const b = beat(t);
    // 몽롱하게 둥실 떠 있는 움직임 + 마우스 쪽으로 살짝 기울기
    root.position.y = Math.sin(t * 0.8) * 0.05;
    root.rotation.x += ((pointer.y * 0.25) - root.rotation.x) * 0.05;
    root.rotation.z = Math.sin(t * 0.3) * 0.06;
    if (parts.eyes) {
      parts.eyes.rotation.y = t * 0.45;
      parts.eyes.rotation.x = Math.sin(t * 0.37) * 0.35;
      parts.eyes.children[1].rotation.y = Math.sin(t * 0.6) * 0.5;
    }
    if (parts.shell) parts.shell.rotation.y = -t * 0.12;
    if (parts.core) {
      const { m, halo } = parts.core.userData;
      const s = 1 + 0.6 * b; m.scale.setScalar(s); halo.scale.setScalar(1 + 1.4 * b);
      halo.material.opacity = 0.1 + 0.25 * b;
    }
    if (parts.pulse) {
      parts.pulse.rotation.y = t * 0.6;
      const p = ((t * BPM) / 60) % 1;
      parts.pulse.userData.rings.forEach((r, i) => {
        const q = (p + i / 3) % 1;
        r.scale.setScalar(0.2 + q * 1.6);
        r.material.opacity = (1 - q) ** 2 * 0.8;
      });
    }
    if (parts.inner) {
      parts.inner.rotation.y = t * 0.3;
      parts.inner.position.x = 0.08 * Math.sin(t * 0.6);
      parts.shell.rotation.y = t * 0.2;
    }
    uniforms.uTime.value = t; uniforms.uBeat.value = b;
    bloom.strength = 0.5 + 0.3 * b;
    composer.render();
  }
  function loop(now) { raf = requestAnimationFrame(loop); if (visible && w) render(now); }

  new ResizeObserver(resize).observe(el);
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = ((e.clientY - r.top) / r.height) * 2 - 1;
  });
  el.addEventListener('pointerleave', () => { pointer.x = pointer.y = 0; });
  if (reduce) { visible = true; resize(); return; }
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: '100px' }).observe(el);
  raf = requestAnimationFrame(loop);
}

document.querySelectorAll('[data-symbol]').forEach((el) => {
  try { mount(el); } catch (err) { console.warn('심볼을 그리지 못했습니다:', err); el.classList.add('is-fallback'); }
});
