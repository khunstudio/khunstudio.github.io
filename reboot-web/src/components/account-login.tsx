"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { crewReady, friendlyError, sb, useCrewUser } from "@/lib/crew";

// RE:BOOT 계정 로그인 (MY · CREW 공용). 비밀번호 없이 구글 또는 이메일 링크.
// 로그인 후 돌아오는 주소는 Supabase에 등록된 /crew/login/ 하나로 통일하고, 원래 가려던 곳은 sessionStorage에 기억해 둔다.

const NEXT_KEY = "reboot:login-next";
const RETURN_PATH = "/crew/login/";
const safeNext = (v: string | null) => (v && v.startsWith("/") && !v.startsWith("//") ? v : null);

export function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
  );
}

/** 다른 화면에서 로그인 화면으로 보낼 때 쓰는 주소 */
export const loginHref = (next: string) => `/login/?next=${encodeURIComponent(next)}`;

export function AccountLogin() {
  const router = useRouter();
  const { user, nickname, loading, setNickname } = useCrewUser();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [nick, setNick] = useState("");
  const [agree, setAgree] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  // ?next= 를 기억해 둔다 (구글 · 메일 링크를 거쳐 돌아와도 원래 화면으로)
  useEffect(() => {
    const n = safeNext(new URLSearchParams(location.search).get("next"));
    if (n) try { sessionStorage.setItem(NEXT_KEY, n); } catch { /* noop */ }
  }, []);

  // 로그인 + 닉네임까지 끝났으면 원래 가려던 곳으로
  useEffect(() => {
    if (loading || !user || !nickname) return;
    let n: string | null = null;
    try { n = safeNext(sessionStorage.getItem(NEXT_KEY)); sessionStorage.removeItem(NEXT_KEY); } catch { /* noop */ }
    if (n) router.replace(n);
  }, [loading, user, nickname, router]);

  if (!crewReady) return <div className="notice"><p>계정 기능을 준비하고 있어요.</p></div>;
  if (loading) return <p className="small">확인 중…</p>;

  const back = () => `${location.origin}${process.env.NEXT_PUBLIC_BASE_PATH || ""}${RETURN_PATH}`;

  async function google() {
    setBusy(true); setMsg("");
    const { error } = await sb().auth.signInWithOAuth({ provider: "google", options: { redirectTo: back() } });
    if (error) {
      setBusy(false);
      setMsg(/provider is not enabled|Unsupported provider/i.test(error.message) ? "구글 로그인을 준비 중이에요. 지금은 이메일 링크로 로그인해 주세요." : friendlyError(error));
    }
  }

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg("");
    const { error } = await sb().auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: back() } });
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
        <p className="eyebrow">ACCOUNT</p>
        <h1 className="h1 mt-3">{nickname}님, 반가워요.</h1>
        <p className="lead mt-3">MY에서 기록 백업을 켜면 다른 기기에서도 이어 쓸 수 있어요. CREW에서는 글과 답을 남길 수 있어요.</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/my/" className="btn btn-primary">MY로</Link>
          <Link href="/crew/" className="btn btn-ghost">CREW로</Link>
          <button type="button" className="btn btn-ghost" onClick={() => sb().auth.signOut()}>로그아웃</button>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <form onSubmit={saveNick}>
        <p className="eyebrow">ACCOUNT · 마지막 단계</p>
        <h1 className="h1 mt-3">닉네임을 정해 주세요</h1>
        <p className="lead mt-3">CREW와 공유 카드에는 닉네임만 보여요. 실명 · 계급 · 소속 부대가 드러나는 이름은 피해 주세요.</p>
        <label className="mt-6 grid gap-1.5"><span className="small">닉네임 (2~16자)</span>
          <input id="acct-nick" className="field" value={nick} maxLength={16} onChange={(e) => setNick(e.target.value)} placeholder="예: 아침세안러" autoComplete="off" />
        </label>
        <label className="mt-4 flex items-start gap-2.5 text-[15px]">
          <input id="acct-agree" type="checkbox" className="mt-1.5" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span><Link href="/legal/terms/" className="link" target="_blank">이용약관</Link>, <Link href="/legal/privacy/" className="link" target="_blank">개인정보 처리 안내</Link>, <Link href="/legal/community/" className="link" target="_blank">커뮤니티 운영원칙</Link>을 읽었고 지킬게요.</span>
        </label>
        <button type="submit" className="btn btn-primary mt-6" disabled={!agree || busy}>시작하기</button>
        {msg && <p className="small mt-3" role="alert">{msg}</p>}
      </form>
    );
  }

  return (
    <div>
      <p className="eyebrow">ACCOUNT · 로그인</p>
      <h1 className="h1 mt-3">RE:BOOT 계정으로 로그인</h1>
      <p className="lead mt-3">로그인 없이도 루틴 · 피부 체크 · CREW 읽기는 그대로 쓸 수 있어요. 로그인하면 기록을 계정에 백업하고, CREW에 글과 답을 남길 수 있어요.</p>
      <button type="button" className="btn mt-6 w-full justify-center gap-3 border-[1.5px] border-line bg-white !text-ink hover:border-ink sm:w-auto" onClick={google} disabled={busy}>
        <GoogleIcon />
        Google로 계속하기
      </button>
      <div className="my-6 flex items-center gap-3 text-[13px] text-mute"><span className="h-px flex-1 bg-line" />또는 이메일 링크로<span className="h-px flex-1 bg-line" /></div>
      <form onSubmit={sendLink}>
        {sent ? (
          <div className="notice"><p><b>{email}</b>로 링크를 보냈어요. 메일함(스팸함도)을 확인하고, 링크는 이 브라우저에서 열어 주세요.</p></div>
        ) : (
          <>
            <label className="grid gap-1.5"><span className="small">이메일</span>
              <input id="acct-email" type="email" required className="field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
            </label>
            <button type="submit" className="btn btn-primary mt-4" disabled={busy || !email}>{busy ? "보내는 중…" : "로그인 링크 받기"}</button>
          </>
        )}
      </form>
      {msg && <p className="small mt-3" role="alert">{msg}</p>}
      <p className="small mt-8">비밀번호는 없어요. 다른 사람에게는 닉네임만 보이고 이메일은 공개되지 않아요. 저장되는 정보는 <Link href="/legal/privacy/" className="link">개인정보 처리 안내</Link>에 있어요.</p>
    </div>
  );
}
