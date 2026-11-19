import type { SkinKey } from "../content/ingredients.ts";

// 피부 타입 셀프 체크. 진단이 아니라 '지금 내 피부가 어느 쪽에 가까운지' 보는 생활 체크다.
// 점수: oil(유분) · dry(건조) · sens(예민). 결과는 지성 · 건성 · 복합성 · 중성 + 예민 여부.

export interface SkinQ {
  id: string;
  q: string;
  hint?: string;
  options: { label: string; oil?: number; dry?: number; sens?: number; tzone?: number }[];
}

export const SKIN_QUESTIONS: SkinQ[] = [
  {
    id: "wash2h", q: "세안하고 아무것도 안 바른 채 2시간 뒤, 얼굴은?",
    hint: "주말 아침에 직접 해보면 가장 정확해요.",
    options: [
      { label: "전체가 번들거려요", oil: 3 },
      { label: "이마 · 코만 번들, 볼은 괜찮아요", oil: 1, tzone: 3 },
      { label: "편안하고 별 느낌 없어요" },
      { label: "볼이 당기고 건조해요", dry: 3 },
    ],
  },
  {
    id: "afternoon", q: "오후 3시쯤 휴지로 코와 이마를 눌러보면?",
    options: [
      { label: "기름이 확실히 묻어나요", oil: 2, tzone: 1 },
      { label: "살짝 묻어요", oil: 1, tzone: 1 },
      { label: "거의 안 묻어요" },
      { label: "오히려 하얗게 일어난 각질이 보여요", dry: 2 },
    ],
  },
  {
    id: "pores", q: "거울 가까이서 보면 모공은?",
    options: [
      { label: "볼까지 넓게 보여요", oil: 2 },
      { label: "코 주변만 눈에 띄어요", tzone: 2 },
      { label: "잘 안 보여요", dry: 1 },
    ],
  },
  {
    id: "flake", q: "겨울이나 에어컨 바람 아래에서 각질은?",
    options: [
      { label: "거의 안 생겨요", oil: 1 },
      { label: "볼 쪽에 가끔", dry: 1, tzone: 1 },
      { label: "자주 하얗게 일어나요", dry: 3 },
    ],
  },
  {
    id: "react", q: "새 제품을 바르거나 면도한 뒤 따갑거나 붉어지는 일은?",
    options: [
      { label: "거의 없어요" },
      { label: "가끔 있어요", sens: 1 },
      { label: "자주 있어요", sens: 3 },
    ],
  },
  {
    id: "trouble", q: "트러블은 얼마나 자주 나요?",
    options: [
      { label: "거의 안 나요" },
      { label: "한 달에 몇 개 정도", oil: 1 },
      { label: "늘 몇 개씩 있어요", oil: 2 },
      { label: "붉고 아픈 게 반복돼요", oil: 2, sens: 1 },
    ],
  },
];

export type SkinTypeKey = "oily" | "dry" | "combo" | "normal";

export interface SkinResult {
  type: SkinTypeKey;
  sensitive: boolean;
  scores: { oil: number; dry: number; tzone: number; sens: number };
  at: string;
}

export function scoreSkin(answers: Record<string, number>): SkinResult {
  const s = { oil: 0, dry: 0, tzone: 0, sens: 0 };
  for (const q of SKIN_QUESTIONS) {
    const o = q.options[answers[q.id] ?? -1];
    if (!o) continue;
    s.oil += o.oil ?? 0; s.dry += o.dry ?? 0; s.tzone += o.tzone ?? 0; s.sens += o.sens ?? 0;
  }
  let type: SkinTypeKey;
  if (s.tzone >= 3 && s.dry >= 1) type = "combo";
  else if (s.tzone >= 4) type = "combo";
  else if (s.oil >= 5 && s.oil > s.dry + 2) type = "oily";
  else if (s.dry >= 4 && s.dry > s.oil) type = "dry";
  else if (s.oil >= 3 && s.tzone >= 2) type = "combo";
  else type = "normal";
  return { type, sensitive: s.sens >= 3, scores: s, at: new Date().toISOString() };
}

export interface SkinProfile {
  ko: string;
  en: string;
  one: string;
  traits: string[];
  /** 고를 제형 · 제품 종류 (브랜드 아님) */
  products: { step: string; pick: string; why: string }[];
  /** 추천 성분 slug */
  ingredients: string[];
  /** 피할 것 */
  avoid: string[];
  sunscreen: string;
  /** 루틴에 추가 제안 */
  addons: { title: string; slot: "am" | "pm"; minutes: number }[];
}

export const SKIN_PROFILES: Record<SkinTypeKey, SkinProfile> = {
  oily: {
    ko: "지성", en: "OILY",
    one: "유분은 많지만, 수분까지 많은 건 아니에요. 기름을 '없애는' 게 아니라 '조절'하는 게 목표예요.",
    traits: ["오후가 되면 얼굴 전체가 번들거림", "볼까지 모공이 보임", "블랙헤드 · 좁쌀이 잘 생김"],
    products: [
      { step: "세안", pick: "약산성 젤 · 폼 클렌저", why: "세정력은 충분히, 당김은 적게" },
      { step: "보습", pick: "가벼운 수분젤 · 젤크림", why: "보습을 빼면 오히려 유분이 더 올라오는 느낌이 들기 쉬워요" },
      { step: "자외선", pick: "유기자차 · 혼합자차 (산뜻한 로션 · 젤)", why: "백탁과 무거움이 적어 매일 쓰기 쉬워요" },
      { step: "추가", pick: "BHA 토너 · 패드 (주 2~3회)", why: "모공 속 피지 · 각질 정리" },
    ],
    ingredients: ["niacinamide", "salicylic-acid", "azelaic-acid", "retinol", "tranexamic-acid"],
    avoid: ["하루 3번 이상 세안", "알코올 느낌 강한 스킨으로 닦아내기", "보습 완전히 생략하기"],
    sunscreen: "유기자차나 혼합자차의 젤 · 로션 제형. 땀이 많으면 워터프루프.",
    addons: [
      { title: "BHA 토너로 T존 닦기 (주 2~3회)", slot: "pm", minutes: 1 },
      { title: "점심 후 기름종이로 T존 누르기", slot: "am", minutes: 0.5 },
    ],
  },
  dry: {
    ko: "건성", en: "DRY",
    one: "피부가 스스로 붙잡는 기름과 수분이 적은 편이에요. 장벽을 채우는 게 먼저예요.",
    traits: ["세안 후 금방 당김", "각질이 하얗게 일어남", "모공은 잘 안 보임"],
    products: [
      { step: "세안", pick: "크림 · 밀크 타입 저자극 클렌저, 아침엔 물세안도 OK", why: "필요한 유분까지 씻어내지 않게" },
      { step: "보습", pick: "히알루론산 세럼 + 세라마이드 크림", why: "수분을 끌어오고, 크림으로 덮어 붙잡기" },
      { step: "자외선", pick: "무기자차 · 혼합자차의 촉촉한 크림 제형", why: "건조함과 자극을 덜어요" },
      { step: "추가", pick: "저녁에 페이스 오일 1~2방울 (크림에 섞기)", why: "건조한 계절에 수분 증발을 한 번 더 막기" },
    ],
    ingredients: ["ceramide", "glycerin", "squalane", "panthenol", "adenosine", "peptides"],
    avoid: ["뜨거운 물 세안", "스크럽 · 강한 각질 제거", "알코올 함량 높은 토너"],
    sunscreen: "무기자차나 혼합자차의 크림 제형.",
    addons: [
      { title: "세안 후 1분 안에 보습제", slot: "am", minutes: 0.5 },
      { title: "자기 전 세라마이드 크림 한 번 더", slot: "pm", minutes: 0.5 },
    ],
  },
  combo: {
    ko: "복합성", en: "COMBINATION",
    one: "T존은 지성, 볼은 중성 · 건성에 가까워요. 부위별로 다르게 챙기는 게 핵심이에요.",
    traits: ["이마 · 코만 번들거림", "볼은 당기거나 무난함", "코 주변 모공 · 블랙헤드"],
    products: [
      { step: "세안", pick: "약산성 젤 클렌저", why: "T존은 개운하게, 볼은 당기지 않게" },
      { step: "보습", pick: "젤크림 전체 + 볼에만 크림 한 겹 더", why: "부위별 레이어링" },
      { step: "자외선", pick: "혼합자차 로션", why: "산뜻함과 순함의 중간" },
      { step: "추가", pick: "BHA는 T존에만 주 2회", why: "볼까지 바르면 건조해지기 쉬워요" },
    ],
    ingredients: ["niacinamide", "salicylic-acid", "pha-lha", "hyaluronic-acid", "ceramide"],
    avoid: ["얼굴 전체에 같은 강도의 각질 제거", "지성용 제품으로 볼까지 말리기"],
    sunscreen: "혼합자차 로션. T존이 무너지면 그 부위만 파우더 · 기름종이.",
    addons: [
      { title: "BHA를 T존에만 (주 2회)", slot: "pm", minutes: 1 },
      { title: "볼에만 보습크림 한 겹 더", slot: "pm", minutes: 0.5 },
    ],
  },
  normal: {
    ko: "중성", en: "NORMAL",
    one: "유분과 수분의 균형이 무난한 편이에요. 지금 상태를 지키면서 원하는 성분을 하나씩 더해요.",
    traits: ["큰 불편함 없음", "계절 따라 조금씩 변함"],
    products: [
      { step: "세안", pick: "순한 젤 · 폼 클렌저", why: "지금 균형을 깨지 않게" },
      { step: "보습", pick: "로션 · 가벼운 크림", why: "계절에 맞춰 무게만 조절" },
      { step: "자외선", pick: "쓰기 편한 제형 아무거나, SPF30 이상", why: "가장 좋은 선크림은 매일 바르게 되는 선크림" },
      { step: "추가", pick: "아침 비타민 C 또는 저녁 레티놀", why: "관리 목표(톤 · 결)에 맞춰 하나씩" },
    ],
    ingredients: ["vitamin-c", "niacinamide", "retinol", "tranexamic-acid", "adenosine"],
    avoid: ["한 번에 여러 기능성 제품 시작하기"],
    sunscreen: "SPF30 이상, 쓰기 편한 제형이면 충분해요.",
    addons: [
      { title: "아침 비타민 C 세럼", slot: "am", minutes: 0.5 },
    ],
  },
};

export const SENSITIVE_NOTE = {
  title: "예민 신호가 있어요",
  points: [
    "새 제품은 귀 뒤나 턱선에 2~3일 먼저 발라 보고 써요.",
    "향료 · 알코올 · 강한 각질 제거 성분이 많은 제품은 천천히.",
    "자외선 차단제는 무기자차부터 시도해 보세요.",
    "면도 후엔 판테놀 · 시카 같은 진정 성분.",
    "붉은 기 · 따가움이 계속되면 피부과 상담을 받아요.",
  ],
  ingredients: ["panthenol", "centella", "allantoin", "beta-glucan", "zinc-oxide", "bakuchiol"],
};

export const SKIN_LABEL: Record<SkinKey, string> = { oily: "지성", dry: "건성", combo: "복합성", normal: "중성", sensitive: "예민" };
