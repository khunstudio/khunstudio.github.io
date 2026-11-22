"use client";

import Link from "next/link";
import { useState } from "react";
import { crewReady, friendlyError, sb, useCrewUser } from "@/lib/crew";
import { NotReady } from "../crew-ui";

// 비밀번호 없이 이메일 링크로 로그인. 닉네임만 공개되고 이메일은 다른 사람에게 보이지 않는다.
export function CrewLogin() {
  const { user, nickname, loading, setNickname } = useCrewUser();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [nick, setNick] = useState("");
  const [agree, setAgree] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  if (!crewReady) return <NotReady />;
  if (loading) return <p className="small">확인 중…</p>;

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg("");
    const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
    const { error } = await sb().auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: `${location.origin}${base}/crew/login/` } });
    setBusy(false);
    if (error) setMsg(error.message.includes("rate") ? "메일을 너무 자주 요청했어요. 1분 뒤 다시 시도해 주세요." : friendlyError(error));
    else setSent(true);
  }

  async function saveNick(e: React.FormEvent) {
    e.preventDefault();
    const n = nick.trim();
    if (!/^[가-힣a-zA-Z0-9_]{2,16}$/.test(n)) { setMsg("닉네임은 한글 · 영문 · 숫자 · _ 로 2~16자예요."); return; }
    setBusy(true); setMsg("");
    const { error } = await sb().from("profiles").insert({ id: user!.id, nickname: n });
    setBusy(false);
    if (error) setMsg(friendlyError(error)); else setNickname(n);
  }

  if (user && nickname) {
    return (
      <div>
        <p className="eyebrow">CREW</p>
        <h1 className="h1 mt-3">{nickname}님, 반가워요.</h1>
        <p className="lead mt-3">이제 질문하고, 경험으로 답할 수 있어요.</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/crew/new/" className="btn btn-primary">글쓰기</Link>
          <Link href="/crew/" className="btn btn-ghost">CREW로</Link>
          <button type="button" className="btn btn-ghost" onClick={() => sb().auth.signOut()}>로그아웃</button>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <form onSubmit={saveNick}>
        <p className="eyebrow">CREW · 마지막 단계</p>
        <h1 className="h1 mt-3">닉네임을 정해 주세요</h1>
        <p className="lead mt-3">CREW에는 닉네임만 보여요. 실명 · 계급 · 소속 부대가 드러나는 이름은 피해 주세요.</p>
        <label className="mt-6 grid gap-1.5"><span className="small">닉네임 (2~16자)</span>
          <input id="crew-nick" className="field" value={nick} maxLength={16} onChange={(e) => setNick(e.target.value)} placeholder="예: 아침세안러" autoComplete="off" />
        </label>
        <label className="mt-4 flex items-start gap-2.5 text-[15px]">
          <input id="crew-agree" type="checkbox" className="mt-1.5" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span><Link href="/legal/community/" className="link" target="_blank">커뮤니티 운영원칙</Link>을 읽었고 지킬게요. 비하 · 괴롭힘, 개인정보 · 부대 정보 노출, 진단 · 약물 단정은 하지 않아요.</span>
        </label>
        <button type="submit" className="btn btn-primary mt-6" disabled={!agree || busy}>시작하기</button>
        {msg && <p className="small mt-3" role="alert">{msg}</p>}
      </form>
    );
  }

  return (
    <form onSubmit={sendLink}>
      <p className="eyebrow">CREW · 로그인</p>
      <h1 className="h1 mt-3">이메일로 로그인 링크를 보내 드려요</h1>
      <p className="lead mt-3">비밀번호는 없어요. 메일의 링크를 누르면 바로 로그인돼요. 이메일은 다른 사람에게 보이지 않아요.</p>
      {sent ? (
        <div className="notice mt-6"><p><b>{email}</b>로 링크를 보냈어요. 메일함(스팸함도)을 확인해 주세요. 링크는 이 브라우저에서 열어 주세요.</p></div>
      ) : (
        <>
          <label className="mt-6 grid gap-1.5"><span className="small">이메일</span>
            <input id="crew-email" type="email" required className="field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
          </label>
          <button type="submit" className="btn btn-primary mt-4" disabled={busy || !email}>{busy ? "보내는 중…" : "로그인 링크 받기"}</button>
        </>
      )}
      {msg && <p className="small mt-3" role="alert">{msg}</p>}
      <p className="small mt-8">로그인하면 <Link href="/legal/privacy/" className="link">개인정보 처리 안내</Link>에 따라 이메일과 닉네임, 쓴 글이 CREW 서버에 저장돼요. 루틴 · 피부 기록은 지금처럼 내 브라우저에만 남아요.</p>
    </form>
  );
}
