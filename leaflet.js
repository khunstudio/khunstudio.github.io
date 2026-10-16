// 3단 리플렛
//  1) 펼쳐 보는 리플렛(.lf-feature 안의 .lf — 조종분야, 음악회): 페이지 안에서 바로 접고 펼칩니다.
//     종이 구조 — 가운데 면을 기준으로 양 날개가 접힙니다.
//       왼쪽 날개: 앞 = 안쪽 왼쪽, 뒤 = 앞표지 → 맨 위에 덮여 표지가 보입니다
//       오른쪽 날개: 앞 = 안쪽 오른쪽, 뒤 = 바깥 왼쪽 → 안쪽으로 먼저 접혀 들어갑니다
//  2) 나머지 리플렛: 누르면 바깥면과 안쪽면을 크게 보여 줍니다.
(() => {
  // ── 1) 펼쳐 보는 리플렛
  document.querySelectorAll('.lf-feature .lf').forEach((lf) => {
    let timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    const clear = () => { timers.forEach(clearTimeout); timers = []; };
    const isOpen = () => lf.classList.contains('is-open-left');
    const label = lf.closest('.lf-feature').querySelector('[data-act="fold"]');
    const sync = (open) => { if (label) label.textContent = open ? 'FOLD' : 'UNFOLD'; };
    const unfold = () => { clear(); sync(true); lf.classList.add('is-open-left'); later(() => lf.classList.add('is-open-right'), 600); };
    const fold = () => { clear(); sync(false); lf.classList.remove('is-flipped', 'is-open-right'); later(() => lf.classList.remove('is-open-left'), 550); };
    // 화면에 도착하면 한 번: 접힌 표지 → 펼쳐 안쪽 → 뒤집어 바깥면
    let shown = false;
    const reveal = () => { unfold(); later(() => lf.classList.add('is-flipped'), 2200); };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { sync(true); lf.classList.add('is-open-left', 'is-open-right', 'is-flipped'); shown = true; }
    new IntersectionObserver(([e], io) => { if (e.isIntersecting && !shown) { shown = true; io.disconnect(); later(reveal, 300); } }, { threshold: 0.55 }).observe(lf);
    lf.addEventListener('click', () => { shown = true; isOpen() ? fold() : unfold(); });
    lf.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); lf.click(); } });
    // 세트 고르기(윙스피킹): 버튼을 누르면 접었다가 다른 색의 리플렛으로 바꿔 다시 펼칩니다
    const sets = lf.closest('.lf-feature').querySelector('.lf-sets');
    if (sets) sets.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-set]');
      if (!b || b.classList.contains('is-on')) return;
      sets.querySelectorAll('button').forEach((x) => x.classList.toggle('is-on', x === b));
      shown = true;
      fold();
      later(() => {
        const faces = lf.querySelectorAll('.lf__face');
        ['mi', 'mo', 'ri', 'lo', 'li', 'ro'].forEach((k, i) => { faces[i].style.backgroundImage = `url(${b.dataset.set}${k}.jpg)`; });
        lf.closest('.lf-feature').style.setProperty('--tone', b.dataset.tone);
        reveal();
      }, 1200);
    });
    lf.closest('.lf-feature').querySelector('.lf-feature__bar').addEventListener('click', (e) => {
      const act = e.target.closest('button')?.dataset.act;
      shown = true;
      if (act === 'fold') isOpen() ? fold() : unfold();
      if (act === 'flip') {
        if (!lf.classList.contains('is-open-right')) { unfold(); later(() => lf.classList.add('is-flipped'), 1200); }
        else lf.classList.toggle('is-flipped');
      }
    });
  });

  // ── 2) 나머지 리플렛: 앞뒤 보기
  const list = document.getElementById('leaflets');
  if (!list) return;
  const base = list.dataset.base;
  const box = document.createElement('div');
  box.className = 'lf-box';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.hidden = true;
  box.innerHTML = `
    <div class="lf-box__bar">
      <span class="lf-box__title"></span>
      <button type="button" class="lf-box__close" aria-label="닫기">CLOSE ✕</button>
    </div>
    <div class="lf-box__body">
      <figure><figcaption>OUTSIDE — 바깥면</figcaption><img class="lf-box__out" alt=""></figure>
      <figure><figcaption>INSIDE — 안쪽면</figcaption><img class="lf-box__in" alt=""></figure>
    </div>`;
  document.body.appendChild(box);
  let lastFocus = null;
  function open(item) {
    const id = item.dataset.id, name = item.querySelector('h4').textContent;
    box.querySelector('.lf-box__title').textContent = name;
    Object.assign(box.querySelector('.lf-box__out'), { src: `${base}${id}-out.jpg`, alt: `${name} 리플렛 바깥면` });
    Object.assign(box.querySelector('.lf-box__in'), { src: `${base}${id}-in.jpg`, alt: `${name} 리플렛 안쪽면` });
    lastFocus = document.activeElement;
    box.hidden = false;
    box.scrollTop = 0;
    document.documentElement.classList.add('lf-lock');
    requestAnimationFrame(() => box.classList.add('is-on'));
    box.querySelector('.lf-box__close').focus({ preventScroll: true });
  }
  function close() {
    box.classList.remove('is-on');
    setTimeout(() => { box.hidden = true; document.documentElement.classList.remove('lf-lock'); lastFocus?.focus({ preventScroll: true }); }, 300);
  }
  list.addEventListener('click', (e) => { const item = e.target.closest('.lf-item'); if (item) open(item); });
  box.addEventListener('click', (e) => { if (e.target.closest('.lf-box__close') || e.target === box || e.target.classList.contains('lf-box__body')) close(); });
  document.addEventListener('keydown', (e) => { if (!box.hidden && e.key === 'Escape') close(); });
})();
