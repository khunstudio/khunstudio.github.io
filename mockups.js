// 공군 페이지 목업: 종합책자 넘김, 책갈피, 3D 머그컵
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const onView = (el, fn, opt = { threshold: 0.35 }) => new IntersectionObserver(([e]) => fn(e.isIntersecting), opt).observe(el);

// ─────────────────────────────────────────────
// 1) 종합책자: 표지부터 한 장씩 넘어갑니다. 화면에 들어오면 저절로 넘기고, 누르거나 버튼으로도 넘길 수 있습니다.
//    장(leaf) 하나 = 앞면(오른쪽 페이지) + 뒷면(다음 펼침면의 왼쪽 페이지)
// ─────────────────────────────────────────────
(() => {
  const book = document.getElementById('book');
  if (!book) return;
  const base = book.dataset.base;
  const spreads = +book.dataset.spreads; // 표지(1) 다음 안쪽 펼침면 수
  const pg = (n, side) => `${base}p${String(n).padStart(2, '0')}${side}.jpg`;
  // 앞표지 = 1번 펼침면 오른쪽, 뒤표지 = 1번 펼침면 왼쪽
  const fronts = [pg(1, 'R')], backs = [];
  for (let s = 2; s <= spreads + 1; s++) { backs.push(pg(s, 'L')); fronts.push(pg(s, 'R')); }
  backs.push(pg(1, 'L'));
  const N = fronts.length;
  const stack = book.querySelector('.book__leaves');
  const leaves = fronts.map((f, i) => {
    const el = document.createElement('div');
    el.className = 'book__leaf';
    el.style.zIndex = N - i;
    el.innerHTML = `<div class="book__face" style="background-image:url(${f})"></div><div class="book__face book__face--back" style="background-image:url(${backs[i]})"></div>`;
    stack.appendChild(el);
    return el;
  });
  const count = book.parentElement.querySelector('.book__count');
  let at = 0, timer = 0, auto = !reduce;
  function show(n) {
    at = Math.max(0, Math.min(N, n));
    leaves.forEach((l, i) => {
      const turned = i < at;
      l.classList.toggle('is-turned', turned);
      l.style.zIndex = turned ? i + 1 : N - i;
    });
    book.classList.toggle('is-open', at > 0 && at < N);
    book.classList.toggle('is-back', at === N);
    if (count) count.textContent = at === 0 ? 'COVER' : at === N ? 'BACK' : `${String(at * 2 - 1).padStart(2, '0')}–${String(at * 2).padStart(2, '0')} / ${String((N - 1) * 2).padStart(2, '0')}`;
  }
  const stop = () => { auto = false; clearInterval(timer); };
  const play = () => { clearInterval(timer); if (!auto) return; timer = setInterval(() => show(at >= N ? 0 : at + 1), 2400); };
  book.addEventListener('click', (e) => {
    stop();
    const r = book.getBoundingClientRect();
    show(e.clientX < r.left + r.width / 2 ? at - 1 : at + 1);
  });
  book.parentElement.addEventListener('click', (e) => {
    const act = e.target.closest('button')?.dataset.act;
    if (!act) return;
    stop();
    if (act === 'prev') show(at - 1);
    if (act === 'next') show(at + 1);
    if (act === 'play') { auto = true; play(); }
  });
  show(0);
  onView(book, (v) => (v ? play() : clearInterval(timer)));
})();

// ─────────────────────────────────────────────
// 2) 책갈피: 둥실 떠서 천천히 돌며 앞뒤를 보여 줍니다. 누르면 그 자리에서 뒤집힙니다.
// ─────────────────────────────────────────────
document.querySelectorAll('.bm').forEach((el) => el.addEventListener('click', () => el.classList.toggle('is-flipped')));

// ─────────────────────────────────────────────
// 3) 머그컵 (Three.js): 크림색 몸통 + 스테인리스 테두리 + 철사 손잡이. 앞면에는 전투기 각인, 뒷면에는 공군 엠블럼.
//    천천히 돌고, 끌어서 돌려 볼 수 있습니다.
// ─────────────────────────────────────────────
(async () => {
  const el = document.getElementById('mug');
  if (!el) return;
  const load = (src) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
  const [logo, emblem] = await Promise.all([load(el.dataset.logo), load(el.dataset.emblem)]);

  // 몸통 둘레에 감을 그림 (가로 = 한 바퀴)
  const cv = document.createElement('canvas');
  cv.width = 2048; cv.height = 1024;
  const g = cv.getContext('2d');
  g.fillStyle = '#ece6d6'; g.fillRect(0, 0, cv.width, cv.height);
  // 각인 이미지의 크림색 바탕을 빼고 선만 남겨서 올립니다
  const ink = (img, w, tone = 0) => {
    const h = Math.round(w * img.height / img.width), c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0, w, h);
    const d = x.getImageData(0, 0, w, h), p = d.data;
    for (let i = 0; i < p.length; i += 4) {
      const lum = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2];
      const a = Math.max(0, Math.min(1, (200 - lum) / 50)); // 바탕(밝기 약 215)은 완전히 투명하게
      p[i + 3] = a * 255;
      p[i] = p[i + 1] = p[i + 2] = lum * 0.5 + tone; // 스테인리스 각인처럼 어두운 은회색
    }
    x.putImageData(d, 0, 0);
    return c;
  };
  const L = ink(logo, 760, 20);
  g.drawImage(L, 512 - L.width / 2, 512 - L.height / 2 - 10);       // 앞면
  const E = ink(emblem, 420, 0);
  g.drawImage(E, 1536 - E.width / 2, 1024 - 230 - E.height);         // 반대편 아래
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  el.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.02).texture;
  const cam = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
  cam.position.set(0, 0.55, 5.6);
  cam.lookAt(0, 0.05, 0);
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(3, 4, 5); scene.add(key);
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));

  const mug = new THREE.Group(); scene.add(mug);
  const R = 0.78, H = 1.5, RIM = 0.26;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(R, R * 0.97, H - RIM, 128, 1, true),
    new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.55, clearcoat: 0.3, clearcoatRoughness: 0.6, side: THREE.DoubleSide }));
  body.position.y = -RIM / 2;
  body.rotation.y = -Math.PI / 2;
  const steel = new THREE.MeshStandardMaterial({ color: 0xeef1f4, metalness: 1, roughness: 0.18, envMapIntensity: 1.6 });
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.005, R * 1.005, RIM, 128, 1, true), steel);
  rim.position.y = (H - RIM) / 2;
  const lip = new THREE.Mesh(new THREE.TorusGeometry(R * 0.985, 0.022, 16, 128), steel);
  lip.rotation.x = Math.PI / 2; lip.position.y = H / 2;
  const inside = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.965, R * 0.94, H - 0.05, 96, 1, true), new THREE.MeshStandardMaterial({ color: 0xaab1b8, metalness: 0.9, roughness: 0.35, side: THREE.BackSide }));
  inside.position.y = 0.02;
  const bottom = new THREE.Mesh(new THREE.CircleGeometry(R * 0.97, 96), new THREE.MeshStandardMaterial({ color: 0xd9d2c2, roughness: 0.7 }));
  bottom.rotation.x = Math.PI / 2; bottom.position.y = -H / 2;
  const floor = new THREE.Mesh(new THREE.CircleGeometry(R * 0.94, 96), new THREE.MeshStandardMaterial({ color: 0x8e959c, metalness: 0.8, roughness: 0.4 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -H / 2 + 0.06;
  // 철사 손잡이: 모서리가 둥근 사각 고리
  const pts = [[0, 0.42], [0.5, 0.42], [0.58, 0.34], [0.58, -0.3], [0.5, -0.38], [0, -0.38]].map(([x, y]) => new THREE.Vector3(R - 0.02 + x, y, 0));
  const handle = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.2), 120, 0.03, 16, false),
    new THREE.MeshStandardMaterial({ color: 0xece6d6, roughness: 0.5 }));
  mug.add(body, rim, lip, inside, bottom, floor, handle);

  // 바닥 그림자
  const sh = document.createElement('canvas'); sh.width = sh.height = 256;
  const sg = sh.getContext('2d'); const grd = sg.createRadialGradient(128, 128, 10, 128, 128, 128);
  grd.addColorStop(0, 'rgba(0,0,0,.55)'); grd.addColorStop(1, 'rgba(0,0,0,0)'); sg.fillStyle = grd; sg.fillRect(0, 0, 256, 256);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sh), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -H / 2 - 0.01;
  scene.add(shadow);

  let w = 0, h = 0, visible = false, rotY = 0.2, vel = 0, drag = null, last = 0;
  function resize() {
    w = el.clientWidth; h = el.clientHeight; if (!w || !h) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.setSize(w, h, false);
    cam.aspect = w / h; cam.updateProjectionMatrix(); render(performance.now());
  }
  function render(now) {
    const dt = Math.min((now - last) / 1000, 0.05) || 0; last = now;
    if (!drag && !reduce) { rotY += (0.35 + vel) * dt; vel *= 0.95; }
    mug.rotation.y = rotY;
    mug.position.y = reduce ? 0 : Math.sin(now / 1400) * 0.04;
    renderer.render(scene, cam);
  }
  const loop = (now) => { requestAnimationFrame(loop); if (visible && w) render(now); };
  el.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, r: rotY }; el.setPointerCapture(e.pointerId); });
  el.addEventListener('pointermove', (e) => { if (drag) { const d = (e.clientX - drag.x) / el.clientWidth * 5; vel = d - (rotY - drag.r); rotY = drag.r + d; } });
  el.addEventListener('pointerup', () => { drag = null; vel = Math.max(-3, Math.min(3, vel * 20)); });
  new ResizeObserver(resize).observe(el);
  onView(el, (v) => { visible = v; }, { rootMargin: '100px' });
  requestAnimationFrame(loop);
})().catch((err) => console.warn('머그컵을 그리지 못했습니다:', err));
