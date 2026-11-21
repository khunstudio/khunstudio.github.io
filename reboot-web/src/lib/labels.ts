import type { AgeBand, Area, Concern, Focus, Status, Experience, Goal, Minutes, Mode, Situation } from "./types.ts";

export const MODES: Record<Mode, { en: string; ko: string; desc: string }> = {
  prepare: { en: "PREPARE", ko: "입대 준비", desc: "입대 전에 기본 관리 습관을 만들어 두고 싶어요" },
  service: { en: "IN SERVICE", ko: "복무 중", desc: "제한된 시간과 환경에서 할 수 있는 관리를 찾고 있어요" },
  next: { en: "NEXT CHAPTER", ko: "전역 후", desc: "전역을 앞두었거나, 바뀐 일상에 맞게 루틴을 다시 짜고 싶어요" },
  everyday: { en: "EVERYDAY", ko: "일반 자기관리", desc: "군 복무와 상관없이 자기관리를 시작하고 싶어요" },
};
export const MODE_ORDER: Mode[] = ["prepare", "service", "next", "everyday"];

export const AREAS: Record<Area, { en: string; ko: string; desc: string }> = {
  skin: { en: "SKIN", ko: "피부", desc: "세안 · 보습 · 자외선 · 면도" },
  body: { en: "BODY", ko: "운동", desc: "운동 · 스트레칭 · 땀 관리" },
  style: { en: "STYLE", ko: "헤어 · 스타일", desc: "헤어 · 옷 · 향 · 외출 준비" },
  life: { en: "LIFE", ko: "생활습관", desc: "수면 · 수분 · 하루 정리" },
};
export const AREA_ORDER: Area[] = ["skin", "body", "style", "life"];

export const EXPERIENCES: Record<Experience, string> = {
  new: "거의 처음이에요",
  sometimes: "가끔 해요",
  steady: "꾸준히 하고 있어요",
};

export const MINUTES: Record<Minutes, string> = { 3: "하루 3분", 5: "하루 5분", 10: "하루 10분", 30: "하루 30분" };
export const MINUTE_OPTIONS: Minutes[] = [5, 10, 30];

/** 앞에서 고른 영역에 맞춰 시간 선택지 설명을 만든다 */
export function minuteDesc(m: Minutes, interests: Area[]): string {
  const has = (a: Area) => interests.includes(a);
  if (m <= 5) return "피부 기본만 확실하게. 세안 · 보습 · 자외선 차단";
  const parts: string[] = [];
  if (m === 10) {
    if (has("skin") || interests.length === 0) parts.push(interests.length > 1 ? "세럼" : "세럼과 저녁 기능성 한 단계");
    if (has("body")) parts.push("스트레칭");
    if (has("style")) parts.push("머리 손질");
    if (has("life")) parts.push("내일 할 일 정리");
    return `기본에 ${parts.slice(0, 3).join(", ")} 추가`;
  }
  const skinOnly = interests.length === 0 || (interests.length === 1 && has("skin"));
  if (skinOnly) return "세럼 · 진정 패드 · 뷰티 디바이스까지 피부 풀코스";
  parts.push(has("skin") ? "피부 기본과 세럼" : "피부 기본");
  if (has("body")) parts.push("맨몸 운동");
  if (has("style")) parts.push("헤어 · 옷 준비");
  if (has("life")) parts.push("하루 정리");
  return `${parts.join(", ")}까지 시간에 맞춰 나눠요`;
}

export const CONCERNS: Record<Concern, { ko: string; desc: string }> = {
  start: { ko: "뭐부터 할지 모르겠어요", desc: "기초부터" },
  dryness: { ko: "당기고 건조해요", desc: "보습 부족감" },
  oily: { ko: "기름이 많아요", desc: "오후 번들거림" },
  pores: { ko: "모공 · 블랙헤드", desc: "코 · 볼 모공" },
  redness: { ko: "붉고 예민해요", desc: "자극 · 따가움" },
  acne: { ko: "여드름이 자주 나요", desc: "좁쌀 · 붉은 여드름" },
  bumps: { ko: "면도 후 오돌토돌 · 모낭염", desc: "털구멍마다 뾰루지" },
  scars: { ko: "흉터 · 자국", desc: "갈색 · 붉은 자국, 패인 흉터" },
  shave: { ko: "면도 후 따가워요", desc: "면도 자극" },
  outdoor: { ko: "밖에 있는 시간이 길어요", desc: "야외 · 햇빛" },
  sweat: { ko: "땀을 많이 흘려요", desc: "운동 · 활동 후" },
};
export const CONCERN_ORDER: Concern[] = ["start", "dryness", "oily", "pores", "redness", "acne", "bumps", "scars", "shave", "outdoor", "sweat"];
export const CONCERN_GROUPS: { label: string; items: Concern[] }[] = [
  { label: "피부 상태", items: ["dryness", "oily", "pores", "redness"] },
  { label: "트러블", items: ["acne", "bumps", "scars"] },
  { label: "면도", items: ["shave"] },
  { label: "생활", items: ["outdoor", "sweat", "start"] },
];

export const GOALS: Record<Goal, string> = {
  start: "일단 시작해 보기",
  keep: "꾸준히 유지하기",
  adapt: "바뀐 생활에 맞추기",
};

/** 생활 상황 라벨은 모드에 따라 다르다. 데이터 키는 같아서 모드를 바꿔도 루틴이 이어진다. */
export function situationLabel(mode: Mode, s: Situation): string {
  const service: Record<Situation, string> = { default: "일반 근무일", active: "야외활동이 많은 날", out: "휴가 · 외출" };
  const other: Record<Situation, string> = { default: "평소", active: "운동 · 야외활동", out: "약속 · 외출" };
  return (mode === "service" ? service : other)[s];
}
export const SITUATION_ORDER: Situation[] = ["default", "active", "out"];

export const AGES: Record<AgeBand, string> = { teen: "10대", "20e": "20대 초반", "20m": "20대 중반", "20l": "20대 후반", "30s": "30대", "40p": "40대 이상" };
export const AGE_ORDER: AgeBand[] = ["teen", "20e", "20m", "20l", "30s", "40p"];

export const STATUSES: Record<Status, string> = { student: "학생", jobseeker: "취업 준비", worker: "직장인", freelance: "프리랜서 · 자영업", service: "군 복무 중", other: "그 외" };
/** 생활 단계에 맞는 선택지만 보여 준다 */
export function statusOptions(mode?: Mode): Status[] {
  if (mode === "service") return ["service"];
  if (mode === "prepare") return ["student", "jobseeker", "worker", "freelance", "other"];
  return ["student", "jobseeker", "worker", "freelance", "other"];
}

export const FOCUSES: Record<Focus, { ko: string; desc: string }> = {
  looks: { ko: "인상 · 외모", desc: "피부 · 헤어 · 옷으로 첫인상" },
  fitness: { ko: "몸 만들기", desc: "운동 · 체력 · 체형" },
  dating: { ko: "연애 · 만남", desc: "만나기 전 준비 · 향" },
  career: { ko: "취업 · 커리어", desc: "면접 · 이력서 · 출근" },
  health: { ko: "건강 · 컨디션", desc: "수면 · 검진 · 피로" },
  money: { ko: "돈 관리", desc: "저축 · 소비 습관" },
  study: { ko: "공부 · 자격증", desc: "시험 · 꾸준한 공부" },
};
export const FOCUS_ORDER: Focus[] = ["looks", "fitness", "career", "dating", "health", "study", "money"];
