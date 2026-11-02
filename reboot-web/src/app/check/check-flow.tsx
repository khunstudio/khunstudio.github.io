"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Choice } from "@/components/choice";
import { AREAS, AREA_ORDER, CONCERNS, CONCERN_ORDER, EXPERIENCES, GOALS, MINUTES, MODES, MODE_ORDER } from "@/lib/labels";
import { getStore } from "@/lib/store";
import { track } from "@/lib/analytics";
import type { Area, CheckAnswers, Concern, Experience, Goal, Minutes, Mode } from "@/lib/types";

export const DRAFT_KEY = "reboot:check-draft";

type Draft = Partial<CheckAnswers> & { interests: Area[]; concerns: Concern[] };

const STEPS = ["mode", "interests", "experience", "minutes", "concerns", "goal"] as const;

export function CheckFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Draft>({ interests: [], concerns: [] });

  useEffect(() => {
    const m = params.get("mode") as Mode | null;
    const p = getStore().profile;
    // 이미 체크한 적이 있으면 이전 답을 채워 둔다
    setD(p ? { mode: p.mode, interests: p.interests, experience: p.experience, minutes: p.minutes, concerns: p.concerns, goal: p.goal } : { interests: [], concerns: [] });
    if (m && MODES[m]) { setD((x) => ({ ...x, mode: m })); setStep(1); }
    track("check_start", { mode: m ?? undefined });
  }, [params]);

  const key = STEPS[step];
  const valid =
    key === "mode" ? !!d.mode :
    key === "interests" ? d.interests.length > 0 :
    key === "experience" ? !!d.experience :
    key === "minutes" ? !!d.minutes :
    key === "concerns" ? true :
    !!d.goal;

  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  function next() {
    if (!valid) return;
    if (step < STEPS.length - 1) { setStep(step + 1); window.scrollTo({ top: 0 }); return; }
    const answers = d as CheckAnswers;
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(answers)); } catch { /* noop */ }
    track("check_complete", { mode: answers.mode, minutes: answers.minutes });
    // 고민 응답은 주소창(서버 접속 기록)에 남기지 않도록 sessionStorage로만 넘긴다
    router.push("/check/result/");
  }

  const Q: Record<(typeof STEPS)[number], { q: string; hint?: string; body: React.ReactNode }> = {
    mode: {
      q: "지금 어떤 시기를 보내고 있나요?",
      body: MODE_ORDER.map((m) => <Choice key={m} selected={d.mode === m} onClick={() => setD({ ...d, mode: m })} title={MODES[m].ko} desc={MODES[m].desc} />),
    },
    interests: {
      q: "관심 있는 영역을 모두 골라주세요",
      hint: "여러 개 선택할 수 있어요",
      body: AREA_ORDER.map((a) => <Choice key={a} multi selected={d.interests.includes(a)} onClick={() => setD({ ...d, interests: toggle(d.interests, a) })} title={AREAS[a].ko} desc={AREAS[a].desc} />),
    },
    experience: {
      q: "평소 관리는 어느 정도 하고 있나요?",
      body: (Object.keys(EXPERIENCES) as Experience[]).map((e) => <Choice key={e} selected={d.experience === e} onClick={() => setD({ ...d, experience: e })} title={EXPERIENCES[e]} />),
    },
    minutes: {
      q: "하루에 얼마나 쓸 수 있나요?",
      hint: "아침과 저녁을 합친 시간이에요. 적게 시작해도 충분해요.",
      body: ([3, 5, 10] as Minutes[]).map((m) => <Choice key={m} selected={d.minutes === m} onClick={() => setD({ ...d, minutes: m })} title={MINUTES[m]} />),
    },
    concerns: {
      q: "요즘 신경 쓰이는 게 있나요?",
      hint: "선택 사항이에요. 스스로 느끼는 정도를 참고할 뿐, 피부 상태를 진단하지 않아요.",
      body: CONCERN_ORDER.map((c) => <Choice key={c} multi selected={d.concerns.includes(c)} onClick={() => setD({ ...d, concerns: toggle(d.concerns, c) })} title={CONCERNS[c].ko} desc={CONCERNS[c].desc} />),
    },
    goal: {
      q: "이번에 가장 하고 싶은 건 뭔가요?",
      body: (Object.keys(GOALS) as Goal[]).map((g) => <Choice key={g} selected={d.goal === g} onClick={() => setD({ ...d, goal: g })} title={GOALS[g]} />),
    },
  };

  const q = Q[key];
  return (
    <div className="wrap-narrow flex min-h-[calc(100dvh-56px-64px)] flex-col py-8 md:min-h-0 md:py-14">
      <div className="flex items-center justify-between">
        <p className="eyebrow">30-SECOND CHECK</p>
        <p className="small tabular-nums">{step + 1} / {STEPS.length}</p>
      </div>
      <div className="bar mt-3" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1} aria-label="체크 진행">
        <i style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
      </div>

      <fieldset key={key} className="fade-in mt-8 min-w-0">
        <legend className="h2">{q.q}</legend>
        {q.hint && <p className="small mt-2">{q.hint}</p>}
        <div className="mt-6 grid gap-2.5" role={key === "interests" || key === "concerns" ? "group" : "radiogroup"}>
          {q.body}
        </div>
      </fieldset>

      <div className="mt-auto flex items-center gap-2 pt-8">
        {step > 0 && <button type="button" className="btn btn-ghost" onClick={() => setStep(step - 1)}>이전</button>}
        <button type="button" className="btn btn-primary ml-auto min-w-[150px] flex-1 md:flex-none" disabled={!valid} onClick={next}>
          {step === STEPS.length - 1 ? "결과 보기" : key === "concerns" && d.concerns.length === 0 ? "없어요, 다음" : "다음"}
        </button>
      </div>
      <p className="small mt-4 text-center">의학적 진단이 아닌, 시작할 루틴을 고르기 위한 간단한 질문이에요.</p>
    </div>
  );
}
