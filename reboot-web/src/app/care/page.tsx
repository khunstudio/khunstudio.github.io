import Link from "next/link";
import type { Metadata } from "next";
import { GuideBrowser } from "@/components/guide-browser";

export const metadata: Metadata = { title: "CARE 가이드" };

export default function CarePage() {
  return (
    <div className="wrap py-10 md:py-14">
      <p className="eyebrow">CARE</p>
      <h1 className="h1 mt-3">복잡한 관리 정보를<br />시작할 수 있는 순서로.</h1>
      <p className="lead mt-4 max-w-xl">피부 · 운동 · 스타일 · 생활 가이드. 모두 일반적인 생활 관리 정보이며, 전문가 검수 전인 글에는 표시를 달아 두었어요.</p>
      <div className="mt-8 grid gap-3 md:grid-cols-3">
        <Link href="/skin/" className="band-ink block rounded-[16px] p-6">
          <p className="eyebrow">SKIN TYPE</p>
          <p className="h3 mt-2">내 피부 타입 셀프 체크</p>
          <p className="mt-2 text-[14px] text-ink-mute">6문항 · 지성 · 건성 · 복합성 · 중성 · 예민. 맞는 성분과 제품 종류까지.</p>
        </Link>
        <Link href="/ingredients/" className="card card-link block p-6">
          <p className="eyebrow">INGREDIENTS</p>
          <p className="h3 mt-2">성분 사전</p>
          <p className="small mt-2">나이아신아마이드 · 레티놀 · 비타민 C · 아젤라익산 · 판테놀, 무기 · 유기자차까지.</p>
        </Link>
        <Link href="/care/acne-types/" className="card card-link block p-6">
          <p className="eyebrow">TROUBLE</p>
          <p className="h3 mt-2">내 트러블은 무슨 종류?</p>
          <p className="small mt-2">좁쌀 · 화농성 · 결절 · 모낭염 · 흉터. 집에서 할 것과 병원에 갈 때.</p>
        </Link>
      </div>
      <div className="mt-10">
        <GuideBrowser />
      </div>
      <div className="mt-12 grid gap-3 md:grid-cols-3">
        <Link href="/care/px/" className="band-ink block rounded-[12px] p-6">
          <p className="eyebrow">FOR IN SERVICE</p>
          <p className="h3 mt-2">PX에서 관리 제품 고르는 기준</p>
          <p className="mt-2 text-[14px] text-ink-mute">상품 목록이 아니라 고르는 기준을 먼저 정리했어요.</p>
        </Link>
        <a href="https://relev-beauty.vercel.app/#science" className="card card-link block p-6" target="_blank" rel="noopener">
          <p className="eyebrow">SISTER PROJECT · RE:LEV</p>
          <p className="h3 mt-2">디바이스 · 시술은 원리부터</p>
          <p className="small mt-2">LED · 고주파 · 레이저가 피부에서 어떻게 작용하는지, 상품명이 아니라 기술로 정리한 RE:LEV에서 이어서 보세요. ↗</p>
        </a>
        <Link href="/check/" className="card card-link block p-6">
          <p className="eyebrow">30-SECOND CHECK</p>
          <p className="h3 mt-2">어디서부터 할지 모르겠다면</p>
          <p className="small mt-2">6개 질문으로 오늘 시작할 루틴을 만들어요.</p>
        </Link>
      </div>
    </div>
  );
}
