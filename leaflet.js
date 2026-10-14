// 3단 리플렛 목업: 접힌 표지 목록 → 누르면 크게 열리며 펼쳐집니다.
// 종이 구조(가운데 면을 기준으로 양 날개가 접힘)
//   바깥면: [왼쪽 날개 겉 | 뒷표지 | 앞표지]   안쪽면: [왼쪽 | 가운데 | 오른쪽]
//   - 왼쪽 날개: 앞 = 안쪽 왼쪽, 뒤 = 앞표지   → 맨 위에 덮여 표지가 보입니다
//   - 오른쪽 날개: 앞 = 안쪽 오른쪽, 뒤 = 바깥 왼쪽 → 안쪽으로 먼저 접혀 들어갑니다
(() => {
  const list = document.getElementById('leaflets');
  if (!list) return;
  const path = (id, k) => `${list.dataset.base}${id}-${k}.jpg`;

  const box = document.createElement('div');
  box.className = 'lf-box';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.hidden = true;
  box.innerHTML = `
    <div class="lf-box__bar">
      <span class="lf-box__title"></span>
      <div class="lf-box__ctrl">
        <button type="button" data-act="fold">FOLD / UNFOLD</button>
        <button type="button" data-act="flip">FLIP — 바깥면</button>
        <button type="button" data-act="close" aria-label="닫기">CLOSE ✕</button>
      </div>
    </div>
    <div class="lf-stage">
      <div class="lf">
        <div class="lf__turn">
          <div class="lf__panel lf__mid"><img class="lf__face" alt=""><img class="lf__face lf__face--back" alt=""></div>
          <div class="lf__panel lf__right"><img class="lf__face" alt=""><img class="lf__face lf__face--back" alt=""></div>
          <div class="lf__panel lf__left"><img class="lf__face" alt=""><img class="lf__face lf__face--back" alt=""></div>
        </div>
      </div>
    </div>
    <p class="lf-box__hint">리플렛을 누르면 접고 펼칠 수 있습니다</p>`;
  document.body.appendChild(box);

  const lf = box.querySelector('.lf');
  const set = (sel, front, back) => {
    const [f, b] = box.querySelectorAll(`${sel} .lf__face`);
    f.src = front; b.src = back;
  };
  let timers = [], lastFocus = null;
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const clear = () => { timers.forEach(clearTimeout); timers = []; };

  function unfold() { clear(); lf.classList.add('is-open-left'); later(() => lf.classList.add('is-open-right'), 650); }
  function fold(done) {
    clear();
    lf.classList.remove('is-flipped');
    lf.classList.remove('is-open-right');
    later(() => lf.classList.remove('is-open-left'), 550);
    if (done) later(done, 1150);
  }
  const isOpen = () => lf.classList.contains('is-open-left');

  function open(item) {
    const id = item.dataset.id;
    set('.lf__mid', path(id, 'mi'), path(id, 'mo'));
    set('.lf__right', path(id, 'ri'), path(id, 'lo'));
    set('.lf__left', path(id, 'li'), path(id, 'ro'));
    box.querySelector('.lf-box__title').textContent = item.querySelector('h4').textContent;
    lf.className = 'lf';
    lastFocus = document.activeElement;
    box.hidden = false;
    document.documentElement.classList.add('lf-lock');
    requestAnimationFrame(() => { box.classList.add('is-on'); later(unfold, 450); });
    box.querySelector('[data-act="close"]').focus({ preventScroll: true });
  }
  function close() {
    const end = () => {
      box.classList.remove('is-on');
      later(() => { box.hidden = true; document.documentElement.classList.remove('lf-lock'); lastFocus?.focus({ preventScroll: true }); }, 350);
    };
    if (isOpen()) fold(end); else end();
  }

  list.addEventListener('click', (e) => {
    const item = e.target.closest('.lf-item');
    if (item) open(item);
  });
  lf.addEventListener('click', () => (isOpen() ? fold() : unfold()));
  box.addEventListener('click', (e) => {
    const act = e.target.closest('button')?.dataset.act;
    if (act === 'close') close();
    else if (act === 'fold') isOpen() ? fold() : unfold();
    else if (act === 'flip') {
      if (!lf.classList.contains('is-open-right')) { unfold(); later(() => lf.classList.add('is-flipped'), 1300); }
      else lf.classList.toggle('is-flipped');
    } else if (e.target === box || e.target.classList.contains('lf-stage')) close();
  });
  document.addEventListener('keydown', (e) => { if (!box.hidden && e.key === 'Escape') close(); });
})();
