import type { AgeBand, Anchor, Checkpoint, Focus, LifeGoal, Mode, Status } from "./types.ts";

// 목표 · 버킷리스트 · 남은 기간별 추천. 규칙 기반이다 (AI 아님).
// 추천 목록은 RE:BOOT 편집 제안이며, 실제 사용자 통계가 아니다.

const DAY = 86400000;
export const toDate = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
export const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export function daysUntil(date: string, today = new Date()): number {
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((toDate(date).getTime() - t.getTime()) / DAY);
}

export const ANCHOR_LABEL: Record<Anchor["kind"], string> = { enlist: "입대일", discharge: "전역일", target: "목표일" };
export const anchorKindFor = (mode?: Mode): Anchor["kind"] => (mode === "prepare" ? "enlist" : mode === "service" ? "discharge" : "target");

export interface Phase { key: string; title: string; focus: string; todo: string[] }

/** 남은 일수에 맞춘 지금 단계 */
export function phaseFor(kind: Anchor["kind"], left: number): Phase {
  if (kind === "enlist") {
    if (left >= 300) return { key: "e300", title: "큰 변화는 지금", focus: "시간이 걸리는 것부터 시작할 때예요.", todo: ["해보고 싶던 헤어스타일 시도 (기르기 · 펌 · 탈색)", "체력 기초 만들기: 주 3회 운동 습관", "트러블이 심하면 피부과 상담 시작 (치료는 몇 달 걸려요)", "해외 · 국내 여행 계획 세우기", "운전면허 · 자격증 일정 잡기"] };
    if (left >= 100) return { key: "e100", title: "마무리할 것들", focus: "벌여 놓은 걸 끝내는 구간이에요.", todo: ["면허 · 자격증 마무리", "치과 검진 · 스케일링", "나한테 맞는 옷 스타일 정리", "피부 루틴 매일 체크 습관 굳히기", "가족 · 친구와 사진 남기기"] };
    if (left >= 30) return { key: "e30", title: "입대 리듬 만들기", focus: "몸과 생활을 미리 맞춰 두면 훈련소가 덜 힘들어요.", todo: ["기상 시간을 조금씩 당기기", "입영 안내문 확인 (지참 물품은 안내문 기준)", "달리기 · 팔굽혀펴기 꾸준히", "마지막 헤어 시도 정리", "휴대폰 · 계정 · 구독 정리"] };
    if (left >= 0) return { key: "e0", title: "D-30, 정리와 인사", focus: "새로 시작하기보다 정리하는 시간이에요.", todo: ["짐 싸기 체크리스트", "머리 정리 시기 정하기", "보고 싶은 사람 만나기", "편지 받을 주소 정리", "피부 · 손톱 · 발 정리"] };
    return { key: "eafter", title: "입대 후", focus: "생활 단계를 '복무 중'으로 바꾸면 전역일 기준으로 다시 추천해요.", todo: [] };
  }
  if (kind === "discharge") {
    if (left >= 300) return { key: "d300", title: "복무 중 쌓아 둘 것", focus: "남은 시간이 길어요. 습관과 실력을 쌓기 좋은 때예요.", todo: ["자격증 하나 목표 잡기", "체력 측정 목표 세우기", "매달 저축 목표 정하기", "책 한 달에 한 권", "피부 루틴 100일 채우기"] };
    if (left >= 100) return { key: "d100", title: "전역 후를 그려 볼 때", focus: "전역 후 첫 3개월을 미리 계획해 두면 덜 흔들려요.", todo: ["전역 후 하고 싶은 것 10개 적기", "이력서 · 포트폴리오 초안", "복학 · 취업 일정 확인", "휴가 때 해 볼 것 정하기"] };
    if (left >= 0) return { key: "d0", title: "전역 준비", focus: "나갈 준비를 할 시간이에요.", todo: ["사복 · 옷장 점검", "머리 기르는 계획", "피부 회복 루틴 (보습 · 자외선 차단)", "전역 후 첫 주 일정 짜기"] };
    return { key: "dafter", title: "전역 후", focus: "생활 단계를 '전역 후'로 바꾸면 새 목표일 기준으로 추천해요.", todo: [] };
  }
  if (left >= 180) return { key: "t180", title: "긴 호흡으로", focus: "큰 목표는 지금 쪼개 두세요.", todo: ["목표를 3개로 줄이기", "목표마다 중간 점검 날짜 정하기", "매일 루틴과 연결할 것 하나씩"] };
  if (left >= 60) return { key: "t60", title: "속도 내기", focus: "중간 점검을 지나는 구간이에요.", todo: ["진행률 확인하고 계획 조정", "가장 밀린 목표 하나에 집중"] };
  if (left >= 0) return { key: "t0", title: "마무리", focus: "남은 기간엔 끝내는 데 집중해요.", todo: ["끝낼 수 있는 것 1~2개 고르기", "다음 목표일 정하기"] };
  return { key: "tafter", title: "목표일이 지났어요", focus: "새 목표일을 정해 보세요.", todo: [] };
}

/** 추천 버킷리스트 (편집 제안) */
export const BUCKET_SUGGESTIONS: Record<Mode, string[]> = {
  prepare: ["머리 밀기 전에 해보고 싶던 스타일 해보기", "나한테 어울리는 옷 스타일 찾기", "해외여행 · 혼자 여행 다녀오기", "운전면허 따기", "팔굽혀펴기 30개 · 3km 달리기", "치과 스케일링 · 검진", "피부과 한 번 상담받기", "가족 · 친구와 사진 남기기", "수영 배우기", "요리 3가지 배우기"],
  service: ["자격증 하나 따기", "책 12권 읽기", "체력 측정 목표 달성", "매달 저축 목표 지키기", "외국어 하나 시작", "피부 루틴 100일 채우기", "전역 후 하고 싶은 것 10개 적기"],
  next: ["이력서 · 포트폴리오 완성", "새 헤어스타일 찾기", "옷장 다시 짜기", "건강검진 받기", "운동 루틴 3개월 유지", "가 보고 싶던 곳 여행", "자격증 · 공부 목표"],
  everyday: ["올해 여행 한 번", "운동 루틴 3개월 유지", "책 12권 읽기", "새 취미 하나", "저축 목표", "피부 루틴 100일", "건강검진 받기"],
};

/** 관심사 · 지금 생활 · 나이대별 버킷리스트 제안 */
const BY_FOCUS: Record<Focus, string[]> = {
  looks: ["나한테 맞는 헤어스타일 찾기", "피부 루틴 100일", "기본 옷 5벌로 옷장 정리"],
  fitness: ["3개월 운동 루틴 유지", "5km 쉬지 않고 달리기", "턱걸이 10개"],
  dating: ["나한테 어울리는 향 하나 찾기", "사진 잘 나오는 옷 · 헤어 정리", "같이 할 취미 하나 만들기"],
  career: ["이력서 · 포트폴리오 완성", "모의 면접 3번", "업무 관련 자격증 하나"],
  health: ["건강검진 받기", "수면 시간 7시간 한 달", "치과 스케일링"],
  money: ["비상금 3개월치 모으기", "고정 지출 점검 · 구독 정리", "매달 저축 목표 지키기"],
  study: ["목표 시험 날짜 정하고 접수", "매일 공부 기록 30일", "자격증 하나 따기"],
};
const BY_STATUS: Partial<Record<Status, string[]>> = {
  student: ["학기 목표 학점 정하기", "방학에 해 볼 것 하나"],
  jobseeker: ["지원서 10곳 넣기", "면접 복장 한 벌 맞추기"],
  worker: ["연차로 혼자 여행", "출근 전 운동 습관"],
  freelance: ["작업 시간 · 쉬는 시간 정하기", "포트폴리오 업데이트"],
};
const BY_AGE: Partial<Record<AgeBand, string[]>> = {
  "30s": ["눈가 · 목까지 보습 습관", "기초 체력 측정해 보기"],
  "40p": ["정기 건강검진 일정 잡기", "관절에 무리 없는 운동 찾기"],
  teen: ["하고 싶은 일 세 가지 적어 보기"],
};

export interface Persona { age?: AgeBand; status?: Status; focus?: Focus[] }

/** 생활 단계 + 개인화 정보를 합친 제안 (관심사 먼저, 중복 제거) */
export function bucketFor(mode: Mode, me: Persona = {}): string[] {
  const list = [
    ...(me.focus ?? []).flatMap((f) => BY_FOCUS[f]),
    ...(me.status ? BY_STATUS[me.status] ?? [] : []),
    ...(me.age ? BY_AGE[me.age] ?? [] : []),
    ...BUCKET_SUGGESTIONS[mode],
  ];
  return list.filter((x, i) => list.indexOf(x) === i).slice(0, 14);
}

/** 단계별 할 일에 관심사에 맞는 항목을 앞에 더한다 */
export function personalizePhase(ph: Phase, me: Persona = {}): Phase {
  if (!ph.todo.length || !me.focus?.length) return ph;
  const extra = me.focus.slice(0, 2).map((f) => BY_FOCUS[f][0]);
  const todo = [...extra, ...ph.todo].filter((x, i, a) => a.indexOf(x) === i).slice(0, 6);
  return { ...ph, todo };
}

const MARKS = [300, 200, 100, 30, 7];

/** 날짜가 있는 목표에 D-300 · 200 · 100 · 30 · 7 체크포인트를 만든다 (이미 지난 시점은 뺀다) */
export function makeCheckpoints(title: string, date: string, today = new Date()): Checkpoint[] {
  const left = daysUntil(date, today);
  const out: Checkpoint[] = [];
  for (const m of MARKS) {
    if (m >= left) continue;
    const d = new Date(toDate(date).getTime() - m * DAY);
    const t = m >= 100 ? `D-${m} · 준비 범위와 계획 점검` : m === 30 ? "D-30 · 마무리 계획, 부족한 것 하나 집중" : "D-7 · 최종 점검";
    out.push({ id: `cp-${m}`, title: `${title} · ${t}`, date: ymd(d), done: false });
  }
  return out;
}

export function newGoal(title: string, source: LifeGoal["source"], date?: string, today = new Date()): LifeGoal {
  return {
    id: `g-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    title: title.trim().slice(0, 60),
    date: date || undefined,
    done: false,
    source,
    checkpoints: date ? makeCheckpoints(title.trim(), date, today) : undefined,
    createdAt: new Date().toISOString(),
  };
}

/** 로그인 없이 구글 캘린더 '일정 추가' 화면을 여는 링크 (종일 일정) */
export function googleCalendarUrl(title: string, date: string, details = "RE:BOOT에서 추가한 일정"): string {
  const start = date.replaceAll("-", "");
  const end = ymd(new Date(toDate(date).getTime() + DAY)).replaceAll("-", "");
  const q = new URLSearchParams({ action: "TEMPLATE", text: title, dates: `${start}/${end}`, details });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

/** 여러 일정을 한 번에: 애플 · 구글 · 아웃룩 캘린더에서 열 수 있는 .ics 파일 내용 */
export function toICS(events: { title: string; date: string }[]): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const esc = (s: string) => s.replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//RE:BOOT//GOALS//KO", "CALSCALE:GREGORIAN"];
  events.forEach((e, i) => {
    const start = e.date.replaceAll("-", "");
    const end = ymd(new Date(toDate(e.date).getTime() + DAY)).replaceAll("-", "");
    lines.push("BEGIN:VEVENT", `UID:reboot-${start}-${i}@rebootyourself`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${start}`, `DTEND;VALUE=DATE:${end}`, `SUMMARY:${esc(e.title)}`, "END:VEVENT");
  });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
