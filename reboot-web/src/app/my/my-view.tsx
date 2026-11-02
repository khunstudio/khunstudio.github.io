"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { activeDays, recentDays, streak, toCSV } from "@/lib/engine";
import { GOALS, MODES, MODE_ORDER } from "@/lib/labels";
import { actions, useStore } from "@/lib/store";
import { track } from "@/lib/analytics";
import { canvasToBlob, drawCard, type CardFormat } from "@/lib/share-card";
import type { Mode, Store } from "@/lib/types";

function download(name: string, data: BlobPart, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function MyView() {
  const s = useStore();
  if (!s) return <div className="wrap-narrow py-14 small">불러오는 중…</div>;
  if (!s.profile) {
    return (
      <div className="wrap-narrow py-14">
        <p className="eyebrow">MY RE:BOOT</p>
        <h1 className="h1 mt-3">아직 기록이 없어요</h1>
        <p className="lead mt-4">루틴을 만들고 체크하면 여기에 7일 · 30일 기록이 쌓여요. 생활 단계가 바뀌어도 기록은 이어져요.</p>
        <Link href="/start/" className="btn btn-primary mt-8">30초 체크 시작</Link>
      </div>
    );
  }
  return <MyInner s={s} />;
}

function MyInner({ s }: { s: Store }) {
  const p = s.profile!;
  const week = recentDays(s, 7);
  const month = recentDays(s, 30);
  const days = activeDays(s);
  const st = streak(s);
  const weekAvg = Math.round((week.reduce((n, d) => n + d.ratio, 0) / 7) * 100);

  return (
    <div>
      <section className="band-ink">
        <div className="wrap-narrow py-10 md:py-14">
          <p className="eyebrow">MY RE:BOOT</p>
          <div className="mt-4 grid grid-cols-3 gap-4">
            {[
              [days, "실천한 날"],
              [st, "연속 일수"],
              [`${weekAvg}%`, "최근 7일 평균"],
            ].map(([v, l]) => (
              <div key={l as string}>
                <p className="display text-[52px] leading-none tabular-nums md:text-[68px]">{v}</p>
                <p className="mt-2 text-[13px] text-ink-mute">{l}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-[13px] text-ink-mute">완료율은 계획한 루틴 항목 중 실천한 비율이에요. 외모 변화를 측정하지 않아요.</p>
        </div>
      </section>

      <div className="wrap-narrow py-10">
        <section>
          <h2 className="sec-head h3">최근 7일</h2>
          <div className="daygrid grid-cols-7">
            {week.map((d, i) => (
              <div key={d.key} className="grid justify-items-center gap-1.5">
                <span className={`day w-full ${d.ratio >= 0.99 ? "f" : d.ratio > 0 ? "p" : ""} ${i === 6 ? "today" : ""}`} title={`${d.key} ${Math.round(d.ratio * 100)}%`} />
                <span className="small !text-[11px]">{"일월화수목금토"[d.date.getDay()]}</span>
              </div>
            ))}
          </div>
          <h2 className="sec-head h3 mt-10">최근 30일</h2>
          <div className="daygrid grid-cols-10">
            {month.map((d, i) => (
              <span key={d.key} className={`day ${d.ratio >= 0.99 ? "f" : d.ratio > 0 ? "p" : ""} ${i === 29 ? "today" : ""}`} title={`${d.key} ${Math.round(d.ratio * 100)}%`} />
            ))}
          </div>
          <p className="small mt-3 flex flex-wrap gap-4">
            <span className="inline-flex items-center gap-1.5"><i className="day inline-block w-3" /> 기록 없음</span>
            <span className="inline-flex items-center gap-1.5"><i className="day p inline-block w-3" /> 일부 실천</span>
            <span className="inline-flex items-center gap-1.5"><i className="day f inline-block w-3" /> 모두 실천</span>
          </p>
        </section>

        <ModeSection s={s} />
        <ShareSection s={s} days={days} streakDays={st} week={week.map((d) => d.ratio)} goal={GOALS[p.goal]} />
        <DataSection s={s} />
      </div>
    </div>
  );
}

function ModeSection({ s }: { s: Store }) {
  const p = s.profile!;
  const [pending, setPending] = useState<{ from: Mode; to: Mode } | null>(null);

  function change(to: Mode) {
    if (to === p.mode) return;
    const from = p.mode;
    actions.setMode(to);
    track("mode_change", { mode: to });
    setPending({ from, to });
  }

  return (
    <section className="mt-14">
      <h2 className="sec-head h3">생활 모드</h2>
      <p className="small -mt-2 mb-4">지금 시기에 맞게 바꾸면 추천과 상황 이름이 바뀌어요. 기록과 루틴은 그대로 남아요.</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="생활 모드">
        {MODE_ORDER.map((m) => (
          <button key={m} type="button" className="chip" aria-pressed={p.mode === m} onClick={() => change(m)}>{MODES[m].ko}</button>
        ))}
      </div>
      {pending && (
        <div className="card mt-4 p-5 fade-in" role="status">
          <p className="font-bold">
            {pending.from === "service" && pending.to === "next" ? "전역을 축하해요. " : ""}
            생활 모드를 &lsquo;{MODES[pending.to].ko}&rsquo;(으)로 바꿨어요.
          </p>
          <p className="small mt-1">다음 일상에 맞게 루틴을 다시 구성할까요? 지금까지의 기록은 지워지지 않아요.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="btn btn-dark !min-h-11" onClick={() => { actions.saveCheck({ ...p, mode: pending.to }); setPending(null); }}>
              새 모드로 루틴 다시 구성
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setPending(null)}>지금 루틴 유지</button>
          </div>
        </div>
      )}
    </section>
  );
}

function ShareSection({ s, days, streakDays, week, goal }: { s: Store; days: number; streakDays: number; week: number[]; goal: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [fmt, setFmt] = useState<CardFormat>("story");
  const [nick, setNick] = useState(s.profile?.nickname ?? "");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!ref.current) return;
    drawCard(ref.current, fmt, { nickname: nick.trim() || undefined, goal, activeDays: days, streak: streakDays, week });
  }, [fmt, nick, goal, days, streakDays, week.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  async function save() {
    if (!ref.current) return;
    actions.setNickname(nick.trim());
    const blob = await canvasToBlob(ref.current);
    if (!blob) { setMsg("이미지를 만들지 못했어요. 다시 시도해 주세요."); return; }
    download(`reboot-${fmt === "story" ? "story-9x16" : "feed-4x5"}.png`, blob, "image/png");
    track("share_card_export", { format: fmt });
    setMsg("이미지를 저장했어요.");
  }

  async function share() {
    if (!ref.current) return;
    const blob = await canvasToBlob(ref.current);
    if (!blob) return;
    const file = new File([blob], "reboot.png", { type: "image/png" });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (nav.canShare?.({ files: [file] })) {
      try { await nav.share({ files: [file] }); track("share_card_export", { format: fmt }); } catch { /* 사용자가 취소 */ }
    } else {
      setMsg("이 브라우저에서는 바로 공유할 수 없어요. 이미지를 저장한 뒤 올려 주세요.");
    }
  }

  return (
    <section className="mt-14">
      <h2 className="sec-head h3">공유 카드</h2>
      <p className="small -mt-2 mb-4">실천 일수와 목표만 들어가요. 피부 고민, 생활 모드, 소속, 날짜는 카드에 넣지 않아요.</p>
      <div className="grid gap-6 md:grid-cols-[220px_1fr] md:items-start">
        <canvas ref={ref} className="mx-auto w-[200px] rounded-[10px] border border-line md:w-full" aria-label="공유 카드 미리보기" />
        <div className="grid content-start gap-4">
          <div className="flex gap-2" role="group" aria-label="카드 비율">
            <button type="button" className="chip" aria-pressed={fmt === "story"} onClick={() => setFmt("story")}>스토리 9:16</button>
            <button type="button" className="chip" aria-pressed={fmt === "feed"} onClick={() => setFmt("feed")}>피드 4:5</button>
          </div>
          <label className="grid gap-1.5">
            <span className="text-[14px] font-semibold">닉네임 (선택)</span>
            <input
              id="nickname"
              value={nick}
              maxLength={12}
              onChange={(e) => setNick(e.target.value)}
              placeholder="비워 두면 표시하지 않아요"
              className="h-12 rounded-[10px] border-[1.5px] border-line px-4 text-[16px] outline-none focus:border-ink"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary" onClick={save}>이미지 저장</button>
            <button type="button" className="btn btn-line" onClick={share}>바로 공유</button>
          </div>
          {msg && <p className="small" role="status">{msg}</p>}
        </div>
      </div>
    </section>
  );
}

function DataSection({ s }: { s: Store }) {
  const [confirm, setConfirm] = useState<"records" | "all" | null>(null);
  const stamp = new Date().toISOString().slice(0, 10);
  return (
    <section className="mt-14">
      <h2 className="sec-head h3">내 데이터</h2>
      <div className="notice notice-warn">
        <p>기록은 이 브라우저에만 저장돼요. 브라우저 데이터를 지우거나 다른 기기 · 다른 브라우저에서 열면 보이지 않아요. 계정과 기기 간 동기화는 아직 준비 중이라, 중요한 기록은 파일로 내보내 두세요.</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="btn btn-line !min-h-11" onClick={() => { download(`reboot-backup-${stamp}.json`, JSON.stringify(s, null, 2), "application/json"); track("data_export"); }}>JSON 내보내기</button>
        <button type="button" className="btn btn-line !min-h-11" onClick={() => { download(`reboot-records-${stamp}.csv`, toCSV(s), "text/csv"); track("data_export"); }}>CSV 내보내기</button>
      </div>
      <div className="mt-6 grid gap-2 border-t border-line pt-6">
        {confirm ? (
          <div className="card p-5" role="alertdialog" aria-label="삭제 확인">
            <p className="font-bold">{confirm === "records" ? "실천 기록을 모두 지울까요?" : "루틴 · 기록 · 설정을 모두 지울까요?"}</p>
            <p className="small mt-1">지운 데이터는 되돌릴 수 없어요.</p>
            <div className="mt-4 flex gap-2">
              <button type="button" className="btn btn-dark !min-h-11" onClick={() => { confirm === "records" ? actions.clearRecords() : actions.clearAll(); track("data_delete"); setConfirm(null); }}>삭제</button>
              <button type="button" className="btn btn-ghost" onClick={() => setConfirm(null)}>취소</button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-ghost !text-signal-ink" onClick={() => setConfirm("records")}>실천 기록만 지우기</button>
            <button type="button" className="btn btn-ghost !text-signal-ink" onClick={() => setConfirm("all")}>모든 데이터 지우기</button>
          </div>
        )}
      </div>
    </section>
  );
}
