/* atlas. prototype — 빌드 없는 정적 SPA. 데이터는 data/*.json, 라우팅은 location.hash */
(function () {
  "use strict";

  var D = {};            // taxonomy, techs, treatments, devices
  var view = document.getElementById("view");
  var trayEl = document.getElementById("tray");
  var deviceFilter = "all";
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

  var EXTRA_TAG_LABEL = { microneedle: "미세침", "chemical-peel": "화학적 필링", plasma: "플라즈마", cooling: "쿨링", heating: "히팅", vibration: "진동", suction: "석션" };
  var KIND_LABEL = { energy: "ENERGY-BASED", injectable: "INJECTABLE", surface: "SURFACE & RESURFACING" };
  var KIND_KO = { energy: "에너지 기반 시술", injectable: "주입형 시술", surface: "표면 관리 시술" };
  var HOME_FAMILIES = ["electrical", "rf", "ultrasound", "light", "other"];

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
      ? '<a class="' + cls + '" href="#/science/' + tag + '">' + label + "</a>"
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
    "ha-filler": [1, 2], biostimulator: [1, 2], "pn-pdrn": [1], toxin: [4]
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

  // ── 스펙트럼 라인 (홈 히어로) ──
  function spectrumSvg() {
    var paths = "", colors = ["#7d8fb8", "#a9a3d9", "#6aa3a3", "#c08a6a"];
    colors.forEach(function (c, k) {
      var d = "M0 36", wl = 18 + k * 22, amp = 10 + k * 3;
      for (var x = 0; x <= 1200; x += 6) d += " L" + x + " " + (36 + Math.sin((x / wl) * Math.PI) * amp * Math.sin((x / 1200) * Math.PI)).toFixed(1);
      paths += '<path d="' + d + '" fill="none" stroke="' + c + '" stroke-width="1.4" opacity=".85"/>';
    });
    return '<svg class="spectrum" viewBox="0 0 1200 72" preserveAspectRatio="none" aria-hidden="true">' + paths + "</svg>";
  }

  // ── 비교함 ────────────────────────────────────────
  function tray() { return store("atlas.compare") || []; }
  function setTray(a) { store("atlas.compare", a.slice(0, 3)); renderTray(); }
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
    if (!t.length || location.hash.indexOf("#/compare") === 0) { trayEl.hidden = true; return; }
    trayEl.hidden = false;
    trayEl.innerHTML = '<span class="label">비교함 ' + t.length + "/3</span>" +
      '<span class="items">' + t.map(function (e) {
        return '<span class="it">' + esc(e.rec.name) + '<button data-untray="' + esc(e.key) + '" aria-label="' + esc(e.rec.name) + ' 빼기">×</button></span>';
      }).join("") + "</span>" +
      '<a class="btn" href="#/compare">비교하기</a>';
  }

  // ── 페이지: 홈 ────────────────────────────────────
  function pageHome() {
    var bridges = [
      { home: "홈 RF 디바이스", tech: "rf", clinic: ["thermage", "oligio"], note: "같은 RF 계열 · 출력 · 전극 구조 · 허가 목적은 다름" },
      { home: "홈 초음파 디바이스 (비집속)", tech: "ultrasound", clinic: ["ulthera", "shurink"], note: "전문 시술은 집속 초음파(HIFU) — 다른 방식", techTo: "hifu" },
      { home: "LED 마스크", tech: "led", clinic: ["ipl-clinic", "laser-toning"], note: "같은 '빛' 계열이지만 LED · IPL · 레이저는 서로 다른 기술", techTo: "ipl" }
    ];
    var stats = [
      [D.techs.length, "기술 백과 초안"],
      [D.treatments.length, "시술 백과 초안"],
      [D.devices.length, "디바이스 샘플 자리표시"],
      [D.techs.concat(D.treatments).filter(function (x) { return x.status !== "draft" && x.status !== "sample"; }).length, "검수 완료"]
    ];
    return '<section class="hero">' +
      '<p class="eyebrow">Beauty Technology Platform · Prototype</p>' +
      "<h1>FROM HOME<br>TO <em>CLINIC.</em></h1>" +
      '<p class="lead">홈 뷰티 디바이스와 피부과 시술을 상품명이 아니라 <b>기술 · 성분 · 작용 기전</b>으로 연결합니다. 무엇이 같고 무엇이 다른지, 그리고 아직 무엇이 확인되지 않았는지까지.</p>' +
      '<div class="cta"><a class="btn" href="#/science">기술부터 이해하기</a><a class="btn btn--ghost" href="#/compare">비교해 보기</a></div>' +
      spectrumSvg() + "</section>" +

      '<section class="section"><div class="entry">' +
      entryCard("01", "DEVICE", "#/device", "홈 디바이스 데이터베이스", "제조사 · 모델이 아니라 실제 작용 기전으로 분류합니다. 공개되지 않은 스펙은 추정하지 않고 '미공개'로 표시합니다.") +
      entryCard("02", "CLINIC", "#/clinic", "피부과 시술 백과", "울쎄라, 써마지, 쥬베룩 같은 상품명 뒤에 있는 기술과 성분, 알려진 위험을 정리합니다.") +
      entryCard("03", "SCIENCE", "#/science", "기술 · 성분 백과", "RF, EMS, 미세전류, 집속 초음파, IPL… 그리고 MHz와 W/cm²가 말해 주지 않는 것.") +
      "</div></section>" +

      '<section class="section"><p class="eyebrow">Home → Clinic</p><h2 style="font-size:26px;margin:6px 0 18px">같은 계열, 다른 도구.</h2>' +
      '<div class="bridge"><div class="bridge__row head"><span>HOME</span><span class="bridge__mid">TECHNOLOGY</span><span>CLINIC</span></div>' +
      bridges.map(function (b) {
        return '<div class="bridge__row"><div><b>' + esc(b.home) + '</b><div class="caption" style="margin-top:2px">' + esc(b.note) + "</div></div>" +
          '<div class="bridge__mid">' + chip(b.tech) + (b.techTo ? " " + chip(b.techTo) : "") + '<div class="bridge__line"></div></div>' +
          '<div class="chips">' + b.clinic.map(function (id) { var t = byId(D.treatments, id); return '<a class="chip chip--plain" href="#/clinic/' + id + '">' + esc(t.name) + "</a>"; }).join("") + "</div></div>";
      }).join("") + "</div>" +
      '<p class="note">이 연결은 같은 물리 원리 계열을 보여 줄 뿐, 홈 디바이스가 시술을 대체하거나 시술이 홈케어보다 낫다는 뜻이 아닙니다. 출력 · 표적 깊이 · 허가 목적 · 시행 주체가 모두 다릅니다.</p></section>' +

      '<section class="section"><h2>atlas.가 지키는 것</h2><div class="principles">' +
      [["SCIENCE", "과학적 원리와 검증 가능한 정보만 사실로 씁니다."],
       ["CLARITY", "복잡한 기술을 쉬운 말로, 그러나 단순화하지 않고."],
       ["TRANSPARENCY", "모든 값에 출처 등급과 검수 상태를 붙이고, 모르는 값은 모른다고 씁니다."],
       ["ACCESSIBILITY", "전문적인 피부관리의 정보 장벽을 낮춥니다."],
       ["CONTINUITY", "한 번의 구매를 지속적인 관리 경험으로 잇습니다."],
       ["INDEPENDENCE", "광고는 평가 · 순위 · 데이터 값에 영향을 주지 않습니다."]]
        .map(function (p) { return "<div><b>" + p[0] + "</b><p>" + p[1] + "</p></div>"; }).join("") + "</div></section>" +

      '<section class="section"><h2>데이터 현황</h2><div class="stats">' +
      stats.map(function (s) { return "<div><b>" + s[0] + "</b><span>" + s[1] + "</span></div>"; }).join("") + "</div>" +
      '<p class="note note--warn">프로토타입 단계입니다. 시술 · 기술 항목은 일반적으로 알려진 분류를 정리한 초안이며 전문가 검수 전입니다. 디바이스 항목은 데이터 구조를 보여 주기 위한 샘플 자리표시로, 실제 제품이 아닙니다.</p></section>';
  }
  function entryCard(num, label, href, title, body) {
    return '<a class="card" href="' + href + '"><span class="num">' + num + " / " + label + "</span><h3>" + title + "</h3><p>" + body + "</p></a>";
  }

  // ── 페이지: 디바이스 ──────────────────────────────
  function pageDevices() {
    var fams = D.taxonomy.families.filter(function (f) { return HOME_FAMILIES.indexOf(f.id) > -1; });
    var items = D.devices.filter(function (d) {
      return deviceFilter === "all" || d.techIds.some(function (t) { return familyOf(t) === deviceFilter; });
    });
    return head("DEVICE", "홈 디바이스 데이터베이스", "제품을 실제 작용 기전으로 분류합니다. 한 제품이 여러 기술을 쓰면 여러 태그가 붙습니다. 지금 보이는 항목은 실제 제품이 아닌 데이터 구조 샘플입니다.") +
      '<div class="filters" role="group" aria-label="기술 계열 필터">' +
      '<button class="chip chip--plain" data-filter="all" aria-pressed="' + (deviceFilter === "all") + '">전체</button>' +
      fams.map(function (f) { return '<button class="chip f-' + f.id + '" data-filter="' + f.id + '" aria-pressed="' + (deviceFilter === f.id) + '">' + f.label + " · " + f.ko + "</button>"; }).join("") +
      "</div>" +
      (items.length ? '<div class="grid">' + items.map(deviceCard).join("") + "</div>" : '<p class="empty">이 계열로 등록된 항목이 아직 없습니다.</p>');
  }
  function deviceCard(d) {
    return '<a class="card" href="#/device/' + d.id + '"><span class="eyebrow">' + esc(d.brand) + " · " + esc(d.form) + "</span><h3>" + esc(d.name) + "</h3>" +
      "<p>" + d.techIds.map(tagLabel).join(" + ") + " 계열 · 스펙 미입력</p>" +
      '<div class="meta">' + chips(d.techIds, false) + statusBadge(d.status) + "</div></a>";
  }
  function pageDevice(id) {
    var d = byId(D.devices, id);
    if (!d) return notFound();
    var specs = D.taxonomy.specFields.map(function (f) {
      var s = d.specs[f.key];
      var v = s && s.status === "disclosed" ? esc(s.value + " " + (s.unit || "")) + (s.condition ? ' <span class="caption">' + esc(s.condition) + "</span>" : "") : na(s && s.status === "undisclosed" ? "미공개" : "미입력");
      return '<div class="spec"><span class="k">' + f.label + '</span><span class="v">' + v + '</span><span>' + (s && s.tier ? '<span class="badge">' + s.tier + "</span>" : "") + "</span></div>";
    }).join("");
    var related = d.relatedTreatmentIds.map(function (tid) { return byId(D.treatments, tid); }).filter(Boolean);
    var sameTech = D.devices.filter(function (x) { return x.id !== d.id && x.techIds.some(function (t) { return d.techIds.indexOf(t) > -1; }); });
    var safety = uniq([].concat.apply([], d.techIds.map(function (t) { var x = byId(D.techs, t); return x ? x.safety : []; })));

    var body =
      '<p class="summary">이 항목은 <b>' + d.techIds.map(tagLabel).join(" + ") + "</b> 계열로 분류된 디바이스 레코드입니다. 효능 문구는 표시하지 않습니다.</p>" +
      block("기술 사양", '<div class="specs">' +
        '<div class="spec"><span class="k">제조사 기술 명칭</span><span class="v">' + (d.makerTechName ? esc(d.makerTechName) : na()) + "</span><span></span></div>" + specs + "</div>" +
        '<p class="caption">모든 값은 물리량 · 단위 · 측정 조건 · 출처 등급과 함께 저장됩니다. 공개되지 않은 값은 추정하지 않습니다.</p>') +
      block("사용 지침 (제조사 문서 기준)", '<div class="specs">' +
        ["권장 사용 주기", "사용 가능 부위", "금기 · 주의사항"].map(function (k) { return '<div class="spec"><span class="k">' + k + '</span><span class="v">' + na() + "</span><span></span></div>"; }).join("") + "</div>" +
        '<p class="caption">기술 계열의 일반적인 주의사항 (제품 지침이 우선): ' + esc(safety.join(" · ")) + "</p>") +
      block("허가 · 인증", "<p>" + na("확인 필요") + ' <span class="caption">공산품 / 의료기기 등급과 허가 목적을 규제기관 문서(T1)로 확인해 기재합니다.</span></p>') +
      block("근거", '<div class="specs"><div class="spec"><span class="k">독립 연구 (T2)</span><span class="v">' + na() + '</span><span></span></div><div class="spec"><span class="k">제조사 인체적용시험 (T4)</span><span class="v">' + na() + "</span><span></span></div></div>") +
      block("비용", '<div class="specs">' + ["정가", "확인된 판매가 (확인일)", "소모품 비용", "보증기간"].map(function (k) { return '<div class="spec"><span class="k">' + k + '</span><span class="v">' + na() + "</span><span></span></div>"; }).join("") + "</div>") +
      block("HOME → CLINIC · 같은 기술 계열의 전문 시술", related.length
        ? '<div class="grid">' + related.map(treatmentCard).join("") + '</div><p class="note">같은 계열이라도 출력, 표적 깊이, 허가 목적, 시행 주체가 다릅니다. 이 연결은 대체 가능성을 뜻하지 않습니다.</p>'
        : '<p class="caption">이 기술 계열과 직접 대응하는 전문 시술 레코드가 아직 없습니다.</p>') +
      (sameTech.length ? block("같은 기술을 쓰는 다른 디바이스", '<div class="grid">' + sameTech.map(deviceCard).join("") + "</div>") : "") +
      block("정보 출처", "<p>" + na("출처 미입력") + "</p>");

    return '<a class="back" href="#/device">← Device</a><div class="split detail"><div>' +
      '<p class="eyebrow">' + esc(d.brand) + " · " + esc(d.form) + "</p><h1>" + esc(d.name) + "</h1>" + chips(d.techIds) + body + "</div>" +
      aside([["레코드 상태", statusBadge(d.status)], ["기술 계열", chips(d.techIds)], ["마지막 검증일", na("검증 전")]], "device:" + d.id) + "</div>";
  }

  // ── 페이지: 시술 ──────────────────────────────────
  function pageClinic() {
    return head("CLINIC", "피부과 시술 백과", "상품명이 아니라 작용 기전과 성분으로 시술을 이해하도록 돕습니다. 시술 추천 · 진단 · 개인별 치료 계획은 제공하지 않습니다.") +
      ["energy", "injectable", "surface"].map(function (k) {
        var items = D.treatments.filter(function (t) { return t.kind === k; });
        return '<div class="group-title"><h2>' + KIND_LABEL[k] + '</h2><span class="caption">' + KIND_KO[k] + " · " + items.length + "</span></div>" +
          '<div class="grid">' + items.map(treatmentCard).join("") + "</div>";
      }).join("");
  }
  function treatmentCard(t) {
    return '<a class="card" href="#/clinic/' + t.id + '"><span class="eyebrow">' + esc(t.en) + "</span><h3>" + esc(t.name) + "</h3>" +
      "<p>" + esc(t.ingredients.length ? "주요 성분: " + t.ingredients.join(", ") : t.delivery) + "</p>" +
      '<div class="meta">' + chips(t.techIds, false) + statusBadge(t.status) + "</div></a>";
  }
  function pageTreatment(id) {
    var t = byId(D.treatments, id);
    if (!t) return notFound();
    var homeTechs = t.techIds.filter(function (x) { return HOME_FAMILIES.indexOf(familyOf(x)) > -1 && byId(D.techs, x); });
    var homeBridgeTechs = uniq(homeTechs.concat(homeTechs.indexOf("hifu") > -1 ? ["ultrasound"] : []));
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

    return '<a class="back" href="#/clinic">← Clinic</a><div class="split detail"><div>' +
      '<p class="eyebrow">' + KIND_LABEL[t.kind] + " · " + esc(t.en) + "</p><h1>" + esc(t.name) + "</h1>" + chips(t.techIds) + body + "</div>" +
      aside([["레코드 상태", statusBadge(t.status)], ["분류", esc(KIND_KO[t.kind])], ["기술 · 성분 계열", chips(t.techIds)], ["검수일", na("검수 전")]], "clinic:" + t.id) + "</div>";
  }

  // ── 페이지: 기술 백과 ─────────────────────────────
  function pageScience() {
    var groups = D.taxonomy.families.map(function (f) {
      var items = D.techs.filter(function (t) { return t.family === f.id; });
      if (!items.length) return "";
      return '<div class="group-title"><h2>' + f.label + '</h2><span class="caption">' + f.ko + "</span></div>" +
        '<div class="grid">' + items.map(function (t) {
          return '<a class="card" href="#/science/' + t.id + '"><span class="eyebrow">' + esc(t.en) + "</span><h3>" + esc(t.question) + "</h3><p>" + esc(t.summary) + '</p><div class="meta">' + chip(t.id, false) + statusBadge(t.status) + "</div></a>";
        }).join("") + "</div>";
    }).join("");
    return head("SCIENCE", "피부관리 기술 백과", "제품과 시술을 이해하기 위한 기본기. 원리, 쉬운 설명, 확인된 근거의 범위, 안전성과 한계를 함께 적습니다.") + groups;
  }
  function pageTech(id) {
    var t = byId(D.techs, id);
    if (!t) return notFound();
    var devices = D.devices.filter(function (d) { return d.techIds.indexOf(id) > -1; });
    var treatments = D.treatments.filter(function (x) { return x.techIds.indexOf(id) > -1; });
    var fam = familyMeta(t.family);
    var body =
      '<p class="summary">' + esc(t.summary) + "</p>" +
      block("쉬운 설명", '<p class="plain">' + esc(t.plain) + "</p>") +
      block(t.id === "units" ? "단위별 의미" : "작용 방식", list(t.mechanism)) +
      (TECH_LAYERS[id] ? block("적용 층 (일반 설명)", skinSvg([id])) : "") +
      (t.purposes.length ? block("일반적인 사용 목적", list(t.purposes)) : "") +
      block("현재 확인된 근거", '<p class="note note--warn">' + esc(t.evidence) + "</p>") +
      (t.safety.length ? block("안전성 · 제한사항", list(t.safety)) : "") +
      (devices.length ? block("대표 홈 디바이스", '<div class="grid">' + devices.map(deviceCard).join("") + "</div>") : "") +
      (treatments.length ? block("관련 전문 장비 · 시술", '<div class="grid">' + treatments.map(treatmentCard).join("") + "</div>") : "") +
      block("관련 연구 · 출처", "<p>" + na("출처 미입력") + ' <span class="caption">출처는 T1–T7 등급으로 구분해 표시합니다.</span></p>');
    return '<a class="back" href="#/science">← Science</a><div class="split detail"><div>' +
      '<p class="eyebrow">' + esc(t.question) + "</p><h1>" + esc(t.name) + '</h1><p class="sub">' + esc(t.en) + "</p>" + body + "</div>" +
      aside([["레코드 상태", statusBadge(t.status)], ["계열", fam ? '<span class="chip f-' + fam.id + '">' + fam.label + "</span>" : ""], ["다른 이름", esc(t.aka.join(", "))], ["검수일", na("검수 전")]]) + "</div>";
  }

  function aside(rows, compareKey) {
    return '<aside class="aside"><dl>' + rows.map(function (r) { return "<div><dt>" + r[0] + "</dt><dd>" + r[1] + "</dd></div>"; }).join("") + "</dl>" +
      (compareKey ? compareBtn(compareKey) : "") +
      '<a class="caption" href="#/about">정보 수정 요청 · 편집 원칙 →</a></aside>';
  }
  function head(eyebrow, title, desc) {
    return '<div class="page-head"><p class="eyebrow">' + eyebrow + "</p><h1>" + title + "</h1><p>" + desc + "</p></div>";
  }
  function notFound() { return head("404", "항목을 찾을 수 없습니다", '<a href="#/">홈으로</a>'); }

  // ── 페이지: 비교 ──────────────────────────────────
  function pageCompare() {
    var sel = tray();
    while (sel.length < 2) sel.push("");
    var opts = function (cur) {
      return '<option value="">— 선택 —</option>' +
        '<optgroup label="홈 디바이스">' + D.devices.map(function (d) { var k = "device:" + d.id; return '<option value="' + k + '"' + (k === cur ? " selected" : "") + ">" + esc(d.name + " (" + d.techIds.map(tagLabel).join("+") + ")") + "</option>"; }).join("") + "</optgroup>" +
        '<optgroup label="피부과 시술">' + D.treatments.map(function (t) { var k = "clinic:" + t.id; return '<option value="' + k + '"' + (k === cur ? " selected" : "") + ">" + esc(t.name) + "</option>"; }).join("") + "</optgroup>";
    };
    var slots = [0, 1, 2].map(function (i) { return '<select data-slot="' + i + '" aria-label="비교 항목 ' + (i + 1) + '">' + opts(sel[i] || "") + "</select>"; }).join("");
    var ents = sel.map(function (k) { return k ? entity(k) : null; }).filter(Boolean);

    return head("COMPARE", "비교", "제품 ↔ 제품, 제품 ↔ 시술, 시술 ↔ 시술. 같은 기준의 항목만 나란히 놓고, 비교할 수 없는 것은 왜 비교하지 않는지 알려 드립니다.") +
      '<div class="pickers">' + slots + "</div>" +
      (ents.length >= 2 ? compareTable(ents) : '<p class="empty">두 개 이상 선택하면 비교표가 나타납니다. 예: 써마지 ↔ 올리지오, 샘플 A ↔ 써마지</p>') +
      '<section class="section" id="calc"><p class="eyebrow">Beauty Economics</p><h2 style="margin:6px 0 8px">단순 구매비용 계산기</h2>' +
      '<p class="caption" style="margin-bottom:16px">직접 입력한 금액으로 단순 구매비용만 비교합니다. atlas.는 실제 제품 · 시술 가격을 넣어 두지 않았습니다.</p>' +
      calcHtml() + "</section>";
  }
  function techsOf(e) { return e.rec.techIds; }
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
      ["가격", function (e) { return na(e.kind === "device" ? "미입력" : "조사 전"); }, true],
      ["회복", function (e) { return e.kind === "device" ? '<span class="caption">해당 없음 / 제조사 지침</span>' : "개인차 · 의료진 안내"; }],
      ["알려진 위험", function (e) {
        if (e.kind === "clinic") return list(e.rec.risks);
        return list(uniq([].concat.apply([], techsOf(e).map(function (t) { var x = byId(D.techs, t); return x ? x.safety : []; }))));
      }, true],
      ["레코드 상태", function (e) { return statusBadge(e.rec.status); }]
    ];
    var html = (mixed ? '<p class="note note--warn" style="margin:0 0 14px">홈 디바이스와 전문 시술은 같은 기술 계열이어도 출력, 표적 깊이, 허가 목적, 시행 주체가 다릅니다. 이 표는 효과의 크기를 비교하지 않습니다.</p>' : "") +
      '<div class="ctable-wrap"><table class="ctable"><thead><tr><th></th>' +
      ents.map(function (e) { return '<th><a href="#/' + e.kind + "/" + e.rec.id + '">' + esc(entityName(e)) + "</a></th>"; }).join("") +
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
    return head("SEARCH", "“" + esc(q) + "” 검색 결과", total + "건") +
      (techs.length ? '<div class="group-title"><h2>기술</h2></div><div class="grid">' + techs.map(function (t) { return '<a class="card" href="#/science/' + t.id + '"><h3>' + esc(t.name) + "</h3><p>" + esc(t.summary) + "</p></a>"; }).join("") + "</div>" : "") +
      (txs.length ? '<div class="group-title"><h2>시술</h2></div><div class="grid">' + txs.map(treatmentCard).join("") + "</div>" : "") +
      (devs.length ? '<div class="group-title"><h2>디바이스</h2></div><div class="grid">' + devs.map(deviceCard).join("") + "</div>" : "") +
      (total ? "" : '<p class="empty">결과가 없습니다. 예: RF, 초음파, PLLA, 써마지</p>');
  }

  // ── 페이지: About ─────────────────────────────────
  function pageAbout() {
    return head("ABOUT", "편집 원칙", "atlas.는 피부관리 기술에 대한 정보 장벽을 낮추고, 누구나 자신의 피부에 사용되는 기술을 이해해 더 합리적으로 선택하도록 돕습니다.") +
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

  // ── 라우터 ────────────────────────────────────────
  function route() {
    var h = location.hash.replace(/^#\/?/, "");
    var parts = h.split("?"), path = parts[0].split("/"), query = new URLSearchParams(parts[1] || "");
    var html, nav = path[0] || "";
    switch (path[0]) {
      case "": html = pageHome(); break;
      case "device": html = path[1] ? pageDevice(path[1]) : pageDevices(); break;
      case "clinic": html = path[1] ? pageTreatment(path[1]) : pageClinic(); break;
      case "science": html = path[1] ? pageTech(path[1]) : pageScience(); break;
      case "compare": html = pageCompare(); break;
      case "about": html = pageAbout(); break;
      case "search": html = pageSearch(query.get("q") || ""); break;
      default: html = notFound();
    }
    view.innerHTML = html;
    document.querySelectorAll("[data-nav]").forEach(function (a) { a.classList.toggle("on", a.dataset.nav === nav); });
    var h1 = view.querySelector("h1");
    document.title = (h1 && nav ? h1.textContent + " — " : "") + "atlas. — 피부관리 기술의 지도";
    renderTray();
  }

  // ── 이벤트 ────────────────────────────────────────
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-compare],[data-untray],[data-filter],[data-calc-example]");
    if (!t) return;
    if (t.dataset.compare) {
      var a = tray(), k = t.dataset.compare, i = a.indexOf(k);
      if (i > -1) a.splice(i, 1); else { if (a.length >= 3) a.shift(); a.push(k); }
      setTray(a); route();
    } else if (t.dataset.untray) {
      setTray(tray().filter(function (x) { return x !== t.dataset.untray; })); route();
    } else if (t.dataset.filter) {
      deviceFilter = t.dataset.filter; route();
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
    if (e.target.dataset.calc) {
      calcState[e.target.dataset.calc] = e.target.value;
      document.getElementById("calc-result").innerHTML = calcResult();
    }
  });
  document.getElementById("search").addEventListener("submit", function (e) {
    e.preventDefault();
    var q = document.getElementById("q").value.trim();
    if (q) location.hash = "#/search?q=" + encodeURIComponent(q);
  });
  window.addEventListener("hashchange", function () { route(); window.scrollTo(0, 0); });

  // ── 데이터 로드 ───────────────────────────────────
  function load(name) { return fetch("data/" + name + ".json").then(function (r) { if (!r.ok) throw new Error(name); return r.json(); }); }
  Promise.all([load("taxonomy"), load("technologies"), load("treatments"), load("devices")]).then(function (r) {
    D.taxonomy = r[0]; D.techs = r[1]; D.treatments = r[2]; D.devices = r[3];
    route();
  }).catch(function () {
    view.innerHTML = '<p class="empty">데이터를 불러오지 못했습니다. 로컬에서 열 때는 저장소 루트에서 <code>python3 -m http.server</code>로 실행하세요.</p>';
  });
})();
