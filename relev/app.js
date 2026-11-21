/* RE:LEV prototype — 빌드 없는 정적 SPA. 데이터는 data/*.json, 라우팅은 location.hash */
(function () {
  "use strict";

  var D = {};            // taxonomy, techs, treatments, devices
  var view = document.getElementById("view");
  var trayEl = document.getElementById("tray");
  var searchQ = "";
  var calcState = { price: "", consumable: "", years: "", session: "" };

  // ── 유틸 ──────────────────────────────────────────
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function byId(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
  function uniq(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }
  function store(key, val) {
    try {
      if (val === undefined) return JSON.parse(localStorage.getItem(key) || "null");
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) { return null; }
  }

  var EXTRA_TAG_LABEL = { microneedle: "미세침", "chemical-peel": "화학적 필링", plasma: "플라즈마", cooling: "쿨링", heating: "온열", vibration: "진동", suction: "석션" };
  var KIND_LABEL = { energy: "ENERGY-BASED", injectable: "INJECTABLE", surface: "SURFACE & RESURFACING", aesthetic: "AESTHETIC" };
  var KIND_KO = { energy: "에너지 기반 시술", injectable: "주입형 시술", surface: "표면 관리 시술", aesthetic: "피부관리실 · 에스테틱 관리" };
  var HOME_FAMILIES = [];

  function familyOf(tag) {
    var t = byId(D.techs, tag);
    if (t) return t.family;
    var f = D.taxonomy.families.filter(function (f) { return f.tags.indexOf(tag) > -1; })[0];
    return f ? f.id : "other";
  }
  function familyMeta(id) { return byId(D.taxonomy.families, id); }
  function tagLabel(tag) { var t = byId(D.techs, tag); return t ? t.name : (EXTRA_TAG_LABEL[tag] || tag); }
  function chip(tag, linked) {
    var cls = "chip f-" + familyOf(tag);
    var label = esc(tagLabel(tag));
    return linked !== false && byId(D.techs, tag)
      ? '<a class="' + cls + '" href="#science--' + tag + '">' + label + "</a>"
      : '<span class="' + cls + '">' + label + "</span>";
  }
  function chips(tags, linked) { return '<span class="chips">' + tags.map(function (t) { return chip(t, linked); }).join("") + "</span>"; }
  function statusBadge(s) {
    var cls = s === "draft" ? "badge badge--draft" : s === "sample" ? "badge badge--sample" : "badge";
    return '<span class="' + cls + '">' + esc(D.taxonomy.status[s] || s) + "</span>";
  }
  function na(text) { return '<span class="na">' + esc(text || "미입력") + "</span>"; }
  function list(items) { return items && items.length ? "<ul>" + items.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : na("미입력"); }
  function block(title, html) { return '<section class="block"><h2>' + esc(title) + "</h2>" + html + "</section>"; }
  function treatmentLayerTechs(t) { return t.techIds.filter(function (id) { return byId(D.techs, id); }); }

  // ── 피부 단면 도식: 기술별 "일반적으로 설명되는" 표적 층 ──
  var LAYERS = [
    { name: "표피", h: 26, fill: "#efe3d8" },
    { name: "진피", h: 54, fill: "#e8cfc3" },
    { name: "피하지방", h: 50, fill: "#f3e6bf" },
    { name: "근막 (SMAS)", h: 18, fill: "#d9c9d6" },
    { name: "근육", h: 34, fill: "#d5a9a3" }
  ];
  var TECH_LAYERS = {
    rf: [1], ems: [4], microcurrent: [0], electroporation: [0], iontophoresis: [0],
    ultrasound: [0, 1], hifu: [1, 2, 3], led: [0, 1], ipl: [0, 1], laser: [0, 1],
    "ha-filler": [1, 2], biostimulator: [1, 2], "pn-pdrn": [1], toxin: [4], "ultrasound-multi": [0, 1], airshot: [0], cooling: [0], vibration: [0]
  };
  function skinSvg(techIds) {
    var on = [];
    techIds.forEach(function (id) { (TECH_LAYERS[id] || []).forEach(function (i) { if (on.indexOf(i) < 0) on.push(i); }); });
    if (!on.length) return "";
    var y = 10, rows = "";
    LAYERS.forEach(function (L, i) {
      var hit = on.indexOf(i) > -1;
      rows += '<rect x="0" y="' + y + '" width="520" height="' + L.h + '" fill="' + L.fill + '" opacity="' + (hit ? 1 : 0.35) + '"/>';
      if (hit) rows += '<rect x="0" y="' + y + '" width="6" height="' + L.h + '" fill="#5d55a8"/>';
      rows += '<text x="16" y="' + (y + L.h / 2 + 4) + '"' + (hit ? ' class="lbl-on"' : "") + ">" + L.name + (hit ? "  ←" : "") + "</text>";
      y += L.h;
    });
    return '<svg class="skin" viewBox="0 0 520 ' + (y + 10) + '" role="img" aria-label="피부 단면 도식: ' +
      on.map(function (i) { return LAYERS[i].name; }).join(", ") + ' 강조">' + rows + "</svg>" +
      '<p class="caption">일반적인 설명을 위한 도식입니다. 실제 도달 깊이는 장비 · 설정 · 개인에 따라 다르며, 제품별로 검증된 값이 아닙니다.</p>';
  }

  // ── 히어로 비주얼: Fluid Glass 모티프 (투명한 리본 두 줄) ──
  function glassSvg() {
    return '<svg viewBox="0 0 500 400" preserveAspectRatio="xMidYMid slice"><defs>' +
      '<linearGradient id="gl1" x1="0" x2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".2"/><stop offset=".5" stop-color="#ffffff" stop-opacity=".85"/><stop offset="1" stop-color="#c6e2f0" stop-opacity=".35"/></linearGradient>' +
      '<linearGradient id="gl2" x1="0" x2="1"><stop offset="0" stop-color="#6a52d9" stop-opacity=".15"/><stop offset=".6" stop-color="#9a84e6" stop-opacity=".55"/><stop offset="1" stop-color="#ffffff" stop-opacity=".3"/></linearGradient></defs>' +
      '<path d="M-20 250 C 80 140, 170 330, 270 210 S 430 90, 540 160" fill="none" stroke="url(#gl1)" stroke-width="46" stroke-linecap="round"/>' +
      '<path d="M-20 270 C 90 170, 180 350, 280 235 S 440 120, 540 185" fill="none" stroke="url(#gl2)" stroke-width="10" stroke-linecap="round"/>' +
      '<path d="M-20 300 C 100 230, 200 380, 300 290 S 450 200, 540 240" fill="none" stroke="#ffffff" stroke-opacity=".5" stroke-width="2"/></svg>';
  }

  // ── 비교함 ────────────────────────────────────────
  function tray() { return store("relev.compare") || []; }
  function setTray(a) { store("relev.compare", a.slice(0, 3)); renderTray(); }
  function entity(key) {
    var p = key.split(":"), rec = p[0] === "device" ? byId(D.devices, p[1]) : byId(D.treatments, p[1]);
    return rec ? { key: key, kind: p[0], rec: rec } : null;
  }
  function entityName(e) { return e.kind === "device" ? e.rec.name + " · " + e.rec.brand : e.rec.name; }
  function compareBtn(key) {
    var inTray = tray().indexOf(key) > -1;
    return '<button class="btn' + (inTray ? " btn--ghost" : "") + '" data-compare="' + esc(key) + '">' + (inTray ? "비교함에 담김 ✓" : "비교에 담기") + "</button>";
  }
  function renderTray() {
    var t = tray().map(entity).filter(Boolean);
    if (!t.length || location.hash.indexOf("#compare") === 0) { trayEl.hidden = true; return; }
    trayEl.hidden = false;
    trayEl.innerHTML = '<span class="label">비교함 ' + t.length + "/3</span>" +
      '<span class="items">' + t.map(function (e) {
        return '<span class="it">' + esc(e.rec.name) + '<button data-untray="' + esc(e.key) + '" aria-label="' + esc(e.rec.name) + ' 빼기">×</button></span>';
      }).join("") + "</span>" +
      '<a class="btn" href="#compare">비교하기</a>';
  }

  // ── 페이지: 홈 ────────────────────────────────────
  function pageHome() {
    var I = {
      learn: '<svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h10M4 18h7"/><circle cx="18" cy="16" r="3"/></svg>',
      device: '<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="15" rx="3"/><path d="M8 21h8"/></svg>',
      clinic: '<svg viewBox="0 0 24 24"><path d="M5 20V10a7 7 0 0 1 14 0v10"/><path d="M10 20v-6h4v6"/></svg>',
      compare: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="7" height="14" rx="2"/><rect x="14" y="5" width="7" height="14" rx="2"/></svg>',
      decode: '<svg viewBox="0 0 24 24"><path d="M8 8l-4 4 4 4M16 8l4 4-4 4"/></svg>',
      science: '<svg viewBox="0 0 24 24"><path d="M3 12c3-5 6-5 9 0s6 5 9 0"/></svg>'
    };
    var go = [
      ["#learn", "learn", "1분 기전 가이드", "RF · EMS · 초음파 · LED, 네 가지 에너지로 정리"],
      ["#device", "device", "홈 디바이스 " + D.devices.length + "개", "제품을 작용 기전별로 분류"],
      ["#clinic", "clinic", "시술 백과 " + D.treatments.length + "개", "피부과 · 관리실 시술을 같은 기준으로"],
      ["#decode", "decode", "이름 해독", "'쎄라', '에어샷', '부스터'가 실제로 뜻하는 것"],
      ["#compare", "compare", "비교 · 비용 계산", "최대 3개를 나란히, 1회당 비용까지"]
    ];
    var top = D.devices.filter(function (d) { return d.glowpick && d.glowpick.rank; })
      .sort(function (a, b) { return a.glowpick.rank - b.glowpick.rank; }).slice(0, 8);
    var principles = [
      ["근거가 있는 것만 사실로", "모든 값에 출처 등급과 검수일을 붙이고, 확인되지 않은 건 '확인 필요'로 남겨요."],
      ["광고와 평가는 분리", "제휴나 광고는 분류 · 순위 · 설명에 영향을 주지 않아요."],
      ["홈케어와 시술은 경쟁이 아니에요", "같은 원리 계열이라도 출력 · 깊이 · 허가 범위가 다릅니다. 대체하거나 우열을 가리지 않아요."]
    ];
    return (
      '<section class="h-hero"><div class="h-hero__in">' +
        '<div class="h-hero__text">' +
          '<p class="h-kicker">RE:LEVEL YOUR SKIN</p>' +
          "<h1>광고 말고 원리로,<br>똑똑하게 고르는 피부관리</h1>" +
          '<p class="h-sub">홈 디바이스와 피부과 시술을 상품명이 아니라 작용 기전으로 연결해요. 원리를 알고, 나에게 맞게 고르고, 피부를 한 단계 위로.</p>' +
          '<form class="h-search" data-search role="search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/></svg><input type="search" placeholder="제품 · 기술 · 시술 검색 (예: 갈바닉, 써마지)" aria-label="통합 검색"><button type="submit">검색</button></form>' +
          '<div class="h-cta"><a class="btn btn--lg" href="#learn">1분 기전 가이드</a><a class="btn btn--soft btn--lg" href="#device">디바이스 찾기</a></div>' +
        "</div>" +
        '<figure class="h-hero__img"><img src="assets/relev/models/model-hand.webp" alt="라벤더 배경의 모델 클로즈업" width="1448" height="1086" fetchpriority="high"></figure>' +
      "</div></section>" +

      '<section class="h-sec"><h2 class="h-title">바로 시작하기</h2><div class="cells">' +
        go.map(function (g) { return '<a class="cell" href="' + g[0] + '"><span class="cell__ic">' + I[g[1]] + '</span><span class="cell__t"><b>' + esc(g[2]) + "</b><span>" + esc(g[3]) + '</span></span><span class="cell__chev" aria-hidden="true">›</span></a>'; }).join("") +
      "</div></section>" +

      '<section class="h-sec"><div class="h-row"><h2 class="h-title">피부관리 기술은 결국 네 가지 에너지</h2><a class="h-more" href="#learn">기전 가이드 ›</a></div><div class="etiles">' +
        ENERGY.map(function (e) { var n = LEARN.filter(function (x) { return x.e === e.id; }); return '<a class="etile en-' + e.id + '" href="#learn"><span class="etile__ic">' + e.icon + "</span><b>" + esc(e.name) + "</b><span>" + n.map(function (x) { return esc(x.name.replace(/\s*\(.*\)/, "")); }).slice(0, 4).join(" · ") + "</span></a>"; }).join("") +
      "</div></section>" +

      '<section class="h-sec"><div class="h-row"><h2 class="h-title">많이 찾는 홈 디바이스</h2><a class="h-more" href="#device">전체 ' + D.devices.length + "개 ›</a></div>" +
        '<div class="hscroll">' + top.map(function (d) {
          var t = d.techIds.length ? d.techIds : (d.techCandidates || []);
          return '<a class="dmini" href="#device--' + d.id + '"><span class="dmini__rank">' + d.glowpick.rank + '</span><span class="dmini__brand">' + esc(d.brand) + "</span><b>" + esc(d.name) + '</b><span class="dmini__tech">' + esc(t.slice(0, 3).map(tagLabel).join(" · ") || "기술 확인 필요") + (d.techIds.length ? "" : " · 확인 필요") + "</span></a>";
        }).join("") + "</div>" +
        '<p class="h-note">순위는 공개 랭킹 기준이며, 효과나 추천 순위를 뜻하지 않아요.</p>' +
      "</section>" +

      '<section class="h-sec"><div class="h-row"><h2 class="h-title">같은 원리, 다른 도구</h2><a class="h-more" href="#clinic">시술 백과 ›</a></div>' +
        '<div class="bridges">' + [["rf", ["thermage", "oligio"], "출력 · 전극 구조 · 허가 목적이 다름"], ["ultrasound", ["ulthera", "shurink"], "전문 시술은 집속(HIFU) — 다른 방식"], ["ems", ["emface"], "근육 자극 계열 · 장비 규모가 다름"], ["led", ["led-clinic"], "같은 LED여도 광량 · 조사 조건이 다름"]].map(function (b) {
          var cs = b[1].map(function (id) { return byId(D.treatments, id); }).filter(Boolean);
          return cs.length ? '<div class="bridge"><a href="#science--' + b[0] + '" class="bridge__home"><small>홈</small>' + esc(tagLabel(b[0])) + '</a><span class="bridge__arrow" aria-hidden="true">→</span><span class="bridge__clinic"><small>시술</small>' + cs.map(function (t) { return '<a href="#clinic--' + t.id + '">' + esc(t.name) + "</a>"; }).join(", ") + '</span><p>' + esc(b[2]) + "</p></div>" : "";
        }).join("") + "</div>" +
        '<p class="h-note">같은 물리 원리 계열을 보여 줄 뿐, 홈 디바이스가 시술을 대체하거나 시술이 더 낫다는 뜻이 아니에요.</p>' +
      "</section>" +

      '<section class="h-sec"><h2 class="h-title">RE:LEV의 원칙</h2><ol class="rules">' +
        principles.map(function (p, i) { return '<li><span class="rules__n">0' + (i + 1) + "</span><div><b>" + esc(p[0]) + "</b><p>" + esc(p[1]) + "</p></div></li>"; }).join("") +
      "</ol></section>" +

      '<section class="h-sec"><div class="h-banner"><div><b>빠진 제품이나 틀린 정보가 있나요?</b><p>출처와 함께 알려 주시면 검수 후 반영해요.</p></div><a class="btn" href="#contribute">정보 등록하기</a></div>' +
      '<p class="h-note">프로토타입 단계입니다. 기술 ' + D.techs.length + "건 · 시술 " + D.treatments.length + "건은 검수 전 초안이고, 디바이스 " + D.devices.length + "건의 기술 분류는 판매 표기 기준으로 제조사 확인 전이에요.</p></section>"
    );
  }

  // 인트로 · 다크 섹션 스크롤 연출
  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function ease(x) { return x * x * (3 - 2 * x); }
  var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function onScrollFx() {
    var intro = document.getElementById("intro");
    if (intro) {
      var r = intro.getBoundingClientRect(), span = intro.offsetHeight - window.innerHeight;
      var p = REDUCED ? 1 : clamp01(-r.top / (span || 1));
      var a = ease(clamp01(p / 0.45)), b = ease(clamp01((p - 0.35) / 0.3)), c = ease(clamp01((p - 0.6) / 0.25));
      var s = 6 - 5 * a;
      intro.style.setProperty("--pearl-scale", s.toFixed(3));
      intro.style.setProperty("--glyph", b.toFixed(3));
      intro.style.setProperty("--rise", ((1 - c) * 33).toFixed(2));
      intro.style.setProperty("--trail", c.toFixed(3));
      intro.style.setProperty("--slogan", ease(clamp01((p - 0.72) / 0.2)).toFixed(3));
      intro.style.setProperty("--bgmix", (a * 100).toFixed(1) + "%");
    }
    var sp = document.getElementById("spread");
    if (sp) {
      var rr = sp.getBoundingClientRect();
      var q = REDUCED ? 1 : clamp01((window.innerHeight - rr.top) / (rr.height + window.innerHeight * 0.2));
      sp.style.setProperty("--draw", ease(q).toFixed(3));
    }
    document.body.classList.toggle("on-dark", !!(intro && intro.getBoundingClientRect().bottom > 60));
  }
  window.addEventListener("scroll", onScrollFx, { passive: true });
  window.addEventListener("resize", onScrollFx);


  // ── 목록 검색 · 목적 필터 (Device · Science · Clinic 공통) ─────────
  var listState = { q: "", c: "all", f: "all", e: "all" };
  var lastConcernItems = [];
  var clinicGroup = "concern";
  function concernLabel(id) { var c = byId(D.taxonomy.concerns || [], id); return c ? c.label : id; }
  function concernChips(items) {
    lastConcernItems = items;
    var used = (D.taxonomy.concerns || []).filter(function (c) { return items.some(function (x) { return (x.concerns || []).indexOf(c.id) > -1; }); });
    var grp = EFFECT_GROUPS.filter(function (g) { return g.c === listState.c; })[0];
    var subs = grp && items.some(function (x) { return x.purpose !== undefined; }) ? grp.items.filter(function (it) { return items.some(function (x) { return effectsOf(x).indexOf(it) > -1; }); }) : [];
    return '<div data-cwrap><div class="filters" role="group" aria-label="목적 필터"><span class="filters__label">목적</span>' +
      '<button class="chip chip--plain" data-concern="all" aria-pressed="' + (listState.c === "all") + '">전체</button>' +
      used.map(function (c) { return '<button class="chip chip--plain" data-concern="' + c.id + '" aria-pressed="' + (listState.c === c.id) + '">' + c.label + "</button>"; }).join("") + "</div>" +
      (subs.length > 1 ? '<div class="subfilters" role="group" aria-label="세부 효과 (판매 표기)"><span class="filters__label">세부</span><button data-effect="all" aria-pressed="' + (listState.e === "all") + '">전체</button>' + subs.map(function (it) { return '<button data-effect="' + esc(it) + '" aria-pressed="' + (listState.e === it) + '">' + esc(it) + "</button>"; }).join("") + '<span class="subfilters__note">판매 표기 기준</span></div>' : "") + "</div>";
  }
  function listBar(placeholder, extra) {
    return '<div class="listbar"><input type="search" data-listq value="' + esc(listState.q) + '" placeholder="' + esc(placeholder) + '" aria-label="목록 안에서 검색"><span class="listbar__count" data-listcount></span></div>' + (extra || "");
  }
  function dataAttrs(o, text) {
    return ' data-q="' + esc(text.toLowerCase()) + '" data-e="' + esc(o.purpose !== undefined ? "|" + effectsOf(o).join("|") + "|" : "") + '" data-c="' + esc((o.concerns || []).join(" ")) + '" data-f="' + esc(uniq((o.techIds || []).concat(o.techCandidates || []).map(familyOf)).join(" ")) + '"';
  }
  function applyListFilter() {
    var q = listState.q.trim().toLowerCase(), n = 0;
    view.querySelectorAll("[data-q]").forEach(function (el) {
      var ok = (!q || el.dataset.q.indexOf(q) > -1) &&
        (listState.c === "all" || (" " + el.dataset.c + " ").indexOf(" " + listState.c + " ") > -1) &&
        (listState.f === "all" || (" " + el.dataset.f + " ").indexOf(" " + listState.f + " ") > -1) &&
        (listState.e === "all" || (el.dataset.e || "").indexOf("|" + listState.e + "|") > -1);
      el.hidden = !ok; if (ok) n++;
    });
    view.querySelectorAll("[data-group]").forEach(function (g) { g.hidden = !g.querySelector("[data-q]:not([hidden])"); });
    var cnt = view.querySelector("[data-listcount]"); if (cnt) cnt.textContent = n + "개";
    var empty = view.querySelector("[data-listempty]"); if (empty) empty.hidden = n > 0;
  }

  // ── 이미지 (AI 생성 콘셉트) ───────────────────────
  var TECH_IMG = { "ultrasound-multi": "technology/ultrasound", airshot: "technology/electroporation", cooling: "editorial/cooling", vibration: "editorial/surface-care" };
  function techImg(id) {
    var known = ["biostimulator", "electroporation", "ems", "ha-filler", "hifu", "iontophoresis", "ipl", "laser", "led", "microcurrent", "pn-pdrn", "rf", "toxin", "ultrasound", "units"];
    var p = TECH_IMG[id] || (known.indexOf(id) > -1 ? "technology/" + id : null);
    return p ? "assets/relev/" + p + ".webp" : null;
  }
  function figure(src, alt, cls) {
    return '<figure class="fig ' + (cls || "") + '"><img src="' + src + '" alt="' + esc(alt) + '" loading="lazy" width="1536" height="1024"></figure>';
  }

  // ── 페이지: 기전 가이드 (LEARN) ─────────────────
  var learnPick = "rf";
  var LEARN = [
    { id: "ems", dm: ["EMS"], e: "electric", name: "EMS (저주파)", one: "근육에 '움직여' 신호를 대신 보내 실제로 수축시킵니다.", like: "운동 신경을 바깥에서 대신 눌러 주는 리모컨", feel: "근육이 움찔하는 느낌", unit: "mA · 수 Hz~수백 Hz" },
    { id: "ems", key: "midfreq", dm: ["중주파"], e: "electric", name: "중주파", one: "EMS처럼 근육 자극이 목적이지만 더 빠른 주파수를 써서 피부 표면 자극을 줄였다고 설명됩니다.", like: "EMS의 다른 버전 — 고주파(RF)와는 다른 것", feel: "움찔하지만 덜 따끔", unit: "대략 수 kHz" },
    { id: "rf", dm: ["고주파"], e: "electric", name: "고주파 (RF)", one: "근육이 따라 반응하지 못할 만큼 빠르게 바뀌는 전류가 조직을 지나며 열을 만듭니다.", like: "전기가 지나가며 생기는 저항열 — 따뜻해지는 원리", feel: "따뜻함 · 열감", unit: "수백 kHz~수십 MHz" },
    { id: "microcurrent", dm: ["미세전류", "MC"], e: "electric", name: "미세전류", one: "느끼기 어려울 만큼 약한 전류를 흘립니다. 주파수보다 '세기'가 다른 기술입니다.", like: "EMS의 1/1000 수준 전류 (mA → µA)", feel: "거의 느껴지지 않음", unit: "µA" },
    { id: "iontophoresis", dm: ["갈바닉"], e: "electric", name: "갈바닉 (이온)", one: "한 방향으로 흐르는 약한 전류로, 전하를 띤 성분을 피부 쪽으로 밀어 줍니다.", like: "같은 극끼리 밀어내는 자석", feel: "거의 없음 · 약간 찌릿", unit: "직류 · µA" },
    { id: "electroporation", dm: ["EP"], e: "electric", name: "일렉트로포레이션 (EP)", one: "짧고 센 전기 펄스로 피부 표면에 잠깐 길을 연다는 원리입니다. 홈 기기는 연구 조건과 다를 수 있습니다.", like: "아주 짧게 문을 열었다 닫는 펄스", feel: "약한 따끔함", unit: "짧은 고전압 펄스" },
    { id: "plasma", key: "plasma", dm: ["플라즈마"], e: "electric", name: "플라즈마", one: "높은 전압으로 공기를 이온화해 만든 플라즈마(전하를 띤 기체)를 피부 표면에 닿게 하는 방식으로 설명됩니다. 가정용 제품은 출력 · 방식 정보가 거의 공개되지 않습니다.", like: "아주 작은 번개를 표면에 스치듯 대는 것", feel: "약한 찌릿함 · 따뜻함으로 소개됨", unit: "고전압 방전" },
    { id: "ultrasound", dm: ["초음파"], e: "sound", name: "비집속 초음파", one: "들리지 않는 빠른 진동을 헤드 면적 전체로 넓게 전달합니다.", like: "넓게 울리는 스피커 진동", feel: "거의 없음 · 미지근", unit: "대략 1~3 MHz" },
    { id: "ultrasound-multi", dm: ["LDM"], e: "sound", name: "물방울 · LDM 계열", one: "서로 다른 주파수의 초음파를 번갈아 · 교차로 줍니다. LDM은 특정 제조사의 기술명입니다.", like: "두세 개의 진동을 섞어 쓰는 스피커", feel: "거의 없음", unit: "다중 주파수" },
    { id: "hifu", dm: ["HIFU", "HIFU(MFU)"], e: "sound", name: "집속 초음파 (HIFU)", one: "초음파를 피부 속 한 점에 모아 작은 열 응고점을 만듭니다.", like: "돋보기로 햇빛을 한 점에 모으기", feel: "찌릿한 열감 · 통증 (전문 장비)", unit: "수 MHz · 초점 깊이" },
    { id: "led", dm: ["LED광선"], e: "light", name: "LED 광원", one: "특정 색(파장)의 약한 빛을 넓게 쬡니다. 태우지 않습니다.", like: "색이 정해진 부드러운 조명", feel: "없음 · 밝음", unit: "nm (예: 630nm 빨간빛)" },
    { id: "ipl", dm: ["IPL"], e: "light", name: "IPL", one: "여러 색이 섞인 강한 섬광을 짧게 터뜨리고 필터로 파장을 고릅니다.", like: "카메라 플래시", feel: "순간 따끔 · 열감", unit: "넓은 파장대 · J/cm²" },
    { id: "laser", dm: ["레이저식"], e: "light", name: "레이저", one: "한 가지 파장의 빛을 한 방향으로 정밀하게 쏩니다.", like: "한 색만 쓰는 정밀한 빛줄기", feel: "장비별 상이 (전문)", unit: "단일 파장 nm" },
    { id: "far-infrared", key: "far-infrared", dm: ["원적외선"], e: "light", name: "원적외선", one: "눈에 보이지 않는 긴 파장의 적외선으로, 주로 따뜻함(복사열)을 주는 기능으로 표기됩니다. LED 마스크의 근적외선(약 800~1000nm)과는 다른 영역입니다.", like: "햇볕을 쬘 때 느끼는 따스함", feel: "은은한 따뜻함", unit: "µm 단위 파장 · 제품마다 정의 다름" },
    { id: "cooling", dm: ["쿨링", "크라이오쿨링"], e: "temp", name: "쿨링 · 크라이오", one: "피부 온도를 낮춰 일시적인 진정감을 줍니다.", like: "차가운 수건", feel: "차가움", unit: "온도" },
    { id: "heating", key: "heating", dm: ["온열"], e: "temp", name: "온열", one: "헤드를 데워 피부 표면에 따뜻함을 전합니다. 고주파(RF)처럼 조직 안에서 열이 생기는 방식과는 다릅니다.", like: "따뜻한 찜질팩", feel: "따뜻함", unit: "℃" },
    { id: "vibration", dm: ["진동"], e: "temp", name: "진동", one: "모터의 기계적 진동으로 세안 · 마사지를 돕습니다.", like: "진동 칫솔 · 마사지건", feel: "떨림", unit: "회/분" },
    { id: "massage", key: "massage", dm: ["마사지"], e: "temp", name: "마사지 (롤러 · 헤드)", one: "롤러나 헤드가 피부를 문지르고 누르는 물리적 관리입니다. 전기 · 빛 기능 없이 이것만 있는 제품도 많습니다.", like: "손으로 하는 마사지를 도구로", feel: "누르는 압 · 문지름", unit: "회전수 · 압력" },
    { id: "microderm", key: "microderm", dm: ["다이아몬드필링"], e: "temp", name: "다이아몬드 필링", one: "미세한 다이아몬드 입자가 박힌 팁으로 각질을 물리적으로 갈아내고 흡입합니다. 관리실의 마이크로더마브레이전과 같은 계열입니다.", like: "아주 고운 사포 + 흡입", feel: "약한 마찰 · 당김", unit: "흡입 압력 · 팁 거칠기" },
    { id: "mist", key: "mist", dm: ["미스트"], e: "temp", name: "미스트", one: "물이나 화장수를 아주 작은 입자로 뿜어 수분을 더하는 보조 기능입니다. 진동판(초음파)이나 압력으로 입자를 만듭니다.", like: "가습기의 작은 버전", feel: "촉촉함 · 시원함", unit: "분사량 · 입자 크기" }
  ];
  var ENERGY = [
    { id: "electric", name: "전기", en: "ELECTRIC", line: "전류를 흘려서 — 근육을 움직이거나, 성분을 밀어 넣거나, 열을 만든다", icon: '<svg viewBox="0 0 40 40"><path d="M22 4L8 22h10l-2 14 14-18H20z"/></svg>' },
    { id: "sound", name: "소리 (진동)", en: "SOUND", line: "들리지 않는 초음파 진동을 — 넓게 퍼뜨리거나, 한 점에 모은다", icon: '<svg viewBox="0 0 40 40"><path d="M6 20h4M14 12v16M20 6v28M26 12v16M32 17v6"/></svg>' },
    { id: "light", name: "빛", en: "LIGHT", line: "정해진 색(파장)의 빛을 — 약하게 쬐거나, 강하게 터뜨리거나, 정밀하게 쏜다", icon: '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="6"/><path d="M20 4v5M20 31v5M4 20h5M31 20h5M8.7 8.7l3.5 3.5M27.8 27.8l3.5 3.5M8.7 31.3l3.5-3.5M27.8 12.2l3.5-3.5"/></svg>' },
    { id: "temp", name: "온도 · 물리", en: "TEMP", line: "차갑게 · 따뜻하게 · 떨리게 · 문지르게 — 표면에서 느끼는 관리", icon: '<svg viewBox="0 0 40 40"><path d="M17 6a3 3 0 0 1 6 0v18a7 7 0 1 1-6 0z"/><path d="M20 14v14"/></svg>' }
  ];
  var PAIRS = [
    { a: "고주파 (RF)", b: "중주파 · 저주파 (EMS)", q: "이름이 비슷한데 하는 일이 정반대예요", diff: ["주파수가 낮으면(EMS) 근육이 신호를 따라 움찔합니다.", "주파수가 아주 높으면(RF) 근육이 따라가지 못하고, 대신 조직이 데워집니다.", "중주파는 '중간 RF'가 아니라 근육 자극(EMS) 계열입니다."], ta: "rf", tb: "ems" },
    { a: "EMS", b: "미세전류", q: "둘 다 전기인데 뭐가 달라요?", diff: ["EMS는 mA 단위로 근육을 실제로 움직입니다.", "미세전류는 그 1/1000인 µA 단위로, 대개 느껴지지 않습니다.", "목적은 비슷하게 소개되지만(탄력) 근거의 양과 방식이 다릅니다."], ta: "ems", tb: "microcurrent" },
    { a: "비집속 초음파", b: "집속 초음파 (HIFU)", q: "같은 초음파인데 왜 하나는 시술이에요?", diff: ["비집속은 진동을 넓게 퍼뜨려 표면 근처에 전달합니다.", "집속은 한 점에 모아 피부 속에 열 응고점을 만듭니다.", "'초음파'라는 이름만으로는 어느 쪽인지 알 수 없습니다."], ta: "ultrasound", tb: "hifu" },
    { a: "갈바닉", b: "일렉트로포레이션", q: "둘 다 '흡수'라던데요?", diff: ["갈바닉은 약한 직류로 전하를 띤 성분을 밀어 줍니다.", "일렉트로포레이션은 짧은 펄스로 표면에 잠깐 길을 연다는 원리입니다.", "두 방식 모두 '부스터 모드'라고 불릴 수 있습니다."], ta: "iontophoresis", tb: "electroporation" },
    { a: "LED", b: "IPL · 레이저", q: "다 빛인데 왜 LED는 집에서 써요?", diff: ["LED는 약한 빛을 넓게 쬐어 태우지 않습니다.", "IPL은 강한 섬광, 레이저는 한 파장의 정밀한 빛으로 열을 만듭니다.", "가정용 IPL은 주로 제모용입니다."], ta: "led", tb: "ipl" }
  ];
  function learnDetail(x) {
    var t = byId(D.techs, x.id);
    var n = !x.key && t ? D.devices.filter(function (d) { return d.techIds.indexOf(x.id) > -1; }).length : 0;
    var dmN = (x.dm || []).length ? D.devices.filter(function (d) { return (d.danawaMethods || []).some(function (m) { return x.dm.indexOf(m) > -1; }); }).length : 0;
    return '<div class="lp__text"><p class="eyebrow">' + esc(ENERGY.filter(function (e) { return e.id === x.e; })[0].name) + "</p><h3>" + esc(x.name) + "</h3>" +
      '<p class="lp__one">' + esc(x.one) + "</p>" +
      '<dl class="lp__dl"><div><dt>비유</dt><dd>' + esc(x.like) + "</dd></div><div><dt>느낌</dt><dd>" + esc(x.feel) + "</dd></div><div><dt>단위 · 범위</dt><dd>" + esc(x.unit) + ' <span class="caption">일반적 범위 · 제품마다 다름</span></dd></div>' +
        ((x.dm || []).length ? '<div><dt>판매 표기</dt><dd>' + x.dm.map(function (m) { return '<span class="dm">' + esc(m) + "</span>"; }).join(" ") + (dmN ? ' <span class="caption">이 표기를 쓴 제품 ' + dmN + "개</span>" : "") + "</dd></div>" : "") + "</dl>" +
      '<p class="lp__links">' + (t ? '<a class="btn btn--ghost" href="#science--' + x.id + '">자세히 · 근거 보기</a>' : "") + (n ? ' <a class="btn btn--ghost" href="#device" data-goto-tech="' + x.id + '">이 기술 쓰는 디바이스 ' + n + "개</a>" : dmN ? ' <a class="btn btn--ghost" href="#device" data-goto-q="' + esc(x.dm[0]) + '">\'' + esc(x.dm[0]) + "\' 표기 제품 " + dmN + "개</a>" : "") + "</p></div>" +
      '<div class="lp__skin">' + (skinSvg([x.id]) || '<p class="caption">피부 표면에서 느끼는 관리</p>') + "</div>";
  }
  var LED_COLORS = [
    { name: "블루", c: "#4c6ef5", nm: "약 405~470nm", peak: "415nm 전후", depth: 1, topic: "여드름균(C. acnes)이 만드는 포르피린이 청색광을 흡수한다는 원리로, 여드름 관련 연구가 많습니다. 결과는 연구마다 엇갈립니다.", ev: "일부", note: "눈부심이 강해 눈 보호가 권장됩니다." },
    { name: "그린", c: "#2fb36d", nm: "약 495~570nm", peak: "525nm 전후", depth: 2, topic: "톤 · 색소 관련으로 소개되지만 연구가 적습니다.", ev: "제한적" },
    { name: "옐로우", c: "#f2c230", nm: "약 570~590nm", peak: "590nm 전후", depth: 2, topic: "붉은기 · 진정, 광노화 관련 소규모 연구가 있습니다.", ev: "제한적" },
    { name: "오렌지", c: "#f08a3c", nm: "약 590~620nm", peak: "605nm 전후", depth: 3, topic: "레드와 옐로우 사이 파장으로, 톤 관련으로 소개됩니다. 이 색만 다룬 연구는 드뭅니다.", ev: "제한적" },
    { name: "레드", c: "#e5484d", nm: "약 620~700nm", peak: "630 · 633 · 660nm", depth: 4, topic: "광생물조절(PBM) 연구가 가장 많은 색입니다. 주름 · 탄력 관련 임상이 있지만 대부분 소규모이고 조건이 제각각입니다.", ev: "상대적으로 많음" },
    { name: "근적외선", c: "#8a3b47", nm: "약 700~1000nm+", peak: "830 · 850nm", depth: 5, topic: "눈에는 거의 보이지 않고 가시광선보다 깊이 들어갑니다. 레드와 함께 PBM 연구에 자주 쓰입니다.", ev: "일부" },
    { name: "IR 표기", c: "#5b2a33", nm: "대개 근적외선", peak: "제품 확인 필요", depth: 5, topic: "제품의 'IR'은 보통 근적외선 LED(830 · 850nm 등)를 뜻합니다. 따뜻함을 주는 '원적외선'과는 다른 영역입니다.", ev: "표기 해설", mix: true },
    { name: "퍼플", c: "linear-gradient(135deg,#e5484d,#4c6ef5)", nm: "혼합광", peak: "보통 레드 + 블루", depth: 0, topic: "단일 파장이 아니라 레드와 블루를 함께 켠 경우가 많습니다. 각 색의 특성을 합쳐 이해하면 됩니다.", ev: "혼합광", mix: true },
    { name: "핑크", c: "linear-gradient(135deg,#e5484d,#f6c1d0)", nm: "혼합광", peak: "레드 + 블루 · 화이트 등", depth: 0, topic: "제조사마다 섞는 조합이 달라 실제 파장 구성을 확인해야 합니다.", ev: "혼합광", mix: true }
  ];
  function ledGuide() {
    var nLed = D.devices.filter(function (d) { return (d.danawaMethods || []).indexOf("LED광선") > -1 || d.techIds.indexOf("led") > -1; }).length;
    return '<section class="section" id="led-colors"><p class="eyebrow">LED colors</p><h2 class="sec-h">LED 색깔별 가이드</h2>' +
      '<p class="sec-sub">LED 기능이 표기된 제품 ' + nLed + '개. 파장이 길수록(파랑 → 빨강 → 근적외선) 더 깊이 들어갑니다.</p>' +
      '<div class="nmbar" aria-hidden="true"><div class="nmbar__grad"></div><div class="nmbar__ticks"><span style="left:0%">400</span><span style="left:25%">550</span><span style="left:50%">700</span><span style="left:75%">850</span><span style="left:100%">1000nm</span></div><div class="nmbar__depth"><span>얕게 (표피)</span><span>깊게 →</span></div></div>' +
      '<div class="leds">' + LED_COLORS.map(function (L) {
        var cls = L.ev === "상대적으로 많음" ? "hi" : L.ev === "일부" ? "mid" : L.mix ? "mix" : "lo";
        return '<article class="led"><div class="led__top"><i class="led__sw" style="background:' + L.c + '"></i><div><b>' + L.name + "</b><span>" + L.nm + " · " + (L.mix ? "" : "자주 쓰는 값 ") + L.peak + "</span></div></div>" +
          (L.depth ? '<div class="led__depth" aria-label="상대적 도달 깊이 ' + L.depth + '/5"><small>도달 깊이</small>' + [1, 2, 3, 4, 5].map(function (i) { return "<i" + (i <= L.depth ? ' class="on"' : "") + "></i>"; }).join("") + "</div>" : "") +
          "<p>" + esc(L.topic) + (L.note ? " " + esc(L.note) : "") + '</p><span class="led__ev led__ev--' + cls + '">연구 근거 · ' + L.ev + "</span></article>";
      }).join("") + "</div>" +
      '<p class="caption">파장 범위는 일반적인 물리적 구분이며 경계는 자료마다 조금씩 다릅니다. \'연구 근거\'는 그 주제로 연구된 정도를 뜻할 뿐 홈 기기의 효과를 보장하지 않습니다. 홈 LED 기기는 연구 조건보다 광량(mW/cm²)이 낮을 수 있습니다.</p></section>';
  }
  // 판매 표기 효과 → RE:LEV 목적 묶음
  var EFFECT_GROUPS = [
    { c: "lifting", items: ["탄력개선", "리프팅", "윤곽관리"] },
    { c: "volume", items: ["주름개선"] },
    { c: "absorption", items: ["유효성분흡수"] },
    { c: "hydration", items: ["수분보습"] },
    { c: "soothing", items: ["피부진정", "혈액순환"] },
    { c: "pores", items: ["모공케어", "피지제거"] },
    { c: "tone", items: ["피부톤개선"] },
    { c: "cleansing", items: ["딥클렌징", "각질제거", "세안"] },
    { c: "hair", items: ["제모"] }
  ];
  function effectsOf(d) { return String(d.purpose || "").split(/\s*,\s*/).filter(Boolean); }
  function effectGuide() {
    return '<section class="section"><p class="eyebrow">Start from your goal</p><h2 class="sec-h">원하는 효과에서 시작하기</h2>' +
      '<p class="sec-sub">판매 페이지에 쓰인 효과 표기 15가지를 RE:LEV의 9가지 목적으로 묶었어요. 효과를 확인했다는 뜻이 아니라, 어떤 기술이 그 목적으로 \'소개되는지\'를 보여 줍니다.</p><div class="effs">' +
      EFFECT_GROUPS.map(function (g) {
        var ts = D.techs.filter(function (t) { return (t.concerns || []).indexOf(g.c) > -1; });
        return '<article class="eff"><h3>' + esc(concernLabel(g.c)) + '</h3><ul class="eff__items">' + g.items.map(function (it) {
          var n = D.devices.filter(function (d) { return effectsOf(d).indexOf(it) > -1; }).length;
          return '<li><a href="#device" data-goto-effect="' + esc(g.c + "|" + it) + '"><span>' + esc(it) + "</span><small>" + (n ? n + "개" : "–") + '</small><i aria-hidden="true">›</i></a></li>';
        }).join("") + "</ul>" + (ts.length ? '<p class="eff__tech"><span>주로 소개되는 기술</span>' + ts.map(function (t) { return '<a href="#science--' + t.id + '">' + esc(t.name) + "</a>"; }).join(" · ") + "</p>" : "") + "</article>";
      }).join("") + '</div><p class="caption">숫자는 그 효과가 판매 표기에 적힌 제품 수예요. 효과의 크기나 순위를 뜻하지 않으며, 각 기술 페이지에서 근거 수준을 확인하세요.</p></section>';
  }
  function lpPicker() {
    var cur = LEARN.filter(function (x) { return (x.key || x.id) === learnPick; })[0] || LEARN[2];
    return '<div class="seg" role="tablist" aria-label="에너지 종류">' + ENERGY.map(function (e) {
        var n = LEARN.filter(function (x) { return x.e === e.id; }).length;
        return '<button role="tab" data-energy="' + e.id + '" aria-selected="' + (e.id === cur.e) + '">' + esc(e.name.replace(/\s*\(.*\)/, "")) + "<small>" + n + "</small></button>";
      }).join("") + "</div>" +
      '<div class="lp-tabs" role="group" aria-label="기술 선택">' + LEARN.filter(function (x) { return x.e === cur.e; }).map(function (x) { var k = x.key || x.id; return '<button data-learn="' + k + '" aria-pressed="' + (k === learnPick) + '">' + esc(x.name) + "</button>"; }).join("") + "</div>";
  }
  function pageLearn() {
    var pick = LEARN.filter(function (x) { return (x.key || x.id) === learnPick; })[0] || LEARN[2];
    return pageHero("assets/relev/editorial/fluid-glass.webp", "50% 50%", "BASICS", "1분<br>기전 가이드", "고주파, 중주파, 집속 · 비집속 초음파, 일렉트로포레이션, LED, EMS, 갈바닉… 이름은 많아도 피부관리 기술은 결국 네 가지 에너지입니다.", "투명한 유리 리본 (AI 생성 콘셉트)") +
      '<div class="energy">' + ENERGY.map(function (e) {
        var mem = LEARN.filter(function (x) { return x.e === e.id; });
        return '<div class="energy__card en-' + e.id + '"><div class="ec__head"><span class="ec__icon">' + e.icon + '</span><div><h2>' + e.name + '</h2><span class="ec__count">' + mem.length + "가지 기술</span></div></div>" +
          '<p class="ec__line">' + esc(e.line) + '</p><ul class="ec__list">' + mem.map(function (x) { return '<li><button data-learn="' + (x.key || x.id) + '"><span>' + esc(x.name) + '</span><i aria-hidden="true">›</i></button></li>'; }).join("") + "</ul></div>";
      }).join("") + "</div>" +

      '<section class="section"><p class="eyebrow">Pick one</p><h2 class="sec-h">피부 속 어디까지, 어떤 느낌으로?</h2>' +
      '<div id="lpPick">' + lpPicker() + "</div>" +
      '<div class="lp" id="lp">' + learnDetail(pick) + "</div></section>" +

      '<section class="section"><p class="eyebrow">Electric spectrum</p><h2 class="sec-h">전기는 \'얼마나 빠르게 바뀌느냐\'로 하는 일이 달라요</h2>' +
      '<div class="spec-band"><div class="sb sb-dc"><b>직류</b><span>갈바닉</span><i>성분을 밀어 줌</i></div><div class="sb sb-low"><b>저주파</b><span>EMS · 수~수백 Hz</span><i>근육이 움찔</i></div><div class="sb sb-mid"><b>중주파</b><span>수 kHz</span><i>근육 자극 · 덜 따끔</i></div><div class="sb sb-high"><b>고주파 RF</b><span>수백 kHz~MHz</span><i>근육은 못 따라옴 → 열</i></div></div>' +
      '<p class="caption">세기 축은 따로: 미세전류(µA)는 주파수가 아니라 \'아주 약한 세기\', 일렉트로포레이션은 \'아주 짧고 센 펄스\'가 특징입니다. 범위는 일반적인 설명이며 제품마다 다릅니다.</p></section>' +

      ledGuide() +
      '<p class="caption nonTech">판매 표기 중 \'반영구\'(소모품 교체 없이 쓴다는 뜻), \'세기조절\' · \'타이머\' · \'앱연동\' · \'착용감지센서\'는 기술 방식이 아니라 제품 기능 · 사용 편의 표기입니다.</p>' +
      '<section class="section"><p class="eyebrow">Don\'t mix up</p><h2 class="sec-h">가장 많이 헷갈리는 다섯 쌍</h2><div class="pairs">' + PAIRS.map(function (p) {
        return '<article class="pair"><p class="pair__q">' + esc(p.q) + '</p><div class="pair__vs"><a href="#science--' + p.ta + '">' + esc(p.a) + '</a><span>vs</span><a href="#science--' + p.tb + '">' + esc(p.b) + "</a></div>" + list(p.diff) + "</article>";
      }).join("") + "</div></section>" +

      effectGuide() +
      '<p class="note">홈 디바이스와 전문 장비는 같은 이름의 기술이어도 출력 · 깊이 · 허가 범위가 다릅니다. <a href="#decode">제조사 용어 해독 보기 →</a></p>';
  }

  // ── 페이지: 용어 해독 (DECODE) ────────────────────
  function termDevices(term) {
    if (!term.match) return [];
    return D.devices.filter(function (d) { return (d.fullName || d.name).indexOf(term.match) > -1; });
  }
  function pageDecode() {
    return pageHero("assets/relev/models/model-closeup.webp", "60% 35%", "DECODE", "이름 말고,<br>방식으로", "제조사가 만든 기능 이름이 실제로 어떤 기술인지 풀어 둡니다. 같은 이름이 제품마다 다른 기술을 가리키는 경우도 데이터로 보여 드립니다.", "피부 결이 보이는 얼굴 클로즈업 (AI 생성 콘셉트)") +
      listBar("에어샷, 쎄라, 부스터…") +
      '<div class="decode">' + D.terms.map(function (t) {
        var ds = termDevices(t), dist = {};
        ds.forEach(function (d) { d.techIds.forEach(function (x) { dist[x] = (dist[x] || 0) + 1; }); });
        var distHtml = Object.keys(dist).sort(function (a, b) { return dist[b] - dist[a]; }).map(function (x) { return '<span class="chip f-' + familyOf(x) + '">' + esc(tagLabel(x)) + " <b>" + dist[x] + "</b></span>"; }).join("");
        return '<article class="term" data-q="' + esc((t.term + " " + (t.evokes || "") + " " + t.plain).toLowerCase()) + '" data-c="" data-f="">' +
          '<header><h2>' + esc(t.term) + "</h2>" + (t.tech ? chip(t.tech) : "") + "</header>" +
          '<p class="term__evokes"><span>연상되는 것</span>' + esc(t.evokes || "—") + "</p>" +
          '<p class="term__plain">' + esc(t.plain) + "</p>" +
          (ds.length ? '<div class="term__data"><p class="caption">이름에 \'' + esc(t.match) + "'가 들어간 제품 " + ds.length + "개의 실제 방식 (판매 표기 기준. '초음파'로만 표기된 것은 집속 여부를 알 수 없어 비집속으로 묶임)</p>" + '<div class="chips">' + distHtml + "</div>" +
            '<ul class="term__list">' + ds.slice(0, 8).map(function (d) { return '<li><a href="#device--' + d.id + '">' + esc(d.fullName || d.brand + " " + d.name) + "</a> " + d.techIds.map(function (x) { return '<span class="mini f-' + familyOf(x) + '">' + esc(tagLabel(x)) + "</span>"; }).join("") + "</li>"; }).join("") + "</ul></div>" : "") +
          "</article>";
      }).join("") + '</div><p class="empty" data-listempty hidden>찾는 용어가 없습니다. <a href="#contribute">용어 추가 제안하기</a></p>';
  }

  // ── 페이지: 참여 (등록 · 수정 요청) ─────────────────
  function pageContribute(kind, targetId) {
    var mine = store("relev.submissions") || [];
    var fams = D.taxonomy.families.filter(function (f) { return HOME_FAMILIES.indexOf(f.id) > -1; });
    var target = targetId ? (byId(D.devices, targetId) || byId(D.treatments, targetId) || byId(D.techs, targetId)) : null;
    kind = kind === "edit" ? "edit" : "new";
    return head("CONTRIBUTE", "함께 만드는 데이터베이스", "제조사 · 의료기관 · 사용자 누구나 디바이스를 등록하거나 정보 수정을 요청할 수 있습니다. 모든 제출은 출처가 있어야 하며, 편집팀 확인 뒤에만 반영됩니다.") +
      '<div class="flow"><span><b>1</b> 제출</span><span><b>2</b> 출처 확인</span><span><b>3</b> 편집 검수</span><span><b>4</b> 반영 · 출처 등급 표시</span></div>' +
      '<form class="contrib" data-contrib>' +
      '<div class="seg" role="radiogroup" aria-label="제출 종류"><label><input type="radio" name="kind" value="new"' + (kind === "new" ? " checked" : "") + '> 새 디바이스 등록</label><label><input type="radio" name="kind" value="edit"' + (kind === "edit" ? " checked" : "") + '> 정보 수정 요청</label></div>' +
      (target ? '<p class="note">대상: <b>' + esc(target.fullName || target.name) + '</b><input type="hidden" name="target" value="' + esc(target.id) + '"></p>' : "") +
      '<div class="contrib__grid">' +
      '<label>제품 · 항목 이름 *<input name="name" id="c-name" required value="' + esc(target ? (target.fullName || target.name) : "") + '"></label>' +
      '<label>브랜드 · 제조사<input name="brand" id="c-brand" value="' + esc(target && target.brand ? target.brand : "") + '"></label>' +
      "</div>" +
      '<fieldset><legend>사용 기술 (해당하는 것 모두)</legend><div class="chips">' + fams.map(function (f) { return '<label class="chk"><input type="checkbox" name="tech" value="' + f.id + '"> ' + esc(f.ko) + "</label>"; }).join("") + "</div></fieldset>" +
      '<label>내용 *<textarea name="body" id="c-body" rows="4" required placeholder="예: 공식 설명서 12쪽에 \'부스터 모드는 일렉트로포레이션 방식\'이라고 적혀 있습니다."></textarea></label>' +
      '<div class="contrib__grid">' +
      '<label>출처 URL *<input name="url" id="c-url" type="url" required placeholder="https://"></label>' +
      '<label>출처 종류 *<select name="tier" id="c-tier" required><option value="">선택</option>' + D.taxonomy.tiers.map(function (t) { return '<option value="' + t.id + '">' + t.id + " · " + esc(t.label) + "</option>"; }).join("") + "</select></label>" +
      '<label>제출자 *<select name="who" id="c-who" required><option value="">선택</option><option>제조사 · 브랜드</option><option>의료기관 · 의료진</option><option>사용자</option><option>연구자 · 기타</option></select></label>' +
      "</div>" +
      '<label class="chk"><input type="checkbox" name="disclose" id="c-disc"> 이 제품과 이해관계(제조 · 판매 · 광고)가 있습니다</label>' +
      '<p class="form-error" data-formerr hidden></p>' +
      '<button class="btn">제출하기</button>' +
      '<p class="caption">프로토타입: 제출 내용은 지금 이 브라우저에만 저장되고 편집팀에 전송되지 않습니다. 공개 전에는 회원 · 서버 저장(예: Supabase)과 검수 화면을 연결해야 합니다.</p>' +
      "</form>" +
      (mine.length ? '<section class="section"><h2>내 제출</h2><div class="subs">' + mine.slice().reverse().map(function (s) {
        return '<div class="sub"><span class="badge badge--draft">검토 대기</span><b>' + esc(s.kind === "edit" ? "수정 요청" : "새 디바이스") + " · " + esc(s.name) + '</b><span class="caption">' + esc(s.tier) + " · " + esc(s.who) + " · " + esc(s.at) + "</span></div>";
      }).join("") + "</div></section>" : "");
  }

  // ── 페이지: 디바이스 ──────────────────────────────
  function bridgeFor(tag) { return (D.taxonomy.bridge || []).filter(function (b) { return b.tech === tag; })[0]; }
  function clinicFor(techIds) { return uniq([].concat.apply([], techIds.map(function (t) { var b = bridgeFor(t); return b ? b.clinic : []; }))).map(function (id) { return byId(D.treatments, id); }).filter(Boolean); }
  function won0(n) { return n ? Math.round(n).toLocaleString("ko-KR") + "원" : ""; }
  function bridgeTable() {
    return '<div class="ctable-wrap"><table class="ctable match"><thead><tr><th>홈 디바이스 기술</th><th>피부과 · 관리실 대응</th><th>차이</th><th>홈 제품</th></tr></thead><tbody>' +
      D.taxonomy.bridge.map(function (b) {
        var n = D.devices.filter(function (d) { return d.techIds.indexOf(b.tech) > -1; }).length;
        var c = D.devices.filter(function (d) { return (d.techCandidates || []).indexOf(b.tech) > -1; }).length;
        return "<tr><td>" + chip(b.tech) + "</td><td>" + (b.clinic.length ? b.clinic.map(function (id) { var t = byId(D.treatments, id); return t ? '<a class="chip chip--plain" href="#clinic--' + id + '">' + esc(t.name) + "</a>" : ""; }).join(" ") : '<span class="caption">해당 없음</span>') +
          '</td><td class="caption">' + esc(b.note) + '</td><td class="mono">' + (n ? n + "개" : "–") + (c ? '<br><span class="caption">확인 필요 ' + c + "</span>" : "") + "</td></tr>";
      }).join("") + "</tbody></table></div>";
  }
  function pageDevices() {
    var fams = D.taxonomy.families.filter(function (f) { return HOME_FAMILIES.indexOf(f.id) > -1 && D.devices.some(function (d) { return d.techIds.concat(d.techCandidates || []).some(function (t) { return familyOf(t) === f.id; }); }); });
    var items = D.devices.slice().sort(function (a, b) { return ((a.glowpick && a.glowpick.rank) || 999) - ((b.glowpick && b.glowpick.rank) || 999); });
    return pageHero("assets/device-banner.webp", "58% 60%", "DEVICE", "홈 디바이스<br>데이터베이스", "주요 제품과 상품 정보를 바탕으로 디바이스를 작용 기전별로 분류했습니다. 제조사 공식 자료가 있으면 우선하고, 이름만 있는 모드는 '확인 필요'로 둡니다.", "흰색 홈 뷰티 디바이스와 유리 리본 (AI 생성 콘셉트)") +
      listBar("제품 · 브랜드 · 기술 검색 (예: 메디큐브, 갈바닉, LDM)") + concernChips(items) +
      '<div class="filters" role="group" aria-label="기술 계열 필터"><span class="filters__label">기술</span>' +
      '<button class="chip chip--plain" data-filter="all" aria-pressed="' + (listState.f === "all") + '">전체</button>' +
      fams.map(function (f) { return '<button class="chip f-' + f.id + '" data-filter="' + f.id + '" aria-pressed="' + (listState.f === f.id) + '">' + f.ko + "</button>"; }).join("") + "</div>" +
      '<div class="grid">' + items.map(deviceCard).join("") + '</div><p class="empty" data-listempty hidden>조건에 맞는 제품이 없습니다. <a href="#contribute">새 디바이스 등록하기</a></p>';
  }
  function deviceCard(d) {
    var g = d.glowpick || {}, cand = d.techCandidates || [];
    return '<a class="card dcard" href="#device--' + d.id + '"' + dataAttrs(d, [d.fullName || d.name, d.brand, d.maker || "", d.purpose || "", (d.danawaMethods || []).join(" "), d.techIds.concat(cand).map(tagLabel).join(" ")].join(" ")) + ">" + (g.rank ? '<span class="rank">#' + g.rank + "</span>" : "") +
      '<span class="eyebrow">' + esc(d.brand) + " · " + esc(d.form) + "</span><h3>" + esc(d.name) + "</h3>" +
      "<p>" + esc(d.purpose || "") + (g.price ? ' · <span class="price">정가 ' + won0(g.price) + "</span>" : "") + "</p>" +
      '<div class="meta">' + (d.techIds.length ? chips(d.techIds, false) : "") + (cand.length ? '<span class="badge badge--draft">확인 필요 ' + cand.length + "</span>" : "") + "</div></a>";
  }
  function pageDevice(id) {
    var d = byId(D.devices, id);
    if (!d) return notFound();
    var emptySpecs = [];
    var specs = D.taxonomy.specFields.map(function (f) {
      var s = d.specs[f.key];
      if (!s || (s.status !== "disclosed" && s.status !== "undisclosed")) { emptySpecs.push(f.label); return ""; }
      var v = s && s.status === "disclosed" ? esc((typeof s.value === "number" ? s.value.toLocaleString("ko-KR") : s.value) + " " + (s.unit || "")) + (s.condition ? ' <span class="caption">' + esc(s.condition) + "</span>" : "") : na(s && s.status === "undisclosed" ? "미공개" : "미입력");
      return '<div class="spec"><span class="k">' + f.label + '</span><span class="v">' + v + '</span><span>' + (s && s.tier ? '<span class="badge">' + s.tier + "</span>" : "") + "</span></div>";
    }).join("");
    var related = clinicFor(d.techIds.concat(d.techCandidates || [])); var g = d.glowpick || {}, cand = d.techCandidates || [];
    var core = d.techIds.filter(function (t) { return t !== "vibration" && t !== "heating"; }); if (!core.length) core = d.techIds;
    var sameTech = D.devices.filter(function (x) { return x.id !== d.id && x.techIds.some(function (t) { return core.indexOf(t) > -1; }); });
    var safety = uniq([].concat.apply([], d.techIds.map(function (t) { var x = byId(D.techs, t); return x ? x.safety : []; })));

    var body =
      '<p class="summary">' + (d.techIds.length ? "<b>" + d.techIds.map(tagLabel).join(" + ") + "</b> 계열로 분류했습니다." : "판매 페이지만으로는 작용 기전을 확인할 수 없습니다.") + " 효능 문구는 옮기지 않습니다.</p>" +
      block("기술 분류", '<div class="specs">' +
        '<div class="spec"><span class="k">확인된 기술</span><span class="v">' + (d.techIds.length ? chips(d.techIds) : na("없음")) + '</span><span><span class="badge">' + ((d.sources || []).some(function (x) { return x.tier === "T5"; }) ? "T5" : "T6") + '</span></span></div>' +
        '<div class="spec"><span class="k">확인 필요</span><span class="v">' + (cand.length ? cand.map(function (t) { return '<span class="chip chip--cand f-' + familyOf(t) + '">' + esc(tagLabel(t)) + "?</span>"; }).join(" ") : '<span class="caption">없음</span>') + "</span><span></span></div>" +
        '<div class="spec"><span class="k">판매 페이지 표기</span><span class="v" style="font-family:var(--sans)">' + esc(d.listingNote || "") + "</span><span></span></div></div>" +
        '<p class="caption">출처: 제조사 공식 자료(T5)가 있으면 우선, 없으면 판매 페이지 설명(T6 광고성 설명). \'확인 필요\'는 모드 이름만 있고 기술명이 없어 제조사 상세 페이지 · 설명서로 확인해야 하는 후보입니다.</p>') +
      block("기술 사양", '<div class="specs">' +
        '<div class="spec"><span class="k">제조사 기술 명칭</span><span class="v">' + (d.makerTechName ? esc(d.makerTechName) : na()) + "</span><span></span></div>" + specs + "</div>" +
        (emptySpecs.length ? '<details class="empty-specs"><summary>아직 확인되지 않은 항목 ' + emptySpecs.length + "개</summary><p>" + esc(emptySpecs.join(" · ")) + '</p><a href="#contribute--edit--' + d.id + '">출처와 함께 알려 주기 →</a></details>' : "") +
        '<p class="caption">모든 값은 물리량 · 단위 · 측정 조건 · 출처 등급과 함께 저장됩니다. 공개되지 않은 값은 추정하지 않습니다.</p>') +
      (d.makerModes ? block("제조사 공식 모드", '<div class="chips">' + d.makerModes.map(function (m) { return '<span class="chip chip--plain">' + esc(m) + "</span>"; }).join("") + "</div>" + (d.makerTechNote ? '<p class="note">' + esc(d.makerTechNote) + "</p>" : "")) : "") +
      block("사용 지침 (제조사 문서 기준)", '<div class="specs">' +
        '<div class="spec"><span class="k">권장 사용 주기</span><span class="v" style="font-family:var(--sans)">' + (d.makerGuide ? d.makerGuide.map(esc).join("<br>") : na()) + "</span><span>" + (d.makerGuide ? '<span class="badge">T5</span>' : "") + "</span></div>" +
        ["사용 가능 부위", "금기 · 주의사항"].map(function (k) { return '<div class="spec"><span class="k">' + k + '</span><span class="v">' + na() + "</span><span></span></div>"; }).join("") + "</div>" +
        '<p class="caption">기술 계열의 일반적인 주의사항 (제품 지침이 우선): ' + esc(safety.join(" · ")) + "</p>") +
      block("허가 · 인증", "<p>" + na("확인 필요") + ' <span class="caption">공산품 / 의료기기 등급과 허가 목적을 규제기관 문서(T1)로 확인해 기재합니다.</span></p>') +
      block("근거", '<div class="specs"><div class="spec"><span class="k">독립 연구 (T2)</span><span class="v">' + na() + '</span><span></span></div><div class="spec"><span class="k">제조사 인체적용시험 (T4)</span><span class="v">' + na() + "</span><span></span></div></div>") +
      block("비용", '<div class="specs">' +
        '<div class="spec"><span class="k">정가</span><span class="v">' + (g.price ? won0(g.price) + ' <span class="caption">' + esc(g.observedAt) + " 조회</span>" : na()) + "</span><span></span></div>" +
        (d.priceUsd ? '<div class="spec"><span class="k">글로벌 공식몰가</span><span class="v">US$' + d.priceUsd + ' <span class="caption">medicube.us · ' + esc(g.observedAt) + ' 조회</span></span><span><span class="badge">T5</span></span></div>' : "") +
        '<div class="spec"><span class="k">최저가 · 구매 링크</span><span class="v" style="font-family:var(--sans)"><span class="caption">제휴 링크 연동 예정 — 연결 시 \'광고 · 제휴\' 표기, 순위 · 평가와 분리</span></span><span></span></div>' +
        ["소모품 비용", "보증기간"].map(function (k) { return '<div class="spec"><span class="k">' + k + '</span><span class="v">' + na() + "</span><span></span></div>"; }).join("") + "</div>") +
      block("HOME → CLINIC · 같은 기술 계열의 전문 시술", related.length
        ? '<div class="grid">' + related.map(treatmentCard).join("") + '</div><p class="note">같은 계열이라도 출력, 표적 깊이, 허가 목적, 시행 주체가 다릅니다. 이 연결은 대체 가능성을 뜻하지 않습니다.</p>'
        : '<p class="caption">이 기술 계열과 직접 대응하는 전문 시술 레코드가 아직 없습니다.</p>') +
      (sameTech.length ? block("같은 기술을 쓰는 다른 디바이스", '<div class="grid">' + sameTech.map(deviceCard).join("") + "</div>") : "") +
      block("정보 출처", '<div class="srcs">' + (d.sources || []).map(function (x) { return '<p><span class="badge">' + x.tier + '</span> <a href="' + x.url + '" target="_blank" rel="noopener">' + esc(x.label) + "</a></p>"; }).join("") +
        (g.url ? '<p><span class="badge">T6</span> <a href="' + g.url + '" target="_blank" rel="noopener">제품 랭킹 페이지</a> <span class="caption">순위 · 정가 · 판매처 설명 (' + esc(g.observedAt) + " 조회)</span></p>" : "") +
        ((d.sources || []).length ? "" : '<p class="caption">제조사 공식 스펙(T5) 미입력</p>') + "</div>");

    return '<a class="back" href="#device">← Device</a><div class="split detail"><div>' +
      '<p class="eyebrow">' + esc(d.brand) + " · " + esc(d.form) + "</p><h1>" + esc(d.name) + "</h1>" + '<p class="sub">' + esc(d.purpose || "") + "</p>" + body + "</div>" +
      aside([["인기 순위", g.rank ? "#" + g.rank + ' <span class="caption">뷰티 디바이스 · ' + esc(g.observedAt) + "</span>" : '<span class="caption">–</span>'], ["레코드 상태", statusBadge(d.status)], ["기술 계열", d.techIds.length ? chips(d.techIds) : na("확인 필요")], ["마지막 검증일", na("검증 전")]], "device:" + d.id, buyBlock(d)) + "</div>";
  }

  // ── 페이지: 시술 ──────────────────────────────────
  function pageClinic() {
    var groups = clinicGroup === "concern"
      ? (D.taxonomy.concerns || []).map(function (c) { return { title: c.label, sub: "목적별", items: D.treatments.filter(function (t) { return (t.concerns || []).indexOf(c.id) > -1; }) }; })
      : ["energy", "aesthetic", "injectable", "surface"].map(function (k) { return { title: KIND_LABEL[k], sub: KIND_KO[k], items: D.treatments.filter(function (t) { return t.kind === k; }) }; });
    return pageHero("assets/clinic-banner.webp", "70% 50%", "CLINIC", "피부과 · 관리실<br>시술 백과", "상품명이 아니라 작용 기전과 성분으로 시술을 이해하도록 돕습니다. 목적은 일반적으로 소개되는 범위이며 효과를 보장하지 않습니다. 시술 추천 · 진단은 제공하지 않습니다.", "라벤더 유리 파티션이 있는 피부관리 공간 (AI 생성 콘셉트)") +
      listBar("시술 · 성분 · 장비 검색 (예: 써마지, PLLA, LDM)") +
      '<div class="seg seg--sm" role="group" aria-label="묶는 방식"><button data-cgroup="concern" aria-pressed="' + (clinicGroup === "concern") + '">목적별</button><button data-cgroup="kind" aria-pressed="' + (clinicGroup === "kind") + '">방식별</button></div>' +
      groups.filter(function (g) { return g.items.length; }).map(function (g) {
        return '<div data-group><div class="group-title"><h2>' + esc(g.title) + '</h2><span class="caption">' + esc(g.sub) + " · " + g.items.length + "</span></div>" +
          '<div class="grid">' + g.items.map(treatmentCard).join("") + "</div></div>";
      }).join("") + '<p class="empty" data-listempty hidden>조건에 맞는 시술이 없습니다.</p>';
  }
  function treatmentCard(t) {
    return '<a class="card" href="#clinic--' + t.id + '"' + dataAttrs(t, [t.name, t.en, t.product, t.maker, t.ingredients.join(" "), t.delivery, t.techIds.map(tagLabel).join(" ")].join(" ")) + '><span class="eyebrow">' + esc(t.en) + "</span><h3>" + esc(t.name) + "</h3>" +
      "<p>" + esc(t.ingredients.length ? "주요 성분: " + t.ingredients.join(", ") : t.delivery) + "</p>" +
      '<div class="meta">' + chips(t.techIds, false) + (t.concerns || []).map(function (c) { return '<span class="mini mini--c">' + esc(concernLabel(c)) + "</span>"; }).join("") + "</div></a>";
  }
  function pageTreatment(id) {
    var t = byId(D.treatments, id);
    if (!t) return notFound();
    var homeBridgeTechs = (D.taxonomy.bridge || []).filter(function (b) { return b.clinic.indexOf(t.id) > -1; }).map(function (b) { return b.tech; });
    var homeTechs = homeBridgeTechs;
    var devices = D.devices.filter(function (d) { return d.techIds.some(function (x) { return homeBridgeTechs.indexOf(x) > -1; }); });
    var similar = t.similar.map(function (s) { return byId(D.treatments, s); }).filter(Boolean);

    var body =
      '<p class="summary">' + esc(t.mechanism) + "</p>" +
      block(t.kind === "injectable" ? "주요 성분 · 전달" : "에너지 전달 방식", '<div class="specs">' +
        '<div class="spec"><span class="k">장비 · 제품</span><span class="v">' + esc(t.product) + "</span><span></span></div>" +
        '<div class="spec"><span class="k">제조사</span><span class="v">' + esc(t.maker) + '</span><span><span class="badge">검수 전</span></span></div>' +
        '<div class="spec"><span class="k">전달 방식</span><span class="v">' + esc(t.delivery) + "</span><span></span></div>" +
        '<div class="spec"><span class="k">주요 성분</span><span class="v">' + (t.ingredients.length ? esc(t.ingredients.join(", ")) : '<span class="caption">해당 없음 (에너지 기반)</span>') + "</span><span></span></div></div>") +
      block("적용 조직 · 깊이 (일반 설명)", skinSvg(treatmentLayerTechs(t)) || na()) +
      block("사용 목적", list(t.purposes)) +
      block("허가사항", "<p>" + na("확인 필요") + ' <span class="caption">허가 목적 · 범위는 규제기관 문서(T1)로 확인해 기재합니다.</span></p>') +
      block("일반적인 과정 · 예상 회복", '<p class="caption">의료기관 · 장비 설정 · 개인에 따라 다릅니다. 초안 미작성 — 의료진 검수 후 게시합니다.</p>') +
      block("알려진 위험 · 부작용", list(t.risks)) +
      block("의료진의 판단이 필요한 사항", list(["시술 적합성 · 금기 여부", "시술 강도 · 용량 · 간격", "다른 시술 · 홈 디바이스와의 병행 및 재개 시점", "부작용 발생 시 대응"])) +
      block("가격 조사 정보", "<p>" + na("조사 전") + ' <span class="caption">가격은 조사일 · 표본 수 · 채널과 함께만 게시합니다.</span></p>') +
      block("관련 홈 디바이스 기술", homeTechs.length
        ? chips(homeBridgeTechs) + (devices.length ? '<div class="grid" style="margin-top:14px">' + devices.map(deviceCard).join("") + "</div>" : "") +
          '<p class="note">같은 기술 계열이라는 사실만으로 같은 효과나 안전성을 갖는다고 볼 수 없습니다.</p>'
        : '<p class="caption">이 시술과 직접 대응하는 홈 디바이스 기술은 없습니다. 주입형 시술은 의료인만 시행할 수 있습니다.</p>') +
      (similar.length ? block("유사 시술", '<div class="grid">' + similar.map(treatmentCard).join("") + "</div>") : "") +
      block("학술자료 · 공식 문서", "<p>" + na("출처 미입력") + "</p>");

    return '<a class="back" href="#clinic">← Clinic</a><div class="split detail"><div>' +
      '<p class="eyebrow">' + KIND_LABEL[t.kind] + " · " + esc(t.en) + "</p><h1>" + esc(t.name) + "</h1>" + chips(t.techIds) + body + "</div>" +
      aside([["레코드 상태", statusBadge(t.status)], ["분류", esc(KIND_KO[t.kind])], ["기술 · 성분 계열", chips(t.techIds)], ["검수일", na("검수 전")]], "clinic:" + t.id) + "</div>";
  }

  // ── 페이지: 기술 백과 ─────────────────────────────
  function pageScience() {
    var order = D.taxonomy.families.map(function (f) { return f.id; });
    var items = D.techs.slice().sort(function (a, b) { return order.indexOf(a.family) - order.indexOf(b.family); });
    return pageHero("assets/relev/editorial/evidence.webp", "72% 55%", "SCIENCE", "피부관리<br>기술 백과", "제품과 시술을 이해하기 위한 기본기. 원리, 쉬운 설명, 확인된 근거의 범위, 안전성과 한계를 함께 적습니다. 처음이라면 <a href=\"#learn\">1분 기전 가이드</a>부터 보세요.", "현미경과 연구 노트 (AI 생성 콘셉트)") +
      listBar("기술 · 별칭 검색 (예: 갈바닉, EP, 물방울)") + concernChips(D.techs) +
      '<div class="grid">' + items.map(function (t) {
        var img = techImg(t.id), fam = familyMeta(t.family);
        return '<a class="card card--img" href="#science--' + t.id + '"' + dataAttrs({ concerns: t.concerns, techIds: [t.id] }, [t.name, t.en, t.question, t.summary, (t.aka || []).join(" ")].join(" ")) + ">" + (img ? '<img class="card__img" src="' + img + '" alt="" loading="lazy" width="1536" height="1024">' : "") + '<span class="eyebrow">' + esc(fam ? fam.label : t.en) + "</span><h3>" + esc(t.question) + "</h3><p>" + esc(t.summary) + '</p><div class="meta">' + chip(t.id, false) + (t.studies && t.studies.length ? '<span class="badge">T2 논문 ' + t.studies.length + "</span>" : "") + "</div></a>";
      }).join("") + '</div><p class="empty" data-listempty hidden>찾는 기술이 없습니다.</p>';
  }
  function pageTech(id) {
    var t = byId(D.techs, id);
    if (!t) return notFound();
    var devices = D.devices.filter(function (d) { return d.techIds.indexOf(id) > -1; });
    var treatments = D.treatments.filter(function (x) { return x.techIds.indexOf(id) > -1; });
    var fam = familyMeta(t.family);
    var body =
      (techImg(id) ? figure(techImg(id), t.name + " 기술을 표현한 콘셉트 이미지", "fig--cover") : "") +
      '<p class="summary">' + esc(t.summary) + "</p>" +
      ((t.concerns || []).length ? '<p class="chips" style="margin-top:12px">' + t.concerns.map(function (c) { return '<span class="mini mini--c">' + esc(concernLabel(c)) + "</span>"; }).join("") + '<span class="caption">일반적으로 소개되는 목적 · 효과 보장 아님</span></p>' : "") +
      block("쉬운 설명", '<p class="plain">' + esc(t.plain) + "</p>") +
      block(t.id === "units" ? "단위별 의미" : "작용 방식", list(t.mechanism)) +
      (TECH_LAYERS[id] ? block("적용 층 (일반 설명)", skinSvg([id])) : "") +
      (t.purposes.length ? block("일반적인 사용 목적", list(t.purposes)) : "") +
      block("현재 확인된 근거", '<p class="note note--warn">' + esc(t.evidence) + "</p>") +
      (t.safety.length ? block("안전성 · 제한사항", list(t.safety)) : "") +
      (devices.length ? block("대표 홈 디바이스", '<div class="grid">' + devices.map(deviceCard).join("") + "</div>") : "") +
      (treatments.length ? block("관련 전문 장비 · 시술", '<div class="grid">' + treatments.map(treatmentCard).join("") + "</div>") : "") +
      block("관련 연구 (PubMed)", (t.studyNote ? '<p class="note">' + esc(t.studyNote) + "</p>" : "") +
        ((t.studies || []).length ? '<ol class="studies">' + t.studies.map(function (x) { return '<li><span class="badge">T2</span> <a href="https://pubmed.ncbi.nlm.nih.gov/' + x.pmid + '/" target="_blank" rel="noopener">' + esc(x.title) + '</a><span class="caption">' + esc(x.journal || "") + " · " + esc(x.year) + (x.type ? " · " + esc(x.type) : "") + " · PMID " + x.pmid + "</span></li>"; }).join("") + "</ol>" : "<p>" + na("관련 연구 없음") + "</p>") +
        (t.studySearch ? '<p class="caption">PubMed 검색 ' + t.studySearch.count + "건 중 관련도 높은 문헌 선별 (" + t.studySearch.date + "). 논문이 있다는 것이 특정 제품의 효과를 뜻하지는 않습니다.</p>" : ""));
    return '<a class="back" href="#science">← Science</a><div class="split detail"><div>' +
      '<p class="eyebrow">' + esc(t.question) + "</p><h1>" + esc(t.name) + '</h1><p class="sub">' + esc(t.en) + "</p>" + body + "</div>" +
      aside([["레코드 상태", statusBadge(t.status)], ["계열", fam ? '<span class="chip f-' + fam.id + '">' + fam.label + "</span>" : ""], ["다른 이름", esc(t.aka.join(", "))], ["검수일", na("검수 전")]]) + "</div>";
  }

  // 구매 링크: data/affiliate.json에 쿠팡 파트너스 링크가 있으면 제휴 링크 + 고지 문구, 없으면 일반 쿠팡 검색 링크
  var AFF_NOTICE = "이 링크는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.";
  function coupangSearchUrl(d) { return "https://www.coupang.com/np/search?q=" + encodeURIComponent(d.fullName || ((d.brand ? d.brand + " " : "") + d.name)); }
  function buyBlock(d) {
    var aff = (D.affiliate && D.affiliate.links && D.affiliate.links[d.id]) || null;
    if (aff) {
      return '<div class="buy"><a class="btn buy__btn" href="' + esc(aff) + '" target="_blank" rel="sponsored noopener">쿠팡에서 보기<span class="buy__tag">제휴</span></a>' +
        '<p class="buy__note">' + esc(AFF_NOTICE) + " 수수료는 분류 · 순위 · 설명에 영향을 주지 않습니다.</p></div>";
    }
    return '<div class="buy"><a class="btn btn--soft buy__btn" href="' + esc(coupangSearchUrl(d)) + '" target="_blank" rel="noopener">쿠팡에서 검색</a>' +
      '<p class="buy__note">일반 검색 링크예요. 가격과 판매처는 쿠팡에서 직접 확인하세요.</p></div>';
  }
  function aside(rows, compareKey, extra) {
    return '<aside class="aside"><dl>' + rows.map(function (r) { return "<div><dt>" + r[0] + "</dt><dd>" + r[1] + "</dd></div>"; }).join("") + "</dl>" +
      (extra || "") +
      (compareKey ? compareBtn(compareKey) : "") +
      '<a class="caption" href="#contribute--edit' + (compareKey ? "--" + compareKey.split(":")[1] : "") + '">정보 수정 요청하기 →</a></aside>';
  }
  function head(eyebrow, title, desc) {
    return '<div class="page-head"><p class="eyebrow">' + eyebrow + "</p><h1>" + title + "</h1><p>" + desc + "</p></div>";
  }
  function banner(src, alt) { return '<div class="banner"><img src="' + src + '" alt="' + esc(alt) + '" width="1672" height="941"></div>'; }
  function pageHero(src, pos, eyebrow, title, desc, alt) {
    return '<div class="bandwrap"><section class="phero" style="--pos:' + pos + '"><img src="' + src + '" alt="' + esc(alt) + '" width="1672" height="941" fetchpriority="high"><div class="phero__in"><div class="phero__text"><p class="eyebrow">' + eyebrow + "</p><h1>" + title + "</h1><p>" + desc + '</p></div></div></section></div>';
  }
  function notFound() { return head("404", "항목을 찾을 수 없습니다", '<a href="#home">홈으로</a>'); }

  // ── 페이지: 비교 ──────────────────────────────────
  function pageCompare() {
    var sel = tray();
    var ents = sel.map(entity).filter(Boolean);
    var slots = [0, 1, 2].map(function (i) {
      var e = ents[i];
      if (e) return '<div class="slot slot--on"><span class="slot__kind">' + (e.kind === "device" ? "홈 디바이스 · " + esc(e.rec.brand) : "시술") + "</span><b>" + esc(e.rec.name) + '</b><button class="slot__x" data-untray="' + esc(e.key) + '" aria-label="' + esc(e.rec.name) + ' 빼기">×</button></div>';
      return '<button class="slot slot--add" data-pick' + (i > ents.length ? " disabled" : "") + '><span class="slot__plus" aria-hidden="true">+</span>' + (i === 0 ? "비교할 항목 검색" : i === 1 ? "하나 더 추가" : "세 번째 (선택)") + "</button>";
    }).join("");
    return head("COMPARE", "비교", "제품 ↔ 제품, 제품 ↔ 시술, 시술 ↔ 시술. 같은 기준의 항목만 나란히 놓고, 비교할 수 없는 것은 왜 비교하지 않는지 알려 드립니다.") +
      '<div class="slots">' + slots + "</div>" +
      (ents.length >= 2 ? compareTable(ents) : '<p class="empty">두 개 이상 고르면 비교표가 나타나요. 예: 써마지 ↔ 올리지오</p>') +
      '<details class="match-wrap"><summary>홈 디바이스 기술 ↔ 피부과 · 관리실 대응표</summary>' + bridgeTable() + '<p class="caption">같은 원리 계열을 보여 줄 뿐, 홈 디바이스가 시술을 대체한다는 뜻이 아닙니다.</p></details>' +
      '<section class="section" id="calc"><p class="eyebrow">Beauty Economics</p><h2 style="margin:6px 0 8px">단순 구매비용 계산기</h2>' +
      '<p class="caption" style="margin-bottom:16px">직접 입력한 금액으로 단순 구매비용만 비교합니다. RE:LEV는 실제 제품 · 시술 가격을 넣어 두지 않았습니다.</p>' +
      calcHtml() + "</section>";
  }

  // ── 비교 항목 검색 시트 ──────────────────────────
  var pickKind = "all";
  function pickResults(q) {
    q = (q || "").trim().toLowerCase();
    var inTray = tray();
    var devs = D.devices.map(function (d) { return { key: "device:" + d.id, kind: "device", name: d.name, sub: d.brand + " · " + (d.techIds.length ? d.techIds.map(tagLabel).join(" + ") : "기술 확인 필요"), hay: [d.name, d.fullName || "", d.brand, d.techIds.concat(d.techCandidates || []).map(tagLabel).join(" ")].join(" ").toLowerCase(), rank: (d.glowpick && d.glowpick.rank) || 999 }; });
    var trs = D.treatments.map(function (t) { return { key: "clinic:" + t.id, kind: "clinic", name: t.name, sub: "시술 · " + t.techIds.map(tagLabel).join(" + "), hay: [t.name, t.nameEn || "", t.id, t.techIds.map(tagLabel).join(" ")].join(" ").toLowerCase(), rank: 0 }; });
    var all = (pickKind === "device" ? devs : pickKind === "clinic" ? trs : devs.concat(trs)).filter(function (x) { return inTray.indexOf(x.key) < 0; });
    var score = function (x) { var n = x.name.toLowerCase(); return n.indexOf(q) === 0 ? 0 : n.indexOf(q) > -1 ? 1 : 2; };
    var hit = q ? all.filter(function (x) { return x.hay.indexOf(q) > -1; }).sort(function (a, b) { return score(a) - score(b) || (a.kind === b.kind ? a.rank - b.rank : 0); }) : null;
    var row = function (x) { return '<button class="pick" data-pickkey="' + esc(x.key) + '"><span class="pick__badge pick__badge--' + x.kind + '">' + (x.kind === "device" ? "디바이스" : "시술") + '</span><span class="pick__t"><b>' + esc(x.name) + "</b><span>" + esc(x.sub) + '</span></span><span class="pick__add" aria-hidden="true">+</span></button>'; };
    if (hit) return hit.length ? '<p class="psheet__h">검색 결과 ' + hit.length + "개</p>" + hit.slice(0, 40).map(row).join("") : '<p class="psheet__empty">\'' + esc(q) + "'에 맞는 항목이 없어요.<br>브랜드 · 제품명 · 기술명(예: 고주파, 갈바닉)으로 찾아보세요.</p>";
    var out = "";
    if (pickKind !== "clinic") out += '<p class="psheet__h">많이 찾는 디바이스</p>' + devs.filter(function (x) { return inTray.indexOf(x.key) < 0; }).sort(function (a, b) { return a.rank - b.rank; }).slice(0, pickKind === "device" ? 30 : 6).map(row).join("");
    if (pickKind !== "device") out += '<p class="psheet__h">시술</p>' + trs.filter(function (x) { return inTray.indexOf(x.key) < 0; }).slice(0, pickKind === "clinic" ? 40 : 6).map(row).join("");
    return out;
  }
  function openPicker() {
    var sh = document.getElementById("sheet");
    if (!sh) { sh = document.createElement("div"); sh.id = "sheet"; document.body.appendChild(sh); }
    pickKind = "all";
    sh.innerHTML = '<div class="psheet__bg" data-sheet-close></div><div class="psheet" role="dialog" aria-modal="true" aria-label="비교할 항목 찾기"><div class="psheet__grab" aria-hidden="true"></div>' +
      '<div class="psheet__top"><b>비교할 항목 찾기</b><button class="psheet__close" data-sheet-close aria-label="닫기">×</button></div>' +
      '<label class="psheet__search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/></svg><input type="search" data-pickq placeholder="제품명 · 브랜드 · 기술 · 시술명" aria-label="비교할 항목 검색" autocomplete="off"></label>' +
      '<div class="seg seg--sm" role="tablist"><button role="tab" data-pickkind="all" aria-selected="true">전체</button><button role="tab" data-pickkind="device" aria-selected="false">디바이스</button><button role="tab" data-pickkind="clinic" aria-selected="false">시술</button></div>' +
      '<div class="psheet__list" id="pickList">' + pickResults("") + "</div></div>";
    document.body.classList.add("sheet-open");
    setTimeout(function () { var i = sh.querySelector("[data-pickq]"); if (i) i.focus(); }, 60);
  }
  function closePicker() { var sh = document.getElementById("sheet"); if (sh) sh.innerHTML = ""; document.body.classList.remove("sheet-open"); }

  // ── 전체 메뉴 (모바일 '전체' 탭) ────────────────────
  function pageMenu() {
    var g = function (title, items) { return '<section class="mgroup"><h2>' + title + '</h2><div class="cells">' + items.map(function (x) { return '<a class="cell" href="' + x[0] + '"><span class="cell__t"><b>' + x[1] + "</b><span>" + x[2] + '</span></span><span class="cell__chev" aria-hidden="true">›</span></a>'; }).join("") + "</div></section>"; };
    return '<div class="page-head"><h1>전체</h1></div>' +
      '<form class="h-search" data-search role="search" style="margin:0 0 8px"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/></svg><input type="search" placeholder="제품 · 기술 · 시술 검색" aria-label="통합 검색"><button type="submit">검색</button></form>' +
      g("배우기", [["#learn", "1분 기전 가이드", "네 가지 에너지로 보는 피부관리 기술"], ["#science", "기술 백과", "기술별 원리 · 근거 · 한계"], ["#decode", "이름 해독", "'쎄라' · '에어샷' 같은 제조사 용어 풀이"]]) +
      g("찾기", [["#device", "홈 디바이스", D.devices.length + "개 · 작용 기전별 분류"], ["#clinic", "시술 백과", D.treatments.length + "개 · 피부과 · 관리실 시술"], ["#search", "통합 검색", "제품 · 기술 · 시술을 한 번에"]]) +
      g("도구", [["#compare", "비교", "최대 3개를 나란히"], ["#compare--calc", "비용 계산기", "직접 입력한 금액으로 단순 비교"]]) +
      g("참여 · 정보", [["#contribute", "정보 등록 · 수정 요청", "출처와 함께 알려 주세요"], ["#about", "서비스 소개", "출처 등급 · 운영 원칙"], ["#brand", "브랜드", "RE:LEV 로고 · 컬러 · 톤"]]);
  }
  function techsOf(e) { return e.rec.techIds.length ? e.rec.techIds : (e.rec.techCandidates || []); }
  function compareTable(ents) {
    var mixed = uniq(ents.map(function (e) { return e.kind; })).length > 1;
    var shared = ents.map(techsOf).reduce(function (a, b) { return a.filter(function (x) { return b.indexOf(x) > -1; }); });
    var rows = [
      ["구분", function (e) { return e.kind === "device" ? "홈 디바이스" : KIND_KO[e.rec.kind]; }],
      ["기술 · 성분 계열", function (e) { return chips(techsOf(e)); }, true],
      ["에너지 전달 · 성분", function (e) { return e.kind === "device" ? esc(techsOf(e).map(tagLabel).join(" + ")) : esc(e.rec.delivery + (e.rec.ingredients.length ? " · " + e.rec.ingredients.join(", ") : "")); }, true],
      ["작용 기전", function (e) { return e.kind === "device" ? '<span class="caption">제품별 기전 미입력 — 기술 백과 참고</span>' : esc(e.rec.mechanism); }, true],
      ["적용 층 (일반 설명)", function (e) { return esc(uniq(techsOf(e).map(function (t) { var x = byId(D.techs, t); return x ? x.layer : null; }).filter(Boolean)).join(" / ")) || na(); }, true],
      ["시행 주체", function (e) { return e.kind === "device" ? "사용자 본인 · 제조사 지침" : "의료인"; }],
      ["허가 · 인증", function () { return na("확인 필요"); }, true],
      ["가격", function (e) { var g = e.rec.glowpick; return g && g.price ? won0(g.price) + ' <span class="caption">정가 · ' + g.observedAt + "</span>" : na(e.kind === "device" ? "미입력" : "조사 전"); }, true],
      ["회복", function (e) { return e.kind === "device" ? '<span class="caption">해당 없음 / 제조사 지침</span>' : "개인차 · 의료진 안내"; }],
      ["알려진 위험", function (e) {
        if (e.kind === "clinic") return list(e.rec.risks);
        return list(uniq([].concat.apply([], techsOf(e).map(function (t) { var x = byId(D.techs, t); return x ? x.safety : []; }))));
      }, true],
      ["레코드 상태", function (e) { return statusBadge(e.rec.status); }]
    ];
    var html = (mixed ? '<p class="note note--warn" style="margin:0 0 14px">홈 디바이스와 전문 시술은 같은 기술 계열이어도 출력, 표적 깊이, 허가 목적, 시행 주체가 다릅니다. 이 표는 효과의 크기를 비교하지 않습니다.</p>' : "") +
      '<div class="ctable-wrap"><table class="ctable"><thead><tr><th></th>' +
      ents.map(function (e) { return '<th><a href="#' + e.kind + "--" + e.rec.id + '">' + esc(entityName(e)) + "</a></th>"; }).join("") +
      "</tr></thead><tbody>" +
      rows.map(function (r) { return "<tr><th>" + r[0] + "</th>" + ents.map(function (e) { return "<td>" + r[1](e) + "</td>"; }).join("") + "</tr>"; }).join("") +
      "</tbody></table></div>";

    html += '<section class="block"><h2>공통 기술 계열</h2><p>' + (shared.length
      ? chips(shared) + ' <span class="caption">— 같은 물리 원리 계열을 공유합니다. 같은 계열 ≠ 같은 효과 · 안전성.</span>'
      : '<span class="caption">공유하는 기술 계열이 없습니다. 서로 다른 원리로 작동합니다.</span>') + "</p></section>";
    html += '<section class="block"><h2>출력 비교</h2>' + powerVerdict(ents) + "</section>";
    return html;
  }
  // 9.5 원칙: 같은 물리량 · 단위 · 측정 조건이 모두 공개된 경우에만 비율을 계산
  function powerVerdict(ents) {
    if (ents.some(function (e) { return e.kind !== "device"; })) {
      return '<p class="note">전문 시술 장비의 출력은 대부분 공개 조건 · 측정 방식이 홈 디바이스와 달라 비율을 계산하지 않습니다. "시술 1회 = 홈 디바이스 n회" 같은 환산도 제공하지 않습니다.</p>';
    }
    var a = ents[0].rec, b = ents[1].rec;
    var rows = D.taxonomy.specFields.map(function (f) {
      var x = a.specs[f.key], y = b.specs[f.key], why;
      if (!x || !y || x.status !== "disclosed" || y.status !== "disclosed") why = "한쪽 이상 값이 공개 · 입력되지 않음";
      else if (x.unit !== y.unit) why = "단위가 다름 (" + x.unit + " / " + y.unit + ")";
      else if ((x.condition || "") !== (y.condition || "")) why = "측정 조건이 다름";
      else if (!x.tier || !y.tier) why = "출처 등급 미확인";
      else return "<div><b>" + f.label + "</b><span>" + esc(a.name) + "의 값은 " + esc(b.name) + "의 " + Math.round((x.value / y.value) * 100) + "% · 물리적 측정값 비율이며 효과 비율이 아닙니다.</span></div>";
      return "<div><b>" + f.label + "</b><span>비교하지 않음 — " + why + "</span></div>";
    });
    return '<div class="verdict">' + rows.join("") + '</div><p class="caption">소비전력, 실제 출력, 주파수, 에너지 밀도, 조사 면적, 펄스 폭, 작동 시간, 총 조사 에너지, 조직 전달 에너지는 서로 다른 값으로 취급합니다.</p>';
  }

  // ── 비용 계산기 ───────────────────────────────────
  function num(v) { var n = Number(String(v).replace(/[^\d.]/g, "")); return isFinite(n) ? n : 0; }
  function won(n) { return Math.round(n).toLocaleString("ko-KR") + "원"; }
  function calcHtml() {
    var field = function (k, label, ph) { return "<label>" + label + '<input inputmode="numeric" data-calc="' + k + '" value="' + esc(calcState[k]) + '" placeholder="' + ph + '"></label>'; };
    return '<div class="calc"><div>' +
      field("price", "홈 디바이스 구매가 (원)", "예: 800000") +
      field("consumable", "연간 소모품 비용 (원, 선택)", "0") +
      field("years", "소모품 계산 기간 (년, 선택)", "0") +
      field("session", "전문 시술 1회 비용 (원)", "예: 100000") +
      '<button class="btn btn--ghost" data-calc-example>가상 예시 넣기</button></div>' +
      '<div class="result" id="calc-result">' + calcResult() + "</div></div>";
  }
  function calcResult() {
    var price = num(calcState.price), cons = num(calcState.consumable) * num(calcState.years), session = num(calcState.session);
    if (!price || !session) return '<span class="caption">디바이스 구매가와 시술 1회 비용을 입력하세요.</span>';
    var total = price + cons, n = total / session;
    return '<span class="eyebrow">단순 구매비용 손익분기</span><span class="big">' + (Math.round(n * 10) / 10).toLocaleString("ko-KR") + "회</span>" +
      '<span class="formula">(' + won(price) + (cons ? " + 소모품 " + won(cons) : "") + ") ÷ " + won(session) + "</span>" +
      '<p class="note note--warn" style="margin:4px 0 0">이 숫자는 지출 금액만 나눈 단순 산수입니다. 홈 디바이스 사용과 전문 시술의 효과가 같다는 가정을 포함하지 않으며, 시술 1회를 디바이스 몇 회로 대체할 수 있다는 의미가 아닙니다.</p>';
  }

  // ── 페이지: 검색 ──────────────────────────────────
  function pageSearch(q) {
    var s = q.trim().toLowerCase();
    var hit = function (o, keys) { return keys.some(function (k) { var v = o[k]; return v && (Array.isArray(v) ? v.join(" ") : String(v)).toLowerCase().indexOf(s) > -1; }); };
    var techs = s ? D.techs.filter(function (t) { return hit(t, ["name", "en", "aka", "summary", "question"]); }) : [];
    var txs = s ? D.treatments.filter(function (t) { return hit(t, ["name", "en", "ingredients", "maker", "delivery"]) || t.techIds.some(function (x) { return tagLabel(x).toLowerCase().indexOf(s) > -1; }); }) : [];
    var devs = s ? D.devices.filter(function (d) { return hit(d, ["name", "brand"]) || d.techIds.some(function (x) { return tagLabel(x).toLowerCase().indexOf(s) > -1; }); }) : [];
    var total = techs.length + txs.length + devs.length;
    return '<form class="search-page" data-search><input type="search" id="q2" value="' + esc(q) + '" placeholder="기술 · 시술 · 성분 검색" aria-label="검색"><button class="btn">검색</button></form>' + head("SEARCH", q ? "“" + esc(q) + "” 검색 결과" : "검색", q ? total + "건" : "") +
      (techs.length ? '<div class="group-title"><h2>기술</h2></div><div class="grid">' + techs.map(function (t) { return '<a class="card" href="#science--' + t.id + '"><h3>' + esc(t.name) + "</h3><p>" + esc(t.summary) + "</p></a>"; }).join("") + "</div>" : "") +
      (txs.length ? '<div class="group-title"><h2>시술</h2></div><div class="grid">' + txs.map(treatmentCard).join("") + "</div>" : "") +
      (devs.length ? '<div class="group-title"><h2>디바이스</h2></div><div class="grid">' + devs.map(deviceCard).join("") + "</div>" : "") +
      (total ? "" : '<p class="empty">' + (s ? "결과가 없습니다. " : "") + "예: RF, 초음파, PLLA, 써마지</p>");
  }

  // ── 페이지: About ─────────────────────────────────
  function pageAbout() {
    return head("ABOUT", "편집 원칙", "RE:LEV는 피부관리 기술에 대한 정보 장벽을 낮추고, 누구나 자신의 피부에 사용되는 기술을 이해해 더 합리적으로 선택하도록 돕습니다.") +
      '<section class="block"><h2>정보 출처 등급</h2><div class="tiers">' +
      D.taxonomy.tiers.map(function (t) { return '<div class="tier"><span class="badge">' + t.id + "</span>" + esc(t.label) + "</div>"; }).join("") +
      '</div><p class="caption" style="margin-top:10px">등급이 다른 출처를 같은 수준의 과학적 근거로 취급하지 않습니다.</p></section>' +
      block("하지 않는 것", list([
        "확인되지 않은 제품 스펙을 만들거나 추정하지 않습니다.",
        "가상의 사용자 수 · 후기 · 임상 결과를 실제 데이터처럼 표시하지 않습니다.",
        "홈 디바이스와 전문 장비의 출력 · 효과를 동일시하지 않습니다.",
        "개인별 진단 · 시술 추천 · 처방을 제공하지 않습니다.",
        "안전성이 확인되지 않은 기기 조합의 병행 사용을 추천하지 않습니다.",
        "의료기관 추천 · 예약 · 환자 소개 수수료 모델을 운영하지 않습니다 (규제 검토 전).",
        "홈케어와 피부과를 대립시키지 않습니다."
      ])) +
      block("광고와 평가의 분리", "<p>스폰서 콘텐츠는 별도 표기하며, 광고 · 제휴 여부는 데이터 값, 비교 결과, 정렬 순서에 영향을 주지 않습니다.</p>") +
      block("레코드 상태", '<div class="tiers">' + Object.keys(D.taxonomy.status).map(function (k) { return '<div class="tier">' + statusBadge(k) + "</div>"; }).join("") + "</div>") +
      block("정보 수정 요청", '<p>제조사 · 의료기관 · 사용자 누구나 출처와 함께 수정 요청을 보낼 수 있도록 할 예정입니다 (P1). 프로토타입에서는 아직 받지 않습니다.</p>') +
      block("브랜드 생태계", "<p><b>KHUN STUDIO</b>가 브랜드 전략, 콘텐츠, 웹 개발을 맡습니다. 남성 자기관리 플랫폼 <b>RE:BOOT</b>와는 독립적인 소비자 아이덴티티를 유지하되 리서치 · 콘텐츠 제작 · 개발 인프라를 공유합니다.</p>");
  }

  // ── 로고 시스템: re:lev — 세포 두 개와 파동 한 줄 ─────────
  // 워드마크는 흐르는 세리프 소문자(원본 레터링을 벡터로 옮김). e에서 l로 이어지는 가는 선이 파동(에너지),
  // 콜론의 두 타원이 피부 속 세포. 3D 그래픽에서는 같은 세포를 반투명 유리 구로 쓴다.
  var logoN = 0;
  var WM_D = "M1721.60 605.17C1719.72 604.24 1719.44 603.80 1716.97 598.00C1710.14 581.95 1696.62 549.73 1688.73 530.75C1681.36 512.98 1678.13 505.31 1676.75 502.25C1676.00 500.60 1673.85 495.43 1671.97 490.75C1670.09 486.07 1667.52 479.89 1666.25 477.00C1664.98 474.11 1662.48 468.06 1660.69 463.55C1658.90 459.04 1656.07 452.17 1654.40 448.30C1652.72 444.42 1650.63 439.34 1649.74 437.00C1648.84 434.66 1646.97 430.16 1645.58 427.00C1644.19 423.84 1641.25 416.86 1639.05 411.50C1636.86 406.14 1634.40 400.29 1633.59 398.50C1632.78 396.71 1630.76 391.65 1629.10 387.25C1627.43 382.85 1625.02 376.77 1623.73 373.75C1622.44 370.73 1620.20 365.32 1618.74 361.75C1617.29 358.18 1614.48 351.43 1612.51 346.75C1610.54 342.07 1608.17 336.31 1607.26 333.95C1606.34 331.58 1604.89 328.27 1604.04 326.57C1603.18 324.88 1600.78 319.39 1598.71 314.37C1593.11 300.86 1584.58 284.02 1580.73 278.89C1565.17 258.16 1545.07 257.70 1525.33 277.61C1520.79 282.18 1520.88 281.64 1523.24 290.25C1527.64 306.34 1524.21 320.72 1512.82 334.00C1502.53 345.99 1477.45 359.44 1446.00 369.84C1443.11 370.79 1439.40 372.12 1437.75 372.79C1436.10 373.46 1425.86 377.01 1415.00 380.69C1404.14 384.38 1390.41 389.11 1384.50 391.22C1378.59 393.32 1370.15 396.30 1365.75 397.83C1341.65 406.22 1321.92 414.61 1301.00 425.37C1282.28 434.99 1266.66 444.43 1266.16 446.42C1265.18 450.34 1274.16 479.90 1279.64 490.80C1298.92 529.12 1326.31 552.46 1365.19 563.72C1379.16 567.77 1387.81 568.99 1402.58 569.00C1440.82 569.01 1475.02 554.35 1507.43 524.05C1526.40 506.31 1544.82 478.49 1555.16 451.93C1558.32 443.82 1559.27 442.08 1560.78 441.70C1562.30 441.32 1564.00 442.64 1563.99 444.20C1563.96 447.85 1553.57 474.91 1547.67 486.70C1538.73 504.59 1527.95 521.00 1516.04 534.86C1492.47 562.28 1458.76 584.16 1427.26 592.50C1423.96 593.37 1421.11 594.18 1420.92 594.30C1420.04 594.84 1400.61 598.51 1395.50 599.09C1388.03 599.95 1362.14 599.92 1355.00 599.05C1341.31 597.38 1323.60 593.21 1313.01 589.17C1280.38 576.73 1253.65 556.62 1233.69 529.50C1232.57 527.99 1229.23 522.59 1226.26 517.50C1219.55 506.02 1218.59 504.50 1218.07 504.50C1217.23 504.50 1216.12 506.37 1213.76 511.75C1201.49 539.70 1190.91 555.20 1173.08 571.33C1150.61 591.67 1124.07 600.19 1100.19 594.71C1081.31 590.38 1066.18 577.70 1056.16 557.82C1045.25 536.16 1042.44 495.91 1049.23 458.75C1049.64 456.55 1050.67 450.48 1051.53 445.25C1052.38 440.02 1053.75 432.82 1054.56 429.25C1056.47 420.85 1060.82 403.18 1062.00 399.00C1062.50 397.21 1064.07 391.36 1065.49 386.00C1068.12 376.00 1070.27 369.06 1078.95 342.50C1084.47 325.63 1087.31 317.29 1092.26 303.50C1094.09 298.41 1096.33 292.11 1097.24 289.50C1100.96 278.84 1113.08 245.74 1115.91 238.50C1120.35 227.16 1122.82 220.53 1125.25 213.50C1126.43 210.06 1128.35 204.78 1129.52 201.75C1132.07 195.13 1137.47 179.97 1141.55 168.00C1156.08 125.36 1157.05 102.41 1144.93 87.61C1134.82 75.27 1116.51 71.01 1091.75 75.26C1080.99 77.10 1061.84 84.09 1048.75 90.96C1041.23 94.91 1025.44 104.09 1022.58 106.18C1021.30 107.12 1018.45 109.07 1016.25 110.52C998.56 122.13 978.16 139.97 942.76 174.81C927.08 190.25 912.45 204.43 910.25 206.32C908.05 208.22 904.79 211.23 903.00 213.01C901.21 214.79 897.37 218.09 894.47 220.34C891.57 222.58 888.87 224.81 888.47 225.29C885.91 228.37 861.34 245.85 851.25 251.77C848.50 253.38 844.56 255.80 842.50 257.14C837.04 260.70 810.68 273.72 800.50 277.89C772.23 289.46 755.96 293.93 731.75 296.78C725.42 297.53 719.78 298.42 719.20 298.78C718.32 299.32 718.11 300.09 717.85 303.59C717.42 309.38 715.88 314.89 713.05 320.75C703.68 340.17 681.63 354.04 636.00 369.24C598.72 381.66 566.04 392.71 559.75 395.01C555.90 396.42 549.71 398.67 546.00 399.99C521.98 408.59 487.52 424.27 473.50 432.98C471.44 434.26 468.18 436.18 466.25 437.24C460.09 440.63 455.54 443.93 455.21 445.24C455.04 445.91 455.27 448.33 455.73 450.61C462.21 483.08 474.85 508.13 495.06 528.56C509.09 542.73 527.87 554.27 547.75 560.94C589.73 575.01 631.83 568.93 670.26 543.26C692.19 528.62 713.38 505.26 726.82 480.91C728.38 478.07 730.20 474.89 730.86 473.84C733.11 470.25 738.64 458.76 742.07 450.54C745.82 441.57 746.50 440.50 748.48 440.50C751.83 440.50 751.75 441.90 747.78 452.86C744.73 461.28 743.32 464.82 737.83 477.75C731.16 493.50 714.46 519.62 701.65 534.37C698.68 537.79 695.80 541.16 695.25 541.86C690.00 548.53 668.00 566.03 654.82 574.00C628.10 590.18 594.06 599.64 562.75 599.59C526.60 599.52 495.53 590.30 466.25 570.94C454.43 563.12 449.73 559.33 440.33 550.07C417.61 527.66 403.34 502.83 396.23 473.32C387.46 436.93 391.28 402.57 408.07 366.88C425.48 329.87 456.81 294.08 492.75 270.16C497.15 267.23 501.71 264.18 502.89 263.38C506.91 260.64 521.22 252.91 530.49 248.48C562.61 233.12 595.52 226.74 628.25 229.52C650.12 231.38 671.79 238.49 688.08 249.16C703.32 259.13 712.05 270.49 716.13 285.68C717.62 291.19 717.55 291.17 726.78 290.23C739.54 288.93 755.33 285.89 765.50 282.77C786.16 276.44 810.18 266.47 827.25 257.14C840.36 249.97 842.69 248.57 854.59 240.73C871.71 229.44 894.42 211.91 903.75 202.79C904.85 201.72 907.44 199.25 909.50 197.32C911.56 195.38 924.87 182.28 939.08 168.21C969.43 138.15 981.55 127.22 1000.71 112.65C1052.71 73.09 1117.38 50.10 1164.25 54.52C1196.62 57.57 1217.50 73.35 1221.02 97.42C1223.27 112.79 1219.41 130.12 1206.26 163.75C1200.31 178.98 1198.44 183.61 1194.22 193.50C1182.07 222.02 1164.93 265.26 1152.50 298.75C1147.47 312.30 1136.79 344.38 1134.04 354.22C1128.88 372.65 1127.87 376.38 1125.54 385.75C1122.43 398.23 1118.74 415.01 1117.75 421.18C1117.33 423.76 1116.56 427.98 1116.02 430.56C1109.76 460.88 1109.11 502.60 1114.57 524.50C1121.14 550.90 1134.47 564.82 1152.25 563.86C1165.27 563.15 1174.70 557.17 1188.32 540.99C1195.74 532.17 1201.59 522.44 1208.16 508.00C1214.71 493.60 1214.50 494.85 1211.82 486.64C1199.99 450.33 1200.38 418.99 1213.12 382.75C1229.81 335.27 1267.08 290.41 1313.75 261.61C1351.83 238.12 1388.98 227.73 1427.00 229.95C1464.74 232.16 1497.87 247.59 1513.26 270.14C1517.46 276.30 1517.29 276.31 1524.39 269.43C1538.92 255.34 1555.50 244.50 1570.48 239.28C1586.66 233.65 1604.28 233.72 1618.10 239.47C1626.76 243.07 1636.73 251.36 1642.45 259.70C1643.94 261.87 1647.18 267.72 1649.65 272.70C1653.56 280.57 1655.90 285.80 1663.11 302.75C1663.93 304.68 1665.40 308.05 1666.39 310.25C1667.37 312.45 1671.87 323.36 1676.39 334.50C1686.28 358.88 1690.34 368.74 1694.74 379.00C1696.56 383.26 1700.72 393.39 1703.98 401.50C1709.37 414.93 1714.54 427.60 1722.46 446.75C1724.05 450.60 1726.27 456.00 1727.39 458.75C1728.51 461.50 1732.85 472.07 1737.04 482.25C1745.74 503.36 1750.27 514.42 1754.77 525.50C1762.10 543.57 1761.72 542.82 1763.32 542.30C1764.27 541.99 1768.85 535.79 1775.72 525.50C1777.84 522.34 1781.91 516.38 1784.77 512.25C1787.64 508.12 1791.13 502.85 1792.54 500.53C1793.94 498.21 1796.01 494.94 1797.12 493.28C1803.47 483.76 1818.67 459.03 1822.67 451.69C1824.15 448.97 1827.12 443.60 1829.26 439.75C1840.79 419.04 1859.70 376.67 1865.09 359.50C1875.12 327.54 1877.08 305.18 1871.72 284.12C1866.15 262.28 1850.46 246.30 1831.31 242.97C1826.93 242.21 1815.76 242.62 1811.90 243.69C1805.59 245.43 1796.59 250.40 1792.27 254.52C1786.73 259.81 1785.03 260.49 1784.02 257.81C1783.48 256.37 1784.35 254.80 1789.10 248.65C1809.98 221.61 1842.23 212.75 1869.75 226.49C1891.86 237.52 1904.13 257.72 1905.32 285.00C1905.94 299.35 1902.77 315.85 1896.00 333.50C1885.66 360.46 1867.93 395.04 1844.74 433.50C1841.50 438.86 1837.24 445.95 1835.27 449.25C1833.30 452.55 1830.65 456.82 1829.39 458.75C1828.14 460.68 1824.36 466.64 1821.01 472.00C1817.65 477.36 1813.13 484.45 1810.97 487.75C1804.11 498.21 1782.75 530.10 1779.94 534.07C1778.46 536.17 1774.21 542.22 1770.50 547.51C1756.30 567.76 1752.36 573.22 1740.88 588.56C1727.21 606.81 1726.39 607.52 1721.60 605.17Z M133.33 587.58C130.79 587.33 129.74 587.00 129.21 586.28C127.41 583.82 128.77 582.47 134.78 580.74C155.06 574.89 165.30 560.15 168.99 531.46C169.36 528.60 169.52 504.10 169.51 455.25C169.50 415.65 169.72 366.80 170.00 346.69C170.54 309.06 170.33 300.34 168.75 294.25C166.37 285.10 160.86 279.76 152.44 278.46C143.17 277.02 134.81 280.16 116.38 292.00C107.54 297.69 106.27 298.18 104.76 296.51C104.00 295.67 103.96 295.31 104.48 294.06C105.92 290.57 147.49 263.00 169.03 251.24C172.21 249.50 176.82 246.86 179.28 245.36C186.97 240.67 205.27 232.04 211.73 230.04C220.23 227.42 227.11 229.89 230.00 236.61C232.63 242.74 232.67 243.39 232.97 297.83C233.12 325.65 233.42 348.59 233.64 348.80C234.30 349.47 235.34 347.90 237.16 343.50C260.19 287.71 306.27 243.27 353.00 231.77C367.45 228.22 386.35 228.20 398.00 231.72C418.52 237.93 431.45 248.15 434.73 260.77C439.22 278.00 427.11 293.86 408.00 295.77C400.54 296.52 394.77 294.88 383.83 288.90C361.61 276.76 352.90 274.00 336.68 274.00C323.84 274.00 313.01 276.74 300.25 283.23C277.64 294.72 261.89 311.37 249.88 336.46C240.98 355.03 237.18 368.21 234.42 390.00C233.28 398.94 233.48 517.43 234.64 526.75C237.04 545.97 240.91 556.58 249.34 567.12C255.41 574.71 261.02 577.95 274.64 581.73C278.15 582.71 279.17 584.16 277.81 586.23C276.98 587.50 276.98 587.50 213.11 587.50C177.99 587.50 146.44 587.60 143.00 587.71C139.56 587.82 135.21 587.76 133.33 587.58Z M846.75 548.71C833.16 546.31 823.55 539.98 818.65 530.17C805.80 504.50 832.56 468.33 879.75 447.57C898.43 439.36 914.05 437.06 927.92 440.48C941.29 443.78 950.95 453.49 953.04 465.73C956.86 488.04 940.39 512.79 907.18 534.69C889.64 546.25 865.12 551.94 846.75 548.71Z M878.21 540.49C883.23 539.38 895.20 534.42 899.77 531.56C915.26 521.85 925.44 508.88 930.82 492.00C933.22 484.49 933.58 473.39 931.63 467.19C928.80 458.18 921.48 451.52 911.96 449.27C886.84 443.35 849.59 467.75 839.85 496.50C834.99 510.83 838.26 526.43 847.71 534.08C856.11 540.88 866.54 543.07 878.21 540.49Z M1275.17 431.57C1283.95 426.33 1293.27 421.00 1293.68 421.00C1293.79 421.00 1296.26 419.67 1299.18 418.04C1311.73 411.03 1345.15 396.50 1355.50 393.54C1356.74 393.19 1359.66 392.11 1362.00 391.15C1364.34 390.18 1370.64 387.86 1376.00 385.99C1416.71 371.81 1426.98 367.22 1439.89 357.43C1447.00 352.04 1447.33 351.72 1453.21 344.68C1463.27 332.63 1467.72 321.16 1468.32 305.75C1469.04 287.00 1463.79 273.27 1451.01 260.49C1432.84 242.31 1404.42 235.43 1375.74 242.26C1343.92 249.83 1319.20 265.79 1300.36 290.94C1279.87 318.28 1268.81 345.75 1263.71 382.00C1261.57 397.18 1261.77 429.89 1264.04 435.85C1264.72 437.65 1265.52 437.34 1275.17 431.57Z M461.18 432.08C482.18 419.18 504.99 407.68 526.75 398.99C537.92 394.53 562.26 385.75 587.25 377.16C613.84 368.02 626.55 361.42 639.04 350.27C649.52 340.92 657.26 328.80 660.30 317.00C662.95 306.73 662.58 292.57 659.40 282.50C652.44 260.41 634.18 245.34 608.12 240.16C601.12 238.77 583.16 238.90 575.25 240.40C549.43 245.29 524.08 258.01 506.41 274.94C486.64 293.87 472.79 315.92 462.22 345.25C453.53 369.37 449.72 402.33 452.51 429.31C453.29 436.89 453.32 436.90 461.18 432.08Z M860.75 387.48C840.92 384.82 830.79 370.57 835.00 351.25C839.22 331.89 863.99 307.03 890.26 295.77C904.70 289.57 920.38 287.31 931.65 289.79C940.32 291.70 949.81 298.19 952.77 304.24C955.76 310.36 956.46 319.72 954.46 326.97C949.59 344.60 928.07 366.87 904.25 378.94C890.79 385.76 873.41 389.17 860.75 387.48Z M885.83 379.22C911.55 373.91 935.81 346.93 936.16 323.25C936.57 296.21 908.50 289.20 879.69 309.14C870.89 315.23 861.06 325.85 857.37 333.25C843.56 360.93 858.39 384.88 885.83 379.22Z";
  var CELL_LO = "M846.75 548.71C833.16 546.31 823.55 539.98 818.65 530.17C805.80 504.50 832.56 468.33 879.75 447.57C898.43 439.36 914.05 437.06 927.92 440.48C941.29 443.78 950.95 453.49 953.04 465.73C956.86 488.04 940.39 512.79 907.18 534.69C889.64 546.25 865.12 551.94 846.75 548.71Z M878.21 540.49C883.23 539.38 895.20 534.42 899.77 531.56C915.26 521.85 925.44 508.88 930.82 492.00C933.22 484.49 933.58 473.39 931.63 467.19C928.80 458.18 921.48 451.52 911.96 449.27C886.84 443.35 849.59 467.75 839.85 496.50C834.99 510.83 838.26 526.43 847.71 534.08C856.11 540.88 866.54 543.07 878.21 540.49Z ", CELL_HI = "M860.75 387.48C840.92 384.82 830.79 370.57 835.00 351.25C839.22 331.89 863.99 307.03 890.26 295.77C904.70 289.57 920.38 287.31 931.65 289.79C940.32 291.70 949.81 298.19 952.77 304.24C955.76 310.36 956.46 319.72 954.46 326.97C949.59 344.60 928.07 366.87 904.25 378.94C890.79 385.76 873.41 389.17 860.75 387.48Z M885.83 379.22C911.55 373.91 935.81 346.93 936.16 323.25C936.57 296.21 908.50 289.20 879.69 309.14C870.89 315.23 861.06 325.85 857.37 333.25C843.56 360.93 858.39 384.88 885.83 379.22Z";
  function cellDefs(id) {
    return '<radialGradient id="' + id + '" cx="36%" cy="30%" r="74%"><stop offset="0" stop-color="#ffffff"/><stop offset=".3" stop-color="#ece5ff"/><stop offset=".72" stop-color="#a995f2"/><stop offset="1" stop-color="#6f57dc"/></radialGradient>';
  }
  function cell(id, cx, cy, r, cls) {
    return '<g class="' + (cls || "") + '"><circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="url(#' + id + ')"/>' +
      '<ellipse cx="' + (cx - r * .34) + '" cy="' + (cy - r * .4) + '" rx="' + (r * .3) + '" ry="' + (r * .18) + '" fill="#fff" fill-opacity=".85" transform="rotate(-28 ' + (cx - r * .34) + " " + (cy - r * .4) + ')"/></g>';
  }
  function logoSvg(cls) {
    return '<svg class="' + (cls || "") + '" viewBox="98 48 1813 564" role="img" aria-label="re:lev"><path fill="currentColor" fill-rule="evenodd" d="' + WM_D + '"/></svg>';
  }
  function cellMark(cls) {
    return '<svg class="' + (cls || "") + '" viewBox="790 272 185 296" aria-hidden="true"><g fill="currentColor"><path fill-rule="evenodd" d="' + CELL_LO + '"/><path fill-rule="evenodd" d="' + CELL_HI + '"/></g></svg>';
  }
  function symbolSvg(cls, bg) {
    var id = "cell" + (++logoN);
    return '<svg class="' + (cls || "") + '" viewBox="0 0 120 120" role="img" aria-label="re:lev 세포 심볼"><defs>' + cellDefs(id) + "</defs>" +
      (bg ? '<rect width="120" height="120" rx="28" fill="#efe9ff"/>' : "") +
      cell(id, 62, 42, 19) + cell(id, 58, 84, 14) + "</svg>";
  }
  // 스월 심볼: 세포 하나가 초승달 둘로 갈라져 비켜 도는 모양(에너지를 받은 상태). 솔리드는 작은 크기용 굵은 두 세포.
  function swirlBody(n) {
    var m = "cm" + n;
    var cres = '<rect x="-60" y="-70" width="120" height="140" fill="currentColor" mask="url(#' + m + ')"/>';
    var unit = '<g transform="translate(-4 6)">' + cres + '</g><g transform="rotate(180) translate(-12 12)">' + cres + "</g>";
    return '<defs><mask id="' + m + '" maskUnits="userSpaceOnUse" x="-60" y="-70" width="120" height="140"><rect x="-60" y="-70" width="120" height="140" fill="#000"/><ellipse rx="38" ry="50" fill="#fff"/><ellipse cx="15" cy="-3" rx="33" ry="49" fill="#000"/></mask></defs>' +
      '<g transform="translate(110 76) rotate(-24) scale(1.08)">' + unit + '</g><g transform="translate(92 222) rotate(-24) scale(.94)">' + unit + "</g>";
  }
  function swirlSvg(cls, bg, fg) {
    var n = ++logoN;
    if (!bg) return '<svg class="' + (cls || "") + '" viewBox="0 0 200 296" role="img" aria-label="re:lev 스월 심볼">' + swirlBody(n) + "</svg>";
    return '<svg class="' + (cls || "") + '" viewBox="0 0 296 296" role="img" aria-label="re:lev 스월 심볼"><rect width="296" height="296" rx="68" fill="' + bg + '"/><g transform="translate(78 44) scale(.7)" style="color:' + (fg || "#fff") + '">' + swirlBody(n) + "</g></svg>";
  }
  function solidSvg(cls, bg, fg) {
    var n = ++logoN, m = "sm" + n;
    var body = '<defs><mask id="' + m + '" maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="296"><rect width="200" height="296" fill="#000"/><ellipse cx="114" cy="70" rx="54" ry="60" fill="#fff" transform="rotate(-24 114 70)"/><ellipse cx="90" cy="222" rx="58" ry="64" fill="#fff" transform="rotate(-24 90 222)"/><ellipse cx="118" cy="68" rx="22" ry="36" fill="#000" transform="rotate(-24 118 68)"/><ellipse cx="88" cy="224" rx="25" ry="39" fill="#000" transform="rotate(-24 88 224)"/></mask></defs><rect width="200" height="296" fill="currentColor" mask="url(#' + m + ')"/>';
    if (!bg) return '<svg class="' + (cls || "") + '" viewBox="0 0 200 296" aria-hidden="true">' + body + "</svg>";
    return '<svg class="' + (cls || "") + '" viewBox="0 0 296 296" aria-hidden="true"><rect width="296" height="296" rx="68" fill="' + bg + '"/><g transform="translate(78 44) scale(.7)" style="color:' + (fg || "#fff") + '">' + body + "</g></svg>";
  }
  // 확장 그래픽: 피부 속 세포들이 아래에서 위로 떠오르는 Cell Rise 필드
  function pearlField(cls, n, seed) {
    var id = "cell" + (++logoN), out = "", s = seed || 7;
    function rnd() { s = (s * 9301 + 49297) % 233280; return s / 233280; }
    for (var k = 0; k < (n || 3); k++) {
      for (var i = 0; i < 12; i++) {
        var t = i / 11, x = 40 + t * 920 + rnd() * 30, y = 340 - t * 240 - Math.sin(t * Math.PI * (1.2 + k * .3)) * (60 + k * 30) + k * 40;
        var r = 4 + t * 12 + rnd() * 4;
        out += '<g opacity="' + (0.4 + t * 0.6).toFixed(2) + '">' + cell(id, +x.toFixed(1), +y.toFixed(1), +r.toFixed(1)) + "</g>";
      }
    }
    return '<svg class="' + (cls || "") + '" viewBox="0 0 1000 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>' + cellDefs(id) + "</defs>" + out + "</svg>";
  }

  // ── 페이지: Brand (디자인 시스템 문서) ────────────
  function pageBrand() {
    var nav = [["overview", "Overview"], ["logo", "Logo"], ["symbol", "Symbol"], ["graphic", "Graphic"], ["color", "Color"], ["type", "Typography"], ["voice", "Voice & Tone"], ["copy", "Copywriting"]];
    var colors = [["Signature Lavender", "#9a84e6", "시그니처 · 세포 그래픽 · 아이콘", "10%"], ["Lavender Mist", "#e6ddfb", "보조 면 · 정보 강조", "20%"], ["Soft Porcelain", "#f8f6fd", "기본 배경", "55%"], ["Liquid Titanium", "#BFC3C8", "디바이스 · 기술 그래픽", "5%"], ["Deep Ink", "#26252D", "텍스트 · 워드마크", "10%"], ["Deep Iris", "#6a52d9", "버튼 · 강조", "CTA"]];
    var sec = function (id, eyebrow, title, desc, body) {
      return '<section class="doc" id="b-' + id + '"><p class="eyebrow">' + eyebrow + "</p><h2>" + title + "</h2>" + (desc ? '<p class="doc__desc">' + desc + "</p>" : "") + body + "</section>";
    };
    return '<div class="bandwrap"><section class="band band--brand"><div class="band__in">' + pearlField("band__field", 2, 11) +
      '<p class="band__eyebrow">RE:LEV DESIGN</p>' + logoSvg("band__logo") +
      '<p class="band__slogan"><i>Re:level</i> your skin.</p><p class="band__sub">세포 두 개와 파동 한 줄 — re:lev 브랜드 시스템</p></div></section></div>' +
      '<div class="docs"><nav class="docs__nav" aria-label="브랜드 문서 목차">' + nav.map(function (n) { return '<a href="#brand" data-jump="b-' + n[0] + '">' + n[1] + "</a>"; }).join("") + "</nav><div class=\"docs__body\">" +

      sec("overview", "Brand Harness", "Why · How · What", "",
        '<div class="harness">' +
        [["Why", "우리가 존재하는 이유", "누구나 자신의 아름다움을 더 건강하고, 더 나은 단계로 발전시킬 수 있도록."],
         ["How", "우리가 하는 방식", "신뢰할 수 있는 정보와 맞춤 가이드로 홈케어와 전문 케어를 연결합니다."],
         ["What", "우리가 제공하는 것", "뷰티 디바이스 · 시술 정보 탐색, 비교, 큐레이션, 개인 맞춤 관리 가이드, 콘텐츠."]]
          .map(function (h, i) { return '<div class="harness__item h' + i + '"><b>' + h[0] + "</b><span>" + h[1] + "</span><p>" + h[2] + "</p></div>"; }).join("") +
        '</div><div class="kw">' + ["Beauty Tech", "Personalized", "Professional", "Accessible", "Elevated"].map(function (k) { return "<span>" + k + "</span>"; }).join("") + "</div>") +

      sec("logo", "Logo", "re:lev 워드마크", "흐르는 세리프 소문자. e에서 l로 이어지는 가는 선 한 줄이 피부에 닿는 에너지(파동)이고, 콜론의 두 타원은 피부 속 세포입니다. 파동이 지나간 뒤 글자는 l에서 한 단계 높이 솟아오릅니다. RE(다시)에서 LEV(더 높은 단계)로.",
        '<div class="spec-grid">' +
        '<div class="sheet sheet--light">' + logoSvg("sheet__logo") + "<span>Primary · Porcelain</span></div>" +
        '<div class="sheet sheet--ink">' + logoSvg("sheet__logo") + "<span>Reverse · Deep Ink</span></div>" +
        '<div class="sheet sheet--mist">' + logoSvg("sheet__logo") + "<span>On Lavender Mist</span></div>" +
        '<div class="sheet sheet--grad">' + logoSvg("sheet__logo") + "<span>On Derma Gradient</span></div></div>" +
        '<div class="anatomy">' + logoSvg("anatomy__logo") + '<ol><li><b>Flow</b> 이어지듯 흐르는 세리프 소문자. 부드럽지만 굵기 대비가 분명한 글자</li><li><b>Wave</b> e에서 l로 올라가는 한 줄의 가는 선 = 피부에 닿는 에너지</li><li><b>Cells</b> 콜론의 두 타원 = 피부 속 세포. 위 세포가 살짝 작고 오른쪽 위</li><li><b>Clear space</b> 세포 하나 높이만큼 사방 여백</li></ol></div>') +

      sec("symbol", "Symbol", "스월 심볼", "콜론의 두 세포가 에너지를 받는 순간. 세포 하나가 초승달 둘로 갈라져 비켜 돌며, 그 회전이 곧 파동입니다. 위 세포가 조금 더 크고 두 세포는 떨어져 있어 콜론으로 읽혀요. 32px 이하에서는 굵은 두 세포(솔리드)를 씁니다.",
        '<div class="sym-row">' +
        '<div class="sym">' + swirlSvg("sym__icon", "#3f2e8c", "#f1ecff") + "<span>App icon · 스월</span></div>" +
        '<div class="sym">' + solidSvg("sym__icon sym__icon--sm", "#efe9ff", "#3f2e8c") + "<span>Favicon · 솔리드</span></div>" +
        '<div class="sym sym--plain">' + swirlSvg("sym__swirl") + "<span>Swirl · 단색</span></div>" +
        '<div class="sym sym--plain">' + cellMark("sym__cells") + "<span>Cells · 워드마크 콜론</span></div></div>") +

      sec("graphic", "Graphic", "Cell Rise 확장 그래픽", "피부 속 세포들이 아래에서 위로 떠오르는 흐름 하나로 배경, 구분선, 로딩, 리스트 기호까지 확장합니다. 로고는 항상 단색, 유리 세포는 그래픽에만 씁니다.",
        '<div class="gfx">' +
        '<div class="gfx__card gfx__card--wide">' + pearlField("gfx__field", 3, 3) + "<span>Cell Rise · 키 비주얼 배경</span></div>" +
        '<div class="gfx__card">' + pearlField("gfx__field", 1, 21) + "<span>Single Rise · 배너 · 썸네일</span></div>" +
        '<div class="gfx__card gfx__card--ui"><div class="ui-demo"><span class="pearl-bullet"></span>디바이스 기술 이해하기</div><div class="ui-demo"><span class="pearl-bullet"></span>나에게 맞는 관리 찾기</div><div class="pearl-loader" aria-label="로딩 예시"><i></i><i></i></div><span>UI 확장 · 리스트 기호 · 로딩</span></div>' +
        '<div class="gfx__card gfx__card--photo"><img src="assets/relev/models/model-wide.webp" alt="RE:LEV 키 비주얼 위에 워드마크를 올린 예시" loading="lazy">' + logoSvg("photo__logo") + "<span>사진 위 워드마크</span></div></div>") +

      sec("color", "Color", "LILAC INTELLIGENCE", "피부 과학과 세련된 여성성의 균형. 채도를 낮춘 라벤더로 화장품 브랜드 특유의 가벼움과 구분합니다.",
        '<div class="swatches">' + colors.map(function (c) { return '<button class="sw" data-copy="' + c[1] + '"><i style="background:' + c[1] + '"></i><b>' + c[0] + "</b><code>" + c[1] + "</code><span>" + c[2] + " · " + c[3] + "</span></button>"; }).join("") +
        '</div><div class="usage"><i style="flex:55;background:#f8f6fd">55%</i><i style="flex:20;background:#e6ddfb">20%</i><i style="flex:10;background:#9a84e6;color:#fff">10%</i><i style="flex:10;background:#26252D;color:#fff">10%</i><i style="flex:5;background:#BFC3C8">5%</i></div><p class="caption">색상 칩을 누르면 값이 복사됩니다.</p>') +

      sec("type", "Typography", "SUIT + Pretendard", "헤딩은 SUIT로 현대적이고 세련되게, 본문은 Pretendard로 디지털 환경에서 편하게 읽히도록.",
        '<div class="type-specimen"><p class="ts ts--display">Elevate Your Beauty.</p><p class="ts ts--h">아름다움을 이해하는 새로운 단계.</p><p class="ts ts--b">홈 디바이스에서 피부과 시술까지, 나에게 맞는 뷰티 테크를 탐색하는 플랫폼. 기술의 원리와 근거, 그리고 아직 확인되지 않은 것까지 정직하게 보여 줍니다.</p><p class="ts ts--c">CAPTION · JETBRAINS MONO · 1.0 MHz · 633 nm · 3.0 mm</p></div>') +

      sec("voice", "Voice & Tone", "말하는 방식", "",
        '<div class="voice">' + [["Informed", "정확하고 신뢰할 수 있는", "출처와 근거 수준을 함께 말합니다."], ["Refined", "세련되고 감각적인", "과장 없이, 짧고 정돈된 문장."], ["Supportive", "함께하는, 친근한", "선택을 강요하지 않고 곁에서 설명합니다."], ["Progressive", "지속적으로 발전하는", "오늘보다 한 단계 나아가는 관리."]]
          .map(function (v) { return "<div><b>" + v[0] + "</b><span>" + v[1] + "</span><p>" + v[2] + "</p></div>"; }).join("") + "</div>") +

      sec("copy", "Copywriting", "슬로건 · 태그라인", "",
        '<div class="copytable">' + [["RE:LEVEL YOUR SKIN.", "원리를 알고, 나에게 맞게 고르고, 피부를 한 단계 위로."], ["Know it. Choose it. Level up.", "알고, 고르고, 레벨업."], ["광고 말고 원리로.", "이름이 아니라 작용 기전으로 고르는 피부관리."], ["Your Beauty, Next Level.", "당신의 아름다움, 다음 단계로."], ["Discover the Right Care.", "나에게 맞는 뷰티 케어를 발견하세요."], ["From Home to Clinic.", "일상 관리부터 전문 케어까지, 하나로."], ["Understand, Choose, Elevate.", "이해하고, 선택하고, 더 나아가세요."], ["The Beauty Tech Guide.", "뷰티 테크의 새로운 기준."], ["A Smarter Way to Care.", "더 스마트한 아름다움 관리."]]
          .map(function (c) { return "<div><b>" + c[0] + "</b><span>" + c[1] + "</span></div>"; }).join("") + "</div>") +
      "</div></div>";
  }

  // ── 라우터 ────────────────────────────────────────
  function route() {
    // 주소 형식: #device, #device--sample-a (공유 링크에도 그대로 남는 단순 해시)
    var path = location.hash.replace(/^#\/?/, "").split(/--|\//);
    if (path[0] === "home") path[0] = "";
    var html, nav = path[0] || "";
    switch (path[0]) {
      case "": html = pageHome(); break;
      case "device": html = path[1] ? pageDevice(path[1]) : pageDevices(); break;
      case "clinic": html = path[1] ? pageTreatment(path[1]) : pageClinic(); break;
      case "science": html = path[1] ? pageTech(path[1]) : pageScience(); break;
      case "compare": html = pageCompare(); break;
      case "about": html = pageAbout(); break;
      case "brand": html = pageBrand(); break;
      case "decode": html = pageDecode(); break;
      case "learn": html = pageLearn(); break;
      case "contribute": html = pageContribute(path[1], path[2]); break;
      case "search": html = pageSearch(searchQ); break;
      case "menu": html = pageMenu(); break;
      default: html = notFound();
    }
    view.innerHTML = html;
    document.body.classList.toggle("has-band", nav === "brand");
    document.body.classList.toggle("is-home", nav === "");
    document.body.classList.toggle("has-phero", !!view.querySelector(".phero"));
    onScrollFx();
    document.querySelectorAll("[data-nav]").forEach(function (a) { a.classList.toggle("on", a.dataset.nav === nav); });
    document.querySelectorAll("[data-tab]").forEach(function (a) { a.classList.toggle("on", a.dataset.tab === ({ "": "home", learn: "learn", device: "device", clinic: "clinic", science: "learn", decode: "learn", menu: "menu", compare: "menu", about: "menu", brand: "menu", contribute: "menu", search: "menu" }[nav] || "")); });
    var h1 = view.querySelector("h1");
    document.title = (h1 && nav ? h1.textContent + " — " : "") + "RE:LEV — Re:level your skin.";
    renderTray();
    applyListFilter();
    scrollHints();
  }

  // 가로 스크롤 힌트: 더 넘길 내용이 있으면 끝을 흐리게
  function scrollHints() {
    view.querySelectorAll(".filters, .hscroll, .docs__nav").forEach(function (el) {
      var upd = function () {
        var more = el.scrollWidth - el.clientWidth > 4;
        el.classList.toggle("can-r", more && el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
        el.classList.toggle("can-l", more && el.scrollLeft > 4);
      };
      var on = el.querySelector('[aria-pressed="true"]');
      if (on && on.offsetLeft + on.offsetWidth > el.clientWidth) el.scrollLeft = on.offsetLeft - 60;
      upd(); if (!el.dataset.hint) { el.dataset.hint = 1; el.addEventListener("scroll", upd, { passive: true }); }
    });
  }
  window.addEventListener("resize", function () { scrollHints(); });

  // ── 이벤트 ────────────────────────────────────────
  document.addEventListener("click", function (e) {
    var j = e.target.closest("[data-jump],[data-replay],[data-copy]");
    if (j) {
      e.preventDefault();
      if (j.dataset.jump) document.getElementById(j.dataset.jump).scrollIntoView({ behavior: "smooth", block: "start" });
      else if (j.hasAttribute("data-replay")) { var svg = j.querySelector("svg"); svg.classList.remove("play"); void svg.getBoundingClientRect(); svg.classList.add("play"); }
      else { var v = j.dataset.copy; try { navigator.clipboard.writeText(v).then(function () { j.classList.add("copied"); setTimeout(function () { j.classList.remove("copied"); }, 1200); }, function () {}); } catch (err) {} }
      return;
    }
    var sp = e.target.closest("[data-pick],[data-pickkey],[data-pickkind],[data-sheet-close]");
    if (sp) {
      if (sp.hasAttribute("data-pick")) { openPicker(); return; }
      if (sp.hasAttribute("data-sheet-close")) { closePicker(); return; }
      if (sp.dataset.pickkind) { pickKind = sp.dataset.pickkind; document.querySelectorAll("[data-pickkind]").forEach(function (b) { b.setAttribute("aria-selected", b.dataset.pickkind === pickKind); }); document.getElementById("pickList").innerHTML = pickResults(document.querySelector("[data-pickq]").value); return; }
      var tr = tray(); if (tr.length < 3) tr.push(sp.dataset.pickkey); setTray(tr); closePicker(); route(); return;
    }
    var en = e.target.closest("[data-energy]");
    if (en) {
      var first = LEARN.filter(function (y) { return y.e === en.dataset.energy; })[0];
      learnPick = first.key || first.id;
      document.getElementById("lpPick").innerHTML = lpPicker();
      document.getElementById("lp").innerHTML = learnDetail(first);
      return;
    }
    var lt = e.target.closest("[data-learn],[data-goto-tech]");
    if (lt) {
      if (lt.dataset.gotoTech) { listState = { q: "", c: "all", f: familyOf(lt.dataset.gotoTech), e: "all" }; return; }
      learnPick = lt.dataset.learn;
      var x = LEARN.filter(function (y) { return (y.key || y.id) === learnPick; })[0];
      var box = document.getElementById("lp"); if (box && x) box.innerHTML = learnDetail(x);
      var pk = document.getElementById("lpPick"); if (pk) pk.innerHTML = lpPicker();
      if (lt.closest(".energy")) document.getElementById("lp").scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    var ef = e.target.closest("[data-effect]");
    if (ef) { listState.e = ef.dataset.effect; view.querySelectorAll("[data-effect]").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.effect === listState.e); }); applyListFilter(); return; }
    var gq = e.target.closest("[data-goto-q],[data-goto-effect]");
    if (gq) { listState = { q: gq.dataset.gotoQ || "", c: "all", f: "all", e: "all" }; if (gq.dataset.gotoEffect) { var pe = gq.dataset.gotoEffect.split("|"); listState.c = pe[0]; listState.e = pe[1]; } return; }
    var cz = e.target.closest("[data-concern],[data-cgroup]");
    if (cz) {
      if (cz.dataset.cgroup) { clinicGroup = cz.dataset.cgroup; route(); return; }
      listState.c = cz.dataset.concern; listState.e = "all";
      var cw = view.querySelector("[data-cwrap]"); if (cw) { cw.outerHTML = concernChips(lastConcernItems); scrollHints(); }
      applyListFilter(); return;
    }
    var t = e.target.closest("[data-compare],[data-untray],[data-filter],[data-calc-example]");
    if (!t) return;
    if (t.dataset.compare) {
      var a = tray(), k = t.dataset.compare, i = a.indexOf(k);
      if (i > -1) a.splice(i, 1); else { if (a.length >= 3) a.shift(); a.push(k); }
      setTray(a); route();
    } else if (t.dataset.untray) {
      setTray(tray().filter(function (x) { return x !== t.dataset.untray; })); route();
    } else if (t.dataset.filter) {
      listState.f = t.dataset.filter; view.querySelectorAll("[data-filter]").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.filter === listState.f); }); applyListFilter();
    } else if (t.hasAttribute("data-calc-example")) {
      calcState = { price: "800000", consumable: "", years: "", session: "100000" };
      route();
      document.getElementById("calc").scrollIntoView({ block: "start" });
    }
  });
  document.addEventListener("change", function (e) {
    if (e.target.matches("select[data-slot]")) {
      var vals = Array.prototype.map.call(document.querySelectorAll("select[data-slot]"), function (s) { return s.value; }).filter(Boolean);
      setTray(uniq(vals)); route();
    }
  });
  document.addEventListener("input", function (e) {
    if (e.target.hasAttribute && e.target.hasAttribute("data-pickq")) { document.getElementById("pickList").innerHTML = pickResults(e.target.value); return; }
    if (e.target.hasAttribute && e.target.hasAttribute("data-listq")) { listState.q = e.target.value; applyListFilter(); return; }
    if (e.target.dataset.calc) {
      calcState[e.target.dataset.calc] = e.target.value;
      document.getElementById("calc-result").innerHTML = calcResult();
    }
  });
  document.addEventListener("submit", function (e) {
    if (e.target.matches("[data-contrib]")) {
      e.preventDefault();
      var f = e.target, fd = new FormData(f), err = f.querySelector("[data-formerr]");
      var rec = { kind: fd.get("kind"), target: fd.get("target") || null, name: (fd.get("name") || "").trim(), brand: (fd.get("brand") || "").trim(), tech: fd.getAll("tech"), body: (fd.get("body") || "").trim(), url: (fd.get("url") || "").trim(), tier: fd.get("tier"), who: fd.get("who"), disclose: !!fd.get("disclose"), at: new Date().toISOString().slice(0, 10) };
      if (!rec.name || !rec.body || !/^https?:\/\//.test(rec.url) || !rec.tier || !rec.who) { err.hidden = false; err.textContent = "이름, 내용, 출처 URL(https://로 시작), 출처 종류, 제출자를 모두 입력해 주세요. 출처가 없는 정보는 반영하지 않습니다."; return; }
      var all = store("relev.submissions") || []; all.push(rec); store("relev.submissions", all);
      route(); var top = view.querySelector(".subs"); if (top) top.scrollIntoView({ block: "center" });
      return;
    }
    if (!e.target.matches("[data-search]")) return;
    e.preventDefault();
    var q = e.target.querySelector("input").value.trim();
    if (q) { searchQ = q; if (location.hash === "#search") route(); else location.hash = "#search"; }
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closePicker(); });
  window.addEventListener("hashchange", function () { closePicker(); route(); if (location.hash === "#compare--calc") { var c = document.getElementById("calc"); if (c) { c.scrollIntoView(); return; } } window.scrollTo(0, 0); });

  // ── 데이터 로드 ───────────────────────────────────
  function load(name) { return fetch("data/" + name + ".json").then(function (r) { if (!r.ok) throw new Error(name); return r.json(); }); }
  function loadOpt(name) { return fetch("data/" + name + ".json").then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }); }
  Promise.all([load("taxonomy"), load("technologies"), load("treatments"), load("devices"), load("terms"), loadOpt("affiliate")]).then(function (r) {
    document.querySelectorAll("[data-logo]").forEach(function (el) { el.innerHTML = logoSvg("logo-svg"); });
    D.taxonomy = r[0]; HOME_FAMILIES = r[0].homeFamilies || []; D.techs = r[1]; D.treatments = r[2]; D.devices = r[3]; D.terms = r[4]; D.affiliate = r[5] || {};
    route();
  }).catch(function () {
    view.innerHTML = '<p class="empty">데이터를 불러오지 못했습니다. 로컬에서 열 때는 저장소 루트에서 <code>python3 -m http.server</code>로 실행하세요.</p>';
  });
})();
