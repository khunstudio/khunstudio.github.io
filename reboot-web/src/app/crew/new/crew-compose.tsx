"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { KINDS, STAGES, TOPICS, crewReady, friendlyError, privacyIssue, removeImages, sb, uploadImage, useCrewUser, type Kind, type Stage, type Topic } from "@/lib/crew";
import { Editor, ImagePicker, type Draft } from "../rich";
import { getStore } from "@/lib/store";
import { NotReady } from "../crew-ui";

export function CrewCompose() {
  const router = useRouter();
  const { user, nickname, loading } = useCrewUser();
  const myMode = (() => { try { return getStore().profile?.mode; } catch { return undefined; } })();
  const [kind, setKind] = useState<Kind>("ask");
  const [stage, setStage] = useState<Stage>((myMode as Stage) ?? "everyday");
  const [topic, setTopic] = useState<Topic>("skin");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [photos, setPhotos] = useState<Draft[]>([]);

  if (!crewReady) return <NotReady />;
  if (loading) return <p className="small">확인 중…</p>;
  if (!user || !nickname) return <div><p className="h3">글을 쓰려면 로그인이 필요해요</p><Link href="/crew/login/" className="btn btn-primary mt-4">로그인</Link></div>;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const issue = privacyIssue(`${title}\n${body}`);
    if (issue) { setMsg(issue); return; }
    if (title.trim().length < 4 || body.trim().length < 10) { setMsg("제목은 4자, 내용은 10자 이상 써 주세요."); return; }
    setBusy(true); setMsg("");
    const uploaded: string[] = [];
    try {
      for (const d of photos) if (d.kind === "new") { setMsg(`사진 올리는 중… ${uploaded.length + 1}/${photos.length}`); uploaded.push(await uploadImage(user!.id, d.file)); }
    } catch (err) {
      await removeImages(uploaded); setBusy(false); setMsg(friendlyError(err)); return;
    }
    const row = { kind, stage, topic, title: title.trim(), body: body.trim(), ...(uploaded.length ? { images: uploaded } : {}) };
    const { data, error } = await sb().from("posts").insert(row).select("id").single();
    setBusy(false);
    if (error) { await removeImages(uploaded); setMsg(friendlyError(error)); return; }
    router.push(`/crew/post/?id=${data.id}`);
  }

  return (
    <form onSubmit={submit}>
      <Link href="/crew/" className="small">← CREW</Link>
      <h1 className="h1 mt-4">{kind === "ask" ? "무엇이 궁금한가요?" : "다음 사람에게 남길 경험"}</h1>
      <div className="mt-6 grid gap-5">
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="글 종류">
          {(Object.keys(KINDS) as Kind[]).map((k) => <button key={k} type="button" role="radio" aria-checked={kind === k} className="chip" aria-pressed={kind === k} onClick={() => setKind(k)}>{KINDS[k].en} · {KINDS[k].ko}</button>)}
        </div>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="생활 단계">
          {(Object.keys(STAGES) as Stage[]).map((s) => <button key={s} type="button" role="radio" aria-checked={stage === s} className="chip" aria-pressed={stage === s} onClick={() => setStage(s)}>{STAGES[s]}</button>)}
        </div>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="주제">
          {(Object.keys(TOPICS) as Topic[]).map((t) => <button key={t} type="button" role="radio" aria-checked={topic === t} className="chip" aria-pressed={topic === t} onClick={() => setTopic(t)}>{TOPICS[t]}</button>)}
        </div>
        <label className="grid gap-1.5"><span className="small">제목 ({title.length}/80)</span>
          <input id="crew-title" className="field" maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={kind === "ask" ? "예: 훈련소 가기 전 피부 관리, 뭐부터 챙길까요?" : "예: 일병 때 알았으면 좋았을 면도 순서"} />
        </label>
        <div className="grid gap-1.5"><label htmlFor="crew-body" className="small">내용</label>
          <Editor id="crew-body" max={3000} value={body} onChange={setBody} placeholder={kind === "ask" ? "상황을 조금 적어 주면 더 맞는 답을 받을 수 있어요. (피부 타입, 쓰는 제품, 시간 등)" : "언제, 무엇을 해 봤고, 뭐가 달라졌는지 적어 주세요."} />
        </div>
        <div className="grid gap-1.5"><span className="small">사진 (선택)</span><ImagePicker items={photos} onChange={setPhotos} /></div>
        <div className="rounded-[12px] bg-sand p-4 text-[14px] leading-relaxed">
          <b>올리기 전에</b> · 소속 부대 · 위치 · 일정, 연락처는 쓰지 않아요. 약 이름을 추천하거나 &lsquo;이거 바르면 낫는다&rsquo;처럼 단정하지 않아요. 증상이 심하면 피부과 상담을 권해 주세요.
        </div>
      </div>
      <button type="submit" className="btn btn-primary mt-6" disabled={busy}>{busy ? "올리는 중…" : "올리기"}</button>
      {msg && <p className="small mt-3" role="alert">{msg}</p>}
    </form>
  );
}
