// RE:BOOT 브랜드북의 표지 장면: 흩어진 두 큐브 → 평면 → 사선 정렬 → 정면 → 오렌지가 번지며 BOOT
(function () {
  var canvas = document.getElementById('rb-stage');
  if (!canvas) return;
  var g = canvas.getContext('2d');
  var scrub = document.getElementById('rb-scrub');
  var playBtn = document.getElementById('rb-play');
  var phases = Array.prototype.slice.call(document.querySelectorAll('#rb-phases .bk-phase'));
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (v, a, b) { return Math.min(b === undefined ? 1 : b, Math.max(a || 0, v)); };
  var seg = function (p, a, b) { return clamp((p - a) / (b - a)); };
  var ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var out = function (t) { return 1 - Math.pow(1 - t, 3); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var VERTS = [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
  var FACES = [{v:[0,1,2,3],n:[0,0,-1]},{v:[5,4,7,6],n:[0,0,1]},{v:[4,0,3,7],n:[-1,0,0]},{v:[1,5,6,2],n:[1,0,0]},{v:[4,5,1,0],n:[0,-1,0]},{v:[3,2,6,7],n:[0,1,0]}];
  var L = (function () { var l = [-.4,-.6,-.7], m = Math.hypot(l[0], l[1], l[2]); return [l[0]/m, l[1]/m, l[2]/m]; })();
  function rot(p, rx, ry, rz) {
    var x = p[0], y = p[1], z = p[2], c, s, t;
    c = Math.cos(rx); s = Math.sin(rx); t = y * c - z * s; z = y * s + z * c; y = t;
    c = Math.cos(ry); s = Math.sin(ry); t = x * c + z * s; z = -x * s + z * c; x = t;
    c = Math.cos(rz); s = Math.sin(rz); t = x * c - y * s; y = x * s + y * c; x = t;
    return [x, y, z];
  }
  function cube(c) {
    var O = .7071;
    var pts = VERTS.map(function (v) {
      var r = rot(v, c.rx, c.ry, c.rz), sc = lerp(1, 4.2 / (4.2 + r[2]), c.persp);
      return { X: c.x + (r[0] * sc + c.k * r[2] * O) * c.half, Y: c.y + (r[1] * sc - c.k * r[2] * O) * c.half, z: r[2] };
    });
    var faces = FACES.map(function (f) {
      return { f: f, n: rot(f.n, c.rx, c.ry, c.rz), d: (pts[f.v[0]].z + pts[f.v[1]].z + pts[f.v[2]].z + pts[f.v[3]].z) / 4 };
    }).sort(function (a, b) { return b.d - a.d; });
    var paths = [];
    g.save();
    if (c.glow > 0) { g.shadowColor = 'rgba(255,90,31,' + (.55 * c.glow) + ')'; g.shadowBlur = c.half * 1.6 * c.glow; }
    faces.forEach(function (o) {
      var lam = Math.max(0, o.n[0] * L[0] + o.n[1] * L[1] + o.n[2] * L[2]);
      var li = lerp(1, .5 + .55 * lam, c.shade);
      var col = 'rgb(' + c.base.map(function (v) { return Math.min(255, Math.round(v * li)); }).join(',') + ')';
      var p = new Path2D();
      o.f.v.forEach(function (i, j) { if (j) p.lineTo(pts[i].X, pts[i].Y); else p.moveTo(pts[i].X, pts[i].Y); });
      p.closePath(); paths.push(p);
      g.fillStyle = col; g.fill(p); g.strokeStyle = col; g.lineWidth = .75; g.stroke(p);
    });
    g.restore();
    if (c.dye > 0) {
      var top = c.y - c.half * 1.15, R = Math.max(1, c.half * 4.2 * c.dye);
      var grd = g.createRadialGradient(c.x, top, 0, c.x, top, R);
      grd.addColorStop(0, 'rgba(255,90,31,1)'); grd.addColorStop(.72, 'rgba(255,90,31,1)'); grd.addColorStop(1, 'rgba(255,90,31,0)');
      g.fillStyle = grd; paths.forEach(function (p) { g.fill(p); });
    }
  }
  var W = 0, H = 0, dpr = 1;
  function resize() { dpr = Math.min(2, devicePixelRatio || 1); W = canvas.clientWidth; H = canvas.clientHeight; canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); }
  function render(p, ts) {
    var small = W < 600, half0 = Math.min(W, H) * (small ? .1 : .085), fin = Math.min(W, H) * .1, gap = fin * .7;
    var tMove = ease(seg(p, .02, .36)), tFlat = ease(seg(p, .2, .4)), tAlign = ease(seg(p, .1, .4)),
        tStack = ease(seg(p, .42, .58)), tFront = ease(seg(p, .62, .74)), tDye = out(seg(p, .78, .92));
    var half = lerp(lerp(half0, half0 * .85, tMove), fin / 2, tStack), k = tFlat * (1 - tFront);
    var sep = lerp(half * 2 * (1 + k) + gap, fin + gap, tFront), cx = W / 2, cy = H / 2, bob = 1 - tAlign;
    var ax = lerp(lerp(W * (small ? .2 : .24), W / 2 - half * 3.2, tMove) + Math.sin(ts * .9) * 10 * bob, cx, tStack);
    var ay = lerp(lerp(H * .72, H / 2 + half * 2.2, tMove) + Math.cos(ts * .7) * 12 * bob, cy + sep / 2, tStack);
    var bx = lerp(lerp(W * (small ? .8 : .76), W / 2 + half * 3.2, tMove) + Math.sin(ts * .8 + 2) * 10 * bob, cx, tStack);
    var by = lerp(lerp(H * .28, H / 2 - half * 2.2, tMove) + Math.cos(ts * .6 + 1) * 12 * bob, cy - sep / 2, tStack);
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    cube({ x: ax, y: ay, half: half, rx: (.62 + Math.sin(ts * .5) * .35 + p * 2.2) * (1 - tAlign), ry: (-.78 + ts * .45 + p * 3.1) * (1 - tAlign), rz: (.18 + Math.cos(ts * .4) * .2) * (1 - tAlign), k: k, persp: 1 - tFlat, shade: 1 - tFlat, base: [242,242,240], dye: tDye, glow: tDye });
    cube({ x: bx, y: by, half: half, rx: (-.55 + Math.cos(ts * .45) * .35 - p * 2.4) * (1 - tAlign), ry: (.9 - ts * .4 - p * 2.8) * (1 - tAlign), rz: (-.2 + Math.sin(ts * .35) * .2) * (1 - tAlign), k: k, persp: 1 - tFlat, shade: 1 - tFlat, base: [255,90,31], dye: 0, glow: Math.max(tFlat * .6, tDye) });
    var idx = p < .2 ? 0 : p < .42 ? 1 : p < .62 ? 2 : p < .78 ? 3 : 4;
    phases.forEach(function (el, i) { el.classList.toggle('on', i === idx); });
  }
  var playing = !reduced, p = reduced ? 1 : 0, last = performance.now(), t0 = last, LOOP = 9000, vis = true;
  function setPlaying(v) { playing = v; playBtn.textContent = v ? 'PAUSE' : 'PLAY'; playBtn.setAttribute('aria-pressed', String(v)); last = performance.now(); }
  playBtn.addEventListener('click', function () { if (!playing && p >= 1) p = 0; setPlaying(!playing); });
  scrub.addEventListener('input', function () { p = scrub.value / 1000; setPlaying(false); });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { vis = e[0].isIntersecting; }).observe(canvas);
  function frame(now) {
    if (!vis) { last = now; requestAnimationFrame(frame); return; }
    if (playing) { p += (now - last) / LOOP; if (p > 1.12) p = 0; }
    last = now;
    var shown = Math.min(1, p);
    if (playing) scrub.value = Math.round(shown * 1000);
    render(shown, reduced ? 0 : (now - t0) / 1000);
    requestAnimationFrame(frame);
  }
  setPlaying(playing); scrub.value = Math.round(p * 1000);
  resize(); addEventListener('resize', resize);
  requestAnimationFrame(frame);
})();
