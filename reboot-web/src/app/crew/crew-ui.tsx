"use client";

import Link from "next/link";
import { loginHref } from "@/components/account-login";
import { useState } from "react";
import { REPORT_REASONS, friendlyError, sb, type Stage, type Topic, STAGES, TOPICS } from "@/lib/crew";

/** 콜론 상태: 해결 전(위만 켜짐) · 해결됨(둘 다 켜짐). 브랜드 가이드의 IN PROGRESS / BOOTED */
export function SolvedDots({ solved }: { solved: boolean }) {
  return <span className="crew-dots" aria-hidden="true"><i className="on" /><i className={solved ? "on" : ""} /></span>;
}

export function Tags({ stage, topic }: { stage: Stage; topic: Topic }) {
  return <><span className="badge badge-draft">{STAGES[stage]}</span><span className="badge badge-draft">{TOPICS[topic]}</span></>;
}

/** 신고 · 차단 메뉴 */
export function ReportBlock({ type, id, author, me, onBlocked }: { type: "post" | "answer"; id: string; author: string; me?: string; onBlocked?: () => void }) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  if (!me) return <span className="crew-menu"><Link href={loginHref("/crew/")} className="underline underline-offset-2">로그인하고 신고</Link></span>;
  if (me === author) return null;
  async function report(reason: string) {
    const { error } = await sb().from("reports").insert({ target_type: type, target_id: id, reason });
    setMsg(error ? friendlyError(error) : "신고했어요. 3건이 모이면 자동으로 가려지고, 운영자가 확인해요.");
    setOpen(false);
  }
  async function block() {
    const { error } = await sb().from("blocks").insert({ blocked_id: author });
    if (error) { setMsg(friendlyError(error)); return; }
    setMsg("차단했어요. 이 사람의 글과 답이 더 이상 보이지 않아요.");
    onBlocked?.();
  }
  return (
    <div className="grid gap-2">
      <div className="crew-menu">
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open}>신고</button>
        <button type="button" onClick={block}>이 사람 차단</button>
      </div>
      {open && (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="신고 사유">
          {REPORT_REASONS.map((r) => <button key={r} type="button" className="chip !h-8 !text-[13px]" onClick={() => report(r)}>{r}</button>)}
        </div>
      )}
      {msg && <p className="small" role="status">{msg}</p>}
    </div>
  );
}

export function NotReady() {
  return (
    <div className="notice">
      <p><b>CREW 서버 연결을 준비하고 있어요.</b> 게시판 기능은 만들어 두었고, 데이터베이스가 연결되면 이 자리에 바로 열려요.</p>
    </div>
  );
}
