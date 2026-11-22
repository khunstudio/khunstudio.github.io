"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { KINDS, blockedIds, crewReady, friendlyError, privacyIssue, sb, timeAgo, useCrewUser, type Answer, type Post } from "@/lib/crew";
import { NotReady, ReportBlock, SolvedDots, Tags } from "../crew-ui";

export function CrewPost() {
  const id = useSearchParams().get("id");
  const router = useRouter();
  const { user, nickname, loading } = useCrewUser();
  const [post, setPost] = useState<Post | null | undefined>(undefined);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [mine, setMine] = useState<string[]>([]);
  const [reply, setReply] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!id) { setPost(null); return; }
    const [{ data: p }, { data: a }, blocked] = await Promise.all([
      sb().from("posts").select("*, profiles(nickname)").eq("id", id).maybeSingle(),
      sb().from("answers").select("*, profiles(nickname)").eq("post_id", id).order("created_at"),
      user ? blockedIds() : Promise.resolve([] as string[]),
    ]);
    setPost((p as Post) ?? null);
    const list = ((a as Answer[]) ?? []).filter((x) => !blocked.includes(x.author));
    setAnswers(list);
    if (user && list.length) {
      const { data: h } = await sb().from("helpful").select("answer_id").in("answer_id", list.map((x) => x.id));
      setMine((h ?? []).map((r: { answer_id: string }) => r.answer_id));
    }
  }
  useEffect(() => { if (crewReady && !loading) load(); }, [id, loading, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!crewReady) return <NotReady />;
  if (post === undefined) return <p className="small">불러오는 중…</p>;
  if (post === null) return <div><p className="h3">글을 찾을 수 없어요</p><p className="small mt-2">삭제됐거나 신고로 가려진 글일 수 있어요.</p><Link href="/crew/" className="btn btn-ghost mt-4">CREW로</Link></div>;

  const isAuthor = user?.id === post.author;

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    const issue = privacyIssue(reply);
    if (issue) { setMsg(issue); return; }
    if (reply.trim().length < 2) return;
    setBusy(true); setMsg("");
    const { error } = await sb().from("answers").insert({ post_id: post!.id, body: reply.trim() });
    setBusy(false);
    if (error) { setMsg(friendlyError(error)); return; }
    setReply(""); load();
  }
  async function toggleHelpful(a: Answer) {
    if (!user) { router.push("/crew/login/"); return; }
    const on = mine.includes(a.id);
    const { error } = on ? await sb().from("helpful").delete().eq("answer_id", a.id).eq("user_id", user.id) : await sb().from("helpful").insert({ answer_id: a.id });
    if (error) { setMsg(friendlyError(error)); return; }
    load();
  }
  async function toggleSolved() {
    const { error } = await sb().from("posts").update({ solved: !post!.solved }).eq("id", post!.id);
    if (error) setMsg(friendlyError(error)); else load();
  }
  async function remove(table: "posts" | "answers", rid: string) {
    if (!window.confirm("삭제할까요? 되돌릴 수 없어요.")) return;
    const { error } = await sb().from(table).delete().eq("id", rid);
    if (error) { setMsg(friendlyError(error)); return; }
    if (table === "posts") router.push("/crew/"); else load();
  }

  return (
    <article>
      <Link href="/crew/" className="small">← CREW</Link>
      <div className="crew-meta mt-6">
        <span className="crew-kind">{KINDS[post.kind].en}</span>
        {post.kind === "ask" && <span className={post.solved ? "crew-solved" : ""}><SolvedDots solved={post.solved} /> {post.solved ? "해결됨" : "답 기다리는 중"}</span>}
        <Tags stage={post.stage} topic={post.topic} />
      </div>
      <h1 className="h2 mt-3">{post.title}</h1>
      <div className="crew-meta mt-3"><span>{post.profiles?.nickname ?? "알 수 없음"}</span><span>{timeAgo(post.created_at)}</span></div>
      {post.hidden && <div className="notice notice-warn mt-4"><p>신고가 모여 다른 사람에게는 가려진 글이에요. 운영자가 확인 중이에요.</p></div>}
      <p className="crew-body mt-6">{post.body}</p>
      <div className="mt-6 flex flex-wrap items-start justify-between gap-3 border-b border-line pb-6">
        {isAuthor ? (
          <div className="crew-menu">
            {post.kind === "ask" && <button type="button" onClick={toggleSolved}>{post.solved ? "해결 취소" : "해결됨으로 표시"}</button>}
            <button type="button" onClick={() => remove("posts", post.id)}>삭제</button>
          </div>
        ) : <span />}
        <ReportBlock type="post" id={post.id} author={post.author} me={user?.id} onBlocked={() => router.push("/crew/")} />
      </div>

      <h2 className="h3 mt-8">BACK <span className="text-mute">{answers.length}</span></h2>
      <ul className="mt-2">
        {answers.length === 0 && <li className="small py-6">아직 답이 없어요. 겪어 본 적 있다면 짧게라도 남겨 주세요.</li>}
        {answers.map((a) => (
          <li key={a.id} className="border-b border-line py-5">
            <div className="crew-meta"><span className="font-semibold text-ink">{a.profiles?.nickname ?? "알 수 없음"}</span>{a.author === post.author && <span className="badge badge-draft">글쓴이</span>}<span>{timeAgo(a.created_at)}</span>{a.hidden && <span className="badge badge-draft">가려짐 · 나에게만 보여요</span>}</div>
            <p className="crew-body mt-2 text-[15.5px]">{a.body}</p>
            <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <button type="button" className="chip !h-8 !text-[13px]" aria-pressed={mine.includes(a.id)} onClick={() => toggleHelpful(a)}>도움 됨 {a.helpful_count}</button>
                {user?.id === a.author && <span className="crew-menu"><button type="button" onClick={() => remove("answers", a.id)}>삭제</button></span>}
              </div>
              <ReportBlock type="answer" id={a.id} author={a.author} me={user?.id} onBlocked={load} />
            </div>
          </li>
        ))}
      </ul>

      {user && nickname ? (
        <form onSubmit={sendReply} className="mt-8">
          <label className="grid gap-1.5"><span className="small">경험으로 답하기 ({reply.length}/2000)</span>
            <textarea id="crew-reply" className="field" maxLength={2000} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="내가 겪어 봤던 것, 해 보니 괜찮았던 순서를 적어 주세요." />
          </label>
          <button type="submit" className="btn btn-primary mt-3" disabled={busy || reply.trim().length < 2}>{busy ? "올리는 중…" : "BACK 남기기"}</button>
        </form>
      ) : (
        <div className="mt-8 rounded-[12px] bg-sand p-5"><p className="font-bold">답을 남기려면 로그인해 주세요</p><Link href="/crew/login/" className="btn btn-dark mt-3 !min-h-11">로그인</Link></div>
      )}
      {msg && <p className="small mt-3" role="alert">{msg}</p>}
    </article>
  );
}
