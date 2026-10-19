// 공군 페이지 목업: 종합책자 넘김

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
  const pg = (n, side) => `${base}p${String(n).padStart(2, '0')}${side}.webp?v=3`; // v: 쪽 이미지를 바꾸면 올립니다
  // 앞표지 = 1번 펼침면 오른쪽, 뒤표지 = 1번 펼침면 왼쪽
  const fronts = [pg(1, 'R')], backs = [];
  for (let s = 2; s <= spreads + 1; s++) { backs.push(pg(s, 'L')); fronts.push(pg(s, 'R')); }
  backs.push(pg(1, 'L'));
  const N = fronts.length;
  [...fronts, ...backs].forEach((src) => { new Image().src = src; }); // 넘길 때 빈 쪽이 보이지 않게 미리 받아 둡니다
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
  const stop = () => { auto = false; riffled = true; clearInterval(timer); };
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
  // 화면에 도착하면 한 번 차라락 넘겨 펼친 뒤(앞으로 6장 → 다시 첫 펼침면), 천천히 자동 넘김
  let riffled = reduce;
  function riffle() {
    riffled = true;
    book.classList.add('is-riffle');
    const seq = [1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];
    seq.forEach((n, i) => setTimeout(() => show(n), 140 + i * 110));
    setTimeout(() => { book.classList.remove('is-riffle'); play(); }, 140 + seq.length * 110 + 600);
  }
  onView(book, (v) => { if (!v) return clearInterval(timer); riffled ? play() : riffle(); });
})();
