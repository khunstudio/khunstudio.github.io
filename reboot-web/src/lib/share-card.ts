"use client";

// 공유 카드: 브라우저 안에서 canvas로만 그린다 (서버 업로드 없음).
// 피부 고민 · 생활 모드(복무 여부) · 소속 · 날짜 같은 정보는 넣지 않는다.

export type CardFormat = "story" | "feed";
export interface CardData {
  nickname?: string;
  goal: string;
  activeDays: number;
  streak: number;
  week: number[]; // 최근 7일 완료율 0~1
}

export const CARD_SIZE: Record<CardFormat, [number, number]> = { story: [1080, 1920], feed: [1080, 1350] };

function displayFont(): string {
  const probe = document.createElement("span");
  probe.className = "display";
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  document.body.appendChild(probe);
  const f = getComputedStyle(probe).fontFamily;
  probe.remove();
  return f;
}

export async function drawCard(canvas: HTMLCanvasElement, fmt: CardFormat, d: CardData) {
  const [W, H] = CARD_SIZE[fmt];
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  // Archivo의 좁은 폭(condensed)을 쓰도록. 지원하지 않는 브라우저는 기본 폭으로 그린다.
  const stretch = (v: "condensed" | "normal") => { if ("fontStretch" in ctx) (ctx as unknown as { fontStretch: string }).fontStretch = v; };
  const disp = displayFont();
  const sans = '"Pretendard Variable", Pretendard, "Apple SD Gothic Neo", sans-serif';
  try {
    await Promise.all([
      document.fonts.load(`800 120px ${disp}`),
      document.fonts.load(`700 60px ${sans}`, "실천기록"),
    ]);
  } catch { /* 폰트 로딩 실패 시 기본 글꼴 */ }

  const ORANGE = "#FF5A1F";
  const P = 96;
  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 0, W, H);

  // 워드마크
  const wm = (x: number, y: number, size: number) => {
    stretch("condensed"); ctx.font = `800 ${size}px ${disp}`;
    ctx.fillStyle = "#fff";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("RE", x, y);
    let w = ctx.measureText("RE").width;
    ctx.fillStyle = ORANGE;
    ctx.fillText(":", x + w, y);
    w += ctx.measureText(":").width;
    ctx.fillStyle = "#fff";
    ctx.fillText("BOOT", x + w, y);
  };
  wm(P, P + 64, 72);

  const story = fmt === "story";
  let y = story ? 640 : 420;

  ctx.fillStyle = "#9B9A95";
  stretch("condensed"); ctx.font = `700 34px ${disp}`;
  ctx.fillText(d.nickname ? `${d.nickname.toUpperCase()} · MY RECORD` : "MY RECORD", P, y - (story ? 230 : 170));

  // 큰 숫자
  ctx.fillStyle = "#fff";
  stretch("condensed"); ctx.font = `800 ${story ? 360 : 300}px ${disp}`;
  ctx.fillText(String(d.activeDays), P - 8, y + (story ? 110 : 80));
  stretch("normal"); ctx.font = `700 56px ${sans}`;
  ctx.fillText("일째 실천 중", P, y + (story ? 210 : 170));

  // 목표
  y += story ? 360 : 290;
  ctx.fillStyle = ORANGE;
  ctx.fillRect(P, y - 44, 10, 56);
  ctx.fillStyle = "#fff";
  stretch("normal"); ctx.font = `600 46px ${sans}`;
  ctx.fillText(d.goal, P + 34, y);
  ctx.fillStyle = "#9B9A95";
  ctx.font = `500 36px ${sans}`;
  ctx.fillText(d.streak > 0 ? `${d.streak}일 연속으로 이어가는 중` : "오늘부터 다시 시작", P + 34, y + 62);

  // 최근 7일
  y += story ? 220 : 160;
  const gap = 18;
  const cell = (W - P * 2 - gap * 6) / 7;
  d.week.forEach((r, i) => {
    const x = P + i * (cell + gap);
    ctx.fillStyle = r >= 0.99 ? ORANGE : r > 0 ? "#7a3a22" : "#2E2E2C";
    ctx.beginPath();
    ctx.roundRect(x, y, cell, cell, 14);
    ctx.fill();
  });
  ctx.fillStyle = "#9B9A95";
  stretch("condensed"); ctx.font = `600 28px ${disp}`;
  ctx.fillText("LAST 7 DAYS", P, y + cell + 54);

  // 하단
  ctx.fillStyle = "#fff";
  stretch("condensed"); ctx.font = `800 64px ${disp}`;
  ctx.fillText("RE:BOOT YOURSELF.", P, H - P - 10);
  ctx.fillStyle = ORANGE;
  ctx.fillRect(P, H - P - 110, 120, 8);
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((res) => canvas.toBlob((b) => res(b), "image/png"));
}
