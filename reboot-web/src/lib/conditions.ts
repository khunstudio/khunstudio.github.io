import type { Area, ConditionTag, RoutineItem } from "./types.ts";

// 원탭 컨디션 태그별 당일 루틴 조정 규칙 (100% 클라이언트 로컬 실행, 비의료 생활 관리 기준).
// 다중 태그 충돌 시 안전 우선(Safety-First Merge): 어느 한 태그라도 자극 성분을 PAUSE하면 그날은 PAUSE가 우선한다.

export type ActiveGroup = "retinoid" | "acid" | "vitamin_c" | "device" | "scrub";

export interface ConditionMeta {
  id: ConditionTag;
  label: string;
  area: Area;
  pauseGroups: ActiveGroup[];
  emphasizeIds: string[];
  summary: string;
  tip: string;
  tone: "soothing" | "minimal";
  showDermNotice?: boolean;
}

export const CONDITION_ORDER: ConditionTag[] = [
  "outdoor_uv",
  "shaved",
  "sweat_workout",
  "sleep_low",
  "heavy_diet",
  "dry_cold",
  "sensitive_flare",
  "important_soon",
];

export const CONDITIONS: Record<ConditionTag, ConditionMeta> = {
  outdoor_uv: {
    id: "outdoor_uv",
    label: "야외 · 햇빛 많음",
    area: "life",
    pauseGroups: ["retinoid", "acid", "scrub"],
    emphasizeIds: ["am-sunscreen", "noon-sunscreen", "sunscreen-reapply", "soothe-quick", "soothing-pad", "pm-moisturize"],
    summary: "햇빛과 바람에 노출된 날이에요. 오늘 밤은 각질·레티놀을 쉬고 진정과 보습만 켜요.",
    tip: "야외활동 후엔 세안을 세게 하기보다 미지근한 물로 씻고 보습을 충분히 얹어요.",
    tone: "soothing",
  },
  shaved: {
    id: "shaved",
    label: "면도함",
    area: "style",
    pauseGroups: ["retinoid", "acid", "scrub"],
    emphasizeIds: ["shave-prep", "shave-after", "shave-grain", "soothe-quick", "pm-moisturize"],
    summary: "면도는 각질층에 미세한 자극을 남겨요. 보습을 먼저 얹고 자극 성분은 하루 쉬어요.",
    tip: "면도 부위가 따갑다면 향과 알코올이 적은 진정 보습제만 얇게 발라요.",
    tone: "soothing",
  },
  sweat_workout: {
    id: "sweat_workout",
    label: "운동 · 땀 많음",
    area: "body",
    pauseGroups: [],
    emphasizeIds: ["sweat-rinse", "after-active-rinse", "pm-cleanse", "water"],
    summary: "땀과 피지가 섞여 오래 남지 않도록 순하게 씻고 가볍게 수분만 채워요.",
    tip: "운동 직후 바로 세안하기 어렵다면 깨끗한 물로 먼저 헹구고 젖은 옷을 갈아입어요.",
    tone: "soothing",
  },
  sleep_low: {
    id: "sleep_low",
    label: "수면 부족 · 늦은 취침",
    area: "life",
    pauseGroups: ["acid", "scrub"],
    emphasizeIds: ["am-moisturize", "pm-moisturize", "screen-off"],
    summary: "잠이 부족한 날은 장벽이 예민해지기 쉬워요. 단계를 늘리지 말고 기본 보습만 챙겨요.",
    tip: "새 기능성 제품을 처음 시작하는 건 푹 잔 날로 미루고 기본 3단계만 유지해요.",
    tone: "soothing",
  },
  heavy_diet: {
    id: "heavy_diet",
    label: "기름진 음식 · 야식",
    area: "life",
    pauseGroups: [],
    emphasizeIds: ["pm-cleanse", "water", "blot-tzone"],
    summary: "음식 하나가 트러블의 유일한 원인은 아니에요. 세안을 늘리기보다 평소 순서를 유지해요.",
    tip: "과도한 세안이나 스크럽은 오히려 당김과 유분을 키울 수 있어요. 평소 루틴과 수분 섭취만 챙겨요.",
    tone: "soothing",
  },
  dry_cold: {
    id: "dry_cold",
    label: "건조 · 찬바람/난방",
    area: "life",
    pauseGroups: ["acid", "scrub"],
    emphasizeIds: ["am-moisturize", "pm-moisturize", "dry-extra", "lip-hand"],
    summary: "실내 난방과 찬바람이 겹치면 수분이 빨리 빠져요. 세안 직후 보습 타이밍을 앞당겨요.",
    tip: "미지근한 물로 짧게 씻고, 당기는 볼·입가는 보습제를 한 겹 더 얇게 덧발라요.",
    tone: "soothing",
  },
  sensitive_flare: {
    id: "sensitive_flare",
    label: "따가움 · 붉어짐 · 예민",
    area: "skin",
    pauseGroups: ["retinoid", "acid", "vitamin_c", "device", "scrub"],
    emphasizeIds: ["am-cleanse", "am-moisturize", "am-sunscreen", "pm-cleanse", "pm-moisturize", "soothe-quick"],
    summary: "피부가 쉬고 싶다는 신호예요. 오늘은 기능성 전부를 끄고 순한 세안·보습만 남겨요.",
    tip: "생활 관리로 가라앉지 않거나 통증·진물·열감이 동반되면 피부과 상담을 권장해요.",
    tone: "minimal",
    showDermNotice: true,
  },
  important_soon: {
    id: "important_soon",
    label: "휴가 · 중요한 날 직전",
    area: "style",
    pauseGroups: ["retinoid", "acid", "scrub"],
    emphasizeIds: ["am-moisturize", "pm-moisturize", "soothing-pad", "out-grooming", "mirror-check"],
    summary: "중요한 날 직전엔 새 제품이나 자극 성분을 켜지 않는 게 안전해요. 익숙한 루틴만 유지해요.",
    tip: "검증된 기존 보습·진정 루틴으로 컨디션만 지키고, 새로운 시도는 일정 이후로 미뤄요.",
    tone: "soothing",
  },
};

/** 루틴 항목(기본 템플릿 + 사용자 직접 추가 항목)이 어떤 자극 가능 활성군에 속하는지 판별한다. */
export function classifyActiveGroups(item: RoutineItem): ActiveGroup[] {
  const groups = new Set<ActiveGroup>();
  if (item.templateId === "active-pm") {
    groups.add("retinoid");
    groups.add("acid");
  }
  if (item.templateId === "device-care") {
    groups.add("device");
  }
  const text = `${item.title} ${item.why} ${item.how}`.toLowerCase();
  if (/레티놀|레티날|레티노이드|retinol|retinal|retinoid/.test(text)) groups.add("retinoid");
  if (/\baha\b|\bbha\b|살리실|글리콜|락틱|각질\s*제거|필링|아젤라익/.test(text)) groups.add("acid");
  if (/비타민\s*c|아스코빅|vitamin\s*c/.test(text)) groups.add("vitamin_c");
  if (/디바이스|갈바닉|led|ems|부스터|고주파/.test(text)) groups.add("device");
  if (/스크럽|스피큘|spicule|scrub/.test(text)) groups.add("scrub");
  return [...groups];
}

export interface ConditionAdjustment {
  tags: ConditionTag[];
  pausedGroups: ActiveGroup[];
  pausedItemIds: string[];
  emphasizedItemIds: string[];
  pauseReasons: Record<string, string[]>;
  summary: string;
  tips: string[];
  tone: "normal" | "soothing" | "minimal";
  showDermNotice: boolean;
}

/** 선택된 컨디션 태그를 Safety-First 규칙으로 병합해 오늘의 루틴 조정 결과를 계산한다. */
export function evaluateConditions(tags: ConditionTag[] | undefined, items: RoutineItem[]): ConditionAdjustment {
  const activeTags = (tags ?? []).filter((t): t is ConditionTag => t in CONDITIONS);
  if (activeTags.length === 0) {
    return {
      tags: [],
      pausedGroups: [],
      pausedItemIds: [],
      emphasizedItemIds: [],
      pauseReasons: {},
      summary: "",
      tips: [],
      tone: "normal",
      showDermNotice: false,
    };
  }

  const pausedGroupSet = new Set<ActiveGroup>();
  const emphasizeIdSet = new Set<string>();
  const tips: string[] = [];
  let showDermNotice = false;
  let tone: "soothing" | "minimal" = "soothing";

  for (const tag of activeTags) {
    const meta = CONDITIONS[tag];
    meta.pauseGroups.forEach((g) => pausedGroupSet.add(g));
    meta.emphasizeIds.forEach((id) => emphasizeIdSet.add(id));
    if (!tips.includes(meta.tip)) tips.push(meta.tip);
    if (meta.showDermNotice) showDermNotice = true;
    if (meta.tone === "minimal") tone = "minimal";
  }

  const pausedItemIds: string[] = [];
  const pauseReasons: Record<string, string[]> = {};
  const emphasizedItemIds: string[] = [];

  for (const item of items) {
    const itemGroups = classifyActiveGroups(item);
    const matchedTags = activeTags.filter((tag) =>
      CONDITIONS[tag].pauseGroups.some((g) => itemGroups.includes(g)),
    );
    if (matchedTags.length > 0) {
      pausedItemIds.push(item.id);
      pauseReasons[item.id] = matchedTags.map((t) => CONDITIONS[t].label);
      continue;
    }
    if (emphasizeIdSet.has(item.id)) {
      emphasizedItemIds.push(item.id);
    }
  }

  // 대표 요약 문구: minimal(예민/따가움) 우선, 아니면 첫 번째 선택 태그 기준 + 복수 선택 시 안내 보강
  const primaryTag = activeTags.find((t) => CONDITIONS[t].tone === "minimal") ?? activeTags[0];
  const summary =
    activeTags.length === 1
      ? CONDITIONS[primaryTag].summary
      : showDermNotice
        ? CONDITIONS.sensitive_flare.summary
        : pausedItemIds.length > 0
          ? "오늘 컨디션에 맞춰 자극 가능 항목은 하루 쉬고, 진정·보습 순서를 우선으로 켰어요."
          : CONDITIONS[primaryTag].summary;

  return {
    tags: activeTags,
    pausedGroups: [...pausedGroupSet],
    pausedItemIds,
    emphasizedItemIds,
    pauseReasons,
    summary,
    tips: tips.slice(0, 3),
    tone,
    showDermNotice,
  };
}
