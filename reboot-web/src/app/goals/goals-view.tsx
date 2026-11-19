"use client";

import Link from "next/link";
import { useState } from "react";
import { Check } from "@/components/chrome";
import { dPlus } from "@/lib/engine";
import {
  ANCHOR_LABEL, BUCKET_SUGGESTIONS, anchorKindFor, daysUntil, googleCalendarUrl, newGoal, phaseFor, toICS, ymd,
} from "@/lib/goals";
import { MODES } from "@/lib/labels";
import { actions, useStore } from "@/lib/store";
import type { Anchor } from "@/lib/types";

const fmtDate = (s: string) => { const [y, m, d] = s.split("-"); return `${y}.${m}.${d}`; };
const dLabel = (n: number) => (n > 0 ? `D-${n}` : n === 0 ? "D-DAY" : `D+${-n}`);

function downloadICS(name: string, events: { title: string; date: string }[]) {
  const blob = new Blob([toICS(events)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${name}.ics`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function GoalsView() {
  const s = useStore();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [anchorDate, setAnchorDate] = useState("");

  if (!s) return <div className="wrap-narrow py-14 small">불러오는 중…</div>;

  const mode = s.profile?.mode ?? "everyday";
  const kind: Anchor["kind"] = s.anchor?.kind ?? anchorKindFor(mode);
  const anchor = s.anchor && s.anchor.kind === kind ? s.anchor : undefined;
  const left = anchor ? daysUntil(anchor.date) : null;
  const phase = left !== null ? phaseFor(kind, left) : null;
  const goals = s.goals ?? [];
  const open = goals.filter((g) => !g.done);
  const done = goals.filter((g) => g.done);
  const suggestions = BUCKET_SUGGESTIONS[mode].filter((t) => !goals.some((g) => g.title === t));
  const today = ymd(new Date());

  const allEvents = [
    ...(anchor ? [{ title: `RE:BOOT · ${ANCHOR_LABEL[kind]}`, date: anchor.date }] : []),
    ...open.flatMap((g) => [
      ...(g.date ? [{ title: `목표 · ${g.title}`, date: g.date }] : []),
      ...(g.checkpoints ?? []).filter((c) => !c.done && c.date >= today).map((c) => ({ title: c.title, date: c.date })),
    ]),
  ];

  return (
    <div className="wrap-narrow py-10 md:py-14">
      <p className="eyebrow">GOALS · {MODES[mode].ko}</p>
      <h1 className="h1 mt-3">하루 루틴 말고,<br />이번 시즌에 해낼 것.</h1>
      <p className="lead mt-3">{ANCHOR_LABEL[kind]}을 정하면 남은 기간에 맞춰 지금 할 것을 추천해요. 버킷리스트와 시험 같은 목표도 넣을 수 있어요.</p>

      {/* 기준 날짜 */}
      <section className="band-ink mt-8 rounded-[20px] p-6">
        {anchor && left !== null ? (
          <>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">{ANCHOR_LABEL[kind]} · {fmtDate(anchor.date)}</p>
                <p className="display mt-2 text-[64px] leading-none" style={{ textTransform: "none" }}>{dLabel(left)}</p>
              </div>
              {s.profile && <p className="text-right text-[14px] text-ink-mute">지금까지 쌓은 날<br /><b className="display text-[28px] text-white" style={{ textTransform: "none" }}>D<span className="colon">+</span>{dPlus(s)}</b></p>}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <a className="btn btn-line !min-h-10 !text-[14px]" href={googleCalendarUrl(`RE:BOOT · ${ANCHOR_LABEL[kind]}`, anchor.date)} target="_blank" rel="noopener">구글 캘린더에 추가 ↗</a>
              <button type="button" className="btn btn-ghost !min-h-10 !text-[14px] !text-ink-mute" onClick={() => actions.setAnchor(undefined)}>날짜 바꾸기</button>
            </div>
          </>
        ) : (
          <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); if (anchorDate) actions.setAnchor({ kind, date: anchorDate }); }}>
            <p className="eyebrow">{ANCHOR_LABEL[kind]} 정하기</p>
            <p className="text-[15px] text-ink-mute">{kind === "enlist" ? "입영 날짜가 정해졌다면 넣어 주세요. 미정이면 예상 날짜도 괜찮아요." : kind === "discharge" ? "전역 예정일을 넣어 주세요." : "이번 시즌의 목표일 (예: 올해 마지막 날)을 정해요."}</p>
            <div className="flex flex-wrap gap-2">
              <label className="sr-only" htmlFor="anchor-date">{ANCHOR_LABEL[kind]}</label>
              <input id="anchor-date" type="date" className="field max-w-[220px] !text-ink" value={anchorDate} min={today} onChange={(e) => setAnchorDate(e.target.value)} />
              {kind === "target" && <button type="button" className="chip !border-white/30 !bg-transparent !text-white" onClick={() => setAnchorDate(`${new Date().getFullYear()}-12-31`)}>올해 마지막 날</button>}
              <button type="submit" className="btn btn-primary !min-h-11" disabled={!anchorDate}>저장</button>
            </div>
          </form>
        )}
      </section>

      {/* 지금 단계 */}
      {phase && (
        <section className="mt-10">
          <h2 className="sec-head h3">지금은 &lsquo;{phase.title}&rsquo; 구간</h2>
          <p className="small mt-1">{phase.focus}</p>
          {phase.todo.length > 0 && (
            <ul className="mt-4 grid gap-2">
              {phase.todo.map((t) => {
                const added = goals.some((g) => g.title === t);
                return (
                  <li key={t} className="card flex items-center justify-between gap-3 px-4 py-3">
                    <span className="text-[15px]">{t}</span>
                    <button type="button" className="btn btn-ghost !min-h-9 !text-signal-ink" disabled={added} onClick={() => actions.addGoal(newGoal(t, "suggest"))}>{added ? "추가됨" : "+ 목표로"}</button>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="small mt-2">남은 기간에 따라 구간이 바뀌면 추천도 바뀌어요. 규칙 기반 추천이에요.</p>
        </section>
      )}

      {/* 내 목표 */}
      <section className="mt-12">
        <h2 className="sec-head h3">내 버킷리스트 · 목표 <span className="small font-normal">{done.length}/{goals.length}</span></h2>
        <form className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]" onSubmit={(e) => { e.preventDefault(); if (title.trim()) { actions.addGoal(newGoal(title, "custom", date || undefined)); setTitle(""); setDate(""); } }}>
          <label className="sr-only" htmlFor="goal-title">목표</label>
          <input id="goal-title" className="field" placeholder="예: 토익 시험, 머리 탈색해 보기, 운전면허" value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} />
          <label className="sr-only" htmlFor="goal-date">날짜 (선택)</label>
          <input id="goal-date" type="date" className="field sm:w-[170px]" value={date} min={today} onChange={(e) => setDate(e.target.value)} />
          <button type="submit" className="btn btn-dark !min-h-11" disabled={!title.trim()}>추가</button>
        </form>
        <p className="small mt-2">날짜를 넣으면 D-300 · 200 · 100 · 30 · 7 점검 일정을 자동으로 만들어요. (지난 시점은 빼요)</p>

        {open.length > 0 && (
          <ul className="mt-6 grid gap-3">
            {open.map((g) => {
              const gl = g.date ? daysUntil(g.date) : null;
              return (
                <li key={g.id} className="card p-4">
                  <div className="flex items-start gap-3">
                    <button type="button" className="rcheck !mt-0.5" aria-pressed={false} aria-label={`${g.title} 완료`} onClick={() => actions.toggleGoal(g.id)}><Check /></button>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">{g.title}</p>
                      {g.date && <p className="small mt-0.5">{fmtDate(g.date)} · {dLabel(gl!)}</p>}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {g.date && <a className="text-[12.5px] font-semibold underline underline-offset-2" href={googleCalendarUrl(`목표 · ${g.title}`, g.date)} target="_blank" rel="noopener">캘린더 ↗</a>}
                      <button type="button" className="text-[12.5px] text-mute underline underline-offset-2" onClick={() => actions.removeGoal(g.id)}>삭제</button>
                    </div>
                  </div>
                  {g.checkpoints && g.checkpoints.length > 0 && (
                    <ul className="mt-3 grid gap-1.5 border-t border-line pt-3">
                      {g.checkpoints.map((c) => (
                        <li key={c.id} className="flex items-center justify-between gap-3 text-[14px]">
                          <label className="flex items-center gap-2">
                            <input type="checkbox" checked={c.done} onChange={() => actions.toggleCheckpoint(g.id, c.id)} />
                            <span className={c.done ? "text-mute line-through" : ""}>{c.title.replace(`${g.title} · `, "")}</span>
                          </label>
                          <a className="small shrink-0 underline underline-offset-2" href={googleCalendarUrl(c.title, c.date)} target="_blank" rel="noopener">{fmtDate(c.date)} ↗</a>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {allEvents.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" className="btn btn-line !min-h-11" onClick={() => downloadICS("reboot-goals", allEvents)}>일정 {allEvents.length}개 한 번에 캘린더로 (.ics)</button>
            <span className="small">구글 · 애플 · 아웃룩 캘린더에서 열 수 있어요.</span>
          </div>
        )}

        {done.length > 0 && (
          <details className="mt-6">
            <summary className="cursor-pointer font-semibold">해낸 것 {done.length}개</summary>
            <ul className="mt-3 grid gap-2">
              {done.map((g) => (
                <li key={g.id} className="flex items-center justify-between gap-3 text-[15px]">
                  <span>✓ {g.title}</span>
                  <button type="button" className="small underline" onClick={() => actions.toggleGoal(g.id)}>되돌리기</button>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      {/* 추천 버킷리스트 */}
      {suggestions.length > 0 && (
        <section className="mt-12">
          <h2 className="sec-head h3">{MODES[mode].ko} 시기에 해보면 좋은 것</h2>
          <p className="small mt-1">RE:BOOT 편집 제안이에요. 눌러서 내 목록에 넣고, 날짜는 나중에 정해도 돼요.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {suggestions.map((t) => (
              <button key={t} type="button" className="chip" onClick={() => actions.addGoal(newGoal(t, "suggest"))}>+ {t}</button>
            ))}
          </div>
          {mode === "prepare" && <Link href="/care/before-buzz/" className="link mt-4 inline-block text-[14.5px]">머리 밀기 전에 해볼 것 읽기 →</Link>}
        </section>
      )}

      {!s.profile && (
        <p className="small mt-10">생활 단계(입대 준비 · 복무 중 · 전역 후 · 일반)에 맞춘 추천을 받으려면 <Link href="/start/" className="link">30초 체크</Link>를 먼저 해 주세요.</p>
      )}
      <p className="small mt-10">목표와 일정은 이 브라우저에만 저장돼요. 캘린더 버튼은 로그인 없이 구글 캘린더 '일정 추가' 화면을 열어요.</p>
    </div>
  );
}
