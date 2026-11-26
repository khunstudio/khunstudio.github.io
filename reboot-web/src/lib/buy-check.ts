import { INGREDIENTS, type Ingredient, type SkinKey } from "../content/ingredients.ts";
import { PRODUCTS, type Product } from "../content/products.ts";
import { classifyActiveGroups } from "./conditions.ts";
import { dayKey, visibleItems } from "./engine.ts";
import type { RoutineItem, Store } from "./types.ts";

// 4단계 "사도 돼?" 성분 · 루틴 중복 판정기 (100% 오프라인 · 초성 검색 · 가격 비교 제외).
// 원칙: 성분이 먼저 → 제품 종류 → 내 피부/루틴 기준 판정 → 예시 제품.

const CHOSEONG = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ",
  "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
];

/** 한글 문자열에서 초성을 추출한다. 영문·숫자는 소문자로 유지한다. */
export function toChoseong(text: string): string {
  let out = "";
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) {
      out += CHOSEONG[Math.floor((code - 0xac00) / 588)];
    } else if (!/\s/.test(ch)) {
      out += ch.toLowerCase();
    }
  }
  return out;
}

const isChoseongOnly = (q: string) => /^[ㄱ-ㅎ\s]+$/.test(q);

export interface SearchHit {
  ingredient: Ingredient;
  matchedProducts: Product[];
}

/** 오프라인 초성 · 키워드 검색 (성분명, 영문명, 태그, 큐레이션 예시 브랜드/제품명 대상) */
export function searchIngredientsOffline(rawQuery: string): SearchHit[] {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return [];
  const qNoSpace = q.replace(/\s+/g, "");
  const choMode = isChoseongOnly(q);

  const hits: SearchHit[] = [];
  for (const ing of INGREDIENTS) {
    const relatedProducts = PRODUCTS.filter((p) => p.ingredient === ing.slug);
    const ingHaystack = `${ing.ko} ${ing.en} ${ing.role} ${ing.tags.join(" ")}`.toLowerCase();
    const ingCho = toChoseong(`${ing.ko} ${ing.tags.join(" ")}`);

    const ingMatch = choMode
      ? ingCho.includes(qNoSpace)
      : ingHaystack.includes(q) || ingCho.includes(qNoSpace);

    const matchedProducts = relatedProducts.filter((p) => {
      const pText = `${p.brand} ${p.name} ${p.kind}`.toLowerCase();
      const pCho = toChoseong(`${p.brand} ${p.name} ${p.kind}`);
      return choMode ? pCho.includes(qNoSpace) : pText.includes(q) || pCho.includes(qNoSpace);
    });

    if (ingMatch || matchedProducts.length > 0) {
      hits.push({
        ingredient: ing,
        matchedProducts: matchedProducts.length > 0 ? matchedProducts : relatedProducts,
      });
    }
  }
  return hits;
}

export type Verdict = "FIT" | "OVERLAP" | "CAUTION" | "HOLD";

export type RoleGroup =
  | "sebum_pore"
  | "soothing"
  | "barrier"
  | "exfoliant_strong"
  | "exfoliant_mild"
  | "retinoid"
  | "vitamin_c"
  | "brightening_mild"
  | "sunscreen"
  | "booster_spicule"
  | "spot_trouble"
  | "hydration"
  | "rx_only"
  | "hype";

const SLUG_ROLE: Record<string, RoleGroup> = {
  niacinamide: "sebum_pore",
  panthenol: "soothing",
  centella: "soothing",
  allantoin: "soothing",
  licorice: "soothing",
  ceramide: "barrier",
  squalane: "barrier",
  glycerin: "hydration",
  "hyaluronic-acid": "hydration",
  "beta-glucan": "hydration",
  urea: "hydration",
  "salicylic-acid": "exfoliant_strong",
  aha: "exfoliant_strong",
  "azelaic-acid": "exfoliant_mild",
  "pha-lha": "exfoliant_mild",
  retinol: "retinoid",
  retinal: "retinoid",
  bakuchiol: "retinoid",
  "retinoids-rx": "rx_only",
  "vitamin-c": "vitamin_c",
  "tranexamic-acid": "brightening_mild",
  arbutin: "brightening_mild",
  adenosine: "brightening_mild",
  peptides: "brightening_mild",
  "zinc-oxide": "sunscreen",
  "organic-filters": "sunscreen",
  spicule: "booster_spicule",
  "benzoyl-peroxide": "spot_trouble",
  sulfur: "spot_trouble",
  "tea-tree": "spot_trouble",
  "pdrn-topical": "hype",
  "collagen-topical": "hype",
  "stem-cell": "hype",
  "thread-ampoule": "hype",
  "bubble-pack": "hype",
};

const HIGH_IRRITATION = new Set([
  "retinol",
  "retinal",
  "salicylic-acid",
  "aha",
  "spicule",
  "benzoyl-peroxide",
  "vitamin-c",
]);

const NEEDS_SUNSCREEN = new Set(["retinol", "retinal", "aha", "salicylic-acid", "spicule", "pha-lha"]);

const SKIN_KO: Record<SkinKey, string> = {
  oily: "지성",
  dry: "건성",
  combo: "복합성",
  normal: "중성",
  sensitive: "예민",
};

export interface BuyCheckResult {
  verdict: Verdict;
  label: string;
  headline: string;
  reasons: string[];
  roleGroup: RoleGroup;
  needsProfileHint: boolean;
}

const VERDICT_LABEL: Record<Verdict, string> = {
  FIT: "잘 맞음",
  OVERLAP: "역할 겹침 · 굳이 안 사도 됨",
  CAUTION: "주의해서 시작",
  HOLD: "지금은 보류 권장",
};

/** 현재 활성 루틴 항목에서 이미 갖고 있는 역할군을 추론한다. */
function detectRoutineSignals(items: RoutineItem[]) {
  const hasSunscreen = items.some((i) => i.id.includes("sunscreen") || /선크림|자외선/.test(i.title));
  const hasSoothing = items.some((i) => i.id === "soothe-quick" || i.id === "soothing-pad" || /진정|판테놀|시카|병풀/.test(i.title));
  const hasRetinoid = items.some((i) => classifyActiveGroups(i).includes("retinoid"));
  const hasAcid = items.some((i) => classifyActiveGroups(i).includes("acid"));
  const hasVitC = items.some((i) => classifyActiveGroups(i).includes("vitamin_c"));
  const hasScrubOrSpicule = items.some((i) => classifyActiveGroups(i).includes("scrub"));
  const hasNiacinamide = items.some((i) => /나이아신/.test(i.title));
  return { hasSunscreen, hasSoothing, hasRetinoid, hasAcid, hasVitC, hasScrubOrSpicule, hasNiacinamide };
}

/** 성분 1종을 사용자의 로컬 프로필·피부타입·루틴·오늘 컨디션 기준으로 판정한다. */
export function evaluateBuyCheck(ing: Ingredient, store: Store | null, today = new Date()): BuyCheckResult {
  const roleGroup: RoleGroup = SLUG_ROLE[ing.slug] ?? "hydration";
  const needsProfileHint = !store?.skin && !store?.routine;

  // 1. 처방 성분 / 과장 주의 성분은 루틴과 무관하게 보류
  if (ing.level === "처방" || roleGroup === "rx_only") {
    return {
      verdict: "HOLD",
      label: VERDICT_LABEL.HOLD,
      headline: "처방이 필요한 의약품 성분이에요.",
      reasons: [
        "화장품처럼 임의로 구매해 시작하지 않고 피부과 진료와 처방을 따르는 성분이에요.",
        ...ing.caution.slice(0, 1),
      ],
      roleGroup,
      needsProfileHint: false,
    };
  }
  if (ing.level === "과장 주의" || roleGroup === "hype") {
    return {
      verdict: "HOLD",
      label: VERDICT_LABEL.HOLD,
      headline: ing.verdict ?? "광고 표현에 비해 바르는 화장품 근거가 약해요.",
      reasons: [
        ing.role,
        "같은 예산이라면 기본 3단계(세안·보습·선크림)나 근거가 탄탄한 성분부터 챙기는 편이 나아요.",
      ],
      roleGroup,
      needsProfileHint: false,
    };
  }

  const todayConds = store?.records[dayKey(today)]?.conditions ?? [];
  const isSensitiveNow = Boolean(store?.skin?.sensitive) || todayConds.includes("sensitive_flare");
  const activeItems = store?.routine ? visibleItems(store.routine.items, store.routine.situation) : [];
  const sig = detectRoutineSignals(activeItems);

  // 2. 현재 예민/따가움 상태 + 고자극 활성 성분 → HOLD
  if (isSensitiveNow && HIGH_IRRITATION.has(ing.slug)) {
    return {
      verdict: "HOLD",
      label: VERDICT_LABEL.HOLD,
      headline: "지금은 피부가 예민한 상태라 보류하는 편이 안전해요.",
      reasons: [
        todayConds.includes("sensitive_flare")
          ? "오늘 컨디션에 '따가움 · 예민'이 켜져 있어요. 자극 성분을 새로 시작하지 말고 장벽 보습부터 회복해요."
          : "피부 타입에 '예민'이 표시되어 있어요. 자극이 큰 성분은 장벽이 안정된 뒤 소량부터 검토해요.",
        ...ing.caution.slice(0, 1),
      ],
      roleGroup,
      needsProfileHint,
    };
  }

  // 3. 기존 루틴과의 자극 충돌 체크 → CAUTION
  const cautionReasons: string[] = [];
  if ((ing.slug === "retinol" || ing.slug === "retinal") && (sig.hasAcid || sig.hasScrubOrSpicule)) {
    cautionReasons.push("현재 루틴에 각질제거(AHA·BHA) 또는 스크럽/스피큘이 있어요. 같은 날 밤에 겹치지 말고 격일로 나눠요.");
  }
  if ((ing.slug === "salicylic-acid" || ing.slug === "aha" || ing.slug === "spicule") && sig.hasRetinoid) {
    cautionReasons.push("현재 루틴에 레티노이드 계열이 있어요. 같은 날 밤에 함께 쓰면 건조함·자극이 커질 수 있어요.");
  }
  if (store?.routine && NEEDS_SUNSCREEN.has(ing.slug) && !sig.hasSunscreen) {
    cautionReasons.push("현재 활성 루틴에 자외선 차단제가 빠져 있어요. 선크림부터 매일 바른 뒤 시작하는 편이 안전해요.");
  }
  if (store?.skin && !ing.goodFor.includes(store.skin.type)) {
    cautionReasons.push(`내 피부 타입(${SKIN_KO[store.skin.type]})에는 건조하거나 부담스러울 수 있는 성분이에요.`);
  }

  if (cautionReasons.length > 0) {
    return {
      verdict: "CAUTION",
      label: VERDICT_LABEL.CAUTION,
      headline: "조건을 확인하고 소량·격일부터 시작해요.",
      reasons: [...cautionReasons, ...ing.use.slice(0, 1)].slice(0, 3),
      roleGroup,
      needsProfileHint,
    };
  }

  // 4. 현재 루틴과의 역할 중복 체크 → OVERLAP
  const overlapReason =
    (roleGroup === "retinoid" && sig.hasRetinoid && "이미 루틴에 레티노이드 계열 항목이 있어요.") ||
    (roleGroup === "exfoliant_strong" && sig.hasAcid && "이미 루틴에 각질 관리(AHA·BHA) 항목이 있어요.") ||
    (roleGroup === "vitamin_c" && sig.hasVitC && "이미 루틴에 비타민 C 항목이 들어 있어요.") ||
    (roleGroup === "sebum_pore" && sig.hasNiacinamide && "이미 루틴에 나이아신아마이드 항목이 있어요.") ||
    (roleGroup === "sunscreen" && sig.hasSunscreen && "이미 루틴에 자외선 차단제가 켜져 있어요.") ||
    (roleGroup === "soothing" && sig.hasSoothing && "이미 진정 보습 항목이 루틴에 있어요.") ||
    (roleGroup === "booster_spicule" && sig.hasScrubOrSpicule && "이미 스피큘·스크럽 계열 항목이 루틴에 있어요.");

  if (overlapReason) {
    return {
      verdict: "OVERLAP",
      label: VERDICT_LABEL.OVERLAP,
      headline: "비슷한 역할이 이미 내 루틴에 있어요.",
      reasons: [
        overlapReason,
        "지금 쓰는 제품을 다 쓴 뒤에 바꿔도 늦지 않아요. 중복 구매를 줄이는 게 피부에도 편해요.",
      ],
      roleGroup,
      needsProfileHint,
    };
  }

  // 5. 기본 적합 → FIT
  const reasons: string[] = [ing.role];
  if (store?.skin) {
    reasons.push(`내 피부 타입(${SKIN_KO[store.skin.type]})에 무난하게 맞는 편으로 분류된 성분이에요.`);
  }
  if (ing.use[0]) reasons.push(`사용 팁: ${ing.use[0]}`);

  return {
    verdict: "FIT",
    label: VERDICT_LABEL.FIT,
    headline: "내 루틴에 무난하게 켜기 좋은 성분이에요.",
    reasons,
    roleGroup,
    needsProfileHint,
  };
}
