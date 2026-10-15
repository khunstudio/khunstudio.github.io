// 바이탈 모니터: 모든 페이지 아래에 붙는 띠.
// 지금 보고 있는 구간과 "살아났는지"를 심전도로 보여 줍니다.
// - 홈: 인트로에서 로고가 완성되면 뛰기 시작
// - 케이스 페이지: BEFORE 구간에서는 평평하다가 RE:VIBE부터 뜁니다
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const bar = document.createElement('div');
  bar.className = 'vitalbar';
  bar.setAttribute('aria-hidden', 'true');
  bar.innerHTML = '<span class="vitalbar__status"></span><canvas></canvas><span class="vitalbar__where"></span>';
  document.body.appendChild(bar);

  // 밝은/어두운 화면 전환 버튼 (상단 바)
  // shortcut: 바꾸면 새로고침해서 캔버스·셰이더 색을 다시 잡습니다. 깜빡임이 거슬리면 각 캔버스가 색을 다시 읽게 바꿉니다.
  const hud = document.querySelector('.hud');
  if (hud) {
    const dark = document.documentElement.dataset.theme === 'dark';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-btn';
    btn.textContent = dark ? '○ LIGHT' : '● DARK';
    btn.setAttribute('aria-label', dark ? '밝은 화면으로 보기' : '어두운 화면으로 보기');
    btn.addEventListener('click', () => {
      try { localStorage.setItem('theme', dark ? 'light' : 'dark'); } catch (e) {}
      location.reload();
    });
    hud.appendChild(btn);
  }
  const statusEl = bar.children[0], canvas = bar.children[1], whereEl = bar.children[2];
  const ctx = canvas.getContext('2d');
  const zones = [...document.querySelectorAll('[data-vital]')];
  const intro = document.getElementById('intro');
  const revibe = document.getElementById('revibe');
  const hasBefore = !!document.getElementById('before');

  const WAVES = [[0.2, 0.035, 0.12], [0.37, 0.012, -0.16], [0.4, 0.012, 1], [0.435, 0.014, -0.3], [0.64, 0.06, 0.26]];
  const wave = (p) => WAVES.reduce((y, [c, w, a]) => y + a * Math.exp(-(((p - c) / w) ** 2)), 0);
  const D = 2, BEAT = 150, SPEED = 110;
  let w = 0, h = 0, x = 0, dist = 0, amp = 0, prevY = 0, last = 0, alive = false, label = '';

  const isAlive = () => {
    if (intro) return document.documentElement.dataset.alive === '1';
    if (hasBefore && revibe) return revibe.getBoundingClientRect().top < window.innerHeight * 0.6;
    return true;
  };
  const yAt = (d, a) => Math.round((h * 0.62 - wave((d / BEAT) % 1) * h * 0.5 * a) / D) * D;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    x = 0; prevY = yAt(dist, amp);
    if (reduce) { ctx.clearRect(0, 0, w, h); prevY = yAt(0, 1); paint(1); for (let px = 0; px < w; px += D) plot(px, yAt(px, 1)); }
  }
  const css = getComputedStyle(document.documentElement);
  const ACC = css.getPropertyValue('--acc').trim(), MUTED = css.getPropertyValue('--muted').trim();
  function paint(a) { ctx.fillStyle = a > 0.5 ? ACC : MUTED; }
  function plot(px, y) { ctx.fillRect(px, Math.min(y, prevY), D, Math.abs(y - prevY) + D); prevY = y; }

  function readout() {
    alive = reduce || isAlive();
    const mid = window.innerHeight / 2;
    let name = '';
    for (const z of zones) { const r = z.getBoundingClientRect(); if (r.top <= mid && r.bottom > mid) name = z.dataset.vital; }
    const text = alive ? 'REVIVED' : 'NO SIGNAL';
    if (statusEl.textContent !== text) { statusEl.textContent = text; bar.classList.toggle('is-alive', alive); }
    if (name !== label) { label = name; whereEl.textContent = name; }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    if (!last) last = now;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    readout();
    amp += ((alive ? 1 : 0) - amp) * Math.min(1, dt * 3);
    const target = x + SPEED * dt;
    ctx.clearRect(x, 0, target - x + 24, h);
    paint(amp);
    for (let px = Math.ceil(x / D) * D; px < target; px += D) plot(px, yAt(dist + (px - x), amp));
    dist += target - x; x = target;
    if (x > w) { x = 0; prevY = yAt(dist, amp); }
  }

  new ResizeObserver(resize).observe(canvas);
  readout();
  if (!reduce) requestAnimationFrame(frame);
  else window.addEventListener('scroll', readout, { passive: true });

  // 차트 카드: 화면에 들어오면 FLATLINE → REVIVED
  const cards = document.querySelectorAll('.case, .tile');
  if (reduce || !('IntersectionObserver' in window)) cards.forEach((c) => c.classList.add('is-alive'));
  else {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-alive'); io.unobserve(e.target); }
    }, { threshold: 0.45 });
    cards.forEach((c) => io.observe(c));
  }
})();
