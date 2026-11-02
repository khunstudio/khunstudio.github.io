import type { Area, Concern, Experience, Goal, Minutes, Mode, Situation } from "./types.ts";

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

export const MINUTES: Record<Minutes, string> = { 3: "하루 3분", 5: "하루 5분", 10: "하루 10분" };

export const CONCERNS: Record<Concern, { ko: string; desc: string }> = {
  start: { ko: "기초부터 시작하고 싶어요", desc: "무엇부터 해야 할지 모름" },
  dryness: { ko: "얼굴이 자주 당겨요", desc: "보습 부족감" },
  shave: { ko: "면도 후 따가워요", desc: "면도 후 자극" },
  outdoor: { ko: "밖에 있는 시간이 길어요", desc: "야외활동 · 햇빛" },
  sweat: { ko: "땀을 많이 흘려요", desc: "운동 · 활동 후 관리" },
};
export const CONCERN_ORDER: Concern[] = ["start", "dryness", "shave", "outdoor", "sweat"];

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
