"use client";

import Link from "next/link";
import { useState } from "react";
import { Check } from "@/components/chrome";
import { CONDITION_ORDER, CONDITIONS, evaluateConditions } from "@/lib/conditions";
import { dayKey, dPlus, visibleItems } from "@/lib/engine";
import { situationLabel, SITUATION_ORDER } from "@/lib/labels";
import { actions, useStore } from "@/lib/store";
import { track } from "@/lib/analytics";
import type { RoutineItem, Slot } from "@/lib/types";
import { SKIN_PROFILES } from "@/lib/skintype";

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
  const todayConditions = today?.conditions ?? [];
  const adj = evaluateConditions(todayConditions, visible);
  const pausedSet = new Set(adj.pausedItemIds);
  const emphasizedSet = new Set(adj.emphasizedItemIds);
  const activeVisible = visible.filter((v) => !pausedSet.has(v.id));
  const done = (today?.done ?? []).filter((id) => activeVisible.some((v) => v.id === id));
  const pct = activeVisible.length ? Math.round((done.length / activeVisible.length) * 100) : 0;
  const excluded = routine.items.filter((i) => !i.enabled && (!i.situations || i.situations.includes(routine.situation)));
  const date = new Date();
  const dateLabel = `${date.getMonth() + 1}월 ${date.getDate()}일 ${"일월화수목금토"[date.getDay()]}요일`;

  const toggle = (id: string) => { actions.toggleDone(id); track("routine_check", { mode: profile.mode }); };

  return (
    <div className="wrap-narrow py-8 md:py-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">D+{dPlus(s)} · {dateLabel}</p>
          <h1 className="h1 mt-2">오늘의 루틴</h1>
        </div>
        <div className="text-right">
          <p className="eyebrow !text-[11px]">오늘 충전</p>
          <p className="display text-[56px] leading-none tabular-nums">{pct}<span className="text-[24px] text-mute">%</span></p>
        </div>
      </div>
      <div className="bar mt-4" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="오늘 충전"><i style={{ width: `${pct}%` }} /></div>
      <p className="small mt-2">
        {activeVisible.length}개 중 {done.length}개 완료
        {adj.pausedItemIds.length > 0 ? ` · 자극 항목 ${adj.pausedItemIds.length}개는 오늘 쉬어요` : ""}
        {" · 충전은 계획한 항목 중 실천한 비율이에요."}
      </p>

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

      <div className="mt-5">
        <p className="small mb-2 font-semibold !text-ink">오늘 컨디션 · 생활 변수 <span className="font-normal text-mute">(해당하는 걸 켜면 오늘 루틴이 맞춰져요)</span></p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="오늘 컨디션 태그">
          {CONDITION_ORDER.map((tag) => {
            const on = todayConditions.includes(tag);
            return (
              <button key={tag} type="button" className="chip" aria-pressed={on} onClick={() => actions.toggleCondition(tag)}>
                {CONDITIONS[tag].label}
              </button>
            );
          })}
        </div>
      </div>

      {adj.tags.length > 0 && (
        <section className={`mt-5 rounded-[12px] border p-4 fade-in ${adj.tone === "minimal" ? "border-ink bg-paper" : "border-line bg-paper"}`} aria-label="오늘 루틴 조정 안내">
          <p className="eyebrow !text-[11px]">{adj.tone === "minimal" ? "MINIMAL CARE · 자극 쉬기" : "TODAY ADJUSTED"}</p>
          <p className="mt-1.5 text-[14.5px] font-semibold leading-snug text-ink">{adj.summary}</p>
          {adj.tips.length > 0 && (
            <ul className="mt-2 grid gap-1 text-[13.5px] leading-relaxed text-[#3d3d3a]">
              {adj.tips.map((tip) => <li key={tip}>· {tip}</li>)}
            </ul>
          )}
          {adj.showDermNotice && (
            <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-line pt-2.5 text-[13px]">
              <Link href="/care/leave-prep/" className="link">피부과 상담 전 정리해 갈 것 →</Link>
              <Link href="/care/breakout-dont/" className="link">예민할 때 피할 행동 →</Link>
            </div>
          )}
        </section>
      )}

      {(["am", "pm"] as const).map((slot) => {
        const list = visible.filter((i) => i.slot === slot);
        if (!list.length) return null;
        const activeMin = list.filter((i) => !pausedSet.has(i.id)).reduce((n, i) => n + i.minutes, 0);
        return (
          <section key={slot} className="mt-10">
            <h2 className="sec-head h3">{slot === "am" ? "아침" : "저녁"}<span className="small ml-1 font-normal">{fmtMin(activeMin)}</span></h2>
            <ul>
              {list.map((it) => (
                <Item
                  key={it.id}
                  it={it}
                  done={done.includes(it.id)}
                  edit={edit}
                  pausedReasons={adj.pauseReasons[it.id]}
                  emphasized={emphasizedSet.has(it.id)}
                  onToggle={() => toggle(it.id)}
                  onExclude={() => (it.templateId === "custom" ? actions.removeCustom(it.id) : actions.toggleEnabled(it.id))}
                />
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

      {edit && <AddCustom skinType={s.skin?.type} />}

      {!edit && (
        <Link href="/goals/" className="card card-link mt-6 flex items-center justify-between gap-4 p-5">
          <span>
            <span className="eyebrow !text-[11px]">GOALS</span>
            <span className="mt-1 block font-bold">{s.anchor ? "이번 시즌 목표 · 버킷리스트 보기" : "입대일 · 전역일 · 목표일을 정하고 버킷리스트 만들기"}</span>
            <span className="small">남은 기간에 맞춘 추천 · 구글 캘린더로 보내기</span>
          </span>
          <span aria-hidden="true">→</span>
        </Link>
      )}

      {!edit && !s.skin && (
        <Link href="/skin/" className="card card-link mt-6 flex items-center justify-between gap-4 p-5">
          <span>
            <span className="eyebrow !text-[11px]">SKIN TYPE</span>
            <span className="mt-1 block font-bold">내 피부 타입부터 알고 루틴을 채워 보세요</span>
            <span className="small">6문항 · 지성 · 건성 · 복합성 · 중성, 예민 여부</span>
          </span>
          <span aria-hidden="true">→</span>
        </Link>
      )}

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

function Item({
  it,
  done,
  edit,
  pausedReasons,
  emphasized,
  onToggle,
  onExclude,
}: {
  it: RoutineItem;
  done: boolean;
  edit: boolean;
  pausedReasons?: string[];
  emphasized?: boolean;
  onToggle: () => void;
  onExclude: () => void;
}) {
  const paused = !!(pausedReasons && pausedReasons.length > 0);
  return (
    <li className={`ritem ${done && !paused ? "done" : ""} ${paused ? "opacity-60" : ""}`}>
      <button
        type="button"
        className="rcheck"
        disabled={paused}
        aria-pressed={!paused && done}
        aria-label={paused ? `${it.title} 오늘은 쉬기` : `${it.title} ${done ? "완료 취소" : "완료"}`}
        onClick={onToggle}
      >
        <Check />
      </button>
      <div className="min-w-0">
        <p className={`rtitle text-[16px] font-semibold tracking-tight ${paused ? "line-through text-mute" : ""}`}>
          {it.title}
          {paused && <span className="badge badge-draft ml-2">오늘 쉬기</span>}
          {!paused && emphasized && <span className="badge ml-2">오늘 강조</span>}
          {it.situations && <span className="badge badge-draft ml-2">오늘 상황</span>}
          {it.templateId === "custom" && <span className="badge badge-draft ml-2">내 항목</span>}
        </p>
        {paused && (
          <p className="small mt-1">{pausedReasons!.join(" · ")} 때문에 오늘 밤은 쉬어요.</p>
        )}
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
        <span className="small tabular-nums">{paused ? "휴식" : fmtMin(it.minutes)}</span>
        {edit && <button type="button" className="text-[12.5px] font-semibold text-signal-ink underline underline-offset-2" onClick={onExclude}>{it.templateId === "custom" ? "삭제" : "빼기"}</button>}
      </div>
    </li>
  );
}

const PRESETS: { title: string; slot: Slot; minutes: number; guide?: string }[] = [
  { title: "비타민 C 세럼", slot: "am", minutes: 0.5, guide: "ingredient-basics" },
  { title: "나이아신아마이드 세럼", slot: "am", minutes: 0.5 },
  { title: "레티놀 (주 2~3회)", slot: "pm", minutes: 0.5, guide: "retinoid-start" },
  { title: "BHA 토너 (주 2~3회)", slot: "pm", minutes: 1 },
  { title: "선크림 덧바르기 (점심)", slot: "am", minutes: 0.5, guide: "sunscreen-types" },
  { title: "립밤", slot: "pm", minutes: 0.5 },
  { title: "뷰티 디바이스 (LED · 갈바닉 등)", slot: "pm", minutes: 5, guide: "px-beauty" },
];

function AddCustom({ skinType }: { skinType?: keyof typeof SKIN_PROFILES }) {
  const [title, setTitle] = useState("");
  const [slot, setSlot] = useState<Slot>("am");
  const [added, setAdded] = useState<string | null>(null);
  const suggestions = skinType ? SKIN_PROFILES[skinType].addons : [];
  const add = (t: string, sl: Slot, minutes = 1, guide?: string) => {
    actions.addCustom({ title: t, slot: sl, minutes, guide });
    setAdded(t);
    setTitle("");
  };
  return (
    <section className="mt-6 rounded-[16px] border border-line p-5 fade-in" aria-label="내 항목 추가">
      <h2 className="h3">내 항목 추가</h2>
      <p className="small mt-1">아침 · 저녁에 내가 하기로 한 걸 직접 넣어요. 체크하면 오늘 충전에 같이 계산돼요.</p>
      <form
        className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]"
        onSubmit={(e) => { e.preventDefault(); if (title.trim()) add(title.trim(), slot); }}
      >
        <label className="sr-only" htmlFor="custom-title">항목 이름</label>
        <input id="custom-title" className="field" placeholder="예: 비타민 C 세럼, 아이크림, 립밤" value={title} maxLength={40} onChange={(e) => setTitle(e.target.value)} />
        <div className="flex gap-1" role="group" aria-label="시간대">
          {(["am", "pm"] as const).map((x) => (
            <button key={x} type="button" className="chip" aria-pressed={slot === x} onClick={() => setSlot(x)}>{x === "am" ? "아침" : "저녁"}</button>
          ))}
        </div>
        <button type="submit" className="btn btn-dark !min-h-11" disabled={!title.trim()}>추가</button>
      </form>
      {added && <p className="small mt-2" role="status">&lsquo;{added}&rsquo;을(를) 넣었어요.</p>}

      {suggestions.length > 0 && (
        <div className="mt-5">
          <p className="small font-semibold !text-ink">내 피부 타입({SKIN_PROFILES[skinType!].ko})에 맞춘 제안</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestions.map((x) => (
              <button key={x.title} type="button" className="chip" onClick={() => add(x.title, x.slot, x.minutes)}>+ {x.title}</button>
            ))}
          </div>
        </div>
      )}
      <div className="mt-5">
        <p className="small font-semibold !text-ink">자주 넣는 항목</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRESETS.map((x) => (
            <button key={x.title} type="button" className="chip" onClick={() => add(x.title, x.slot, x.minutes, x.guide)}>+ {x.title} · {x.slot === "am" ? "아침" : "저녁"}</button>
          ))}
        </div>
      </div>
    </section>
  );
}
