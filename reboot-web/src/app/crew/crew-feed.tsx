"use client";

import Link from "next/link";
import { loginHref } from "@/components/account-login";
import { useEffect, useState } from "react";
import { KINDS, STAGES, TOPICS, blockedIds, crewReady, sb, timeAgo, useCrewUser, type Kind, type Post, type Stage, type Topic } from "@/lib/crew";
import { NotReady, SolvedDots, Tags } from "./crew-ui";

const PAGE = 20;

export function CrewFeed() {
  const { user, nickname, loading } = useCrewUser();
  const [kind, setKind] = useState<Kind | "all">("all");
  const [stage, setStage] = useState<Stage | "all">("all");
  const [topic, setTopic] = useState<Topic | "all">("all");
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [more, setMore] = useState(false);
  const [err, setErr] = useState("");

  async function load(append = false) {
    let q = sb().from("posts").select("*, profiles(nickname)").order("created_at", { ascending: false }).range(append ? (posts?.length ?? 0) : 0, (append ? (posts?.length ?? 0) : 0) + PAGE - 1);
    if (kind !== "all") q = q.eq("kind", kind);
    if (stage !== "all") q = q.eq("stage", stage);
    if (topic !== "all") q = q.eq("topic", topic);
    const [{ data, error }, blocked] = await Promise.all([q, user ? blockedIds() : Promise.resolve([] as string[])]);
    if (error) { setErr("글을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."); setPosts([]); return; }
    const list = (data as Post[]).filter((p) => !blocked.includes(p.author));
    setPosts(append ? [...(posts ?? []), ...list] : list);
    setMore((data?.length ?? 0) === PAGE);
  }

  useEffect(() => { if (crewReady && !loading) load(); }, [kind, stage, topic, loading, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!crewReady) return <NotReady />;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="small">
          {loading ? "확인 중…" : user ? (nickname ? <>나는 <b className="text-ink">{nickname}</b></> : <Link href={loginHref("/crew/")} className="link">닉네임을 정해 주세요</Link>) : "읽기는 누구나, 쓰기는 로그인 후"}
        </p>
        <div className="flex gap-2">
          {!user && !loading && <Link href={loginHref("/crew/")} className="btn btn-ghost !min-h-10">로그인</Link>}
          <Link href={user && nickname ? "/crew/new/" : loginHref("/crew/new/")} className="btn btn-primary !min-h-10">글쓰기</Link>
        </div>
      </div>

      <div className="mt-6 grid gap-2">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="글 종류">
          <button type="button" className="chip" aria-pressed={kind === "all"} onClick={() => setKind("all")}>전체</button>
          {(Object.keys(KINDS) as Kind[]).map((k) => <button key={k} type="button" className="chip" aria-pressed={kind === k} onClick={() => setKind(k)}>{KINDS[k].en} · {KINDS[k].ko}</button>)}
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="생활 단계">
          <button type="button" className="chip" aria-pressed={stage === "all"} onClick={() => setStage("all")}>모든 단계</button>
          {(Object.keys(STAGES) as Stage[]).map((s) => <button key={s} type="button" className="chip" aria-pressed={stage === s} onClick={() => setStage(s)}>{STAGES[s]}</button>)}
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="주제">
          <button type="button" className="chip" aria-pressed={topic === "all"} onClick={() => setTopic("all")}>모든 주제</button>
          {(Object.keys(TOPICS) as Topic[]).map((t) => <button key={t} type="button" className="chip" aria-pressed={topic === t} onClick={() => setTopic(t)}>{TOPICS[t]}</button>)}
        </div>
      </div>

      <div className="mt-6 border-t border-line">
        {posts === null && <p className="small py-8">불러오는 중…</p>}
        {err && <p className="small py-8">{err}</p>}
        {posts && posts.length === 0 && !err && (
          <div className="py-12 text-center">
            <p className="font-bold">아직 이 조건의 글이 없어요</p>
            <p className="small mt-1">첫 질문이나 경험을 남겨 주세요. 다음 사람이 덜 헤매요.</p>
          </div>
        )}
        {posts?.map((p) => (
          <Link key={p.id} href={`/crew/post/?id=${p.id}`} className="crew-item">
            <div className="crew-meta">
              <span className="crew-kind">{KINDS[p.kind].en}</span>
              {p.kind === "ask" && <span className={p.solved ? "crew-solved" : ""}><SolvedDots solved={p.solved} /> {p.solved ? "해결됨" : "답 기다리는 중"}</span>}
              <Tags stage={p.stage} topic={p.topic} />
            </div>
            <p className="crew-title mt-2">{p.title}</p>
            <div className="crew-meta mt-2">
              <span>{p.profiles?.nickname ?? "알 수 없음"}</span><span>{timeAgo(p.created_at)}</span><span>BACK {p.answer_count}</span>{p.images?.length ? <span>사진 {p.images.length}</span> : null}{p.edited_at ? <span>수정됨</span> : null}
              {p.hidden && <span className="badge badge-draft">신고로 가려짐 · 나에게만 보여요</span>}
            </div>
          </Link>
        ))}
      </div>
      {more && <button type="button" className="btn btn-ghost mt-6 w-full" onClick={() => load(true)}>더 보기</button>}
    </div>
  );
}
