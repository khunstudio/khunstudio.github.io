// 최소 이벤트 기록 인터페이스. 아직 분석 도구는 연결하지 않았다.
// 도구를 붙일 때: 이용자 동의를 받은 경우에만 provider를 설정하고,
// 피부 · 건강 관련 응답 원문은 절대 이벤트에 담지 않는다 (아래 허용 필드만 전송).
type EventName = "check_start" | "check_complete" | "routine_save" | "routine_check" | "share_card_export" | "mode_change" | "data_export" | "data_delete";
type Props = { mode?: string; minutes?: number; format?: string };

let provider: ((name: EventName, props: Props) => void) | null = null;

export function setAnalyticsProvider(fn: typeof provider) {
  provider = fn;
}

export function track(name: EventName, props: Props = {}) {
  if (!provider) return;
  const safe: Props = { mode: props.mode, minutes: props.minutes, format: props.format };
  try { provider(name, safe); } catch { /* 분석 실패가 화면에 영향 주지 않게 */ }
}
