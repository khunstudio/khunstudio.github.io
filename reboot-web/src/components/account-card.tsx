"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { crewReady, deleteMyAccount, sb, timeAgo, useCrewUser } from "@/lib/crew";
import { disable, enable, firstEnableState, lastSynced, startAutoSync, syncEnabled, syncNow } from "@/lib/sync";
import { loginHref } from "./account-login";

/** MY 맨 위 계정 카드: 로그인 · 기록 백업(선택) */
export function AccountCard() {
  const { user, nickname, loading } = useCrewUser();
  const [on, setOn] = useState(false);
  const [last, setLast] = useState<string | null>(null);
  const [ask, setAsk] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [delText, setDelText] = useState("");

  useEffect(() => { setOn(syncEnabled()); setLast(lastSynced()); }, []);
  useEffect(() => {
    if (!user || !on) return;
    return startAutoSync((st) => {
      setLast(lastSynced());
      if (st === "pulled") setMsg("다른 기기에서 바뀐 기록을 받아왔어요.");
      if (st === "error") setMsg("백업에 실패했어요. 연결을 확인해 주세요. 기록은 이 기기에 그대로 있어요.");
    });
  }, [user, on]);

  if (!crewReady || loading) return null;

  if (!user) {
    return (
      <section className="rounded-[16px] border border-line p-5 md:p-6">
        <p className="font-bold">로그인하면 기록을 계정에 백업할 수 있어요</p>
        <p className="small mt-1">지금 기록은 이 브라우저에만 저장돼요. 휴대폰을 바꾸거나 브라우저 데이터를 지우면 사라져요.</p>
        <Link href={loginHref("/my/")} className="btn btn-dark mt-4 !min-h-11">로그인</Link>
      </section>
    );
  }

  async function run(fn: () => Promise<unknown>, done: string) {
    setBusy(true); setMsg("");
    try { await fn(); setMsg(done); } catch { setMsg("문제가 생겼어요. 잠시 후 다시 시도해 주세요. 계정 기능 설정이 끝나지 않았을 수도 있어요."); }
    setBusy(false); setLast(lastSynced());
  }

  async function turnOn() {
    setBusy(true); setMsg("");
    try {
      const st = await firstEnableState();
      if (st === "both") { setAsk(true); setBusy(false); return; }
      await enable(st === "empty-local" ? "server" : "local");
      setOn(true); setLast(lastSynced());
      setMsg(st === "empty-local" ? "계정에 저장된 기록을 불러왔어요." : "백업을 켰어요. 이제 기록이 바뀔 때마다 계정에 저장돼요.");
    } catch { setMsg("백업을 켜지 못했어요. 잠시 후 다시 시도해 주세요. 계정 기능 설정이 끝나지 않았을 수도 있어요."); }
    setBusy(false);
  }

  return (
    <section className="rounded-[16px] border border-line p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow !text-[11px]">ACCOUNT</p>
          <p className="mt-1 font-bold">{nickname ?? "닉네임 미설정"} <span className="small font-normal">· {user.email}</span></p>
        </div>
        <div className="flex gap-2">
          {!nickname && <Link href={loginHref("/my/")} className="btn btn-ghost !min-h-10">닉네임 정하기</Link>}
          <button type="button" className="btn btn-ghost !min-h-10" onClick={() => sb().auth.signOut()}>로그아웃</button>
        </div>
      </div>

      <div className="mt-4 border-t border-line pt-4">
        {ask ? (
          <div>
            <p className="font-bold">이 기기와 계정에 둘 다 기록이 있어요. 어느 쪽을 남길까요?</p>
            <p className="small mt-1">고르지 않은 쪽은 덮어써져요. 걱정되면 아래 &lsquo;데이터&rsquo;에서 먼저 내보내기를 해 두세요.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="btn btn-dark !min-h-10" disabled={busy} onClick={() => run(async () => { await enable("local"); setOn(true); setAsk(false); }, "이 기기 기록으로 계정을 맞췄어요.")}>이 기기 기록 남기기</button>
              <button type="button" className="btn btn-ghost !min-h-10" disabled={busy} onClick={() => run(async () => { await enable("server"); setOn(true); setAsk(false); }, "계정에 저장된 기록을 불러왔어요.")}>계정 기록 불러오기</button>
              <button type="button" className="btn btn-ghost !min-h-10" onClick={() => setAsk(false)}>취소</button>
            </div>
          </div>
        ) : on ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[15px]"><b>기록 백업 켜짐</b> <span className="small">· {last ? `마지막 백업 ${timeAgo(last)}` : "백업 준비 중"}</span></p>
            <div className="flex gap-2">
              <button type="button" className="btn btn-ghost !min-h-10" disabled={busy} onClick={() => run(() => syncNow(), "기록을 맞췄어요.")}>지금 맞추기</button>
              <button type="button" className="btn btn-ghost !min-h-10" onClick={() => { disable(); setOn(false); setMsg("이 기기의 백업을 껐어요. 계정에 저장된 기록은 남아 있어요."); }}>끄기</button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-bold">기록을 계정에 백업할까요?</p>
              <p className="small mt-1">루틴 · 체크 기록 · 목표가 계정에 저장돼서 다른 기기에서도 이어 쓸 수 있어요. 켜지 않으면 지금처럼 이 기기에만 남아요.</p>
            </div>
            <button type="button" className="btn btn-primary !min-h-10" disabled={busy} onClick={turnOn}>백업 켜기</button>
          </div>
        )}
        {msg && <p className="small mt-3" role="status">{msg}</p>}
      </div>

      <div className="mt-4 border-t border-line pt-4">
        {!delOpen ? (
          <button type="button" className="text-[13px] text-mute underline underline-offset-2 hover:text-ink" onClick={() => setDelOpen(true)}>계정 삭제</button>
        ) : (
          <div className="rounded-[12px] bg-sand p-4">
            <p className="font-bold">계정을 삭제할까요? 되돌릴 수 없어요.</p>
            <ul className="small mt-2 grid gap-1">
              <li>· 바로 지워지는 것: 로그인 계정, 닉네임, CREW 글 · 답 · 첨부 사진 · &lsquo;도움 됨&rsquo;, 신고 · 차단 기록, 계정에 백업한 기록</li>
              <li>· 남는 것: 이 기기 브라우저의 루틴 기록 (아래 &lsquo;데이터&rsquo;에서 따로 지울 수 있어요)</li>
            </ul>
            <label className="mt-3 grid gap-1.5"><span className="small">확인을 위해 <b>삭제</b>라고 입력해 주세요</span>
              <input id="acct-delete-confirm" className="field max-w-[220px]" value={delText} onChange={(e) => setDelText(e.target.value)} autoComplete="off" />
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="btn !min-h-10 bg-[#b91c1c] text-white disabled:opacity-40" disabled={delText.trim() !== "삭제" || busy}
                onClick={async () => {
                  setBusy(true); setMsg("");
                  try { await deleteMyAccount(); disable(); setOn(false); setDelOpen(false); setMsg("계정을 삭제했어요. 그동안 함께해 줘서 고마워요."); }
                  catch { setMsg("삭제하지 못했어요. 잠시 후 다시 시도해 주세요. 계속 안 되면 협업 문의로 알려 주세요."); }
                  setBusy(false);
                }}>{busy ? "삭제 중…" : "계정 영구 삭제"}</button>
              <button type="button" className="btn btn-ghost !min-h-10" onClick={() => { setDelOpen(false); setDelText(""); }}>취소</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
