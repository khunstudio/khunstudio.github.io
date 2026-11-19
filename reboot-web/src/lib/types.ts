// RE:BOOT 데이터 모델. 계정 도입 전까지는 브라우저 localStorage에만 저장한다.

export type Mode = "prepare" | "service" | "next" | "everyday";
export type Area = "skin" | "body" | "style" | "life";
export type Experience = "new" | "sometimes" | "steady";
/** 하루에 쓸 시간. 3은 이전 버전 호환용 (UI에서는 5 · 10 · 30만 고른다) */
export type Minutes = 3 | 5 | 10 | 30;
export type Concern =
  | "start" | "dryness" | "oily" | "pores" | "redness"
  | "acne" | "bumps" | "scars"
  | "shave" | "outdoor" | "sweat";
export type Goal = "start" | "keep" | "adapt";
export type Slot = "am" | "pm";
/** 생활 상황. 라벨은 모드마다 다르게 보인다 (예: 복무 중이면 "야외활동이 많은 날"). */
export type Situation = "default" | "active" | "out";

export interface Profile {
  mode: Mode;
  interests: Area[];
  experience: Experience;
  minutes: Minutes;
  concerns: Concern[];
  goal: Goal;
  nickname?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoutineItem {
  id: string;
  templateId: string;
  title: string;
  slot: Slot;
  area: Area;
  /** 대략적인 소요 시간 (분, 0.5 단위) */
  minutes: number;
  why: string;
  how: string;
  enabled: boolean;
  /** 지정되면 해당 생활 상황에서만 보인다 */
  situations?: Situation[];
  /** 관련 가이드 slug */
  guide?: string;
}

export interface Routine {
  items: RoutineItem[];
  situation: Situation;
  createdAt: string;
  updatedAt: string;
}

export interface DayRecord {
  /** 그날 계획된 항목 id (체크한 순간의 활성 항목 기준) */
  planned: string[];
  done: string[];
}

export interface SkinRecord {
  type: "oily" | "dry" | "combo" | "normal";
  sensitive: boolean;
  at: string;
}

export interface Store {
  version: 1;
  /** 피부 타입 셀프 체크 결과 (진단 아님) */
  skin?: SkinRecord;
  profile?: Profile;
  routine?: Routine;
  records: Record<string, DayRecord>;
  modeHistory: { mode: Mode; at: string }[];
}

export interface CheckAnswers {
  mode: Mode;
  interests: Area[];
  experience: Experience;
  minutes: Minutes;
  concerns: Concern[];
  goal: Goal;
}
