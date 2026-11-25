"use client";

import { useState } from "react";
import { crewReady, sb } from "@/lib/crew";

const KINDS = [["brand", "브랜드 · 제품"], ["expert", "의료진 · 전문가 검수"], ["content", "콘텐츠 · 인터뷰"], ["press", "언론 · 취재"], ["etc", "기타"]] as const;

export function InquiryForm() {
  const [kind, setKind] = useState<(typeof KINDS)[number][0]>("brand");
  const [org, setOrg] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [trap, setTrap] = useState(""); // 사람에게는 안 보이는 칸 (자동 스팸 막기)
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [err, setErr] = useState("");

  if (!crewReady) return null;
  if (state === "done") return <div className="notice mt-6"><p><b>문의를 받았어요.</b> 남겨 주신 이메일로 답장드릴게요. 보통 3영업일 안에 연락드려요.</p></div>;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (trap) { setState("done"); return; }
    if (message.trim().length < 10) { setErr("내용을 10자 이상 적어 주세요."); return; }
    setState("busy"); setErr("");
    const { error } = await sb().from("inquiries").insert({ kind, org: org.trim() || null, name: name.trim(), email: email.trim(), message: message.trim() });
    if (error) { setState("error"); setErr(error.message.includes("rate_limit") ? "잠시 후 다시 보내 주세요." : "보내지 못했어요. 입력 내용을 확인하고 다시 시도해 주세요."); return; }
    setState("done");
  }

  return (
    <form onSubmit={submit} className="mt-6 grid gap-4">
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="문의 종류">
        {KINDS.map(([k, l]) => <button key={k} type="button" role="radio" aria-checked={kind === k} className="chip" aria-pressed={kind === k} onClick={() => setKind(k)}>{l}</button>)}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5"><span className="small">이름 *</span><input id="inq-name" className="field" required maxLength={40} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>
        <label className="grid gap-1.5"><span className="small">회사 · 소속</span><input id="inq-org" className="field" maxLength={80} value={org} onChange={(e) => setOrg(e.target.value)} autoComplete="organization" /></label>
      </div>
      <label className="grid gap-1.5"><span className="small">답장 받을 이메일 *</span><input id="inq-email" type="email" className="field" required maxLength={120} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
      <label className="grid gap-1.5"><span className="small">내용 * ({message.length}/3000)</span><textarea id="inq-message" className="field" required maxLength={3000} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="협업하고 싶은 내용, 일정, 참고 링크를 적어 주세요." /></label>
      <input tabIndex={-1} aria-hidden="true" className="sr-only" value={trap} onChange={(e) => setTrap(e.target.value)} autoComplete="off" name="website" />
      <p className="small">보내 주신 이름 · 소속 · 이메일 · 내용은 답장을 위해서만 쓰고, 협의가 끝나면 1년 안에 지워요.</p>
      <div><button type="submit" className="btn btn-primary" disabled={state === "busy"}>{state === "busy" ? "보내는 중…" : "문의 보내기"}</button></div>
      {err && <p className="small" role="alert">{err}</p>}
    </form>
  );
}
