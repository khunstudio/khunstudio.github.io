"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { KINDS, blockedIds, crewReady, friendlyError, privacyIssue, removeImages, sb, timeAgo, uploadImage, useCrewUser, type Answer, type Post } from "@/lib/crew";
import { NotReady, ReportBlock, SolvedDots, Tags } from "../crew-ui";
import { Editor, Gallery, ImagePicker, RichText, type Draft } from "../rich";

const Edited = ({ at }: { at?: string | null }) => (at ? <span title={new Date(at).toLocaleString("ko-KR")}>수정됨</span> : null);

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
  // 수정 상태
  const [editPost, setEditPost] = useState(false);
  const [eTitle, setETitle] = useState("");
  const [eBody, setEBody] = useState("");
  const [ePhotos, setEPhotos] = useState<Draft[]>([]);
  const [editAnswer, setEditAnswer] = useState<string | null>(null);
  const [eAnswer, setEAnswer] = useState("");

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

  function startEditPost() {
    setETitle(post!.title); setEBody(post!.body);
    setEPhotos((post!.images ?? []).map((path) => ({ kind: "old" as const, path })));
    setEditPost(true); setMsg("");
  }
  async function savePost(e: React.FormEvent) {
    e.preventDefault();
    const issue = privacyIssue(`${eTitle}\n${eBody}`);
    if (issue) { setMsg(issue); return; }
    if (eTitle.trim().length < 4 || eBody.trim().length < 10) { setMsg("제목은 4자, 내용은 10자 이상 써 주세요."); return; }
    setBusy(true); setMsg("");
    const uploaded: string[] = [];
    try {
      for (const d of ePhotos) if (d.kind === "new") uploaded.push(await uploadImage(user!.id, d.file));
    } catch (err) { await removeImages(uploaded); setBusy(false); setMsg(friendlyError(err)); return; }
    let k = 0;
    const images = ePhotos.map((d) => (d.kind === "old" ? d.path : uploaded[k++]));
    const before = post!.images ?? [];
    const photosChanged = images.join() !== before.join();
    const { error } = await sb().from("posts").update({ title: eTitle.trim(), body: eBody.trim(), ...(photosChanged ? { images } : {}) }).eq("id", post!.id);
    setBusy(false);
    if (error) { await removeImages(uploaded); setMsg(friendlyError(error)); return; }
    if (photosChanged) await removeImages(before.filter((p) => !images.includes(p)));
    setEditPost(false); load();
  }
  async function saveAnswer(a: Answer) {
    const issue = privacyIssue(eAnswer);
    if (issue) { setMsg(issue); return; }
    if (eAnswer.trim().length < 2) return;
    const { error } = await sb().from("answers").update({ body: eAnswer.trim() }).eq("id", a.id);
    if (error) { setMsg(friendlyError(error)); return; }
    setEditAnswer(null); load();
  }
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
    if (table === "posts") { await removeImages(post!.images ?? []); router.push("/crew/"); } else load();
  }

  return (
    <article>
      <Link href="/crew/" className="small">← CREW</Link>
      <div className="crew-meta mt-6">
        <span className="crew-kind">{KINDS[post.kind].en}</span>
        {post.kind === "ask" && <span className={post.solved ? "crew-solved" : ""}><SolvedDots solved={post.solved} /> {post.solved ? "해결됨" : "답 기다리는 중"}</span>}
        <Tags stage={post.stage} topic={post.topic} />
      </div>

      {editPost ? (
        <form onSubmit={savePost} className="mt-4 grid gap-4">
          <label className="grid gap-1.5"><span className="small">제목 ({eTitle.length}/80)</span>
            <input id="crew-edit-title" className="field" maxLength={80} value={eTitle} onChange={(e) => setETitle(e.target.value)} />
          </label>
          <div className="grid gap-1.5"><label htmlFor="crew-edit-body" className="small">내용</label><Editor id="crew-edit-body" max={3000} value={eBody} onChange={setEBody} /></div>
          <div className="grid gap-1.5"><span className="small">사진</span><ImagePicker items={ePhotos} onChange={setEPhotos} /></div>
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "저장 중…" : "수정 저장"}</button>
            <button type="button" className="btn btn-ghost" onClick={() => setEditPost(false)}>취소</button>
          </div>
        </form>
      ) : (
        <>
          <h1 className="h2 mt-3">{post.title}</h1>
          <div className="crew-meta mt-3"><span>{post.profiles?.nickname ?? "알 수 없음"}</span><span>{timeAgo(post.created_at)}</span><Edited at={post.edited_at} /></div>
          {post.hidden && <div className="notice notice-warn mt-4"><p>신고가 모여 다른 사람에게는 가려진 글이에요. 운영자가 확인 중이에요.</p></div>}
          <RichText text={post.body} className="mt-6" />
          {post.images?.length ? <div className="mt-5"><Gallery paths={post.images} /></div> : null}
        </>
      )}

      <div className="mt-6 flex flex-wrap items-start justify-between gap-3 border-b border-line pb-6">
        {isAuthor && !editPost ? (
          <div className="crew-menu">
            <button type="button" onClick={startEditPost}>수정</button>
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
            <div className="crew-meta"><span className="font-semibold text-ink">{a.profiles?.nickname ?? "알 수 없음"}</span>{a.author === post.author && <span className="badge badge-draft">글쓴이</span>}<span>{timeAgo(a.created_at)}</span><Edited at={a.edited_at} />{a.hidden && <span className="badge badge-draft">가려짐 · 나에게만 보여요</span>}</div>
            {editAnswer === a.id ? (
              <div className="mt-3 grid gap-2">
                <Editor id={`crew-edit-answer-${a.id}`} max={2000} value={eAnswer} onChange={setEAnswer} minRows={4} />
                <div className="flex gap-2">
                  <button type="button" className="btn btn-primary !min-h-10" onClick={() => saveAnswer(a)}>수정 저장</button>
                  <button type="button" className="btn btn-ghost !min-h-10" onClick={() => setEditAnswer(null)}>취소</button>
                </div>
              </div>
            ) : (
              <RichText text={a.body} className="mt-2 text-[15.5px]" />
            )}
            <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <button type="button" className="chip !h-8 !text-[13px]" aria-pressed={mine.includes(a.id)} onClick={() => toggleHelpful(a)}>도움 됨 {a.helpful_count}</button>
                {user?.id === a.author && editAnswer !== a.id && (
                  <span className="crew-menu">
                    <button type="button" onClick={() => { setEditAnswer(a.id); setEAnswer(a.body); }}>수정</button>
                    <button type="button" onClick={() => remove("answers", a.id)}>삭제</button>
                  </span>
                )}
              </div>
              <ReportBlock type="answer" id={a.id} author={a.author} me={user?.id} onBlocked={load} />
            </div>
          </li>
        ))}
      </ul>

      {user && nickname ? (
        <form onSubmit={sendReply} className="mt-8 grid gap-3">
          <label htmlFor="crew-reply" className="small">경험으로 답하기</label>
          <Editor id="crew-reply" max={2000} value={reply} onChange={setReply} minRows={4} placeholder="내가 겪어 봤던 것, 해 보니 괜찮았던 순서를 적어 주세요." />
          <div><button type="submit" className="btn btn-primary" disabled={busy || reply.trim().length < 2}>{busy ? "올리는 중…" : "BACK 남기기"}</button></div>
        </form>
      ) : (
        <div className="mt-8 rounded-[12px] bg-sand p-5"><p className="font-bold">답을 남기려면 로그인해 주세요</p><Link href="/crew/login/" className="btn btn-dark mt-3 !min-h-11">로그인</Link></div>
      )}
      {msg && <p className="small mt-3" role="alert">{msg}</p>}
    </article>
  );
}
