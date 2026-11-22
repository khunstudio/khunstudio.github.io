import Link from "next/link";
import type { Metadata } from "next";
import { CrewFeed } from "./crew-feed";

export const metadata: Metadata = { title: "CREW" };

const PILLARS = [
  ["ASK", "질문하고 도움받기", "입대 준비, PX 제품 고르기, 전역 후 루틴처럼 혼자 찾기 어려운 것을 묻는 곳."],
  ["BACK", "경험으로 답하기", "먼저 겪은 사람이 경험을 바탕으로 답하고 응원해요. '좋아요'보다 '도움 됨'과 '해결됨'을 봐요."],
  ["PASS IT ON", "경험 물려주기", "다음 사람에게 남기고 싶은 시행착오와 팁. 글쓰기에서 '경험 물려주기'를 고르면 돼요."],
];

const RULES = [
  "서로의 생활 · 외모 · 피부 상태 · 신체를 비하하지 않아요.",
  "괴롭힘, 계급을 앞세운 압박, 고생 서열화를 하지 않아요.",
  "개인 신상, 소속 부대, 위치, 일정 같은 비공개 정보를 올리지 않아요.",
  "진단 · 처방을 대신하는 주장이나 검증되지 않은 치료 · 약물 추천을 하지 않아요.",
  "협찬 · 홍보는 숨기지 않고 표시해요.",
];

export default function CrewPage() {
  return (
    <>
      <section className="band-ink">
        <div className="wrap py-14 md:py-20">
          <p className="eyebrow">CREW <span className="badge badge-soon ml-2">{process.env.NEXT_PUBLIC_SUPABASE_URL ? "Beta" : "Beta 준비 중"}</span></p>
          <p className="display mt-5 text-[56px] sm:text-[88px]">BACK EACH<br />OTHER.</p>
          <h1 className="mt-5 text-[22px] font-extrabold tracking-tight sm:text-[28px]">서로의 편이 되어주는 커뮤니티</h1>
          <p className="lead mt-4 max-w-xl">&ldquo;내가 고생했으니 너도 해 봐라&rdquo; 대신 &ldquo;내가 겪어봤으니 너는 조금 덜 헤매도 된다.&rdquo; 경험은 물려주고, 고생은 줄이는 문화를 만들려고 해요.</p>
        </div>
      </section>

      <div className="wrap py-14">
        <CrewFeed />

        <h2 className="sec-head h3 mt-16">CREW에서 하는 일</h2>
        <ul className="grid gap-3 md:grid-cols-3">
          {PILLARS.map(([en, ko, d]) => (
            <li key={en} className="card p-6">
              <p className="display text-[30px] leading-none">{en}</p>
              <p className="mt-3 font-bold">{ko}</p>
              <p className="small mt-2">{d}</p>
            </li>
          ))}
        </ul>

        <h2 className="sec-head h3 mt-14">커뮤니티 원칙</h2>
        <ol className="grid gap-3">
          {RULES.map((r, i) => (
            <li key={r} className="flex gap-4 border-b border-line pb-3 text-[15.5px]">
              <span className="display text-[20px] text-signal">{String(i + 1).padStart(2, "0")}</span>{r}
            </li>
          ))}
        </ol>
        <p className="small mt-4">부대별 그룹 없이 생활 단계별 · 주제별로 운영해요. 신고가 3건 모이면 자동으로 가려지고 운영자가 확인해요. 전체 원칙은 <Link href="/legal/community/" className="link">커뮤니티 운영원칙(초안)</Link>에서 볼 수 있어요.</p>

      </div>
    </>
  );
}
