"use client";

import { Fragment, useRef, type ReactNode } from "react";
import { MAX_IMAGES, imageUrl } from "@/lib/crew";

// 아주 작은 서식 규칙: **굵게**, 줄 앞 "- " 목록, 줄 앞 "> " 인용. HTML을 그대로 넣지 않고 React 요소로 만든다(안전).

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*\n]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? <strong key={i}>{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>,
  );
}

export function RichText({ text, className = "" }: { text: string; className?: string }) {
  const blocks: ReactNode[] = [];
  const lines = text.replace(/\r/g, "").split("\n");
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (/^\s*[-•]\s+/.test(l)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-•]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*[-•]\s+/, ""));
      blocks.push(<ul key={i} className="crew-list">{items.map((t, k) => <li key={k}>{inline(t)}</li>)}</ul>);
    } else if (/^\s*>\s?/.test(l)) {
      const q: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) q.push(lines[i++].replace(/^\s*>\s?/, ""));
      blocks.push(<blockquote key={i} className="crew-quote">{q.map((t, k) => <Fragment key={k}>{k > 0 && <br />}{inline(t)}</Fragment>)}</blockquote>);
    } else if (l.trim() === "") {
      i++;
    } else {
      const p: string[] = [];
      while (i < lines.length && lines[i].trim() !== "" && !/^\s*([-•]\s+|>)/.test(lines[i])) p.push(lines[i++]);
      blocks.push(<p key={i}>{p.map((t, k) => <Fragment key={k}>{k > 0 && <br />}{inline(t)}</Fragment>)}</p>);
    }
  }
  return <div className={`crew-rich ${className}`}>{blocks}</div>;
}

/** 서식 버튼이 달린 입력창 */
export function Editor({ id, value, onChange, max, placeholder, minRows = 7 }: { id: string; value: string; onChange: (v: string) => void; max: number; placeholder?: string; minRows?: number }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  function wrapBold() {
    const el = ref.current!; const { selectionStart: a, selectionEnd: b } = el;
    const sel = value.slice(a, b) || "굵게 쓸 말";
    const next = value.slice(0, a) + `**${sel}**` + value.slice(b);
    onChange(next.slice(0, max));
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(a + 2, a + 2 + sel.length); });
  }
  function prefixLines(mark: string) {
    const el = ref.current!; const { selectionStart: a, selectionEnd: b } = el;
    const start = value.lastIndexOf("\n", a - 1) + 1;
    const endIdx = value.indexOf("\n", b); const end = endIdx === -1 ? value.length : endIdx;
    const block = value.slice(start, end).split("\n").map((ln) => (ln.startsWith(mark) ? ln.slice(mark.length) : mark + ln)).join("\n");
    onChange((value.slice(0, start) + block + value.slice(end)).slice(0, max));
    requestAnimationFrame(() => el.focus());
  }
  return (
    <div className="crew-editor">
      <div className="crew-toolbar" role="toolbar" aria-label="서식">
        <button type="button" onClick={wrapBold} aria-label="굵게" title="굵게 (**글자**)"><b>B</b></button>
        <button type="button" onClick={() => prefixLines("- ")} aria-label="목록" title="목록 (- )">• 목록</button>
        <button type="button" onClick={() => prefixLines("> ")} aria-label="인용" title="인용 (> )">❝ 인용</button>
        <span className="crew-count">{value.length}/{max}</span>
      </div>
      <textarea id={id} ref={ref} className="field crew-textarea" rows={minRows} maxLength={max} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

/** 첨부 사진 보기: 1장은 크게, 여러 장은 2열 */
export function Gallery({ paths }: { paths?: string[] }) {
  if (!paths?.length) return null;
  return (
    <div className={`crew-gallery ${paths.length === 1 ? "one" : ""}`}>
      {paths.map((p) => (
        <a key={p} href={imageUrl(p)} target="_blank" rel="noopener" className="crew-shot">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl(p)} alt="첨부 사진" loading="lazy" />
        </a>
      ))}
    </div>
  );
}

export type Draft = { kind: "old"; path: string } | { kind: "new"; file: File; url: string };

/** 사진 고르기 (최대 4장) */
export function ImagePicker({ items, onChange }: { items: Draft[]; onChange: (d: Draft[]) => void }) {
  const left = MAX_IMAGES - items.length;
  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        {items.map((d, i) => (
          <div key={i} className="crew-thumb">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={d.kind === "new" ? d.url : imageUrl(d.path)} alt="" />
            <button type="button" aria-label="사진 빼기" onClick={() => onChange(items.filter((_, k) => k !== i))}>×</button>
          </div>
        ))}
        {left > 0 && (
          <label className="crew-add">
            <input id="crew-photo" type="file" accept="image/*" multiple className="sr-only"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []).slice(0, left);
                onChange([...items, ...files.map((f) => ({ kind: "new" as const, file: f, url: URL.createObjectURL(f) }))]);
                e.target.value = "";
              }} />
            <span aria-hidden="true">＋</span><span className="text-[12px]">사진 {items.length}/{MAX_IMAGES}</span>
          </label>
        )}
      </div>
      <p className="small !text-[12.5px]">올릴 때 크기를 줄이고 위치 정보는 지워요. 부대 안 · 얼굴 · 신분이 드러나는 사진은 올리지 않아요.</p>
    </div>
  );
}
