import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "소개" };

export default function AboutPage() {
  return (
    <>
      <section className="band-ink">
        <div className="wrap-narrow py-14 md:py-20">
          <p className="eyebrow">ABOUT</p>
          <p className="display mt-5 text-[56px] sm:text-[80px]">RE<span className="colon">:</span>BOOT<br />YOURSELF.</p>
          <h1 className="mt-5 text-[22px] font-extrabold tracking-tight sm:text-[28px]">군 생활에서 시작해, 일상으로 이어지는 자기관리</h1>
        </div>
      </section>
      <div className="wrap-narrow py-12">
        <div className="prose-r">
          <h2>왜 시작했나요</h2>
          <p>RE:BOOT는 운영자의 공군 복무 경험에서 출발했어요. 입대 전에는 무엇을 준비해야 할지 몰랐고, 복무 중에는 어떤 관리가 나에게 맞는지 몰랐고, 전역하면 쌓아 온 습관이 끊기기 쉬웠어요.</p>
          <p>이건 아직 검증 전의 가설이에요. 입대 예정자 · 복무 중인 사람 · 전역자 · 일반 사용자와 이야기하며 확인하고 고쳐 나갈게요.</p>
          <h2>미션</h2>
          <p>삶의 변화 속에서 남성들이 스스로를 돌보고, 서로의 경험을 나누며, 각자의 일상을 더 나은 방향으로 만들어 가도록 돕습니다.</p>
          <h2>이렇게 운영해요</h2>
          <ul>
            <li>의학적 진단 · 처방 · 치료 효과 예측을 하지 않아요.</li>
            <li>가이드마다 작성일과 검수 상태를 표시해요. 아직 전문가 검수를 받은 글은 없어요.</li>
            <li>외모를 서열화하거나 불안을 자극하는 표현을 쓰지 않아요.</li>
            <li>군 소속 · 위치 · 일정 같은 정보를 묻거나 수집하지 않아요.</li>
            <li>국방부 · 군 공식 서비스가 아니며 어떤 기관과도 제휴하지 않았어요.</li>
            <li>이용자 수 · 제휴 · 성과는 실제로 생긴 뒤에만 표시해요.</li>
          </ul>
          <h2>운영 주체와 상태</h2>
          <p>기획 · 디자인 · 개발: KHUN STUDIO. 현재 상태는 <b>Prototype</b>이에요 (Concept → Prototype → Public Web Beta → Operational Service 순서로 진행).</p>
        </div>
        <div className="mt-10 flex flex-wrap gap-2">
          <Link href="/start/" className="btn btn-primary">시작하기</Link>
          <Link href="/partnership/" className="btn btn-ghost">협업 · 문의</Link>
        </div>
      </div>
    </>
  );
}
