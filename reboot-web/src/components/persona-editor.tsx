"use client";

import { AGES, AGE_ORDER, FOCUSES, FOCUS_ORDER, STATUSES, statusOptions } from "@/lib/labels";
import type { AgeBand, Focus, Mode, Status } from "@/lib/types";

export interface PersonaValue { age?: AgeBand; status?: Status; focus?: Focus[] }

// 나이대 · 지금 생활 · 요즘 관심사. 모두 선택 입력이고, 추천을 고르는 데만 쓴다.
export function PersonaEditor({ mode, value, onChange, dark = false }: { mode?: Mode; value: PersonaValue; onChange: (v: PersonaValue) => void; dark?: boolean }) {
  const focus = value.focus ?? [];
  const toggleFocus = (f: Focus) => onChange({ ...value, focus: focus.includes(f) ? focus.filter((x) => x !== f) : focus.length >= 3 ? focus : [...focus, f] });
  const statuses = statusOptions(mode);
  const label = `eyebrow !text-[11px] ${dark ? "!text-ink-mute" : ""}`;
  return (
    <div className="grid gap-6">
      <div>
        <p className={label}>나이대</p>
        <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="나이대">
          {AGE_ORDER.map((a) => (
            <button key={a} type="button" role="radio" aria-checked={value.age === a} className="chip" aria-pressed={value.age === a}
              onClick={() => onChange({ ...value, age: value.age === a ? undefined : a })}>{AGES[a]}</button>
          ))}
        </div>
      </div>
      {mode !== "service" && (
        <div>
          <p className={label}>지금 생활</p>
          <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="지금 생활">
            {statuses.map((st) => (
              <button key={st} type="button" role="radio" aria-checked={value.status === st} className="chip" aria-pressed={value.status === st}
                onClick={() => onChange({ ...value, status: value.status === st ? undefined : st })}>{STATUSES[st]}</button>
            ))}
          </div>
        </div>
      )}
      <div>
        <p className={label}>요즘 관심사 <span className="normal-case tracking-normal">· 최대 3개</span></p>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="요즘 관심사">
          {FOCUS_ORDER.map((f) => (
            <button key={f} type="button" role="checkbox" aria-checked={focus.includes(f)} className="concern-chip" onClick={() => toggleFocus(f)}>
              <span className="font-semibold">{FOCUSES[f].ko}</span>
              <span className="concern-chip__d">{FOCUSES[f].desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
