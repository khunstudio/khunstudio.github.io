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
      <div className="mt-8">
        <GuideBrowser />
      </div>
      <div className="mt-12 grid gap-3 md:grid-cols-2">
        <Link href="/care/px/" className="band-ink block rounded-[12px] p-6">
          <p className="eyebrow">FOR IN SERVICE</p>
          <p className="h3 mt-2">PX에서 관리 제품 고르는 기준</p>
          <p className="mt-2 text-[14px] text-ink-mute">상품 목록이 아니라 고르는 기준을 먼저 정리했어요.</p>
        </Link>
        <Link href="/check/" className="card card-link block p-6">
          <p className="eyebrow">30-SECOND CHECK</p>
          <p className="h3 mt-2">어디서부터 할지 모르겠다면</p>
          <p className="small mt-2">6개 질문으로 오늘 시작할 루틴을 만들어요.</p>
        </Link>
      </div>
    </div>
  );
}
