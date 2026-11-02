"use client";

import Link from "next/link";
import { useState } from "react";
import { Check } from "@/components/chrome";
import { dayKey, visibleItems } from "@/lib/engine";
import { situationLabel, SITUATION_ORDER } from "@/lib/labels";
import { actions, useStore } from "@/lib/store";
import { track } from "@/lib/analytics";
import type { RoutineItem } from "@/lib/types";

const fmtMin = (m: number) => (m < 1 ? "30초" : `${m}분`);

export function RoutineView() {
  const s = useStore();
  const [edit, setEdit] = useState(false);

  if (!s) return <div className="wrap-narrow py-14 small">불러오는 중…</div>;
  if (!s.routine || !s.profile) {
    return (
      <div className="wrap-narrow py-14">
        <p className="eyebrow">ROUTINE</p>
        <h1 className="h1 mt-3">아직 루틴이 없어요</h1>
        <p className="lead mt-4">30초 체크로 지금 시작할 수 있는 루틴을 만들어 보세요. 로그인은 필요 없어요.</p>
        <Link href="/start/" className="btn btn-primary mt-8">30초 체크 시작</Link>
      </div>
    );
  }

  const { routine, profile } = s;
  const today = s.records[dayKey()];
  const visible = visibleItems(routine.items, routine.situation);
  const done = (today?.done ?? []).filter((id) => visible.some((v) => v.id === id));
  const pct = visible.length ? Math.round((done.length / visible.length) * 100) : 0;
  const excluded = routine.items.filter((i) => !i.enabled && (!i.situations || i.situations.includes(routine.situation)));
  const date = new Date();
  const dateLabel = `${date.getMonth() + 1}월 ${date.getDate()}일 ${"일월화수목금토"[date.getDay()]}요일`;

  const toggle = (id: string) => { actions.toggleDone(id); track("routine_check", { mode: profile.mode }); };

  return (
    <div className="wrap-narrow py-8 md:py-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">TODAY · {dateLabel}</p>
          <h1 className="h1 mt-2">오늘의 루틴</h1>
        </div>
        <p className="display text-[56px] leading-none tabular-nums">{pct}<span className="text-[24px] text-mute">%</span></p>
      </div>
      <div className="bar mt-4" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="오늘 완료율"><i style={{ width: `${pct}%` }} /></div>
      <p className="small mt-2">{visible.length}개 중 {done.length}개 완료 · 완료율은 계획한 항목 대비 실천한 항목이에요.</p>

      <div className="mt-8">
        <p className="small mb-2 font-semibold !text-ink">오늘은 어떤 날인가요?</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="생활 상황">
          {SITUATION_ORDER.map((x) => (
            <button key={x} type="button" className="chip" aria-pressed={routine.situation === x} onClick={() => actions.setSituation(x)}>
              {situationLabel(profile.mode, x)}
            </button>
          ))}
        </div>
      </div>

      {(["am", "pm"] as const).map((slot) => {
        const list = visible.filter((i) => i.slot === slot);
        if (!list.length) return null;
        return (
          <section key={slot} className="mt-10">
            <h2 className="sec-head h3">{slot === "am" ? "아침" : "저녁"}<span className="small ml-1 font-normal">{fmtMin(list.reduce((n, i) => n + i.minutes, 0))}</span></h2>
            <ul>
              {list.map((it) => (
                <Item key={it.id} it={it} done={done.includes(it.id)} edit={edit} onToggle={() => toggle(it.id)} onExclude={() => actions.toggleEnabled(it.id)} />
              ))}
            </ul>
          </section>
        );
      })}

      {pct === 100 && (
        <div className="band-ink mt-8 rounded-[12px] p-6 fade-in">
          <p className="eyebrow">DONE</p>
          <p className="h3 mt-2">오늘 계획한 루틴을 모두 했어요.</p>
          <Link href="/my/" className="link mt-3 inline-block text-[14px]">기록 보기 · 공유 카드 만들기</Link>
        </div>
      )}

      <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-line pt-6">
        <button type="button" className="btn btn-line !min-h-11" aria-pressed={edit} onClick={() => setEdit(!edit)}>
          {edit ? "편집 완료" : "루틴 편집"}
        </button>
        <Link href="/check/" className="btn btn-ghost">다시 체크해서 새로 만들기</Link>
      </div>

      {edit && (
        <section className="mt-6 fade-in">
          <h2 className="h3">뺀 항목</h2>
          {excluded.length === 0 ? (
            <p className="small mt-2">뺀 항목이 없어요. 위 목록에서 &lsquo;빼기&rsquo;를 누르면 오늘부터 보이지 않아요.</p>
          ) : (
            <ul className="mt-3 grid gap-2">
              {excluded.map((i) => (
                <li key={i.id} className="card flex items-center justify-between gap-3 px-4 py-3">
                  <span className="text-[15px] text-mute">{i.title}</span>
                  <button type="button" className="btn btn-ghost !min-h-9 !text-signal-ink" onClick={() => actions.toggleEnabled(i.id)}>다시 넣기</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function Item({ it, done, edit, onToggle, onExclude }: { it: RoutineItem; done: boolean; edit: boolean; onToggle: () => void; onExclude: () => void }) {
  return (
    <li className={`ritem ${done ? "done" : ""}`}>
      <button type="button" className="rcheck" aria-pressed={done} aria-label={`${it.title} ${done ? "완료 취소" : "완료"}`} onClick={onToggle}>
        <Check />
      </button>
      <div className="min-w-0">
        <p className="rtitle text-[16px] font-semibold tracking-tight">
          {it.title}
          {it.situations && <span className="badge badge-draft ml-2">오늘 상황</span>}
        </p>
        <details className="group mt-1">
          <summary className="small cursor-pointer list-none select-none">
            <span className="group-open:hidden">왜 · 어떻게 ▾</span><span className="hidden group-open:inline">접기 ▴</span>
          </summary>
          <div className="mt-2 grid gap-1.5 text-[14px] leading-relaxed text-[#3d3d3a]">
            <p><b className="font-semibold">왜</b> · {it.why}</p>
            <p><b className="font-semibold">어떻게</b> · {it.how}</p>
            {it.guide && <Link href={`/care/${it.guide}/`} className="link text-[13.5px]">관련 가이드 읽기</Link>}
          </div>
        </details>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="small tabular-nums">{fmtMin(it.minutes)}</span>
        {edit && <button type="button" className="text-[12.5px] font-semibold text-signal-ink underline underline-offset-2" onClick={onExclude}>빼기</button>}
      </div>
    </li>
  );
}
