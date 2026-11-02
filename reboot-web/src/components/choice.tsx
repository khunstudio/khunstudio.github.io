"use client";

import { Check } from "./chrome";

export function Choice({
  selected, onClick, title, desc, multi = false,
}: { selected: boolean; onClick: () => void; title: string; desc?: string; multi?: boolean }) {
  return (
    <button
      type="button"
      role={multi ? "checkbox" : "radio"}
      aria-checked={selected}
      onClick={onClick}
      className={`choice ${multi ? "multi" : ""}`}
    >
      <span className="tick"><Check /></span>
      <span className="grid">
        <span className="text-[16px] font-semibold tracking-tight">{title}</span>
        {desc && <span className="small mt-0.5">{desc}</span>}
      </span>
    </button>
  );
}
